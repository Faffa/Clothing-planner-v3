import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { ClothingItem } from '@/types';
import type { CreateItemInput } from '@/services/wardrobeService';
import * as wardrobeService from '@/services/wardrobeService';
import { fileToDataUrl } from '@/services/imageProcessingService';

/** Helper to race a promise against a timeout. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), ms)),
  ]);
}

interface WardrobeContextValue {
  items: ClothingItem[];
  loading: boolean;
  addItem: (input: CreateItemInput, photo?: File | Blob | null) => Promise<void>;
  addItems: (batch: Array<{ input: CreateItemInput; photo?: File | Blob | null }>) => Promise<void>;
  editItem: (id: string, updates: Partial<ClothingItem>, photo?: File | null) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  toggleClean: (id: string, isClean: boolean) => Promise<void>;
  toggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
  bulkEditItems: (ids: string[], updates: Partial<ClothingItem>) => Promise<void>;
  bulkDeleteItems: (ids: string[]) => Promise<void>;
  reload: () => Promise<void>;
}

const WardrobeCtx = createContext<WardrobeContextValue | null>(null);

export function useWardrobe() {
  const ctx = useContext(WardrobeCtx);
  if (!ctx) throw new Error('useWardrobe must be used within WardrobeProvider');
  return ctx;
}

export function WardrobeProvider({ children }: { children: ReactNode }) {
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
        setItems([]);
      }
    } catch (err) {
      console.error('Failed to load wardrobe, falling back to local mode:', err);
      useLocal.current = true;
      setItems([]);
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
      setItems(prev => prev.map(i => ids.includes(i.id) ? { ...i, ...updates } : i));

      if (useLocal.current) {
        showToast(`${ids.length} items updated`);
        return;
      }

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
      setItems(prev => prev.filter(i => !ids.includes(i.id)));

      if (useLocal.current) {
        showToast(`${ids.length} items deleted`);
        return;
      }

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

  return (
    <WardrobeCtx.Provider value={{ items, loading, addItem, addItems, editItem, removeItem, toggleClean, toggleFavorite, bulkEditItems, bulkDeleteItems, reload: load }}>
      {children}
    </WardrobeCtx.Provider>
  );
}
