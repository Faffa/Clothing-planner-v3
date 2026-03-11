import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { FeedbackItem, FeedbackStatus } from '@/types';

const STORAGE_KEY = 'maison-feedback';

function loadLocal(): FeedbackItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocal(data: FeedbackItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function getFeedback(userId: string): Promise<FeedbackItem[]> {
  if (!supabase || !isSupabaseConfigured) {
    return loadLocal();
  }
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as FeedbackItem[]) || [];
  } catch {
    return loadLocal();
  }
}

export async function createFeedback(
  userId: string,
  page: string,
  message: string,
  element?: string,
): Promise<FeedbackItem> {
  const item: FeedbackItem = {
    id: crypto.randomUUID(),
    user_id: userId,
    page,
    element: element || null,
    message,
    status: 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!supabase || !isSupabaseConfigured) {
    const items = loadLocal();
    items.unshift(item);
    saveLocal(items);
    return item;
  }

  try {
    const { data, error } = await supabase
      .from('feedback')
      .insert({ user_id: userId, page, element: element || null, message })
      .select()
      .single();
    if (error) throw error;
    return data as FeedbackItem;
  } catch {
    const items = loadLocal();
    items.unshift(item);
    saveLocal(items);
    return item;
  }
}

export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus,
): Promise<FeedbackItem> {
  if (!supabase || !isSupabaseConfigured) {
    const items = loadLocal();
    const idx = items.findIndex(i => i.id === id);
    if (idx >= 0) {
      items[idx] = { ...items[idx], status, updated_at: new Date().toISOString() };
      saveLocal(items);
      return items[idx];
    }
    throw new Error('Feedback not found');
  }

  try {
    const { data, error } = await supabase
      .from('feedback')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as FeedbackItem;
  } catch {
    const items = loadLocal();
    const idx = items.findIndex(i => i.id === id);
    if (idx >= 0) {
      items[idx] = { ...items[idx], status, updated_at: new Date().toISOString() };
      saveLocal(items);
      return items[idx];
    }
    throw new Error('Feedback not found');
  }
}

export async function deleteFeedback(id: string): Promise<void> {
  if (!supabase || !isSupabaseConfigured) {
    const items = loadLocal();
    saveLocal(items.filter(i => i.id !== id));
    return;
  }

  try {
    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch {
    const items = loadLocal();
    saveLocal(items.filter(i => i.id !== id));
  }
}
