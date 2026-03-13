import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, Trash2, Check, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { scaleIn } from '@/lib/animations';
import { LAYER_LABELS } from '@/lib/constants';
import type { OutfitTemplate, Layer } from '@/types';

interface TemplateListModalProps {
  open: boolean;
  templates: OutfitTemplate[];
  onClose: () => void;
  onApply: (template: OutfitTemplate) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function TemplateListModal({ open, templates, onClose, onApply, onRename, onDelete }: TemplateListModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const startRename = (t: OutfitTemplate) => {
    setEditingId(t.id);
    setEditName(t.name);
    setConfirmDeleteId(null);
  };

  const confirmRename = () => {
    if (editingId && editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      onDelete(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  const layerCount = (t: OutfitTemplate) =>
    Object.values(t.items).filter(Boolean).length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/50 p-4"
          onClick={onClose}
        >
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="initial"
            onClick={e => e.stopPropagation()}
            className="bg-parchment rounded-2xl shadow-maison-lg w-full max-w-md max-h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-parchment-deep">
              <h2 className="font-display text-xl text-ink">Outfit Templates</h2>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-parchment-dark text-ink-muted">
                <X size={18} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {templates.length === 0 ? (
                <div className="text-center py-12">
                  <LayoutTemplate size={36} className="mx-auto text-ink-muted/20 mb-3" />
                  <p className="text-sm text-ink-muted">No templates saved yet</p>
                  <p className="text-xs text-ink-muted/70 mt-1">Save outfits from your weekly plan to reuse them</p>
                </div>
              ) : (
                templates.map(t => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-maison hover:shadow-maison-md transition-shadow"
                  >
                    <div className="flex-1 min-w-0">
                      {editingId === t.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && confirmRename()}
                            className="flex-1 bg-parchment-dark border border-parchment-deep rounded-lg px-2 py-1 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                            autoFocus
                          />
                          <button onClick={confirmRename} className="p-1 text-sage hover:text-sage-dark">
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-ink truncate">{t.name}</p>
                          <p className="text-[10px] text-ink-muted mt-0.5">
                            {layerCount(t)} layers &middot; {Object.entries(t.items)
                              .filter(([, v]) => v)
                              .map(([l]) => LAYER_LABELS[l as Layer])
                              .join(', ')}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onApply(t)}
                      >
                        Apply
                      </Button>
                      <button
                        onClick={() => startRename(t)}
                        className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-parchment-dark transition-colors"
                        title="Rename"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          confirmDeleteId === t.id
                            ? 'text-rouge bg-rouge/10'
                            : 'text-ink-muted hover:text-rouge hover:bg-rouge/5'
                        }`}
                        title={confirmDeleteId === t.id ? 'Click again to confirm' : 'Delete'}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
