import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { OutfitTemplate, Layer } from '@/types';
import * as templateService from '@/services/templateService';

export function useTemplates() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<OutfitTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await templateService.getTemplates(user.id);
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates:', err);
      showToast('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => { load(); }, [load]);

  const addTemplate = useCallback(async (name: string, items: Record<Layer, string | null>) => {
    if (!user) return;
    try {
      const template = await templateService.createTemplate(user.id, name, items);
      setTemplates(prev => [template, ...prev]);
      showToast('Template saved');
    } catch (err) {
      console.error('Failed to create template:', err);
      showToast('Failed to save template', 'error');
    }
  }, [user, showToast]);

  const editTemplate = useCallback(async (id: string, updates: { name?: string }) => {
    try {
      const updated = await templateService.updateTemplate(id, updates);
      setTemplates(prev => prev.map(t => t.id === id ? updated : t));
      showToast('Template updated');
    } catch (err) {
      console.error('Failed to update template:', err);
      showToast('Failed to update template', 'error');
    }
  }, [showToast]);

  const removeTemplate = useCallback(async (id: string) => {
    try {
      await templateService.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      showToast('Template deleted');
    } catch (err) {
      console.error('Failed to delete template:', err);
      showToast('Failed to delete template', 'error');
    }
  }, [showToast]);

  return { templates, loading, addTemplate, editTemplate, removeTemplate };
}
