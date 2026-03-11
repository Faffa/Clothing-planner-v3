import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquarePlus, X, Send, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/common/Button';

interface FeedbackButtonProps {
  onSubmit: (page: string, message: string, element?: string) => Promise<void>;
}

export function FeedbackButton({ onSubmit }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [element, setElement] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();

  const pageName = location.pathname === '/' ? 'Dashboard'
    : location.pathname.replace('/', '').replace(/^\w/, c => c.toUpperCase());

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(pageName, message.trim(), element.trim() || undefined);
      setMessage('');
      setElement('');
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating trigger */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-terracotta text-white shadow-maison-lg flex items-center justify-center hover:bg-terracotta-dark transition-colors"
        title="Send feedback"
      >
        {open ? <X size={20} /> : <MessageSquarePlus size={20} />}
      </motion.button>

      {/* Popup form */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-6 z-50 w-80 bg-parchment rounded-2xl shadow-maison-lg border border-parchment-deep overflow-hidden"
          >
            <div className="p-4 border-b border-parchment-deep">
              <h3 className="font-display text-base text-ink">Send Feedback</h3>
              <p className="text-[10px] text-ink-muted mt-0.5">Page: {pageName}</p>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-ink-muted block mb-1">Element (optional)</label>
                <input
                  value={element}
                  onChange={e => setElement(e.target.value)}
                  placeholder="e.g., Generate button, Day card"
                  className="w-full bg-white border border-parchment-deep rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted block mb-1">Message *</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && e.metaKey && handleSubmit()}
                  placeholder="What would you like to tell us?"
                  rows={3}
                  className="w-full bg-white border border-parchment-deep rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30 resize-none"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  icon={submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  onClick={handleSubmit}
                  disabled={!message.trim() || submitting}
                >
                  {submitting ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
