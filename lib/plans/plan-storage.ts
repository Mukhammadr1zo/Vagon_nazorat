// =====================================================
// PLAN STORAGE — IndexedDB (idb)
// 237k+ yozuvni localStorage'da saqlab bo'lmaydi
// =====================================================

import { openDB, type IDBPDatabase } from 'idb';
import type { PlanRecord, PlanMeta } from './plan-types';

const DB_NAME = 'vagon-plans-db';
const DB_VERSION = 1;
const STORE_RECORDS = 'records';
const STORE_META = 'meta';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available on server'));
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_RECORDS)) {
          db.createObjectStore(STORE_RECORDS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META);
        }
      },
    });
  }
  return dbPromise;
}

// =====================================================
// Saqlash (chunked, UI bloklamaslik uchun)
// =====================================================
export async function savePlanRecords(
  records: PlanRecord[],
  meta: PlanMeta,
  onProgress?: (saved: number, total: number) => void,
): Promise<void> {
  const db = await getDB();

  // Avval tozalaymiz
  await db.clear(STORE_RECORDS);

  const CHUNK_SIZE = 5000;
  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE);
    const tx = db.transaction(STORE_RECORDS, 'readwrite');
    const store = tx.objectStore(STORE_RECORDS);
    for (const r of chunk) {
      store.put(r);
    }
    await tx.done;
    onProgress?.(Math.min(i + CHUNK_SIZE, records.length), records.length);

    // Event loop ga vaqt
    await new Promise((res) => setTimeout(res, 0));
  }

  await db.put(STORE_META, meta, 'current');
}

// =====================================================
// Yuklash
// =====================================================
export async function loadPlanRecords(): Promise<PlanRecord[]> {
  try {
    const db = await getDB();
    const all = await db.getAll(STORE_RECORDS);
    // Sanalarni qayta tiklash
    return all.map((r) => ({
      ...r,
      requestEnteredAt: r.requestEnteredAt ? new Date(r.requestEnteredAt) : null,
      approvedAt: r.approvedAt ? new Date(r.approvedAt) : null,
      canceledAt: r.canceledAt ? new Date(r.canceledAt) : null,
      cargoDocFormalizedAt: r.cargoDocFormalizedAt ? new Date(r.cargoDocFormalizedAt) : null,
      dispatchedAt: r.dispatchedAt ? new Date(r.dispatchedAt) : null,
      arrivedAt: r.arrivedAt ? new Date(r.arrivedAt) : null,
      unloadedAt: r.unloadedAt ? new Date(r.unloadedAt) : null,
    }));
  } catch (err) {
    console.warn('[plan-storage] loadPlanRecords failed:', err);
    return [];
  }
}

export async function loadPlanMeta(): Promise<PlanMeta | null> {
  try {
    const db = await getDB();
    const meta = await db.get(STORE_META, 'current');
    return meta ?? null;
  } catch (err) {
    console.warn('[plan-storage] loadPlanMeta failed:', err);
    return null;
  }
}

export async function clearPlanData(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear(STORE_RECORDS);
    await db.clear(STORE_META);
  } catch (err) {
    console.warn('[plan-storage] clearPlanData failed:', err);
  }
}

export async function hasPlanData(): Promise<boolean> {
  try {
    const db = await getDB();
    const count = await db.count(STORE_RECORDS);
    return count > 0;
  } catch {
    return false;
  }
}
