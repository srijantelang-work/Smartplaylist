import { BehaviorSubject, Observable } from 'rxjs';

interface LoadingState {
  [key: string]: boolean;
}

interface PendingOperation {
  id: string;
  operation: Promise<unknown>;
  startTime: number;
}

export class LoadingService {
  private static instance: LoadingService;
  private loadingState = new BehaviorSubject<LoadingState>({});
  private pendingOperations: PendingOperation[] = [];
  private readonly TIMEOUT = 30000; // 30 seconds

  private constructor() {
    this.startTimeoutCheck();
  }

  public static getInstance(): LoadingService {
    if (!LoadingService.instance) {
      LoadingService.instance = new LoadingService();
    }
    return LoadingService.instance;
  }

  /**
   * Start a loading operation
   */
  async startLoading<T>(
    key: string,
    operation: Promise<T>,
    timeout = this.TIMEOUT
  ): Promise<T> {
    try {
      const operationId = `${key}_${Date.now()}`;
      const pendingOperation: PendingOperation = {
        id: operationId,
        operation,
        startTime: Date.now(),
      };

      this.pendingOperations.push(pendingOperation);
      this.updateLoadingState(key, true);

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation ${key} timed out after ${timeout}ms`));
        }, timeout);
      });

      // Race between the operation and timeout
      const result = await Promise.race([operation, timeoutPromise]);

      // Operation completed successfully
      this.removePendingOperation(operationId);
      this.checkAndUpdateLoadingState(key);

      return result as T;
    } catch (error) {
      // Operation failed or timed out
      this.checkAndUpdateLoadingState(key);
      throw error;
    }
  }

  /**
   * Get the loading state for a specific key
   */
  isLoading(key: string): boolean {
    return this.loadingState.value[key] || false;
  }

  /**
   * Get the loading state as an observable
   */
  getLoadingState(key: string): Observable<boolean> {
    return new Observable<boolean>(subscriber => {
      const subscription = this.loadingState.subscribe((state: LoadingState) => {
        subscriber.next(state[key] || false);
      });
      return () => subscription.unsubscribe();
    });
  }

  /**
   * Get all loading states
   */
  getAllLoadingStates(): Observable<LoadingState> {
    return this.loadingState.asObservable();
  }

  /**
   * Manually set a loading state
   */
  setLoadingState(key: string, isLoading: boolean): void {
    this.updateLoadingState(key, isLoading);
  }

  /**
   * Clear all loading states
   */
  clearLoadingStates(): void {
    this.loadingState.next({});
    this.pendingOperations = [];
  }

  private updateLoadingState(key: string, isLoading: boolean): void {
    this.loadingState.next({
      ...this.loadingState.value,
      [key]: isLoading,
    });
  }

  private removePendingOperation(operationId: string): void {
    this.pendingOperations = this.pendingOperations.filter(
      op => op.id !== operationId
    );
  }

  private checkAndUpdateLoadingState(key: string): void {
    // Check if there are any remaining operations for this key
    const hasRemainingOperations = this.pendingOperations.some(
      op => op.id.startsWith(key)
    );

    if (!hasRemainingOperations) {
      this.updateLoadingState(key, false);
    }
  }

  private startTimeoutCheck(): void {
    setInterval(() => {
      const now = Date.now();
      this.pendingOperations.forEach(operation => {
        if (now - operation.startTime > this.TIMEOUT) {
          this.removePendingOperation(operation.id);
          this.checkAndUpdateLoadingState(operation.id.split('_')[0]);
        }
      });
    }, 5000); // Check every 5 seconds
  }
} 