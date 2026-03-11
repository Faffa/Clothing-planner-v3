import { motion } from 'framer-motion';
import { Shirt, Sparkle, WashingMachine, Check, Camera } from 'lucide-react';
import { fadeUp } from '@/lib/animations';
import { LAYER_LABELS } from '@/lib/constants';
import { CLOTHING_COLORS } from '@/types';
import type { ClothingItem, ClothingColor } from '@/types';

interface ClothingCardProps {
  item: ClothingItem;
  onClick: () => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onRetakePhoto?: (id: string) => void;
}

function getColorHex(color: ClothingColor): string {
  return CLOTHING_COLORS.find(c => c.value === color)?.hex || '#ccc';
}

export function ClothingCard({ item, onClick, selectable, selected, onSelect, onRetakePhoto }: ClothingCardProps) {
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(item.id);
  };

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4 }}
      onClick={selectable ? handleCheckboxClick : onClick}
      className={`group bg-white rounded-xl overflow-hidden shadow-maison hover:shadow-maison-md transition-all duration-300 cursor-pointer ${
        selected ? 'ring-2 ring-terracotta shadow-maison-md' : ''
      }`}
    >
      {/* Photo Area */}
      <div className="aspect-square bg-parchment-dark relative overflow-hidden">
        {item.photo_url ? (
          <img
            src={item.photo_url}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Shirt size={40} className="text-ink-muted/20" />
          </div>
        )}

        {/* Color indicator */}
        <div
          className="absolute top-2.5 left-2.5 w-4 h-4 rounded-full border-2 border-white shadow-sm"
          style={{ background: getColorHex(item.color) }}
        />

        {/* Selection checkbox */}
        {selectable && (
          <button
            onClick={handleCheckboxClick}
            className={`absolute top-2.5 right-2.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
              selected
                ? 'bg-terracotta border-terracotta text-white'
                : 'bg-white/80 border-parchment-deep hover:border-terracotta'
            }`}
          >
            {selected && <Check size={12} />}
          </button>
        )}

        {/* Favorite (only show when not in selection mode) */}
        {!selectable && item.is_favorite && (
          <div className="absolute top-2.5 right-2.5">
            <Sparkle size={14} className="text-gold fill-gold" />
          </div>
        )}

        {/* Laundry badge */}
        {!item.is_clean && (
          <div className="absolute bottom-2.5 right-2.5 bg-rouge/90 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1">
            <WashingMachine size={10} />
            Dirty
          </div>
        )}

        {/* Hover overlay */}
        {!selectable && (
          <div className="absolute inset-0 bg-espresso/0 group-hover:bg-espresso/40 transition-colors duration-300 flex items-center justify-center gap-3">
            <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              View Details
            </span>
            {onRetakePhoto && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRetakePhoto(item.id);
                }}
                className="absolute bottom-2.5 left-2.5 p-1.5 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white text-ink-muted hover:text-terracotta"
                title="Retake photo"
              >
                <Camera size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-ink truncate">{item.name}</h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-ink-muted uppercase tracking-wider">
            {LAYER_LABELS[item.layer]}
          </span>
          <span className="text-[10px] text-ink-muted">
            {item.wear_count} wears
          </span>
        </div>
      </div>
    </motion.div>
  );
}
