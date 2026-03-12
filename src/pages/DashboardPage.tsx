import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth } from 'date-fns';
import {
  Plus,
  Calendar,
  Shirt,
  CloudSun,
  Sparkles,
  WashingMachine,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWardrobe } from '@/hooks/useWardrobe';
import { useRules } from '@/hooks/useRules';
import { usePlanner } from '@/hooks/usePlanner';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { Link, useNavigate } from 'react-router-dom';
import { LAYER_LABELS } from '@/lib/constants';
import { stagger, fadeUp, EASE_MAISON } from '@/lib/animations';
import type { Layer, ClothingItem } from '@/types';

export function DashboardPage() {
  const { profile } = useAuth();
  const { items, loading: wardrobeLoading } = useWardrobe();
  const { rules, clashes } = useRules();
  const planner = usePlanner(items, rules, clashes);
  const navigate = useNavigate();

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  // Wardrobe stats
  const inLaundry = useMemo(() => items.filter(i => !i.is_clean).length, [items]);
  const thisMonthAdded = useMemo(() => {
    const monthStart = startOfMonth(today).toISOString();
    return items.filter(i => i.created_at >= monthStart).length;
  }, [items, today]);

  // Today's outfit from real plan
  const todayOutfit = useMemo(() => {
    if (!planner.plan) return null;
    const day = planner.plan.days.find(d => d.date === todayStr);
    if (!day) return null;
    const entries = Object.entries(day.items).filter(([, item]) => item !== null) as [Layer, ClothingItem][];
    return entries.length > 0 ? entries : null;
  }, [planner.plan, todayStr]);

  // Weekly summary from real plan
  const weekSummary = useMemo(() => {
    if (!planner.plan) return { dayLetters: ['M', 'T', 'W', 'T', 'F', 'S', 'S'], planned: Array(7).fill(false), todayIndex: -1 };
    const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const planned = planner.plan.days.map(day => {
      return Object.values(day.items).some(item => item !== null);
    });
    const todayIndex = planner.plan.days.findIndex(d => d.date === todayStr);
    const plannedCount = planned.filter(Boolean).length;
    return { dayLetters, planned, todayIndex, plannedCount };
  }, [planner.plan, todayStr]);

  const isLoading = wardrobeLoading;

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-6xl">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl text-ink mb-1">
          {greeting}, {profile?.display_name || 'there'}
        </h1>
        <p className="text-ink-muted text-sm">
          {format(today, 'EEEE, MMMM d, yyyy')}
        </p>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">

        {/* Today's Outfit - Large Card */}
        <motion.div
          variants={fadeUp}
          className="md:col-span-8 bg-white rounded-2xl shadow-maison overflow-hidden"
        >
          <div className="p-6 pb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl text-ink">Today's Outfit</h2>
              <p className="text-ink-muted text-xs mt-0.5">
                {format(today, 'EEEE')}
              </p>
            </div>
            {todayOutfit && (
              <Link to="/planner">
                <Button variant="ghost" size="sm" icon={<Sparkles size={14} />}>
                  Edit in Planner
                </Button>
              </Link>
            )}
          </div>

          <div className="px-6 pb-6">
            {isLoading ? (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-xl" />
                ))}
              </div>
            ) : todayOutfit ? (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {todayOutfit.map(([layer, item], i) => (
                  <motion.div
                    key={layer}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.06, duration: 0.4, ease: EASE_MAISON }}
                    className="group"
                  >
                    <div className="aspect-square bg-parchment-dark rounded-xl flex items-center justify-center relative overflow-hidden cursor-pointer group-hover:shadow-maison-md transition-shadow duration-300">
                      {item.photo_url ? (
                        <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <Shirt size={32} className="text-ink-muted/30" />
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-espresso/80 to-transparent p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <span className="text-parchment text-[11px] font-medium">{item.name}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-ink-muted mt-1.5 text-center truncate">{LAYER_LABELS[layer]}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Sparkles size={32} className="mx-auto text-ink-muted/20 mb-3" />
                <p className="text-ink-muted text-sm mb-3">No outfit planned for today</p>
                <Link to="/planner">
                  <Button variant="primary" size="sm" icon={<Sparkles size={14} />}>
                    Generate Plan
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Weather Widget */}
        <motion.div
          variants={fadeUp}
          className="md:col-span-4 bg-gradient-to-br from-espresso to-espresso-light rounded-2xl shadow-maison p-6 text-parchment flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between">
              <CloudSun size={36} className="text-gold" />
              <span className="text-4xl font-display font-light">--&deg;</span>
            </div>
            <p className="text-parchment/70 text-sm mt-3">Weather</p>
            <p className="text-parchment/50 text-xs">{profile?.location || 'Set location in Settings'}</p>
          </div>
          <div className="flex gap-4 mt-6 pt-4 border-t border-white/10">
            <p className="text-parchment/40 text-xs">Weather API coming soon</p>
          </div>
        </motion.div>

        {/* Weekly Summary */}
        <motion.div
          variants={fadeUp}
          className="md:col-span-5 bg-white rounded-2xl shadow-maison p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-ink">This Week</h2>
            <Link to="/planner" className="text-terracotta text-xs font-medium hover:underline flex items-center gap-1">
              View Plan <ArrowRight size={12} />
            </Link>
          </div>
          {isLoading ? (
            <Skeleton className="h-16 rounded-lg" />
          ) : (
            <>
              <div className="grid grid-cols-7 gap-2">
                {weekSummary.dayLetters.map((day, i) => {
                  const isPlanned = weekSummary.planned[i];
                  const isToday = i === weekSummary.todayIndex;
                  return (
                    <div key={i} className="text-center">
                      <span className={`text-[10px] font-medium ${isToday ? 'text-terracotta' : 'text-ink-muted'}`}>
                        {day}
                      </span>
                      <div className={`
                        mt-1 aspect-square rounded-lg flex items-center justify-center text-xs font-medium
                        ${isToday
                          ? 'bg-terracotta text-white ring-2 ring-terracotta/30'
                          : isPlanned
                            ? 'bg-sage/15 text-sage-dark'
                            : 'bg-parchment-dark text-ink-muted/50'
                        }
                      `}>
                        {isPlanned ? '\u2713' : '\u2014'}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-ink-muted text-xs mt-3">
                {weekSummary.plannedCount ?? 0} of 7 days planned
              </p>
            </>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          variants={fadeUp}
          className="md:col-span-3 bg-white rounded-2xl shadow-maison p-6"
        >
          <h2 className="font-display text-lg text-ink mb-4">Quick Actions</h2>
          <div className="flex flex-col gap-2">
            <Link to="/wardrobe">
              <Button variant="primary" size="md" className="w-full justify-start" icon={<Plus size={16} />}>
                Add Item
              </Button>
            </Link>
            <Link to="/planner">
              <Button variant="secondary" size="md" className="w-full justify-start" icon={<Calendar size={16} />}>
                Generate Plan
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="md"
              className="w-full justify-start"
              icon={<WashingMachine size={16} />}
              onClick={() => navigate('/wardrobe')}
            >
              Laundry Toggle
            </Button>
          </div>
        </motion.div>

        {/* Wardrobe Stats */}
        <motion.div
          variants={fadeUp}
          className="md:col-span-4 bg-white rounded-2xl shadow-maison p-6"
        >
          <h2 className="font-display text-lg text-ink mb-4">Wardrobe</h2>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Total Items', value: String(items.length), icon: <Shirt size={16} />, color: 'text-terracotta' },
                { label: 'In Laundry', value: String(inLaundry), icon: <WashingMachine size={16} />, color: 'text-rouge' },
                { label: 'Outfits Planned', value: String(weekSummary.plannedCount ?? 0), icon: <Calendar size={16} />, color: 'text-sage-dark' },
                { label: 'This Month', value: thisMonthAdded > 0 ? `+${thisMonthAdded}` : '0', icon: <TrendingUp size={16} />, color: 'text-gold-dark' },
              ].map(stat => (
                <div key={stat.label} className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-parchment-dark ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-xl font-display font-semibold text-ink">{stat.value}</p>
                    <p className="text-[10px] text-ink-muted">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
