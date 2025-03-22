/* eslint-disable react-refresh/only-export-components */
import  { createContext, useContext, useEffect, ReactNode } from 'react';
import { CacheService } from '../services/cacheService';
import { LoadingService } from '../services/loadingService';
import { useOffline } from '../hooks/useOffline';

interface AppContextValue {
  isOffline: boolean;
  isOnline: boolean;
  lastOnline: Date | null;
  queueOfflineAction: (action: string, payload: unknown) => Promise<void>;
  processOfflineActions: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // Initialize services
  useEffect(() => {
    const cacheService = CacheService.getInstance();
    const loadingService = LoadingService.getInstance();

    // Initialize cache service
    cacheService.init().catch(console.error);

    // Clean up loading states on unmount
    return () => {
      loadingService.clearLoadingStates();
    };
  }, []);

  // Get offline state and handlers
  const offlineState = useOffline();

  const value: AppContextValue = {
    ...offlineState,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
} 