import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Shirt,
  Calendar,
  Puzzle,
  SlidersHorizontal,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const iconMap = {
  LayoutDashboard,
  Shirt,
  Calendar,
  Puzzle,
  SlidersHorizontal,
  Settings,
  LogOut,
};

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' as const },
  { path: '/wardrobe', label: 'Wardrobe', icon: 'Shirt' as const },
  { path: '/planner', label: 'Planner', icon: 'Calendar' as const },
  { path: '/matching', label: 'Matching', icon: 'Puzzle' as const },
  { path: '/rules', label: 'Rules', icon: 'SlidersHorizontal' as const },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { profile, signOut } = useAuth();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="fixed left-0 top-0 bottom-0 z-40 bg-espresso flex flex-col overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-5 border-b border-white/5">
        <AnimatePresence mode="wait">
          {collapsed ? (
            <motion.span
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-display text-xl text-gold font-semibold tracking-wide"
            >
              M
            </motion.span>
          ) : (
            <motion.span
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-display text-xl text-gold font-semibold tracking-[0.15em] uppercase"
            >
              Maison
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
        {navItems.map(item => {
          const Icon = iconMap[item.icon];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-terracotta/20 text-terracotta-light'
                    : 'text-parchment-dark/60 hover:text-parchment-dark hover:bg-white/5'
                }`
              }
            >
              <Icon size={20} className="shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 flex flex-col gap-1 border-t border-white/5 pt-4">
        {/* User Info */}
        {profile && !collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-3 py-2 mb-2"
          >
            <p className="text-parchment-dark text-sm font-medium truncate">
              {profile.display_name}
            </p>
            <p className="text-parchment-dark/40 text-xs truncate">
              {profile.location}
            </p>
          </motion.div>
        )}

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-terracotta/20 text-terracotta-light'
                : 'text-parchment-dark/60 hover:text-parchment-dark hover:bg-white/5'
            }`
          }
        >
          <Settings size={20} className="shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Settings</span>}
        </NavLink>

        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-parchment-dark/40 hover:text-rouge-light hover:bg-white/5 transition-all duration-200"
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-5 -right-3 w-6 h-6 bg-espresso-light border border-white/10 rounded-full flex items-center justify-center text-parchment-dark/60 hover:text-parchment-dark transition-colors"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}
