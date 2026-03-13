import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shirt } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { scaleIn } from '@/lib/animations';
import { LAYERS, CLOTHING_COLORS, SEASONS } from '@/types';
import type { ClothingItem, Layer, ClothingColor, Season } from '@/types';

interface BulkMetadataEditModalProps {
  open: boolean;
  items: ClothingItem[];
  onClose: () => void;
  onSave: (ids: string[], updates: Partial<ClothingItem>) => Promise<void>;
}

const NO_CHANGE = '__no_change__';

export function BulkMetadataEditModal({ open, items, onClose, onSave }: BulkMetadataEditModalProps) {
  const [layer, setLayer] = useState(NO_CHANGE);
  const [color, setColor] = useState(NO_CHANGE);
  const [isClean, setIsClean] = useState(NO_CHANGE);
  const [isFavorite, setIsFavorite] = useState(NO_CHANGE);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonsChanged, setSeasonsChanged] = useState(false);
  const [addTags, setAddTags] = useState('');
  const [removeTags, setRemoveTags] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const updates: Partial<ClothingItem> = {};
    if (layer !== NO_CHANGE) updates.layer = layer as Layer;
    if (color !== NO_CHANGE) updates.color = color as ClothingColor;
    if (isClean !== NO_CHANGE) updates.is_clean = isClean === 'true';
    if (isFavorite !== NO_CHANGE) updates.is_favorite = isFavorite === 'true';
    if (seasonsChanged && seasons.length > 0) updates.seasons = seasons;

    // If no field changes were made (only tags), we still proceed for tag updates
    const hasUpdates = Object.keys(updates).length > 0;
    const hasTagChanges = addTags.trim() !== '' || removeTags.trim() !== '';

    if (!hasUpdates && !hasTagChanges) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      const ids = items.map(i => i.id);

      if (hasTagChanges) {
        // Handle tags per-item since they need merging
        const tagsToAdd = addTags.split(',').map(t => t.trim()).filter(Boolean);
        const tagsToRemove = new Set(removeTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean));

        for (const item of items) {
          let newTags = [...item.tags];
          // Remove tags
          if (tagsToRemove.size > 0) {
            newTags = newTags.filter(t => !tagsToRemove.has(t.toLowerCase()));
          }
          // Add tags (avoid duplicates)
          for (const tag of tagsToAdd) {
            if (!newTags.some(t => t.toLowerCase() === tag.toLowerCase())) {
              newTags.push(tag);
            }
          }
          await onSave([item.id], { ...updates, tags: newTags });
        }
      } else {
        await onSave(ids, updates);
      }
      handleClose();
    } catch {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setLayer(NO_CHANGE);
    setColor(NO_CHANGE);
    setIsClean(NO_CHANGE);
    setIsFavorite(NO_CHANGE);
    setSeasons([]);
    setSeasonsChanged(false);
    setAddTags('');
    setRemoveTags('');
    onClose();
  };

  const toggleSeason = (s: Season) => {
    setSeasonsChanged(true);
    setSeasons(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  return (
    <AnimatePresence>
      {open && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/50 p-4"
          onClick={handleClose}
        >
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="initial"
            onClick={e => e.stopPropagation()}
            className="bg-parchment rounded-2xl shadow-maison-lg w-full max-w-lg max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-parchment-deep shrink-0">
              <h2 className="font-display text-xl text-ink">Edit {items.length} Items</h2>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-parchment-dark text-ink-muted">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Thumbnail strip */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {items.slice(0, 10).map(item => (
                  <div key={item.id} className="w-10 h-10 rounded-lg bg-parchment-dark shrink-0 overflow-hidden">
                    {item.photo_url ? (
                      <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Shirt size={14} className="text-ink-muted/30" />
                      </div>
                    )}
                  </div>
                ))}
                {items.length > 10 && (
                  <div className="w-10 h-10 rounded-lg bg-parchment-dark shrink-0 flex items-center justify-center text-[10px] text-ink-muted font-medium">
                    +{items.length - 10}
                  </div>
                )}
              </div>

              <p className="text-xs text-ink-muted">Only changed fields will be applied. Leave as "-- No change --" to keep existing values.</p>

              {/* Layer */}
              <div>
                <label className="text-xs font-medium text-ink-muted block mb-1">Layer</label>
                <select
                  value={layer}
                  onChange={e => setLayer(e.target.value)}
                  className="w-full bg-white border border-parchment-deep rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                >
                  <option value={NO_CHANGE}>-- No change --</option>
                  {LAYERS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="text-xs font-medium text-ink-muted block mb-1">Color</label>
                <select
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-full bg-white border border-parchment-deep rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                >
                  <option value={NO_CHANGE}>-- No change --</option>
                  {CLOTHING_COLORS.map(c => (
                    <option key={c.value} value={c.value}>{c.value}</option>
                  ))}
                </select>
              </div>

              {/* Seasons */}
              <div>
                <label className="text-xs font-medium text-ink-muted block mb-1">
                  Seasons {seasonsChanged ? '' : '(unchanged)'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {SEASONS.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => toggleSeason(s.value)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        seasons.includes(s.value)
                          ? 'bg-terracotta text-white border-terracotta'
                          : 'bg-white text-ink-muted border-parchment-deep hover:border-terracotta/50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clean status */}
              <div>
                <label className="text-xs font-medium text-ink-muted block mb-1">Laundry Status</label>
                <select
                  value={isClean}
                  onChange={e => setIsClean(e.target.value)}
                  className="w-full bg-white border border-parchment-deep rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                >
                  <option value={NO_CHANGE}>-- No change --</option>
                  <option value="true">Clean</option>
                  <option value="false">Dirty / In Laundry</option>
                </select>
              </div>

              {/* Favorite */}
              <div>
                <label className="text-xs font-medium text-ink-muted block mb-1">Favorite</label>
                <select
                  value={isFavorite}
                  onChange={e => setIsFavorite(e.target.value)}
                  className="w-full bg-white border border-parchment-deep rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                >
                  <option value={NO_CHANGE}>-- No change --</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-medium text-ink-muted block mb-1">Add Tags (comma-separated)</label>
                <input
                  type="text"
                  value={addTags}
                  onChange={e => setAddTags(e.target.value)}
                  placeholder="e.g. casual, summer-ready"
                  className="w-full bg-white border border-parchment-deep rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted block mb-1">Remove Tags (comma-separated)</label>
                <input
                  type="text"
                  value={removeTags}
                  onChange={e => setRemoveTags(e.target.value)}
                  placeholder="e.g. old-tag"
                  className="w-full bg-white border border-parchment-deep rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 p-5 border-t border-parchment-deep shrink-0">
              <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Applying...' : `Apply to ${items.length} Items`}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
