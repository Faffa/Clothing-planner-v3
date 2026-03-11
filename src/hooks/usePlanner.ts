import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { WeekPlan, ClothingItem, WearingRule, ColorClash, Layer } from '@/types';
import * as planService from '@/services/planService';
import * as generatorService from '@/services/generatorService';
import * as aiOutfitService from '@/services/aiOutfitService';
import { incrementWearCount } from '@/services/wardrobeService';
import { format, startOfWeek, addWeeks, subWeeks } from 'date-fns';

export function usePlanner(items: ClothingItem[], rules: WearingRule[], clashes: ColorClash[]) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [weekStart, setWeekStart] = useState(() =>
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  );
  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [pastPlans, setPastPlans] = useState<Pick<WeekPlan, 'id' | 'week_start' | 'status' | 'approved_at' | 'created_at'>[]>([]);

  const loadPlan = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const existing = await planService.getWeekPlan(user.id, weekStart, items);
      setPlan(existing);
    } catch (err) {
      console.error('Failed to load plan:', err);
    } finally {
      setLoading(false);
    }
  }, [user, weekStart, items]);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    try {
      const history = await planService.getPlanHistory(user.id);
      setPastPlans(history);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }, [user]);

  useEffect(() => { loadPlan(); }, [loadPlan]);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const generate = useCallback(async () => {
    if (!user || items.length === 0) {
      showToast('Add some clothes first', 'info');
      return;
    }
    setLoading(true);
    try {
      const days = generatorService.generateWeekPlan({
        items, rules, clashes, weekStart,
      });
      const saved = await planService.saveWeekPlan(user.id, weekStart, days, plan?.id);
      setPlan({ ...saved, days });
      showToast('Week plan generated');
    } catch (err) {
      console.error('Failed to generate:', err);
      showToast('Failed to generate plan', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, items, rules, clashes, weekStart, plan?.id, showToast]);

  const generateAI = useCallback(async () => {
    if (!user || items.length === 0) {
      showToast('Add some clothes first', 'info');
      return;
    }
    if (!aiOutfitService.isAIAvailable()) {
      showToast('AI not configured — using rule-based generation', 'info');
      return generate();
    }
    setLoading(true);
    try {
      const result = await aiOutfitService.generateWeekPlanAI(items, rules, clashes, weekStart);
      const saved = await planService.saveWeekPlan(user.id, weekStart, result.days, plan?.id);
      setPlan({ ...saved, days: result.days });
      showToast(result.reasoning ? `AI plan: ${result.reasoning}` : 'AI-enhanced plan generated');
    } catch (err: any) {
      console.error('AI generation failed, falling back:', err);
      const message = err?.message || 'AI generation failed';
      if (message.includes('rate limit')) {
        showToast(message, 'error');
      } else {
        showToast('AI unavailable — using rule-based generation', 'info');
        return generate();
      }
    } finally {
      setLoading(false);
    }
  }, [user, items, rules, clashes, weekStart, plan?.id, showToast, generate]);

  const regenDay = useCallback(async (dayIndex: number) => {
    if (!user || !plan) return;
    try {
      const newDay = generatorService.regenerateDay(
        { items, rules, clashes, weekStart },
        plan.days,
        dayIndex,
      );
      const newDays = plan.days.map((d, i) => i === dayIndex ? newDay : d);
      const saved = await planService.saveWeekPlan(user.id, weekStart, newDays, plan.id);
      setPlan({ ...saved, days: newDays });
      showToast(`${format(new Date(newDay.date), 'EEEE')} regenerated`);
    } catch (err) {
      console.error('Failed to regen day:', err);
      showToast('Failed to regenerate day', 'error');
    }
  }, [user, plan, items, rules, clashes, weekStart, showToast]);

  const swapItem = useCallback(async (dayIndex: number, layer: Layer, newItem: ClothingItem) => {
    if (!user || !plan) return;
    try {
      const newDays = plan.days.map((d, i) => {
        if (i !== dayIndex) return d;
        return { ...d, items: { ...d.items, [layer]: newItem } };
      });
      const saved = await planService.saveWeekPlan(user.id, weekStart, newDays, plan.id);
      setPlan({ ...saved, days: newDays });
      showToast('Item swapped');
    } catch (err) {
      console.error('Failed to swap:', err);
      showToast('Failed to swap item', 'error');
    }
  }, [user, plan, weekStart, showToast]);

  const approve = useCallback(async () => {
    if (!user || !plan) return;
    try {
      await planService.approvePlan(plan.id);

      // Increment wear counts for all items in the plan
      const allItemIds: string[] = [];
      for (const day of plan.days) {
        for (const item of Object.values(day.items)) {
          if (item) allItemIds.push(item.id);
        }
      }
      await incrementWearCount(allItemIds);

      setPlan({
        ...plan,
        status: 'approved',
        approved_at: new Date().toISOString(),
        days: plan.days.map(d => ({ ...d, is_locked: true })),
      });
      showToast('Plan approved!');
      loadHistory();
    } catch (err) {
      console.error('Failed to approve:', err);
      showToast('Failed to approve plan', 'error');
    }
  }, [user, plan, showToast, loadHistory]);

  const newDraft = useCallback(async () => {
    if (!user) return;
    // Create a fresh plan for the same week
    setPlan(null);
  }, [user]);

  const goToPrevWeek = useCallback(() => {
    setWeekStart(prev => format(subWeeks(new Date(prev), 1), 'yyyy-MM-dd'));
  }, []);

  const goToNextWeek = useCallback(() => {
    setWeekStart(prev => format(addWeeks(new Date(prev), 1), 'yyyy-MM-dd'));
  }, []);

  const jumpToWeek = useCallback((weekStartStr: string) => {
    setWeekStart(weekStartStr);
  }, []);

  const getAlternatives = useCallback((dayIndex: number, layer: Layer) => {
    if (!plan) return [];
    return generatorService.getValidAlternatives(
      { items, rules, clashes, weekStart },
      plan.days,
      dayIndex,
      layer,
    );
  }, [plan, items, rules, clashes, weekStart]);

  const swapItemsBetweenDays = useCallback(async (
    sourceDayIndex: number,
    targetDayIndex: number,
    layer: Layer,
  ) => {
    if (!user || !plan) return;
    try {
      const sourceItem = plan.days[sourceDayIndex]?.items[layer] ?? null;
      const targetItem = plan.days[targetDayIndex]?.items[layer] ?? null;

      const newDays = plan.days.map((d, i) => {
        if (i === sourceDayIndex) return { ...d, items: { ...d.items, [layer]: targetItem } };
        if (i === targetDayIndex) return { ...d, items: { ...d.items, [layer]: sourceItem } };
        return d;
      });
      const saved = await planService.saveWeekPlan(user.id, weekStart, newDays, plan.id);
      setPlan({ ...saved, days: newDays });
      showToast('Items swapped between days');
    } catch (err) {
      console.error('Failed to swap between days:', err);
      showToast('Failed to swap items', 'error');
    }
  }, [user, plan, weekStart, showToast]);

  return {
    weekStart,
    plan,
    loading,
    pastPlans,
    generate,
    generateAI,
    regenDay,
    swapItem,
    swapItemsBetweenDays,
    approve,
    newDraft,
    goToPrevWeek,
    goToNextWeek,
    jumpToWeek,
    getAlternatives,
  };
}
