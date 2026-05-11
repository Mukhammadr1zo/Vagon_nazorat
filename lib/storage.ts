// =====================================================
// INDEXED DB — Katta hajmdagi ma'lumotlar uchun saqlash
// (localStorage 5 MB chegarasidan oshmaslik uchun)
// =====================================================

import type { Shipment, FileUpload } from './types';

const DB_NAME = 'vagon_nazorat';
const DB_VERSION = 1;
const STORE = 'kv';

const KEY_SHIPMENTS = 'shipments';
const KEY_FILES = 'files';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  if (!isBrowser()) return null;
  try {
    const db = await openDB();
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('[storage] get failed:', err);
    return null;
  }
}

async function idbSet(key: string, value: unknown): Promise<boolean> {
  if (!isBrowser()) return false;
  try {
    const db = await openDB();
    return await new Promise<boolean>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('[storage] set failed:', err);
    return false;
  }
}

async function idbDelete(key: string): Promise<void> {
  if (!isBrowser()) return;
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('[storage] delete failed:', err);
  }
}

export async function loadShipments(): Promise<Shipment[]> {
  return (await idbGet<Shipment[]>(KEY_SHIPMENTS)) ?? [];
}

export async function saveShipments(items: Shipment[]): Promise<boolean> {
  return idbSet(KEY_SHIPMENTS, items);
}

export async function loadFiles(): Promise<FileUpload[]> {
  return (await idbGet<FileUpload[]>(KEY_FILES)) ?? [];
}

export async function saveFiles(items: FileUpload[]): Promise<boolean> {
  return idbSet(KEY_FILES, items);
}

export async function clearAll(): Promise<void> {
  await idbDelete(KEY_SHIPMENTS);
  await idbDelete(KEY_FILES);
}

// Eski localStorage qiymatlarini IndexedDB ga ko'chirish (bir martalik)
export async function migrateFromLocalStorage(): Promise<void> {
  if (!isBrowser()) return;
  try {
    const oldShip = window.localStorage.getItem('vagon_nazorat_shipments_v1');
    const oldFiles = window.localStorage.getItem('vagon_nazorat_files_v1');
    if (oldShip) {
      try {
        const parsed = JSON.parse(oldShip);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existing = (await idbGet<Shipment[]>(KEY_SHIPMENTS)) ?? [];
          if (existing.length === 0) await idbSet(KEY_SHIPMENTS, parsed);
        }
      } catch {}
      window.localStorage.removeItem('vagon_nazorat_shipments_v1');
    }
    if (oldFiles) {
      try {
        const parsed = JSON.parse(oldFiles);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existing = (await idbGet<FileUpload[]>(KEY_FILES)) ?? [];
          if (existing.length === 0) await idbSet(KEY_FILES, parsed);
        }
      } catch {}
      window.localStorage.removeItem('vagon_nazorat_files_v1');
    }
  } catch (err) {
    console.warn('[storage] migration failed:', err);
  }
}
