import { useEffect, useState } from 'react';
import { LoadingService } from '../services/loadingService';

export function useLoading(key: string): boolean {
  const [isLoading, setIsLoading] = useState(false);
  const loadingService = LoadingService.getInstance();

  useEffect(() => {
    const subscription = loadingService.getLoadingState(key).subscribe(loading => {
      setIsLoading(loading);
    });

    return () => subscription.unsubscribe();
  }, [key, loadingService]);

  return isLoading;
}

export function useLoadingOperation() {
  const loadingService = LoadingService.getInstance();

  const withLoading = async <T>(
    key: string,
    operation: () => Promise<T>,
    timeout?: number
  ): Promise<T> => {
    return loadingService.startLoading(key, operation(), timeout);
  };

  return { withLoading };
} 