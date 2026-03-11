import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { FeedbackButton } from '@/components/feedback/FeedbackButton';
import { useFeedback } from '@/hooks/useFeedback';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export function AppLayout() {
  const { enabled, addFeedback } = useFeedback();

  return (
    <div className="min-h-screen bg-parchment">
      <Sidebar />

      {/* Main Content - offset by sidebar width */}
      <main className="ml-[260px] transition-[margin] duration-300">
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          className="min-h-screen p-8"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Floating feedback button (toggleable) */}
      {enabled && <FeedbackButton onSubmit={addFeedback} />}
    </div>
  );
}
