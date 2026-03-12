import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useMediaQuery } from './useMediaQuery';

export function useMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const location = useLocation();

  // Close on resize above 768px
  useEffect(() => {
    if (isDesktop) setIsOpen(false);
  }, [isDesktop]);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return { isOpen, open, close, toggle };
}
