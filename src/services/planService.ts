import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { WeekPlan, DayOutfit, DayOutfitItem, Layer, ClothingItem } from '@/types';
import { format, addDays } from 'date-fns';

export async function getWeekPlan(
  userId: string,
  weekStart: string,
  allItems: ClothingItem[],
): Promise<WeekPlan | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  const { data: plan } = await supabase
    .from('week_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!plan) return null;

  const { data: outfitItems } = await supabase
    .from('day_outfit_items')
    .select('*')
    .eq('plan_id', plan.id);

  const itemMap = new Map(allItems.map(i => [i.id, i]));

  // Build days array
  const days: DayOutfit[] = Array.from({ length: 7 }, (_, i) => {
    const date = format(addDays(new Date(weekStart), i), 'yyyy-MM-dd');
    const dayItems: Record<Layer, ClothingItem | null> = {
      'outer': null, 'top-over': null, 'top-base': null, 'dress': null,
      'bottom': null, 'footwear': null, 'accessory': null, 'bag': null,
    };
    let isLocked = false;

    const dayOutfits = (outfitItems || []).filter((oi: DayOutfitItem) => oi.date === date);
    for (const oi of dayOutfits) {
      const item = oi.item_id ? itemMap.get(oi.item_id) : null;
      dayItems[oi.layer as Layer] = item || null;
      if (oi.is_locked) isLocked = true;
    }

    return { date, items: dayItems, is_locked: isLocked };
  });

  return {
    id: plan.id,
    user_id: plan.user_id,
    week_start: plan.week_start,
    days,
    status: plan.status,
    created_at: plan.created_at,
    approved_at: plan.approved_at,
  };
}

export async function saveWeekPlan(
  userId: string,
  weekStart: string,
  days: DayOutfit[],
  existingPlanId?: string,
): Promise<WeekPlan> {
  if (!supabase || !isSupabaseConfigured) {
    // Return a local-only plan
    return {
      id: existingPlanId || crypto.randomUUID(),
      user_id: userId,
      week_start: weekStart,
      days,
      status: 'draft',
      created_at: new Date().toISOString(),
      approved_at: null,
    };
  }

  let planId = existingPlanId;

  if (!planId) {
    // Create new plan
    const { data, error } = await supabase
      .from('week_plans')
      .insert({ user_id: userId, week_start: weekStart, status: 'draft' })
      .select()
      .single();
    if (error) throw error;
    planId = data.id;
  } else {
    // Update existing
    await supabase
      .from('week_plans')
      .update({ status: 'draft', approved_at: null })
      .eq('id', planId);
  }

  // Delete existing outfit items and re-insert
  await supabase.from('day_outfit_items').delete().eq('plan_id', planId);

  const outfitRows: Omit<DayOutfitItem, 'id'>[] = [];
  for (const day of days) {
    for (const [layer, item] of Object.entries(day.items)) {
      if (item) {
        outfitRows.push({
          plan_id: planId!,
          date: day.date,
          layer: layer as Layer,
          item_id: item.id,
          is_locked: day.is_locked,
        });
      }
    }
  }

  if (outfitRows.length > 0) {
    const { error } = await supabase.from('day_outfit_items').insert(outfitRows);
    if (error) throw error;
  }

  return {
    id: planId!,
    user_id: userId,
    week_start: weekStart,
    days,
    status: 'draft',
    created_at: new Date().toISOString(),
    approved_at: null,
  };
}

export async function approvePlan(planId: string): Promise<void> {
  if (!supabase || !isSupabaseConfigured) return;

  const { error } = await supabase
    .from('week_plans')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', planId);
  if (error) throw error;

  // Lock all outfit items
  await supabase
    .from('day_outfit_items')
    .update({ is_locked: true })
    .eq('plan_id', planId);
}

export async function getPlanHistory(
  userId: string,
  limit = 10,
): Promise<Pick<WeekPlan, 'id' | 'week_start' | 'status' | 'approved_at' | 'created_at'>[]> {
  if (!supabase || !isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('week_plans')
    .select('id, week_start, status, approved_at, created_at')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}
