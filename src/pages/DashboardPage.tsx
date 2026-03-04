import { motion } from 'framer-motion';
import { format } from 'date-fns';
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
import { Button } from '@/components/common/Button';
import { Link } from 'react-router-dom';
import { stagger, fadeUp, EASE_MAISON } from '@/lib/animations';

export function DashboardPage() {
  const { profile } = useAuth();
  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-6xl">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="font-display text-3xl text-ink mb-1">
          {greeting}, {profile?.display_name || 'there'}
        </h1>
        <p className="text-ink-muted text-sm">
          {format(today, 'EEEE, MMMM d, yyyy')}
        </p>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">

        {/* Today's Outfit - Large Card */}
        <motion.div
          variants={fadeUp}
          className="col-span-8 bg-white rounded-2xl shadow-maison overflow-hidden"
        >
          <div className="p-6 pb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl text-ink">Today's Outfit</h2>
              <p className="text-ink-muted text-xs mt-0.5">
                {format(today, 'EEEE')} &middot; Partly Cloudy &middot; 12&deg;C
              </p>
            </div>
            <Button variant="ghost" size="sm" icon={<Sparkles size={14} />}>
              Regenerate
            </Button>
          </div>

          {/* Outfit Stack */}
          <div className="px-6 pb-6">
            <div className="grid grid-cols-5 gap-3">
              {['Wool Coat', 'Cream Knit', 'White Tee', 'Dark Jeans', 'Chelsea Boots'].map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.4, ease: EASE_MAISON }}
                  className="group"
                >
                  <div className="aspect-square bg-parchment-dark rounded-xl flex items-center justify-center relative overflow-hidden cursor-pointer group-hover:shadow-maison-md transition-shadow duration-300">
                    <Shirt size={32} className="text-ink-muted/30" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-espresso/80 to-transparent p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span className="text-parchment text-[11px] font-medium">{item}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-ink-muted mt-1.5 text-center truncate">{item}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Weather Widget */}
        <motion.div
          variants={fadeUp}
          className="col-span-4 bg-gradient-to-br from-espresso to-espresso-light rounded-2xl shadow-maison p-6 text-parchment flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between">
              <CloudSun size={36} className="text-gold" />
              <span className="text-4xl font-display font-light">12&deg;</span>
            </div>
            <p className="text-parchment/70 text-sm mt-3">Partly Cloudy</p>
            <p className="text-parchment/50 text-xs">{profile?.location || 'Set location'}</p>
          </div>
          <div className="flex gap-4 mt-6 pt-4 border-t border-white/10">
            <div>
              <p className="text-gold text-xs font-medium">High</p>
              <p className="text-parchment text-lg font-display">14&deg;</p>
            </div>
            <div>
              <p className="text-gold text-xs font-medium">Low</p>
              <p className="text-parchment text-lg font-display">8&deg;</p>
            </div>
            <div>
              <p className="text-gold text-xs font-medium">Feel</p>
              <p className="text-parchment text-lg font-display">10&deg;</p>
            </div>
          </div>
        </motion.div>

        {/* Weekly Summary */}
        <motion.div
          variants={fadeUp}
          className="col-span-5 bg-white rounded-2xl shadow-maison p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-ink">This Week</h2>
            <Link to="/planner" className="text-terracotta text-xs font-medium hover:underline flex items-center gap-1">
              View Plan <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
              const planned = i < 3;
              const isToday = i === 1;
              return (
                <div key={i} className="text-center">
                  <span className={`text-[10px] font-medium ${isToday ? 'text-terracotta' : 'text-ink-muted'}`}>
                    {day}
                  </span>
                  <div className={`
                    mt-1 aspect-square rounded-lg flex items-center justify-center text-xs font-medium
                    ${isToday
                      ? 'bg-terracotta text-white ring-2 ring-terracotta/30'
                      : planned
                        ? 'bg-sage/15 text-sage-dark'
                        : 'bg-parchment-dark text-ink-muted/50'
                    }
                  `}>
                    {planned ? '✓' : '—'}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-ink-muted text-xs mt-3">3 of 7 days planned</p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          variants={fadeUp}
          className="col-span-3 bg-white rounded-2xl shadow-maison p-6"
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
            <Button variant="ghost" size="md" className="w-full justify-start" icon={<WashingMachine size={16} />}>
              Laundry Toggle
            </Button>
          </div>
        </motion.div>

        {/* Wardrobe Stats */}
        <motion.div
          variants={fadeUp}
          className="col-span-4 bg-white rounded-2xl shadow-maison p-6"
        >
          <h2 className="font-display text-lg text-ink mb-4">Wardrobe</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total Items', value: '47', icon: <Shirt size={16} />, color: 'text-terracotta' },
              { label: 'In Laundry', value: '5', icon: <WashingMachine size={16} />, color: 'text-rouge' },
              { label: 'Outfits Planned', value: '12', icon: <Calendar size={16} />, color: 'text-sage-dark' },
              { label: 'This Month', value: '+3', icon: <TrendingUp size={16} />, color: 'text-gold-dark' },
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
        </motion.div>
      </div>
    </motion.div>
  );
}
