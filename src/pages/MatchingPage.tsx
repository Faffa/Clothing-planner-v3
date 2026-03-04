import { motion } from 'framer-motion';
import { Plus, Link2, Shirt } from 'lucide-react';
import { Button } from '@/components/common/Button';

import { stagger, fadeUp } from '@/lib/animations';

const DEMO_GROUPS = [
  { id: '1', name: 'Earth Tones', items: ['Wool Coat', 'Khaki Chinos', 'Chelsea Boots', 'Leather Bag'], color: '#78552b' },
  { id: '2', name: 'Monochrome', items: ['Black Jeans', 'White Tee', 'Black Boots'], color: '#1a1a1a' },
  { id: '3', name: 'Smart Casual', items: ['Navy Blazer', 'White Shirt', 'Chinos', 'Loafers'], color: '#1e3a5f' },
  { id: '4', name: 'Weekend Comfort', items: ['Hoodie', 'Joggers', 'Sneakers'], color: '#9ca3af' },
];

const DEMO_COMPAT = [
  { a: 'Earth Tones', b: 'Smart Casual' },
  { a: 'Monochrome', b: 'Smart Casual' },
];

export function MatchingPage() {
  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-6xl">
      <motion.div variants={fadeUp} className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Matching Groups</h1>
          <p className="text-ink-muted text-sm mt-1">Group compatible items and define which groups work together</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />}>New Group</Button>
      </motion.div>

      {/* Groups Grid */}
      <motion.div variants={stagger} className="grid grid-cols-2 gap-4 mb-10">
        {DEMO_GROUPS.map(group => (
          <motion.div
            key={group.id}
            variants={fadeUp}
            whileHover={{ y: -2 }}
            className="bg-white rounded-xl shadow-maison p-5 cursor-pointer hover:shadow-maison-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ background: group.color }} />
              <h3 className="font-display text-lg text-ink">{group.name}</h3>
              <span className="ml-auto text-[10px] text-ink-muted bg-parchment-dark px-2 py-0.5 rounded-full">
                {group.items.length} items
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {group.items.map(item => (
                <span key={item} className="inline-flex items-center gap-1 text-[11px] bg-parchment-dark text-ink-light px-2 py-1 rounded-md">
                  <Shirt size={10} />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Compatibility Section */}
      <motion.div variants={fadeUp}>
        <h2 className="font-display text-xl text-ink mb-4 flex items-center gap-2">
          <Link2 size={18} className="text-terracotta" />
          Compatibility
        </h2>
        <div className="bg-white rounded-xl shadow-maison p-5">
          <p className="text-ink-muted text-xs mb-4">Groups that are marked as compatible will mix items in outfit generation.</p>
          <div className="space-y-2">
            {DEMO_COMPAT.map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-parchment/50 rounded-lg">
                <span className="text-sm font-medium text-ink">{c.a}</span>
                <Link2 size={14} className="text-gold" />
                <span className="text-sm font-medium text-ink">{c.b}</span>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="mt-3" icon={<Plus size={14} />}>
            Add Compatibility Rule
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
