/**
 * J.A.R.V.I.S. IndexedDB Offline Chat History & Context Cache Service
 * 
 * Provides resilient, client-side persistence for LLM conversation context
 * so the assistant maintains dialogue memory and session continuity across page reloads
 * and full offline PWA disconnects.
 */

import { CommandLogItem } from '../types';

const DB_NAME = 'JarvisNeuralDB';
const DB_VERSION = 1;
const STORE_NAME = 'chat_history';

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

/**
 * Initializes and upgrades the IndexedDB database.
 */
export function initChatDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('[J.A.R.V.I.S. IndexedDB] IndexedDB not available in current runtime. Falling back to memory.');
      return reject(new Error('IndexedDB not supported'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('indexOrder', 'indexOrder', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
      };
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('[J.A.R.V.I.S. IndexedDB] Failed to open database:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbInitPromise;
}

export interface CachedDBRecord extends CommandLogItem {
  indexOrder: number;
  cachedAt: number;
}

/**
 * Persists a single command/dialogue log into the IndexedDB store.
 */
export async function saveChatMessage(item: CommandLogItem, indexOrder?: number): Promise<void> {
  try {
    const db = await initChatDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record: CachedDBRecord = {
        ...item,
        indexOrder: typeof indexOrder === 'number' ? indexOrder : Date.now(),
        cachedAt: Date.now(),
      };

      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[J.A.R.V.I.S. IndexedDB] Failed to save chat message:', err);
  }
}

/**
 * Batch persists an array of command logs into IndexedDB.
 */
export async function saveAllChatMessages(items: CommandLogItem[]): Promise<void> {
  if (!items || items.length === 0) return;

  try {
    const db = await initChatDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      items.forEach((item, idx) => {
        const record: CachedDBRecord = {
          ...item,
          indexOrder: idx,
          cachedAt: Date.now(),
        };
        store.put(record);
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[J.A.R.V.I.S. IndexedDB] Failed to batch save chat messages:', err);
  }
}

/**
 * Loads all stored chat messages ordered chronologically.
 */
export async function loadAllChatMessages(): Promise<CommandLogItem[]> {
  try {
    const db = await initChatDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = req.result as CachedDBRecord[];
        if (!results || results.length === 0) {
          return resolve([]);
        }

        // Sort by indexOrder or fallback to cachedAt
        results.sort((a, b) => (a.indexOrder ?? 0) - (b.indexOrder ?? 0));

        // Return sanitized CommandLogItem array
        const sanitized: CommandLogItem[] = results.map((r) => ({
          id: r.id,
          timestamp: r.timestamp,
          type: r.type,
          text: r.text,
          details: r.details,
          status: r.status,
        }));

        resolve(sanitized);
      };

      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[J.A.R.V.I.S. IndexedDB] Failed to load messages:', err);
    return [];
  }
}

/**
 * Extracts normalized conversation history context formatted for LLM generation
 * [ { role: 'user' | 'assistant', content: string } ]
 */
export async function getConversationContext(limit: number = 10): Promise<{ role: string; content: string }[]> {
  const allLogs = await loadAllChatMessages();
  const dialogueOnly = allLogs.filter((l) => l.type === 'user' || l.type === 'assistant');
  const recent = dialogueOnly.slice(-limit);

  return recent.map((item) => ({
    role: item.type === 'user' ? 'user' : 'model',
    content: item.text,
  }));
}

/**
 * Clears the entire chat history in IndexedDB.
 */
export async function clearChatDBCache(): Promise<void> {
  try {
    const db = await initChatDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[J.A.R.V.I.S. IndexedDB] Failed to clear chat cache:', err);
  }
}

/**
 * Returns metadata about the cached dialogue memory (count, newest timestamp, etc.)
 */
export async function getCacheMetadata(): Promise<{
  count: number;
  newest?: string;
  isPersisted: boolean;
}> {
  try {
    const db = await initChatDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const countReq = store.count();

      countReq.onsuccess = () => {
        resolve({
          count: countReq.result,
          isPersisted: true,
        });
      };

      countReq.onerror = () => {
        resolve({
          count: 0,
          isPersisted: false,
        });
      };
    });
  } catch (e) {
    return { count: 0, isPersisted: false };
  }
}
