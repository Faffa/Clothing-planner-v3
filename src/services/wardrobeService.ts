import { supabase } from '@/lib/supabase';
import type { ClothingItem, Layer, ClothingColor, Season } from '@/types';
import imageCompression from 'browser-image-compression';

export type CreateItemInput = {
  name: string;
  layer: Layer;
  color: ClothingColor;
  temp_min: number | null;
  temp_max: number | null;
  seasons: Season[];
  tags: string[];
};

export async function getItems(userId: string): Promise<ClothingItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('clothing_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as ClothingItem[];
}

export async function createItem(
  userId: string,
  input: CreateItemInput,
  photo?: File | null,
): Promise<ClothingItem> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data: item, error } = await supabase
    .from('clothing_items')
    .insert({ user_id: userId, ...input })
    .select()
    .single();
  if (error) throw error;

  if (photo) {
    const photoUrl = await uploadPhoto(userId, item.id, photo);
    const { data: updated, error: updateErr } = await supabase
      .from('clothing_items')
      .update({ photo_url: photoUrl })
      .eq('id', item.id)
      .select()
      .single();
    if (updateErr) throw updateErr;
    return updated as ClothingItem;
  }

  return item as ClothingItem;
}

export async function updateItem(
  id: string,
  updates: Partial<ClothingItem>,
): Promise<ClothingItem> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('clothing_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as ClothingItem;
}

export async function deleteItem(id: string, userId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  // Delete photo from storage first
  await deletePhoto(userId, id);
  const { error } = await supabase
    .from('clothing_items')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function toggleClean(id: string, isClean: boolean): Promise<ClothingItem> {
  return updateItem(id, { is_clean: isClean });
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<ClothingItem> {
  return updateItem(id, { is_favorite: isFavorite });
}

export async function incrementWearCount(ids: string[]): Promise<void> {
  if (!supabase || ids.length === 0) return;
  // Increment each item's wear_count by 1
  for (const id of ids) {
    const { data } = await supabase
      .from('clothing_items')
      .select('wear_count')
      .eq('id', id)
      .single();
    if (data) {
      await supabase
        .from('clothing_items')
        .update({ wear_count: data.wear_count + 1 })
        .eq('id', id);
    }
  }
}

export async function uploadPhoto(
  userId: string,
  itemId: string,
  file: File,
): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured');

  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
  });

  const path = `${userId}/${itemId}.jpg`;
  const { error } = await supabase.storage
    .from('clothing-photos')
    .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' });
  if (error) throw error;

  const { data } = supabase.storage.from('clothing-photos').getPublicUrl(path);
  return data.publicUrl;
}

export async function deletePhoto(userId: string, itemId: string): Promise<void> {
  if (!supabase) return;
  const path = `${userId}/${itemId}.jpg`;
  await supabase.storage.from('clothing-photos').remove([path]);
}
