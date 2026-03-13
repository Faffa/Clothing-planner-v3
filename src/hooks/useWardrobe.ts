import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { ClothingItem } from '@/types';
import type { CreateItemInput } from '@/services/wardrobeService';
import * as wardrobeService from '@/services/wardrobeService';
import { fileToDataUrl } from '@/services/imageProcessingService';

// Demo data fallback
const DEMO_ITEMS: ClothingItem[] = [
  { id: '1', user_id: 'demo', name: 'Wool Overcoat', layer: 'outer', color: 'tan', photo_url: null, temp_min: -5, temp_max: 12, seasons: ['autumn', 'winter'], is_clean: true, is_favorite: true, wear_count: 14, tags: [], created_at: '', updated_at: '' },
  { id: '2', user_id: 'demo', name: 'Navy Blazer', layer: 'top-over', color: 'navy', photo_url: null, temp_min: 5, temp_max: 22, seasons: ['spring', 'autumn'], is_clean: true, is_favorite: false, wear_count: 8, tags: [], created_at: '', updated_at: '' },
  { id: '3', user_id: 'demo', name: 'Cream Cable Knit', layer: 'top-base', color: 'cream', photo_url: null, temp_min: 0, temp_max: 15, seasons: ['autumn', 'winter'], is_clean: true, is_favorite: true, wear_count: 11, tags: [], created_at: '', updated_at: '' },
  { id: '4', user_id: 'demo', name: 'White Oxford Shirt', layer: 'top-base', color: 'white', photo_url: null, temp_min: 10, temp_max: 30, seasons: ['all-year'], is_clean: false, is_favorite: false, wear_count: 22, tags: [], created_at: '', updated_at: '' },
  { id: '5', user_id: 'demo', name: 'Black Slim Jeans', layer: 'bottom', color: 'black', photo_url: null, temp_min: 0, temp_max: 25, seasons: ['all-year'], is_clean: true, is_favorite: true, wear_count: 30, tags: [], created_at: '', updated_at: '' },
  { id: '6', user_id: 'demo', name: 'Khaki Chinos', layer: 'bottom', color: 'khaki', photo_url: null, temp_min: 10, temp_max: 30, seasons: ['spring', 'summer', 'autumn'], is_clean: true, is_favorite: false, wear_count: 16, tags: [], created_at: '', updated_at: '' },
  { id: '7', user_id: 'demo', name: 'Chelsea Boots', layer: 'footwear', color: 'brown', photo_url: null, temp_min: -5, temp_max: 20, seasons: ['autumn', 'winter'], is_clean: true, is_favorite: true, wear_count: 25, tags: [], created_at: '', updated_at: '' },
  { id: '8', user_id: 'demo', name: 'White Sneakers', layer: 'footwear', color: 'white', photo_url: null, temp_min: 5, temp_max: 35, seasons: ['spring', 'summer'], is_clean: false, is_favorite: false, wear_count: 18, tags: [], created_at: '', updated_at: '' },
  { id: '9', user_id: 'demo', name: 'Leather Crossbody', layer: 'bag', color: 'brown', photo_url: null, temp_min: null, temp_max: null, seasons: ['all-year'], is_clean: true, is_favorite: false, wear_count: 12, tags: [], created_at: '', updated_at: '' },
  { id: '10', user_id: 'demo', name: 'Gold Watch', layer: 'accessory', color: 'yellow', photo_url: null, temp_min: null, temp_max: null, seasons: ['all-year'], is_clean: true, is_favorite: true, wear_count: 40, tags: [], created_at: '', updated_at: '' },
  { id: '11', user_id: 'demo', name: 'Burgundy Scarf', layer: 'accessory', color: 'burgundy', photo_url: null, temp_min: -10, temp_max: 10, seasons: ['autumn', 'winter'], is_clean: true, is_favorite: false, wear_count: 6, tags: [], created_at: '', updated_at: '' },
  { id: '12', user_id: 'demo', name: 'Linen Dress', layer: 'dress', color: 'beige', photo_url: null, temp_min: 18, temp_max: 35, seasons: ['summer'], is_clean: true, is_favorite: false, wear_count: 4, tags: [], created_at: '', updated_at: '' },
];

/** Helper to race a promise against a timeout. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), ms)),
  ]);
}

export function useWardrobe() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  // Track whether Supabase DB is actually reachable (tables exist)
  const useLocal = useRef(!isSupabaseConfigured);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (isSupabaseConfigured && !useLocal.current) {
        const data = await withTimeout(wardrobeService.getItems(user.id), 8000);
        setItems(data);
      } else {
        setItems(DEMO_ITEMS);
      }
    } catch (err) {
      console.error('Failed to load wardrobe, falling back to local mode:', err);
      useLocal.current = true;
      setItems(DEMO_ITEMS);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const addItemLocal = useCallback(async (user_id: string, input: CreateItemInput, photo?: File | Blob | null) => {
    let photoUrl: string | null = null;
    if (photo) {
      photoUrl = await fileToDataUrl(photo);
    }
    const newItem: ClothingItem = {
      id: crypto.randomUUID(),
      user_id,
      ...input,
      photo_url: photoUrl,
      is_clean: true,
      is_favorite: false,
      wear_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return newItem;
  }, []);

  const addItem = useCallback(async (input: CreateItemInput, photo?: File | Blob | null) => {
    if (!user) return;
    try {
      if (useLocal.current) {
        const newItem = await addItemLocal(user.id, input, photo);
        setItems(prev => [newItem, ...prev]);
        showToast('Item added');
        return;
      }
      const photoFile = photo instanceof Blob && !(photo instanceof File)
        ? new File([photo], 'photo.png', { type: photo.type })
        : photo as File | null | undefined;
      const item = await withTimeout(wardrobeService.createItem(user.id, input, photoFile), 5000);
      setItems(prev => [item, ...prev]);
      showToast('Item added');
    } catch (err) {
      console.error('Supabase addItem failed, saving locally:', err);
      useLocal.current = true;
      // Fall back to local storage
      const newItem = await addItemLocal(user.id, input, photo);
      setItems(prev => [newItem, ...prev]);
      showToast('Item added (saved locally)');
    }
  }, [user, showToast, addItemLocal]);

  const addItems = useCallback(async (batch: Array<{ input: CreateItemInput; photo?: File | Blob | null }>) => {
    if (!user) return;
    try {
      const newItems: ClothingItem[] = [];
      for (const { input, photo } of batch) {
        if (useLocal.current) {
          newItems.push(await addItemLocal(user.id, input, photo));
        } else {
          try {
            const photoFile = photo instanceof Blob && !(photo instanceof File)
              ? new File([photo], 'photo.png', { type: photo.type })
              : photo as File | null | undefined;
            const item = await withTimeout(wardrobeService.createItem(user.id, input, photoFile), 5000);
            newItems.push(item);
          } catch {
            useLocal.current = true;
            newItems.push(await addItemLocal(user.id, input, photo));
          }
        }
      }
      setItems(prev => [...newItems, ...prev]);
      showToast(`${newItems.length} item${newItems.length > 1 ? 's' : ''} added`);
    } catch (err) {
      console.error('Failed to add items:', err);
      showToast('Failed to add items', 'error');
    }
  }, [user, showToast, addItemLocal]);

  const editItem = useCallback(async (id: string, updates: Partial<ClothingItem>, photo?: File | null) => {
    try {
      if (useLocal.current) {
        if (photo) {
          updates.photo_url = await fileToDataUrl(photo);
        }
        setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
        showToast('Item updated');
        return;
      }
      if (photo && user) {
        const photoUrl = await withTimeout(wardrobeService.uploadPhoto(user.id, id, photo), 10000);
        updates.photo_url = photoUrl;
      }
      const updated = await withTimeout(wardrobeService.updateItem(id, updates), 10000);
      setItems(prev => prev.map(i => i.id === id ? updated : i));
      showToast('Item updated');
    } catch (err) {
      console.error('Failed to update item:', err);
      useLocal.current = true;
      if (photo) updates.photo_url = await fileToDataUrl(photo);
      setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
      showToast('Item updated (saved locally)');
    }
  }, [user, showToast]);

  const removeItem = useCallback(async (id: string) => {
    try {
      if (useLocal.current) {
        setItems(prev => prev.filter(i => i.id !== id));
        showToast('Item deleted');
        return;
      }
      if (user) await withTimeout(wardrobeService.deleteItem(id, user.id), 10000);
      setItems(prev => prev.filter(i => i.id !== id));
      showToast('Item deleted');
    } catch (err) {
      console.error('Failed to delete item:', err);
      setItems(prev => prev.filter(i => i.id !== id));
      showToast('Item deleted (locally)');
    }
  }, [user, showToast]);

  const toggleClean = useCallback(async (id: string, isClean: boolean) => {
    // Always apply locally first for responsiveness
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_clean: isClean } : i));
    if (useLocal.current) return;
    try {
      await withTimeout(wardrobeService.toggleClean(id, isClean), 8000);
    } catch {
      useLocal.current = true;
    }
  }, []);

  const toggleFavorite = useCallback(async (id: string, isFavorite: boolean) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_favorite: isFavorite } : i));
    if (useLocal.current) return;
    try {
      await withTimeout(wardrobeService.toggleFavorite(id, isFavorite), 8000);
    } catch {
      useLocal.current = true;
    }
  }, []);

  const bulkEditItems = useCallback(async (ids: string[], updates: Partial<ClothingItem>) => {
    try {
      // Apply locally first for responsiveness
      setItems(prev => prev.map(i => ids.includes(i.id) ? { ...i, ...updates } : i));

      if (useLocal.current) {
        showToast(`${ids.length} items updated`);
        return;
      }

      // Batch in groups of 10 to avoid rate limits
      for (let i = 0; i < ids.length; i += 10) {
        const batch = ids.slice(i, i + 10);
        await Promise.all(batch.map(id => wardrobeService.updateItem(id, updates).catch(() => null)));
      }
      showToast(`${ids.length} items updated`);
    } catch (err) {
      console.error('Bulk edit failed:', err);
      useLocal.current = true;
      showToast(`${ids.length} items updated (locally)`);
    }
  }, [showToast]);

  const bulkDeleteItems = useCallback(async (ids: string[]) => {
    try {
      // Optimistically remove from state
      setItems(prev => prev.filter(i => !ids.includes(i.id)));

      if (useLocal.current) {
        showToast(`${ids.length} items deleted`);
        return;
      }

      // Batch in groups of 10 to avoid rate limits
      for (let i = 0; i < ids.length; i += 10) {
        const batch = ids.slice(i, i + 10);
        await Promise.all(
          batch.map(id =>
            user ? wardrobeService.deleteItem(id, user.id).catch(() => null) : Promise.resolve(),
          ),
        );
      }
      showToast(`${ids.length} items deleted`);
    } catch (err) {
      console.error('Bulk delete failed:', err);
      useLocal.current = true;
      showToast(`${ids.length} items deleted (locally)`);
    }
  }, [user, showToast]);

  return { items, loading, addItem, addItems, editItem, removeItem, toggleClean, toggleFavorite, bulkEditItems, bulkDeleteItems, reload: load };
}
