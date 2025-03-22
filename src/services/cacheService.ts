import { openDB, IDBPDatabase } from 'idb';
import type { Playlist, Song, UserPreferences } from '../types/database';

interface CacheConfig {
  maxAge: number;
  version: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

interface CacheStore {
  playlists: CacheEntry<Playlist & { songs: Song[] }>;
  preferences: CacheEntry<UserPreferences>;
  offline_actions: {
    id: string;
    action: string;
    payload: unknown;
    timestamp: number;
  };
}

export class CacheService {
  private static instance: CacheService;
  private db: IDBPDatabase<CacheStore> | null = null;
  private readonly DB_NAME = 'smartplaylist_cache';
  private readonly DB_VERSION = 1;
  private readonly config: CacheConfig = {
    maxAge: 1000 * 60 * 60, // 1 hour
    version: 1,
  };

  private constructor() {}

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Initialize the cache database
   */
  async init(): Promise<void> {
    if (this.db) return;

    try {
      this.db = await openDB<CacheStore>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db: IDBPDatabase<CacheStore>) {
          // Create stores if they don't exist
          if (!db.objectStoreNames.contains('playlists')) {
            db.createObjectStore('playlists', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('preferences')) {
            db.createObjectStore('preferences', { keyPath: 'user_id' });
          }
          if (!db.objectStoreNames.contains('offline_actions')) {
            const store = db.createObjectStore('offline_actions', { 
              keyPath: 'id',
              autoIncrement: true 
            });
            store.createIndex('timestamp', 'timestamp');
          }
        },
      });
    } catch (error) {
      console.error('Failed to initialize cache database:', error);
      // Fall back to memory cache if IndexedDB is not available
      this.db = null;
    }
  }

  /**
   * Set a cache entry
   */
  async set<K extends keyof CacheStore>(
    store: K,
    key: string,
    data: CacheStore[K] extends CacheEntry<infer T> ? T : never
  ): Promise<void> {
    try {
      await this.init();

      const entry: CacheEntry<typeof data> = {
        data,
        timestamp: Date.now(),
        version: this.config.version,
      };

      if (this.db) {
        const tx = this.db.transaction(store, 'readwrite');
        await tx.store.put(entry);
      } else {
        // Fall back to localStorage
        localStorage.setItem(
          `${store}:${key}`,
          JSON.stringify(entry)
        );
      }
    } catch (error) {
      console.error(`Failed to set cache entry for ${store}:${key}:`, error);
    }
  }

  /**
   * Get a cache entry
   */
  async get<K extends keyof CacheStore>(
    store: K,
    key: string
  ): Promise<CacheStore[K] extends CacheEntry<infer T> ? T | null : never> {
    try {
      await this.init();

      let entry: CacheEntry<unknown> | null = null;

      if (this.db) {
        const tx = this.db.transaction(store, 'readonly');
        entry = await tx.store.get(key) as CacheEntry<unknown> | null;
      } else {
        // Fall back to localStorage
        const stored = localStorage.getItem(`${store}:${key}`);
        if (stored) {
          entry = JSON.parse(stored);
        }
      }

      if (!entry) return null as CacheStore[K] extends CacheEntry<infer T> ? T | null : never;

      // Check if cache is valid
      const isExpired = Date.now() - entry.timestamp > this.config.maxAge;
      const isOutdated = entry.version !== this.config.version;

      if (isExpired || isOutdated) {
        await this.remove(store, key);
        return null as CacheStore[K] extends CacheEntry<infer T> ? T | null : never;
      }

      return entry.data as CacheStore[K] extends CacheEntry<infer T> ? T : never;
    } catch (error) {
      console.error(`Failed to get cache entry for ${store}:${key}:`, error);
      return null as CacheStore[K] extends CacheEntry<infer T> ? T | null : never;
    }
  }

  /**
   * Remove a cache entry
   */
  async remove<K extends keyof CacheStore>(store: K, key: string): Promise<void> {
    try {
      await this.init();

      if (this.db) {
        const tx = this.db.transaction(store, 'readwrite');
        await tx.store.delete(key);
      } else {
        localStorage.removeItem(`${store}:${key}`);
      }
    } catch (error) {
      console.error(`Failed to remove cache entry for ${store}:${key}:`, error);
    }
  }

  /**
   * Clear all cache entries for a store
   */
  async clear<K extends keyof CacheStore>(store: K): Promise<void> {
    try {
      await this.init();

      if (this.db) {
        const tx = this.db.transaction(store, 'readwrite');
        await tx.store.clear();
      } else {
        // Clear only items for this store from localStorage
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith(`${store}:`)) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.error(`Failed to clear cache store ${store}:`, error);
    }
  }

  /**
   * Queue an offline action
   */
  async queueOfflineAction(action: string, payload: unknown): Promise<void> {
    try {
      await this.init();

      const entry = {
        action,
        payload,
        timestamp: Date.now(),
      };

      if (this.db) {
        const tx = this.db.transaction('offline_actions', 'readwrite');
        await tx.store.add(entry);
      } else {
        // Fall back to localStorage
        const actions = this.getOfflineActionsFromStorage();
        actions.push(entry);
        localStorage.setItem('offline_actions', JSON.stringify(actions));
      }
    } catch (error) {
      console.error('Failed to queue offline action:', error);
    }
  }

  /**
   * Process queued offline actions
   */
  async processOfflineActions(): Promise<void> {
    try {
      await this.init();

      let actions: Array<{
        id: string;
        action: string;
        payload: unknown;
        timestamp: number;
      }> = [];

      if (this.db) {
        const tx = this.db.transaction('offline_actions', 'readonly');
        actions = await tx.store.getAll();
      } else {
        const storedActions = this.getOfflineActionsFromStorage();
        actions = storedActions.map((action, index) => ({
          ...action,
          id: `local_${index}`,
        }));
      }

      // Sort actions by timestamp
      actions.sort((a, b) => a.timestamp - b.timestamp);

      // Process each action
      for (const action of actions) {
        try {
          // Process the action based on its type
          switch (action.action) {
            case 'update_playlist':
              // Handle playlist update
              break;
            case 'add_song':
              // Handle song addition
              break;
            case 'remove_song':
              // Handle song removal
              break;
            // Add more action types as needed
          }

          // Remove the processed action
          if (this.db) {
            const tx = this.db.transaction('offline_actions', 'readwrite');
            await tx.store.delete(action.id);
          } else {
            this.removeOfflineActionFromStorage(action);
          }
        } catch (error) {
          console.error(`Failed to process offline action ${action.id}:`, error);
          // Skip to next action
          continue;
        }
      }
    } catch (error) {
      console.error('Failed to process offline actions:', error);
    }
  }

  private getOfflineActionsFromStorage(): Array<{
    action: string;
    payload: unknown;
    timestamp: number;
  }> {
    try {
      const stored = localStorage.getItem('offline_actions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private removeOfflineActionFromStorage(action: {
    id: string;
    action: string;
    payload: unknown;
    timestamp: number;
  }): void {
    try {
      const actions = this.getOfflineActionsFromStorage();
      const filtered = actions.filter(a => 
        a.action !== action.action ||
        a.timestamp !== action.timestamp
      );
      localStorage.setItem('offline_actions', JSON.stringify(filtered));
    } catch {
      // Ignore errors in cleanup
    }
  }
} 