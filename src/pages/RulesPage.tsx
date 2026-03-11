import { useState } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Palette, RotateCcw, Save, X, Plus } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useRules } from '@/hooks/useRules';
import { LAYER_LABELS } from '@/lib/constants';
import { CLOTHING_COLORS } from '@/types';
import type { Layer, ClothingColor } from '@/types';
import { stagger, fadeUp } from '@/lib/animations';

export function RulesPage() {
  const { rules, clashes, saving, updateRule, saveRules, addClash, removeClash, resetDefaults } = useRules();
  const [addingClash, setAddingClash] = useState(false);
  const [newClashA, setNewClashA] = useState<ClothingColor>('red');
  const [newClashB, setNewClashB] = useState<ClothingColor>('pink');

  const handleAddClash = async () => {
    if (newClashA === newClashB) return;
    await addClash(newClashA, newClashB);
    setAddingClash(false);
  };

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-4xl">
      <motion.div variants={fadeUp} className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Wearing Rules</h1>
          <p className="text-ink-muted text-sm mt-1">Configure limits for outfit generation</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<RotateCcw size={14} />} onClick={resetDefaults}>
            Reset Defaults
          </Button>
          <Button variant="primary" size="sm" icon={<Save size={14} />} onClick={saveRules} disabled={saving}>
            {saving ? 'Saving...' : 'Save Rules'}
          </Button>
        </div>
      </motion.div>

      {/* Wearing Rules */}
      <motion.div variants={fadeUp} className="bg-white rounded-xl shadow-maison p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <SlidersHorizontal size={18} className="text-terracotta" />
          <h2 className="font-display text-lg text-ink">Wear Limits</h2>
        </div>

        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.layer} className="flex items-center gap-4 py-3 border-b border-parchment-dark/40 last:border-0">
              <span className="w-28 text-sm font-medium text-ink">
                {LAYER_LABELS[rule.layer as Layer]}
              </span>

              <div className="flex items-center gap-2">
                <label className="text-xs text-ink-muted">Max / week:</label>
                <select
                  value={rule.max_per_week}
                  onChange={e => updateRule(rule.layer, 'max_per_week', Number(e.target.value))}
                  className="text-xs bg-parchment border border-parchment-deep rounded-lg px-2 py-1.5 text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 ml-auto cursor-pointer">
                <input
                  type="checkbox"
                  checked={rule.allow_consecutive}
                  onChange={e => updateRule(rule.layer, 'allow_consecutive', e.target.checked)}
                  className="w-4 h-4 rounded border-parchment-deep text-terracotta focus:ring-terracotta/30"
                />
                <span className="text-xs text-ink-muted">Allow consecutive days</span>
              </label>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Color Clash Rules */}
      <motion.div variants={fadeUp} className="bg-white rounded-xl shadow-maison p-6">
        <div className="flex items-center gap-2 mb-5">
          <Palette size={18} className="text-terracotta" />
          <h2 className="font-display text-lg text-ink">Color Clash Rules</h2>
        </div>

        <p className="text-ink-muted text-xs mb-4">These color combinations will be avoided in outfit generation.</p>

        <div className="space-y-2">
          {clashes.map((clash, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-parchment/50 rounded-lg">
              <span className="text-sm capitalize text-ink">{clash.color_a}</span>
              <span className="text-ink-muted text-xs">clashes with</span>
              <span className="text-sm capitalize text-ink">{clash.color_b}</span>
              <button
                onClick={() => removeClash(i)}
                className="ml-auto p-1 rounded hover:bg-parchment-dark text-ink-muted hover:text-rouge transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {addingClash ? (
          <div className="flex items-center gap-2 mt-3 p-3 bg-parchment/50 rounded-lg">
            <select
              value={newClashA}
              onChange={e => setNewClashA(e.target.value as ClothingColor)}
              className="text-xs bg-white border border-parchment-deep rounded-lg px-2 py-1.5 text-ink"
            >
              {CLOTHING_COLORS.filter(c => c.value !== 'multi').map(c => (
                <option key={c.value} value={c.value}>{c.value}</option>
              ))}
            </select>
            <span className="text-ink-muted text-xs">clashes with</span>
            <select
              value={newClashB}
              onChange={e => setNewClashB(e.target.value as ClothingColor)}
              className="text-xs bg-white border border-parchment-deep rounded-lg px-2 py-1.5 text-ink"
            >
              {CLOTHING_COLORS.filter(c => c.value !== 'multi').map(c => (
                <option key={c.value} value={c.value}>{c.value}</option>
              ))}
            </select>
            <Button variant="primary" size="sm" onClick={handleAddClash}>Add</Button>
            <Button variant="ghost" size="sm" onClick={() => setAddingClash(false)}>Cancel</Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="mt-3" icon={<Plus size={14} />} onClick={() => setAddingClash(true)}>
            Add Color Clash Rule
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
}
