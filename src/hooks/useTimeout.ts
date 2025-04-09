
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook that provides a timeout functionality
 * @param initialTimeoutMs Default timeout in milliseconds
 * @returns Object with timeout state and control functions
 */
export const useTimeout = (initialTimeoutMs = 30000) => {
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);

  const startTimeout = useCallback((customTimeoutMs?: number) => {
    // Clear any existing timeout
    if (timer) {
      window.clearTimeout(timer);
    }
    
    setIsWaiting(true);
    setIsTimedOut(false);
    
    // Start new timeout
    const timeoutId = window.setTimeout(() => {
      setIsTimedOut(true);
      setIsWaiting(false);
    }, customTimeoutMs || initialTimeoutMs);
    
    setTimer(timeoutId);
    
    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [initialTimeoutMs]);

  const cancelTimeout = useCallback(() => {
    if (timer) {
      window.clearTimeout(timer);
      setTimer(null);
    }
    setIsWaiting(false);
    setIsTimedOut(false);
  }, [timer]);

  const resetTimeout = useCallback(() => {
    cancelTimeout();
    setIsTimedOut(false);
  }, [cancelTimeout]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [timer]);

  return {
    isTimedOut,
    isWaiting,
    startTimeout,
    cancelTimeout,
    resetTimeout
  };
};
