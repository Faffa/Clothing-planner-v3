import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { FeedbackItem, FeedbackStatus } from '@/types';
import * as feedbackService from '@/services/feedbackService';

const ENABLED_KEY = 'maison-feedback-enabled';

export function useFeedback() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(() =>
    localStorage.getItem(ENABLED_KEY) !== 'false'
  );

  const toggleEnabled = useCallback((val: boolean) => {
    setEnabled(val);
    localStorage.setItem(ENABLED_KEY, String(val));
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await feedbackService.getFeedback(user.id);
      setItems(data);
    } catch (err) {
      console.error('Failed to load feedback:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const addFeedback = useCallback(async (page: string, message: string, element?: string) => {
    if (!user) return;
    try {
      const item = await feedbackService.createFeedback(user.id, page, message, element);
      setItems(prev => [item, ...prev]);
      showToast('Feedback submitted');
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      showToast('Failed to submit feedback', 'error');
    }
  }, [user, showToast]);

  const updateStatus = useCallback(async (id: string, status: FeedbackStatus) => {
    try {
      const updated = await feedbackService.updateFeedbackStatus(id, status);
      setItems(prev => prev.map(i => i.id === id ? updated : i));
      showToast(`Feedback marked as ${status}`);
    } catch (err) {
      console.error('Failed to update feedback:', err);
      showToast('Failed to update feedback', 'error');
    }
  }, [showToast]);

  const removeFeedback = useCallback(async (id: string) => {
    try {
      await feedbackService.deleteFeedback(id);
      setItems(prev => prev.filter(i => i.id !== id));
      showToast('Feedback deleted');
    } catch (err) {
      console.error('Failed to delete feedback:', err);
      showToast('Failed to delete feedback', 'error');
    }
  }, [showToast]);

  return {
    items,
    loading,
    enabled,
    toggleEnabled,
    addFeedback,
    updateStatus,
    removeFeedback,
  };
}
