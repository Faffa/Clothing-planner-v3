import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { OutfitTemplate, Layer } from '@/types';

const STORAGE_KEY = 'maison-outfit-templates';

function loadLocal(): OutfitTemplate[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocal(data: OutfitTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function getTemplates(userId: string): Promise<OutfitTemplate[]> {
  if (!supabase || !isSupabaseConfigured) {
    return loadLocal();
  }
  try {
    const { data, error } = await supabase
      .from('outfit_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as OutfitTemplate[]) || [];
  } catch {
    return loadLocal();
  }
}

export async function createTemplate(
  userId: string,
  name: string,
  items: Record<Layer, string | null>,
): Promise<OutfitTemplate> {
  const template: OutfitTemplate = {
    id: crypto.randomUUID(),
    user_id: userId,
    name,
    items,
    created_at: new Date().toISOString(),
  };

  if (!supabase || !isSupabaseConfigured) {
    const templates = loadLocal();
    templates.unshift(template);
    saveLocal(templates);
    return template;
  }

  try {
    const { data, error } = await supabase
      .from('outfit_templates')
      .insert({ user_id: userId, name, items })
      .select()
      .single();
    if (error) throw error;
    return data as OutfitTemplate;
  } catch {
    const templates = loadLocal();
    templates.unshift(template);
    saveLocal(templates);
    return template;
  }
}

export async function updateTemplate(
  id: string,
  updates: { name?: string; items?: Record<Layer, string | null> },
): Promise<OutfitTemplate> {
  if (!supabase || !isSupabaseConfigured) {
    const templates = loadLocal();
    const idx = templates.findIndex(t => t.id === id);
    if (idx >= 0) {
      templates[idx] = { ...templates[idx], ...updates };
      saveLocal(templates);
      return templates[idx];
    }
    throw new Error('Template not found');
  }

  try {
    const { data, error } = await supabase
      .from('outfit_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as OutfitTemplate;
  } catch {
    const templates = loadLocal();
    const idx = templates.findIndex(t => t.id === id);
    if (idx >= 0) {
      templates[idx] = { ...templates[idx], ...updates };
      saveLocal(templates);
      return templates[idx];
    }
    throw new Error('Template not found');
  }
}

export async function deleteTemplate(id: string): Promise<void> {
  if (!supabase || !isSupabaseConfigured) {
    const templates = loadLocal();
    saveLocal(templates.filter(t => t.id !== id));
    return;
  }

  try {
    const { error } = await supabase
      .from('outfit_templates')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch {
    const templates = loadLocal();
    saveLocal(templates.filter(t => t.id !== id));
  }
}
