import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { DEFAULT_WEARING_RULES, DEFAULT_COLOR_CLASHES } from '@/lib/constants';
import type { WearingRule, ColorClash, Layer, ClothingColor } from '@/types';

export async function getWearingRules(userId: string): Promise<WearingRule[]> {
  if (!supabase || !isSupabaseConfigured) {
    return DEFAULT_WEARING_RULES.map((r, i) => ({
      id: `rule-${i}`,
      user_id: userId,
      ...r,
    }));
  }
  const { data, error } = await supabase
    .from('wearing_rules')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  // If no rules yet, return defaults
  if (!data || data.length === 0) {
    return DEFAULT_WEARING_RULES.map((r, i) => ({
      id: `default-${i}`,
      user_id: userId,
      ...r,
    }));
  }
  return data as WearingRule[];
}

export async function upsertWearingRules(
  userId: string,
  rules: Omit<WearingRule, 'id' | 'user_id'>[],
): Promise<WearingRule[]> {
  if (!supabase || !isSupabaseConfigured) {
    return rules.map((r, i) => ({ id: `rule-${i}`, user_id: userId, ...r }));
  }
  // Delete existing rules then insert fresh
  await supabase.from('wearing_rules').delete().eq('user_id', userId);
  const { data, error } = await supabase
    .from('wearing_rules')
    .insert(rules.map(r => ({ user_id: userId, ...r })))
    .select();
  if (error) throw error;
  return data as WearingRule[];
}

export async function getColorClashes(userId: string): Promise<ColorClash[]> {
  if (!supabase || !isSupabaseConfigured) {
    return DEFAULT_COLOR_CLASHES;
  }
  const { data, error } = await supabase
    .from('color_clashes')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  if (!data || data.length === 0) {
    return DEFAULT_COLOR_CLASHES;
  }
  return data as ColorClash[];
}

export async function addColorClash(
  userId: string,
  colorA: ClothingColor,
  colorB: ClothingColor,
): Promise<ColorClash> {
  if (!supabase || !isSupabaseConfigured) {
    return { color_a: colorA, color_b: colorB };
  }
  const { data, error } = await supabase
    .from('color_clashes')
    .insert({ user_id: userId, color_a: colorA, color_b: colorB })
    .select()
    .single();
  if (error) throw error;
  return data as ColorClash;
}

export async function removeColorClash(id: string): Promise<void> {
  if (!supabase || !isSupabaseConfigured) return;
  const { error } = await supabase
    .from('color_clashes')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function resetToDefaults(userId: string): Promise<{
  rules: WearingRule[];
  clashes: ColorClash[];
}> {
  const rules = await upsertWearingRules(userId, DEFAULT_WEARING_RULES);
  // Reset clashes
  if (supabase && isSupabaseConfigured) {
    await supabase.from('color_clashes').delete().eq('user_id', userId);
    const { data } = await supabase
      .from('color_clashes')
      .insert(DEFAULT_COLOR_CLASHES.map(c => ({ user_id: userId, ...c })))
      .select();
    return { rules, clashes: (data as ColorClash[]) || DEFAULT_COLOR_CLASHES };
  }
  return { rules, clashes: DEFAULT_COLOR_CLASHES };
}

export type { Layer, ClothingColor };
