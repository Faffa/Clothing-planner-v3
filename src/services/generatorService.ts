import type { ClothingItem, Layer, WearingRule, ColorClash, DayOutfit } from '@/types';
import { format, addDays } from 'date-fns';

const LAYER_ORDER: Layer[] = ['bottom', 'dress', 'top-base', 'top-over', 'outer', 'footwear', 'accessory', 'bag'];

export interface ScoredAlternative {
  item: ClothingItem;
  score: number;
  warnings: string[];
}

interface GeneratorContext {
  items: ClothingItem[];
  rules: WearingRule[];
  clashes: ColorClash[];
  weekStart: string; // ISO date
}

function getRuleForLayer(rules: WearingRule[], layer: Layer): WearingRule | undefined {
  return rules.find(r => r.layer === layer);
}

function isColorClash(color: string, otherColors: string[], clashes: ColorClash[]): string[] {
  const warnings: string[] = [];
  for (const other of otherColors) {
    for (const clash of clashes) {
      if (
        (clash.color_a === color && clash.color_b === other) ||
        (clash.color_b === color && clash.color_a === other)
      ) {
        warnings.push(`${color} clashes with ${other}`);
      }
    }
  }
  return warnings;
}

function scoreItem(
  item: ClothingItem,
  layer: Layer,
  dayIndex: number,
  weekAssignments: Map<string, number>, // itemId -> count this week
  prevDayItemIds: Map<Layer, string>, // previous day's items per layer
  dayColors: string[], // colors already assigned this day
  rules: WearingRule[],
  clashes: ColorClash[],
): { score: number; warnings: string[] } {
  let score = 100;
  const warnings: string[] = [];

  if (!item.is_clean) {
    score -= 200; // strongly avoid dirty items
    warnings.push('Item is in laundry');
  }

  // Wear frequency penalty
  const weekCount = weekAssignments.get(item.id) || 0;
  score -= weekCount * 5;

  // Max per week violation (per-item override takes precedence)
  const rule = getRuleForLayer(rules, layer);
  const effectiveMax = item.rule_override?.max_per_week ?? rule?.max_per_week;
  if (effectiveMax != null && weekCount >= effectiveMax) {
    score -= 50;
    warnings.push(`Exceeds max ${effectiveMax}/week for ${layer}`);
  }

  // Consecutive day violation (per-item override takes precedence)
  const effectiveConsecutive = item.rule_override?.allow_consecutive ?? rule?.allow_consecutive;
  if (effectiveConsecutive === false && dayIndex > 0) {
    const prevItemId = prevDayItemIds.get(layer);
    if (prevItemId === item.id) {
      score -= 40;
      warnings.push('Worn on consecutive days');
    }
  }

  // Color clash
  const clashWarnings = isColorClash(item.color, dayColors, clashes);
  score -= clashWarnings.length * 30;
  warnings.push(...clashWarnings);

  // Wear count balance: prefer less-worn items
  score -= item.wear_count * 0.5;

  // Favorite bonus
  if (item.is_favorite) score += 10;

  return { score, warnings };
}

function pickBestItem(
  candidates: ClothingItem[],
  layer: Layer,
  dayIndex: number,
  weekAssignments: Map<string, number>,
  prevDayItemIds: Map<Layer, string>,
  dayColors: string[],
  rules: WearingRule[],
  clashes: ColorClash[],
): ClothingItem | null {
  if (candidates.length === 0) return null;

  const scored = candidates.map(item => {
    const { score } = scoreItem(item, layer, dayIndex, weekAssignments, prevDayItemIds, dayColors, rules, clashes);
    return { item, score };
  });

  // Add randomness to break ties
  scored.sort((a, b) => (b.score + Math.random() * 5) - (a.score + Math.random() * 5));

  return scored[0]?.item ?? null;
}

export function generateWeekPlan(ctx: GeneratorContext): DayOutfit[] {
  const { items, rules, clashes, weekStart } = ctx;
  const days: DayOutfit[] = [];
  const weekAssignments = new Map<string, number>();

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const date = format(addDays(new Date(weekStart), dayIndex), 'yyyy-MM-dd');
    const dayItems: Record<Layer, ClothingItem | null> = {
      'outer': null,
      'top-over': null,
      'top-base': null,
      'dress': null,
      'bottom': null,
      'footwear': null,
      'accessory': null,
      'bag': null,
    };
    const dayColors: string[] = [];
    const prevDayItemIds = new Map<Layer, string>();

    // Get previous day's items
    if (dayIndex > 0) {
      const prevDay = days[dayIndex - 1];
      for (const [layer, item] of Object.entries(prevDay.items)) {
        if (item) prevDayItemIds.set(layer as Layer, item.id);
      }
    }

    // Process layers in order — bottom/dress first (mutual exclusion)
    for (const layer of LAYER_ORDER) {
      // dress and bottom are mutually exclusive: if dress chosen, skip bottom and vice versa
      if (layer === 'bottom' && dayItems.dress) continue;
      if (layer === 'dress' && dayItems.bottom) continue;

      const candidates = items.filter(i => i.layer === layer);
      if (candidates.length === 0) continue;

      const picked = pickBestItem(
        candidates, layer, dayIndex, weekAssignments, prevDayItemIds, dayColors, rules, clashes,
      );

      if (picked) {
        dayItems[layer] = picked;
        dayColors.push(picked.color);
        weekAssignments.set(picked.id, (weekAssignments.get(picked.id) || 0) + 1);
      }
    }

    days.push({ date, items: dayItems, is_locked: false });
  }

  return days;
}

export function regenerateDay(
  ctx: GeneratorContext,
  days: DayOutfit[],
  dayIndex: number,
): DayOutfit {
  const { items, rules, clashes, weekStart } = ctx;
  const date = format(addDays(new Date(weekStart), dayIndex), 'yyyy-MM-dd');

  // Calculate week assignments excluding this day
  const weekAssignments = new Map<string, number>();
  days.forEach((d, i) => {
    if (i === dayIndex) return;
    for (const item of Object.values(d.items)) {
      if (item) weekAssignments.set(item.id, (weekAssignments.get(item.id) || 0) + 1);
    }
  });

  const prevDayItemIds = new Map<Layer, string>();
  if (dayIndex > 0) {
    for (const [layer, item] of Object.entries(days[dayIndex - 1].items)) {
      if (item) prevDayItemIds.set(layer as Layer, item.id);
    }
  }

  const dayItems: Record<Layer, ClothingItem | null> = {
    'outer': null, 'top-over': null, 'top-base': null, 'dress': null,
    'bottom': null, 'footwear': null, 'accessory': null, 'bag': null,
  };
  const dayColors: string[] = [];

  for (const layer of LAYER_ORDER) {
    if (layer === 'bottom' && dayItems.dress) continue;
    if (layer === 'dress' && dayItems.bottom) continue;

    // Keep locked items
    const existingDay = days[dayIndex];
    if (existingDay?.items[layer] && existingDay.is_locked) {
      dayItems[layer] = existingDay.items[layer];
      if (existingDay.items[layer]) dayColors.push(existingDay.items[layer]!.color);
      continue;
    }

    const candidates = items.filter(i => i.layer === layer);
    if (candidates.length === 0) continue;

    const picked = pickBestItem(
      candidates, layer, dayIndex, weekAssignments, prevDayItemIds, dayColors, rules, clashes,
    );
    if (picked) {
      dayItems[layer] = picked;
      dayColors.push(picked.color);
      weekAssignments.set(picked.id, (weekAssignments.get(picked.id) || 0) + 1);
    }
  }

  return { date, items: dayItems, is_locked: false };
}

export function getValidAlternatives(
  ctx: GeneratorContext,
  days: DayOutfit[],
  dayIndex: number,
  layer: Layer,
): ScoredAlternative[] {
  const { items, rules, clashes } = ctx;
  const currentDay = days[dayIndex];
  const currentItem = currentDay?.items[layer];

  // Week assignments excluding this slot
  const weekAssignments = new Map<string, number>();
  days.forEach((d, i) => {
    for (const [l, item] of Object.entries(d.items)) {
      if (item && !(i === dayIndex && l === layer)) {
        weekAssignments.set(item.id, (weekAssignments.get(item.id) || 0) + 1);
      }
    }
  });

  const prevDayItemIds = new Map<Layer, string>();
  if (dayIndex > 0) {
    for (const [l, item] of Object.entries(days[dayIndex - 1].items)) {
      if (item) prevDayItemIds.set(l as Layer, item.id);
    }
  }

  // Colors of other items this day (excluding current layer)
  const dayColors: string[] = [];
  for (const [l, item] of Object.entries(currentDay.items)) {
    if (l !== layer && item) dayColors.push(item.color);
  }

  const candidates = items
    .filter(i => i.layer === layer)
    .filter(i => i.id !== currentItem?.id);

  return candidates
    .map(item => {
      const { score, warnings } = scoreItem(
        item, layer, dayIndex, weekAssignments, prevDayItemIds, dayColors, rules, clashes,
      );
      return { item, score, warnings };
    })
    .sort((a, b) => b.score - a.score);
}
