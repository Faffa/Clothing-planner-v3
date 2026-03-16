import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { FeedbackButton } from '@/components/feedback/FeedbackButton';
import { useFeedback } from '@/hooks/useFeedback';
import { useMobileMenu } from '@/hooks/useMobileMenu';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export function AppLayout() {
  const { enabled, addFeedback } = useFeedback();
  const menu = useMobileMenu();

  return (
    <div className="min-h-screen bg-parchment">
      <Sidebar mobileOpen={menu.isOpen} onMobileClose={menu.close} />

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-parchment border-b border-parchment-deep flex items-center px-4">
        <button
          onClick={menu.toggle}
          className="p-2 -ml-2 rounded-lg text-ink-muted hover:text-ink hover:bg-parchment-dark transition-colors"
        >
          <Menu size={20} />
        </button>
        <span className="ml-3 font-display text-lg text-gold font-semibold tracking-[0.15em] uppercase">
          Maison
        </span>
      </div>

      {/* Main Content - offset by sidebar width on desktop, top bar on mobile */}
      <main className="md:ml-[260px] transition-[margin] duration-300">
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          className="min-h-screen p-4 md:p-8 pt-18 md:pt-8"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Floating feedback button (toggleable) */}
      {enabled && <FeedbackButton onSubmit={addFeedback} />}
    </div>
  );
}
