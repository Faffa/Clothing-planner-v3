import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { MatchingGroup, GroupCompatibility } from '@/types';

const GROUPS_KEY = 'maison-matching-groups';
const COMPAT_KEY = 'maison-group-compat';

function loadLocal<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function saveLocal<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Matching Groups ──────────────────────────────────────────────────

export async function getMatchingGroups(userId: string): Promise<MatchingGroup[]> {
  if (!supabase || !isSupabaseConfigured) {
    return loadLocal<MatchingGroup>(GROUPS_KEY);
  }
  try {
    const { data, error } = await supabase
      .from('matching_groups')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as MatchingGroup[]) || [];
  } catch {
    return loadLocal<MatchingGroup>(GROUPS_KEY);
  }
}

export async function createMatchingGroup(
  userId: string,
  name: string,
  itemIds: string[],
): Promise<MatchingGroup> {
  const group: MatchingGroup = {
    id: crypto.randomUUID(),
    user_id: userId,
    name,
    item_ids: itemIds,
    created_at: new Date().toISOString(),
  };

  if (!supabase || !isSupabaseConfigured) {
    const groups = loadLocal<MatchingGroup>(GROUPS_KEY);
    groups.unshift(group);
    saveLocal(GROUPS_KEY, groups);
    return group;
  }

  try {
    const { data, error } = await supabase
      .from('matching_groups')
      .insert({ user_id: userId, name, item_ids: itemIds })
      .select()
      .single();
    if (error) throw error;
    return data as MatchingGroup;
  } catch {
    const groups = loadLocal<MatchingGroup>(GROUPS_KEY);
    groups.unshift(group);
    saveLocal(GROUPS_KEY, groups);
    return group;
  }
}

export async function updateMatchingGroup(
  id: string,
  updates: { name?: string; item_ids?: string[] },
): Promise<MatchingGroup> {
  if (!supabase || !isSupabaseConfigured) {
    const groups = loadLocal<MatchingGroup>(GROUPS_KEY);
    const idx = groups.findIndex(g => g.id === id);
    if (idx >= 0) {
      groups[idx] = { ...groups[idx], ...updates };
      saveLocal(GROUPS_KEY, groups);
      return groups[idx];
    }
    throw new Error('Group not found');
  }

  try {
    const { data, error } = await supabase
      .from('matching_groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as MatchingGroup;
  } catch {
    const groups = loadLocal<MatchingGroup>(GROUPS_KEY);
    const idx = groups.findIndex(g => g.id === id);
    if (idx >= 0) {
      groups[idx] = { ...groups[idx], ...updates };
      saveLocal(GROUPS_KEY, groups);
      return groups[idx];
    }
    throw new Error('Group not found');
  }
}

export async function deleteMatchingGroup(id: string): Promise<void> {
  if (!supabase || !isSupabaseConfigured) {
    const groups = loadLocal<MatchingGroup>(GROUPS_KEY);
    saveLocal(GROUPS_KEY, groups.filter(g => g.id !== id));
    // Also remove related compatibilities
    const compats = loadLocal<GroupCompatibility>(COMPAT_KEY);
    saveLocal(COMPAT_KEY, compats.filter(c => c.group_a_id !== id && c.group_b_id !== id));
    return;
  }

  try {
    await supabase.from('group_compatibilities').delete().or(`group_a_id.eq.${id},group_b_id.eq.${id}`);
    const { error } = await supabase.from('matching_groups').delete().eq('id', id);
    if (error) throw error;
  } catch {
    const groups = loadLocal<MatchingGroup>(GROUPS_KEY);
    saveLocal(GROUPS_KEY, groups.filter(g => g.id !== id));
    const compats = loadLocal<GroupCompatibility>(COMPAT_KEY);
    saveLocal(COMPAT_KEY, compats.filter(c => c.group_a_id !== id && c.group_b_id !== id));
  }
}

// ── Group Compatibilities ────────────────────────────────────────────

export async function getCompatibilities(userId: string): Promise<GroupCompatibility[]> {
  if (!supabase || !isSupabaseConfigured) {
    return loadLocal<GroupCompatibility>(COMPAT_KEY);
  }
  try {
    // Get user's group IDs first, then filter compatibilities
    const groups = await getMatchingGroups(userId);
    const groupIds = groups.map(g => g.id);
    if (groupIds.length === 0) return [];

    const { data, error } = await supabase
      .from('group_compatibilities')
      .select('*')
      .in('group_a_id', groupIds);
    if (error) throw error;
    return (data as GroupCompatibility[]) || [];
  } catch {
    return loadLocal<GroupCompatibility>(COMPAT_KEY);
  }
}

export async function addCompatibility(
  groupAId: string,
  groupBId: string,
): Promise<GroupCompatibility> {
  const compat: GroupCompatibility = {
    id: crypto.randomUUID(),
    group_a_id: groupAId,
    group_b_id: groupBId,
  };

  if (!supabase || !isSupabaseConfigured) {
    const compats = loadLocal<GroupCompatibility>(COMPAT_KEY);
    compats.push(compat);
    saveLocal(COMPAT_KEY, compats);
    return compat;
  }

  try {
    const { data, error } = await supabase
      .from('group_compatibilities')
      .insert({ group_a_id: groupAId, group_b_id: groupBId })
      .select()
      .single();
    if (error) throw error;
    return data as GroupCompatibility;
  } catch {
    const compats = loadLocal<GroupCompatibility>(COMPAT_KEY);
    compats.push(compat);
    saveLocal(COMPAT_KEY, compats);
    return compat;
  }
}

export async function removeCompatibility(id: string): Promise<void> {
  if (!supabase || !isSupabaseConfigured) {
    const compats = loadLocal<GroupCompatibility>(COMPAT_KEY);
    saveLocal(COMPAT_KEY, compats.filter(c => c.id !== id));
    return;
  }

  try {
    const { error } = await supabase.from('group_compatibilities').delete().eq('id', id);
    if (error) throw error;
  } catch {
    const compats = loadLocal<GroupCompatibility>(COMPAT_KEY);
    saveLocal(COMPAT_KEY, compats.filter(c => c.id !== id));
  }
}
