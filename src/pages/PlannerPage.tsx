import { useState } from 'react';
import { motion } from 'framer-motion';
import { format, addDays, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  RefreshCw,
  ArrowLeftRight,
  Shirt,
  CloudSun,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { LAYER_LABELS } from '@/lib/constants';
import type { Layer } from '@/types';

import { stagger, fadeUp } from '@/lib/animations';

type DemoDayPlan = {
  date: Date;
  items: { name: string; layer: Layer }[];
  weather: { temp: number; icon: string };
};

export function PlannerPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [status, setStatus] = useState<'empty' | 'draft' | 'approved'>('draft');

  const weekDays: DemoDayPlan[] = Array.from({ length: 7 }, (_, i) => ({
    date: addDays(weekStart, i),
    items: status !== 'empty' ? [
      { name: ['Wool Coat', 'Denim Jacket', 'Blazer', 'Parka', 'Cardigan', 'Hoodie', 'Trench'][i], layer: 'outer' as Layer },
      { name: ['Cream Knit', 'Navy Top', 'White Shirt', 'Stripe Tee', 'Grey Knit', 'Black Tee', 'Flannel'][i], layer: 'top-base' as Layer },
      { name: ['Dark Jeans', 'Chinos', 'Trousers', 'Jeans', 'Cords', 'Joggers', 'Slacks'][i], layer: 'bottom' as Layer },
      { name: ['Boots', 'Loafers', 'Sneakers', 'Oxfords', 'Boots', 'Runners', 'Derbies'][i], layer: 'footwear' as Layer },
    ] : [],
    weather: {
      temp: [8, 10, 12, 11, 9, 13, 14][i],
      icon: ['cloud', 'sun', 'cloud-sun', 'rain', 'cloud', 'sun', 'sun'][i],
    },
  }));

  const weekLabel = `${format(weekStart, 'MMM d')} – ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`;

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-7xl">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Weekly Planner</h1>
          <p className="text-ink-muted text-sm mt-1">
            Plan your outfits for the week ahead
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status === 'draft' && (
            <Button
              variant="primary"
              icon={<Check size={16} />}
              onClick={() => setStatus('approved')}
            >
              Approve Plan
            </Button>
          )}
          <Button
            variant={status === 'empty' ? 'primary' : 'secondary'}
            icon={<Sparkles size={16} />}
            onClick={() => setStatus('draft')}
          >
            {status === 'empty' ? 'Generate Week' : 'Regenerate'}
          </Button>
        </div>
      </motion.div>

      {/* Week Navigator */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-6">
        <button
          onClick={() => setWeekStart(prev => subWeeks(prev, 1))}
          className="p-2 rounded-lg hover:bg-parchment-dark text-ink-muted hover:text-ink transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="font-display text-lg text-ink">{weekLabel}</p>
          {status !== 'empty' && (
            <span className={`
              text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full
              ${status === 'approved' ? 'bg-sage/15 text-sage-dark' : 'bg-gold/15 text-gold-dark'}
            `}>
              {status}
            </span>
          )}
        </div>
        <button
          onClick={() => setWeekStart(prev => addWeeks(prev, 1))}
          className="p-2 rounded-lg hover:bg-parchment-dark text-ink-muted hover:text-ink transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </motion.div>

      {/* Day Cards Grid */}
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map((day, i) => {
          const isToday = format(day.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const isWeekend = i >= 5;

          return (
            <motion.div
              key={i}
              variants={fadeUp}
              className={`
                bg-white rounded-xl shadow-maison overflow-hidden
                ${isToday ? 'ring-2 ring-terracotta/40' : ''}
                ${isWeekend ? 'opacity-90' : ''}
              `}
            >
              {/* Day Header */}
              <div className={`
                px-3 py-2 border-b border-parchment-dark/50 flex items-center justify-between
                ${isToday ? 'bg-terracotta/5' : 'bg-parchment/50'}
              `}>
                <div>
                  <p className={`text-xs font-semibold ${isToday ? 'text-terracotta' : 'text-ink'}`}>
                    {format(day.date, 'EEE')}
                  </p>
                  <p className="text-[10px] text-ink-muted">{format(day.date, 'd MMM')}</p>
                </div>
                <div className="flex items-center gap-1 text-ink-muted">
                  <CloudSun size={12} />
                  <span className="text-[10px]">{day.weather.temp}&deg;</span>
                </div>
              </div>

              {/* Outfit Items */}
              <div className="p-2 flex flex-col gap-1.5">
                {day.items.length > 0 ? (
                  day.items.map((item, j) => (
                    <motion.div
                      key={j}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 + j * 0.03 }}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-parchment-dark/50 transition-colors cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-md bg-parchment-dark flex items-center justify-center shrink-0">
                        <Shirt size={14} className="text-ink-muted/40" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium text-ink truncate">{item.name}</p>
                        <p className="text-[9px] text-ink-muted uppercase tracking-wider">
                          {LAYER_LABELS[item.layer]}
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-[10px] text-ink-muted">No outfit</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {status === 'draft' && day.items.length > 0 && (
                <div className="px-2 pb-2 flex gap-1">
                  <button className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] text-ink-muted hover:bg-parchment-dark hover:text-ink transition-colors">
                    <ArrowLeftRight size={10} />
                    Swap
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] text-ink-muted hover:bg-parchment-dark hover:text-ink transition-colors">
                    <RefreshCw size={10} />
                    Regen
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
