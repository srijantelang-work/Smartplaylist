/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useCallback } from 'react';
import { CacheService } from '../services/cacheService';

interface UseOfflineResult {
  isOffline: boolean;
  isOnline: boolean;
  lastOnline: Date | null;
  queueOfflineAction: (action: string, payload: unknown) => Promise<void>;
  processOfflineActions: () => Promise<void>;
}

export function useOffline(): UseOfflineResult {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastOnline, setLastOnline] = useState<Date | null>(
    isOffline ? null : new Date()
  );
  const cacheService = CacheService.getInstance();

  const handleOnline = useCallback(() => {
    setIsOffline(false);
    setLastOnline(new Date());
    // Process queued actions when coming back online
    cacheService.processOfflineActions().catch(console.error);
  }, [cacheService]);

  const handleOffline = useCallback(() => {
    setIsOffline(true);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  const queueOfflineAction = useCallback(
    async (action: string, payload: unknown) => {
      if (isOffline) {
        await cacheService.queueOfflineAction(action, payload);
      }
    },
    [isOffline]
  );

  const processOfflineActions = useCallback(async () => {
    if (!isOffline) {
      await cacheService.processOfflineActions();
    }
  }, [isOffline]);

  return {
    isOffline,
    isOnline: !isOffline,
    lastOnline,
    queueOfflineAction,
    processOfflineActions,
  };
} 