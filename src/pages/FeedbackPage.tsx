import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Trash2, Filter } from 'lucide-react';
import { useFeedback } from '@/hooks/useFeedback';
import { stagger, fadeUp } from '@/lib/animations';
import type { FeedbackStatus } from '@/types';
import { format } from 'date-fns';

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700' },
  parked: { label: 'Parked', color: 'bg-gold/15 text-gold-dark' },
  done: { label: 'Done', color: 'bg-sage/15 text-sage-dark' },
  cancelled: { label: 'Cancelled', color: 'bg-parchment-dark text-ink-muted' },
};

export function FeedbackPage() {
  const { items, loading, enabled, toggleEnabled, updateStatus, removeFeedback } = useFeedback();
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | 'all'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = filterStatus === 'all'
    ? items
    : items.filter(i => i.status === filterStatus);

  const statusCounts = {
    new: items.filter(i => i.status === 'new').length,
    parked: items.filter(i => i.status === 'parked').length,
    done: items.filter(i => i.status === 'done').length,
    cancelled: items.filter(i => i.status === 'cancelled').length,
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      removeFeedback(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-4xl">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Feedback</h1>
          <p className="text-ink-muted text-sm mt-1">
            {items.length} items &middot; {statusCounts.new} new
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-ink-muted">Feedback button</span>
            <button
              onClick={() => toggleEnabled(!enabled)}
              className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? 'bg-terracotta' : 'bg-parchment-deep'
                }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
              />
            </button>
          </label>
        </div>
      </motion.div>

      {/* Filter bar */}
      <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-1.5 text-ink-muted">
          <Filter size={14} />
          <span className="text-xs font-medium">Status:</span>
        </div>
        <button
          onClick={() => setFilterStatus('all')}
          className={`text-xs px-3 py-1.5 rounded-full transition-colors ${filterStatus === 'all' ? 'bg-ink text-white' : 'bg-parchment-dark text-ink-muted hover:text-ink'
            }`}
        >
          All ({items.length})
        </button>
        {(Object.entries(STATUS_CONFIG) as [FeedbackStatus, typeof STATUS_CONFIG[FeedbackStatus]][]).map(([status, config]) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${filterStatus === status ? config.color + ' font-semibold' : 'bg-parchment-dark text-ink-muted hover:text-ink'
              }`}
          >
            {config.label} ({statusCounts[status]})
          </button>
        ))}
      </motion.div>

      {/* List */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-parchment-dark rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <motion.div variants={fadeUp} className="text-center py-20">
          <MessageSquare size={48} className="mx-auto text-ink-muted/20 mb-4" />
          <p className="text-ink-muted text-sm">
            {items.length === 0 ? 'No feedback yet' : 'No feedback matching this filter'}
          </p>
        </motion.div>
      )}

      {!loading && filtered.length > 0 && (
        <motion.div variants={stagger} className="space-y-3">
          {filtered.map(item => {
            const config = STATUS_CONFIG[item.status];
            return (
              <motion.div
                key={item.id}
                variants={fadeUp}
                className="bg-white rounded-xl shadow-maison p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-[10px] text-ink-muted">{item.page}</span>
                      {item.element && (
                        <span className="text-[10px] text-ink-muted/70">&middot; {item.element}</span>
                      )}
                    </div>
                    <p className="text-sm text-ink">{item.message}</p>
                    <p className="text-[10px] text-ink-muted mt-1.5">
                      {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Status transitions */}
                    <select
                      value={item.status}
                      onChange={e => updateStatus(item.id, e.target.value as FeedbackStatus)}
                      className="text-[10px] bg-parchment-dark border border-parchment-deep rounded-lg px-2 py-1 text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                    >
                      <option value="new">New</option>
                      <option value="parked">Parked</option>
                      <option value="done">Done</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className={`p-1.5 rounded-lg transition-colors ${confirmDeleteId === item.id
                          ? 'text-rouge bg-rouge/10'
                          : 'text-ink-muted hover:text-rouge hover:bg-rouge/5'
                        }`}
                      title={confirmDeleteId === item.id ? 'Click again to confirm' : 'Delete'}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
