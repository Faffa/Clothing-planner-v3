import { useState, useMemo, useCallback } from 'react';
import {
  Plus,
  Filter,
  Shirt,
  Grid3X3,
  List,
  Images,
  Search,
  ArrowUpDown,
  CheckSquare,
  Square,
  X,
  Pencil,
  Trash2,
  Eraser,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ClothingCard } from '@/components/wardrobe/ClothingCard';
import { AddItemModal } from '@/components/wardrobe/AddItemModal';
import { EditItemModal } from '@/components/wardrobe/EditItemModal';
import { BulkUploadModal } from '@/components/wardrobe/BulkUploadModal';
import { BulkMetadataEditModal } from '@/components/wardrobe/BulkMetadataEditModal';
import { PhotoRetakeModal } from '@/components/wardrobe/PhotoRetakeModal';
import { useWardrobe } from '@/hooks/useWardrobe';
import { LAYERS } from '@/types';
import type { Layer, ClothingItem } from '@/types';
import { LAYER_LABELS } from '@/lib/constants';
import { ClothingCardSkeleton } from '@/components/common/Skeleton';
import { removeBackground, fileToDataUrl } from '@/services/imageProcessingService';
import { useToast } from '@/contexts/ToastContext';

type SortOption = 'recent' | 'name' | 'most-worn' | 'by-layer';

export function WardrobePage() {
  const { items, loading, addItem, addItems, editItem, removeItem, bulkEditItems, bulkDeleteItems } = useWardrobe();
  const [filterLayer, setFilterLayer] = useState<Layer | 'all'>('all');
  const [filterClean, setFilterClean] = useState<'all' | 'clean' | 'dirty'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);

  // Selection mode
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [retakeItem, setRetakeItem] = useState<ClothingItem | null>(null);
  const [bgRemovalProgress, setBgRemovalProgress] = useState<{ current: number; total: number } | null>(null);
  const { showToast } = useToast();


  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let result = items.filter(item => {
      if (filterLayer !== 'all' && item.layer !== filterLayer) return false;
      if (filterClean === 'clean' && !item.is_clean) return false;
      if (filterClean === 'dirty' && item.is_clean) return false;
      if (query) {
        const layerLabel = LAYER_LABELS[item.layer]?.toLowerCase() || '';
        const match = item.name.toLowerCase().includes(query)
          || item.color.toLowerCase().includes(query)
          || layerLabel.includes(query)
          || item.tags.some(t => t.toLowerCase().includes(query));
        if (!match) return false;
      }
      return true;
    });

    // Sort
    switch (sortBy) {
      case 'name':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'most-worn':
        result = [...result].sort((a, b) => b.wear_count - a.wear_count);
        break;
      case 'by-layer': {
        const layerOrder = LAYERS.map(l => l.value);
        result = [...result].sort((a, b) => layerOrder.indexOf(a.layer) - layerOrder.indexOf(b.layer));
        break;
      }
      case 'recent':
      default:
        result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return result;
  }, [items, filterLayer, filterClean, searchQuery, sortBy]);

  const hasItems = items.length > 0;
  const hasResults = filtered.length > 0;
  const isSearching = searchQuery.trim() !== '' || filterLayer !== 'all' || filterClean !== 'all';

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setConfirmBulkDelete(false);
  };

  const selectAll = () => {
    setSelectedIds(new Set(filtered.map(i => i.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setConfirmBulkDelete(false);
  };

  const handleBulkDelete = async () => {
    if (!confirmBulkDelete) {
      setConfirmBulkDelete(true);
      return;
    }
    await bulkDeleteItems(Array.from(selectedIds));
    exitSelectionMode();
  };

  const handleBulkRemoveBg = async () => {
    const withPhotos = selectedItems.filter(i => i.photo_url);
    if (withPhotos.length === 0) {
      showToast('No items with photos selected');
      return;
    }
    setBgRemovalProgress({ current: 0, total: withPhotos.length });
    let succeeded = 0;
    for (const item of withPhotos) {
      try {
        const response = await fetch(item.photo_url!);
        const blob = await response.blob();
        const file = new File([blob], 'photo.jpg', { type: blob.type || 'image/jpeg' });
        const bgBlob = await removeBackground(file);
        const newUrl = await fileToDataUrl(bgBlob);
        await editItem(item.id, { photo_url: newUrl });
        succeeded++;
      } catch (err) {
        console.warn(`BG removal failed for ${item.name}:`, err);
      }
      setBgRemovalProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null);
    }
    setBgRemovalProgress(null);
    const failed = withPhotos.length - succeeded;
    showToast(
      failed > 0
        ? `Background removed from ${succeeded} items (${failed} failed)`
        : `Background removed from ${succeeded} items`,
    );
  };

  const selectedItems = useMemo(
    () => items.filter(i => selectedIds.has(i.id)),
    [items, selectedIds],
  );

  // Stable callbacks for ClothingCard (avoids re-render of all cards)
  const handleCardClick = useCallback((item: ClothingItem) => {
    setEditingItem(item);
  }, []);

  const handleRetakePhoto = useCallback((id: string) => {
    setRetakeItem(items.find(i => i.id === id) ?? null);
  }, [items]);

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">My Wardrobe</h1>
          <p className="text-ink-muted text-sm mt-1">{items.length} items &middot; {items.filter(i => !i.is_clean).length} in laundry</p>
        </div>
        <div className="flex gap-2">
          {!selectionMode && (
            <Button variant="ghost" icon={<CheckSquare size={16} />} onClick={() => setSelectionMode(true)}>
              Select
            </Button>
          )}
          <Button variant="ghost" icon={<Images size={16} />} onClick={() => setBulkOpen(true)}>
            Bulk Upload
          </Button>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setAddOpen(true)}>
            Add Item
          </Button>
        </div>
      </div>

      {/* Selection Toolbar */}
      {selectionMode && (
        <div
          className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-terracotta/5 border border-terracotta/20 rounded-xl"
        >
          <button onClick={selectAll} className="flex items-center gap-1.5 text-xs text-ink hover:text-terracotta transition-colors">
            <CheckSquare size={14} />
            Select All
          </button>
          <button onClick={deselectAll} className="flex items-center gap-1.5 text-xs text-ink hover:text-terracotta transition-colors">
            <Square size={14} />
            Deselect All
          </button>
          <span className="text-xs text-ink-muted">{selectedIds.size} selected</span>
          <div className="w-full sm:w-auto sm:ml-auto flex gap-2">
            {selectedIds.size > 0 && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Pencil size={14} />}
                  onClick={() => setBulkEditOpen(true)}
                  disabled={!!bgRemovalProgress}
                >
                  Edit Selected
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Eraser size={14} />}
                  onClick={handleBulkRemoveBg}
                  disabled={!!bgRemovalProgress}
                >
                  {bgRemovalProgress
                    ? `Removing BG (${bgRemovalProgress.current}/${bgRemovalProgress.total})...`
                    : 'Remove BG'}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 size={14} />}
                  onClick={handleBulkDelete}
                  disabled={!!bgRemovalProgress}
                >
                  {confirmBulkDelete ? `Confirm Delete (${selectedIds.size})` : 'Delete Selected'}
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={exitSelectionMode} disabled={!!bgRemovalProgress}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="text-xs bg-white border border-parchment-deep rounded-lg pl-8 pr-3 py-2 text-ink w-full sm:w-44 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
          />
        </div>

        <div className="flex items-center gap-1.5 text-ink-muted">
          <Filter size={14} />
          <span className="text-xs font-medium">Filter:</span>
        </div>

        <select
          value={filterLayer}
          onChange={e => setFilterLayer(e.target.value as Layer | 'all')}
          className="text-xs bg-white border border-parchment-deep rounded-lg px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
        >
          <option value="all">All Layers</option>
          {LAYERS.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>

        <select
          value={filterClean}
          onChange={e => setFilterClean(e.target.value as 'all' | 'clean' | 'dirty')}
          className="text-xs bg-white border border-parchment-deep rounded-lg px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
        >
          <option value="all">All Status</option>
          <option value="clean">Clean</option>
          <option value="dirty">In Laundry</option>
        </select>

        {/* Sort */}
        <div className="flex items-center gap-1.5 text-ink-muted">
          <ArrowUpDown size={14} />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortOption)}
          className="text-xs bg-white border border-parchment-deep rounded-lg px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
        >
          <option value="recent">Recent</option>
          <option value="name">Name A-Z</option>
          <option value="most-worn">Most Worn</option>
          <option value="by-layer">By Layer</option>
        </select>

        <div className="ml-auto flex items-center gap-1 bg-parchment-dark rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-ink' : 'text-ink-muted'}`}
          >
            <Grid3X3 size={14} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-ink' : 'text-ink-muted'}`}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ClothingCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Grid */}
      {!loading && hasResults && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(item => (
            <ClothingCard
              key={item.id}
              item={item}
              onClick={() => handleCardClick(item)}
              selectable={selectionMode}
              selected={selectedIds.has(item.id)}
              onSelect={toggleSelect}
              onRetakePhoto={handleRetakePhoto}
            />
          ))}
        </div>
      )}

      {!loading && !hasResults && (
        <div className="text-center py-20">
          <Shirt size={48} className="mx-auto text-ink-muted/30 mb-4" />
          <p className="text-ink-muted text-sm">
            {isSearching && hasItems
              ? 'No items match your search or filters'
              : 'No items in your wardrobe yet'}
          </p>
        </div>
      )}

      {/* Modals */}
      <AddItemModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={addItem}
      />
      <EditItemModal
        open={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={editItem}
        onDelete={removeItem}
      />
      <BulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onSubmit={addItems}
      />
      <BulkMetadataEditModal
        open={bulkEditOpen}
        items={selectedItems}
        onClose={() => setBulkEditOpen(false)}
        onSave={bulkEditItems}
      />
      <PhotoRetakeModal
        open={!!retakeItem}
        item={retakeItem}
        onClose={() => setRetakeItem(null)}
        onSave={editItem}
      />
    </div>
  );
}
