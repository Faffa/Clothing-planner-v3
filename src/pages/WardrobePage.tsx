import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Filter,
  Shirt,
  Grid3X3,
  List,
  WashingMachine,
  Sparkle,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { LAYERS, CLOTHING_COLORS, type Layer, type ClothingColor, type ClothingItem } from '@/types';
import { LAYER_LABELS } from '@/lib/constants';

// Demo data for development
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

import { stagger, fadeUp } from '@/lib/animations';

export function WardrobePage() {
  const [items] = useState<ClothingItem[]>(DEMO_ITEMS);
  const [filterLayer, setFilterLayer] = useState<Layer | 'all'>('all');
  const [filterClean, setFilterClean] = useState<'all' | 'clean' | 'dirty'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filtered = items.filter(item => {
    if (filterLayer !== 'all' && item.layer !== filterLayer) return false;
    if (filterClean === 'clean' && !item.is_clean) return false;
    if (filterClean === 'dirty' && item.is_clean) return false;
    return true;
  });

  const getColorHex = (color: ClothingColor) =>
    CLOTHING_COLORS.find(c => c.value === color)?.hex || '#ccc';

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-6xl">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">My Wardrobe</h1>
          <p className="text-ink-muted text-sm mt-1">{items.length} items &middot; {items.filter(i => !i.is_clean).length} in laundry</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />}>
          Add Item
        </Button>
      </motion.div>

      {/* Filters Bar */}
      <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-1.5 text-ink-muted">
          <Filter size={14} />
          <span className="text-xs font-medium">Filter:</span>
        </div>

        {/* Layer Filter */}
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

        {/* Status Filter */}
        <select
          value={filterClean}
          onChange={e => setFilterClean(e.target.value as 'all' | 'clean' | 'dirty')}
          className="text-xs bg-white border border-parchment-deep rounded-lg px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
        >
          <option value="all">All Status</option>
          <option value="clean">Clean</option>
          <option value="dirty">In Laundry</option>
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
      </motion.div>

      {/* Grid */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
      >
        {filtered.map(item => (
          <motion.div
            key={item.id}
            variants={fadeUp}
            whileHover={{ y: -4 }}
            className="group bg-white rounded-xl overflow-hidden shadow-maison hover:shadow-maison-md transition-shadow duration-300 cursor-pointer"
          >
            {/* Photo Area */}
            <div className="aspect-square bg-parchment-dark relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <Shirt size={40} className="text-ink-muted/20" />
              </div>

              {/* Color indicator */}
              <div
                className="absolute top-2.5 left-2.5 w-4 h-4 rounded-full border-2 border-white shadow-sm"
                style={{ background: getColorHex(item.color) }}
              />

              {/* Favorite */}
              {item.is_favorite && (
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
              <div className="absolute inset-0 bg-espresso/0 group-hover:bg-espresso/40 transition-colors duration-300 flex items-center justify-center">
                <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  View Details
                </span>
              </div>
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
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <motion.div variants={fadeUp} className="text-center py-20">
          <Shirt size={48} className="mx-auto text-ink-muted/30 mb-4" />
          <p className="text-ink-muted text-sm">No items match your filters</p>
        </motion.div>
      )}
    </motion.div>
  );
}
