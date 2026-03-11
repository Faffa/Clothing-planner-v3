import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { WearingRule, ColorClash, ClothingColor } from '@/types';
import * as rulesService from '@/services/rulesService';

export function useRules() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [rules, setRules] = useState<WearingRule[]>([]);
  const [clashes, setClashes] = useState<ColorClash[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [r, c] = await Promise.all([
        rulesService.getWearingRules(user.id),
        rulesService.getColorClashes(user.id),
      ]);
      setRules(r);
      setClashes(c);
    } catch (err) {
      console.error('Failed to load rules:', err);
      showToast('Failed to load rules', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => { load(); }, [load]);

  const updateRule = useCallback((layer: string, field: 'max_per_week' | 'allow_consecutive', value: number | boolean) => {
    setRules(prev => prev.map(r =>
      r.layer === layer ? { ...r, [field]: value } : r
    ));
  }, []);

  const saveRules = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      const saved = await rulesService.upsertWearingRules(
        user.id,
        rules.map(({ layer, max_per_week, allow_consecutive }) => ({ layer, max_per_week, allow_consecutive })),
      );
      setRules(saved);
      showToast('Rules saved');
    } catch (err) {
      console.error('Failed to save rules:', err);
      showToast('Failed to save rules', 'error');
    } finally {
      setSaving(false);
    }
  }, [user, rules, showToast]);

  const addClash = useCallback(async (colorA: ClothingColor, colorB: ClothingColor) => {
    if (!user) return;
    try {
      const clash = await rulesService.addColorClash(user.id, colorA, colorB);
      setClashes(prev => [...prev, clash]);
      showToast('Color clash added');
    } catch (err) {
      console.error('Failed to add clash:', err);
      showToast('Failed to add color clash', 'error');
    }
  }, [user, showToast]);

  const removeClash = useCallback(async (index: number) => {
    const clash = clashes[index];
    if (!clash) return;
    try {
      if (clash.id) {
        await rulesService.removeColorClash(clash.id);
      }
      setClashes(prev => prev.filter((_, i) => i !== index));
      showToast('Color clash removed');
    } catch (err) {
      console.error('Failed to remove clash:', err);
      showToast('Failed to remove color clash', 'error');
    }
  }, [clashes, showToast]);

  const resetDefaults = useCallback(async () => {
    if (!user) return;
    try {
      const { rules: r, clashes: c } = await rulesService.resetToDefaults(user.id);
      setRules(r);
      setClashes(c);
      showToast('Reset to defaults');
    } catch (err) {
      console.error('Failed to reset:', err);
      showToast('Failed to reset', 'error');
    }
  }, [user, showToast]);

  return { rules, clashes, loading, saving, updateRule, saveRules, addClash, removeClash, resetDefaults };
}
