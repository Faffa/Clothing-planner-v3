import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { MatchingGroup, GroupCompatibility } from '@/types';
import * as matchingService from '@/services/matchingService';

export function useMatching() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [groups, setGroups] = useState<MatchingGroup[]>([]);
  const [compatibilities, setCompatibilities] = useState<GroupCompatibility[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [g, c] = await Promise.all([
        matchingService.getMatchingGroups(user.id),
        matchingService.getCompatibilities(user.id),
      ]);
      setGroups(g);
      setCompatibilities(c);
    } catch (err) {
      console.error('Failed to load matching data:', err);
      showToast('Failed to load matching groups', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => { load(); }, [load]);

  const addGroup = useCallback(async (name: string, itemIds: string[]) => {
    if (!user) return;
    try {
      const group = await matchingService.createMatchingGroup(user.id, name, itemIds);
      setGroups(prev => [group, ...prev]);
      showToast('Group created');
    } catch (err) {
      console.error('Failed to create group:', err);
      showToast('Failed to create group', 'error');
    }
  }, [user, showToast]);

  const editGroup = useCallback(async (id: string, updates: { name?: string; item_ids?: string[] }) => {
    try {
      const updated = await matchingService.updateMatchingGroup(id, updates);
      setGroups(prev => prev.map(g => g.id === id ? updated : g));
      showToast('Group updated');
    } catch (err) {
      console.error('Failed to update group:', err);
      showToast('Failed to update group', 'error');
    }
  }, [showToast]);

  const removeGroup = useCallback(async (id: string) => {
    try {
      await matchingService.deleteMatchingGroup(id);
      setGroups(prev => prev.filter(g => g.id !== id));
      setCompatibilities(prev => prev.filter(c => c.group_a_id !== id && c.group_b_id !== id));
      showToast('Group deleted');
    } catch (err) {
      console.error('Failed to delete group:', err);
      showToast('Failed to delete group', 'error');
    }
  }, [showToast]);

  const addCompat = useCallback(async (groupAId: string, groupBId: string) => {
    try {
      const compat = await matchingService.addCompatibility(groupAId, groupBId);
      setCompatibilities(prev => [...prev, compat]);
      showToast('Compatibility added');
    } catch (err) {
      console.error('Failed to add compatibility:', err);
      showToast('Failed to add compatibility', 'error');
    }
  }, [showToast]);

  const removeCompat = useCallback(async (id: string) => {
    try {
      await matchingService.removeCompatibility(id);
      setCompatibilities(prev => prev.filter(c => c.id !== id));
      showToast('Compatibility removed');
    } catch (err) {
      console.error('Failed to remove compatibility:', err);
      showToast('Failed to remove compatibility', 'error');
    }
  }, [showToast]);

  return { groups, compatibilities, loading, addGroup, editGroup, removeGroup, addCompat, removeCompat };
}
