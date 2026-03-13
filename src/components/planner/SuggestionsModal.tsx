import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wand2, Shirt, Loader2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { scaleIn } from '@/lib/animations';
import { LAYER_LABELS } from '@/lib/constants';
import { CLOTHING_COLORS } from '@/types';
import type { Layer, ClothingItem, ClothingColor } from '@/types';
import type { OutfitSuggestion } from '@/services/aiOutfitService';

interface SuggestionsModalProps {
  open: boolean;
  onClose: () => void;
  suggestions: OutfitSuggestion[];
  loading: boolean;
  onGenerate: (context?: { occasion?: string }) => void;
  onApply?: (suggestion: OutfitSuggestion) => void;
}

function getColorHex(color: ClothingColor): string {
  return CLOTHING_COLORS.find(c => c.value === color)?.hex || '#ccc';
}

function SuggestionCard({ suggestion, onApply }: { suggestion: OutfitSuggestion; onApply?: () => void }) {
  const filledLayers = Object.entries(suggestion.items)
    .filter(([, item]) => item !== null) as [Layer, ClothingItem][];

  return (
    <div className="bg-white rounded-xl shadow-maison p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-base text-ink">{suggestion.style}</h3>
        {onApply && (
          <Button variant="primary" size="sm" onClick={onApply}>
            Apply
          </Button>
        )}
      </div>
      <p className="text-xs text-ink-muted mb-3">{suggestion.reasoning}</p>
      <div className="flex flex-col gap-1.5">
        {filledLayers.map(([layer, item]) => (
          <div key={layer} className="flex items-center gap-2 p-1.5 rounded-lg bg-parchment/50">
            <div className="w-7 h-7 rounded-md bg-parchment-dark flex items-center justify-center shrink-0 overflow-hidden">
              {item.photo_url ? (
                <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <Shirt size={12} className="text-ink-muted/40" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-ink truncate">{item.name}</p>
              <p className="text-[9px] text-ink-muted uppercase tracking-wider">{LAYER_LABELS[layer]}</p>
            </div>
            <div
              className="w-3 h-3 rounded-full border border-parchment-deep shrink-0"
              style={{ background: getColorHex(item.color) }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SuggestionsModal({ open, onClose, suggestions, loading, onGenerate, onApply }: SuggestionsModalProps) {
  const [occasion, setOccasion] = useState('');

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
            className="bg-parchment rounded-2xl shadow-maison-lg w-full max-w-2xl max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-parchment-deep">
              <div>
                <h2 className="font-display text-xl text-ink">AI Outfit Suggestions</h2>
                <p className="text-xs text-ink-muted mt-0.5">Powered by Groq</p>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-parchment-dark text-ink-muted">
                <X size={18} />
              </button>
            </div>

            {/* Controls */}
            <div className="p-4 border-b border-parchment-deep flex items-center gap-3">
              <input
                value={occasion}
                onChange={e => setOccasion(e.target.value)}
                placeholder="Occasion (optional, e.g. work meeting, date night)"
                className="flex-1 bg-white border border-parchment-deep rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
              />
              <Button
                variant="primary"
                icon={loading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                onClick={() => onGenerate({ occasion: occasion.trim() || undefined })}
                disabled={loading}
              >
                {loading ? 'Thinking...' : 'Suggest'}
              </Button>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4">
              {suggestions.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Wand2 size={36} className="mx-auto text-ink-muted/20 mb-3" />
                  <p className="text-sm text-ink-muted">Click "Suggest" to get AI outfit recommendations</p>
                </div>
              )}
              {loading && (
                <div className="text-center py-12">
                  <Loader2 size={28} className="mx-auto text-terracotta animate-spin mb-3" />
                  <p className="text-sm text-ink-muted">Creating outfit suggestions...</p>
                </div>
              )}
              {!loading && suggestions.length > 0 && (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  {suggestions.map((s, i) => (
                    <SuggestionCard
                      key={i}
                      suggestion={s}
                      onApply={onApply ? () => onApply(s) : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
