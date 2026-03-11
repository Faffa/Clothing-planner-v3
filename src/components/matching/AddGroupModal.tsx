import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check, Shirt } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { scaleIn } from '@/lib/animations';
import { LAYERS } from '@/types';
import type { ClothingItem } from '@/types';

interface AddGroupModalProps {
  open: boolean;
  items: ClothingItem[];
  onClose: () => void;
  onSubmit: (name: string, itemIds: string[]) => void;
}

export function AddGroupModal({ open, items, onClose, onSubmit }: AddGroupModalProps) {
  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filterLayer, setFilterLayer] = useState<string>('all');

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (filterLayer !== 'all' && item.layer !== filterLayer) return false;
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, search, filterLayer]);

  const toggleItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!name.trim() || selectedIds.size === 0) return;
    onSubmit(name.trim(), Array.from(selectedIds));
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setSelectedIds(new Set());
    setSearch('');
    setFilterLayer('all');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/50 backdrop-blur-sm p-4"
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
              <h2 className="font-display text-xl text-ink">New Group</h2>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-parchment-dark text-ink-muted">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Name input */}
              <div>
                <label className="text-xs font-medium text-ink-muted block mb-1">Group Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Earth Tones"
                  className="w-full bg-white border border-parchment-deep rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                />
              </div>

              {/* Search + Filter */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted/50" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search items..."
                    className="w-full bg-white border border-parchment-deep rounded-lg pl-8 pr-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                  />
                </div>
                <select
                  value={filterLayer}
                  onChange={e => setFilterLayer(e.target.value)}
                  className="bg-white border border-parchment-deep rounded-lg px-2 py-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-terracotta/30"
                >
                  <option value="all">All</option>
                  {LAYERS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>

              {/* Item grid */}
              <div className="grid grid-cols-3 gap-2">
                {filteredItems.map(item => {
                  const selected = selectedIds.has(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      className={`relative rounded-lg border-2 overflow-hidden transition-all ${
                        selected
                          ? 'border-terracotta shadow-maison'
                          : 'border-transparent hover:border-parchment-deep'
                      }`}
                    >
                      <div className="aspect-square bg-parchment-dark flex items-center justify-center overflow-hidden">
                        {item.photo_url ? (
                          <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <Shirt size={20} className="text-ink-muted/30" />
                        )}
                      </div>
                      <p className="text-[10px] text-ink truncate px-1.5 py-1">{item.name}</p>
                      {selected && (
                        <div className="absolute top-1 right-1 bg-terracotta text-white rounded-full p-0.5">
                          <Check size={10} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {filteredItems.length === 0 && (
                <p className="text-center text-xs text-ink-muted py-4">No items match</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-5 border-t border-parchment-deep shrink-0">
              <span className="text-xs text-ink-muted">{selectedIds.size} selected</span>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={!name.trim() || selectedIds.size === 0}
                  onClick={handleSubmit}
                >
                  Create Group
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
