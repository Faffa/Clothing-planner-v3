import { motion, AnimatePresence } from 'framer-motion';
import { X, Shirt, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { LAYER_LABELS } from '@/lib/constants';
import { CLOTHING_COLORS } from '@/types';
import type { ClothingItem, Layer, ClothingColor } from '@/types';
import type { ScoredAlternative } from '@/services/generatorService';
import { scaleIn } from '@/lib/animations';

interface SwapModalProps {
  open: boolean;
  layer: Layer;
  dayLabel: string;
  currentItem: ClothingItem | null;
  alternatives: ScoredAlternative[];
  onSelect: (item: ClothingItem) => void;
  onClose: () => void;
}

function getColorHex(color: ClothingColor): string {
  return CLOTHING_COLORS.find(c => c.value === color)?.hex || '#ccc';
}

export function SwapModal({ open, layer, dayLabel, currentItem, alternatives, onSelect, onClose }: SwapModalProps) {
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
            className="bg-parchment rounded-2xl shadow-maison-lg w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-parchment-deep">
              <div>
                <h2 className="font-display text-lg text-ink">Swap {LAYER_LABELS[layer]}</h2>
                <p className="text-xs text-ink-muted mt-0.5">{dayLabel}</p>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-parchment-dark text-ink-muted">
                <X size={18} />
              </button>
            </div>

            {/* Current item */}
            {currentItem && (
              <div className="px-5 py-3 bg-parchment-dark/30 border-b border-parchment-deep">
                <p className="text-[10px] text-ink-muted uppercase tracking-wider mb-1">Current</p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full border border-white/50"
                    style={{ background: getColorHex(currentItem.color) }}
                  />
                  <span className="text-sm font-medium text-ink">{currentItem.name}</span>
                </div>
              </div>
            )}

            {/* Alternatives */}
            <div className="flex-1 overflow-y-auto p-5">
              {alternatives.length === 0 ? (
                <div className="text-center py-8">
                  <Shirt size={32} className="mx-auto text-ink-muted/30 mb-2" />
                  <p className="text-sm text-ink-muted">No alternatives available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alternatives.map(({ item, score, warnings }) => (
                    <button
                      key={item.id}
                      onClick={() => onSelect(item)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white transition-colors text-left group"
                    >
                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-lg bg-parchment-dark overflow-hidden shrink-0 relative">
                        {item.photo_url ? (
                          <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Shirt size={18} className="text-ink-muted/30" />
                          </div>
                        )}
                        <div
                          className="absolute top-1 left-1 w-2.5 h-2.5 rounded-full border border-white/50"
                          style={{ background: getColorHex(item.color) }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-ink-muted">{item.wear_count} wears</span>
                          {!item.is_clean && (
                            <span className="text-[9px] bg-rouge/10 text-rouge px-1 py-0.5 rounded">dirty</span>
                          )}
                        </div>
                        {warnings.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertTriangle size={10} className="text-gold-dark shrink-0" />
                            <span className="text-[9px] text-gold-dark truncate">{warnings[0]}</span>
                          </div>
                        )}
                      </div>

                      {/* Score */}
                      <div className={`text-xs font-mono px-2 py-1 rounded-lg shrink-0 ${
                        score >= 80 ? 'bg-sage/10 text-sage-dark' :
                        score >= 50 ? 'bg-gold/10 text-gold-dark' :
                        'bg-rouge/10 text-rouge'
                      }`}>
                        {Math.round(score)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-parchment-deep">
              <Button variant="ghost" size="sm" onClick={onClose} className="w-full">Cancel</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
