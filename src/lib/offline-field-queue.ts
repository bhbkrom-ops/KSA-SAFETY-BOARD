"use client";

export type OfflineFieldBody = {
  resource: "safety_case";
  title: string;
  status: string;
  priority: string;
  payload: Record<string, unknown>;
};

export type OfflineFieldItem = {
  id: string;
  body: OfflineFieldBody;
  created_at: string;
  attempts: number;
  last_error: string | null;
};

const DB_NAME = "ksa-safety-board-field";
const STORE = "pending-observations";
const VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB could not be opened."));
  });
}

function transaction<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore, resolve: (value: T) => void, reject: (reason?: unknown) => void) => void,
) {
  return openDb().then((db) => new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error);
    run(store, resolve, reject);
  }));
}

export async function queueFieldObservation(body: OfflineFieldBody) {
  const id = String(body.payload.client_submission_id || crypto.randomUUID());
  const item: OfflineFieldItem = {
    id,
    body,
    created_at: new Date().toISOString(),
    attempts: 0,
    last_error: null,
  };
  await transaction<void>("readwrite", (store, resolve, reject) => {
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  return item;
}

export async function listQueuedFieldObservations() {
  return transaction<OfflineFieldItem[]>("readonly", (store, resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(
      (request.result as OfflineFieldItem[]).sort((a, b) => a.created_at.localeCompare(b.created_at)),
    );
    request.onerror = () => reject(request.error);
  });
}

export async function removeQueuedFieldObservation(id: string) {
  return transaction<void>("readwrite", (store, resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function markQueuedFieldFailure(item: OfflineFieldItem, error: string) {
  return transaction<void>("readwrite", (store, resolve, reject) => {
    const request = store.put({
      ...item,
      attempts: item.attempts + 1,
      last_error: error.slice(0, 500),
    });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
