import { useState } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Palette, RotateCcw } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { DEFAULT_WEARING_RULES, DEFAULT_COLOR_CLASHES, LAYER_LABELS } from '@/lib/constants';
import type { Layer } from '@/types';

import { stagger, fadeUp } from '@/lib/animations';

export function RulesPage() {
  const [rules, setRules] = useState(DEFAULT_WEARING_RULES);

  const updateRule = (layer: string, field: 'max_per_week' | 'allow_consecutive', value: number | boolean) => {
    setRules(prev => prev.map(r =>
      r.layer === layer ? { ...r, [field]: value } : r
    ));
  };

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-4xl">
      <motion.div variants={fadeUp} className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Wearing Rules</h1>
          <p className="text-ink-muted text-sm mt-1">Configure limits for outfit generation</p>
        </div>
        <Button variant="ghost" size="sm" icon={<RotateCcw size={14} />}>
          Reset Defaults
        </Button>
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
          {DEFAULT_COLOR_CLASHES.map((clash, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-parchment/50 rounded-lg">
              <span className="text-sm capitalize text-ink">{clash.color_a}</span>
              <span className="text-ink-muted text-xs">clashes with</span>
              <span className="text-sm capitalize text-ink">{clash.color_b}</span>
            </div>
          ))}
        </div>

        <Button variant="ghost" size="sm" className="mt-3" icon={<Palette size={14} />}>
          Add Color Clash Rule
        </Button>
      </motion.div>
    </motion.div>
  );
}
