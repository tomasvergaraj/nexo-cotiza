// Memoria local con IndexedDB (nivel 2: anónimo + persistencia).
// Guarda datos de empresa, logo y el borrador de cotización en el navegador.
// Nada de esto sale del dispositivo del usuario.
import { openDB, type IDBPDatabase } from 'idb';
import type { CatalogItem, Company, Quote, SavedQuote } from './types';

const DB_NAME = 'nexocotiza';
const STORE = 'kv';
const STORE_QUOTES = 'quotes';
const STORE_CATALOG = 'catalog';
const VERSION = 3;

let _db: Promise<IDBPDatabase> | null = null;
function db(): Promise<IDBPDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB no disponible (entorno sin navegador)'));
  }
  if (!_db) {
    _db = openDB(DB_NAME, VERSION, {
      upgrade(d) {
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE);
        if (!d.objectStoreNames.contains(STORE_QUOTES)) d.createObjectStore(STORE_QUOTES, { keyPath: 'id' });
        if (!d.objectStoreNames.contains(STORE_CATALOG)) d.createObjectStore(STORE_CATALOG, { keyPath: 'id' });
      },
    });
  }
  return _db;
}

/**
 * Pide al navegador marcar el almacenamiento como persistente para que no lo
 * purgue por falta de espacio. Best-effort: si no se concede, todo sigue
 * funcionando igual. Ver también el respaldo exportable.
 */
export async function requestPersistence(): Promise<boolean> {
  try {
    const sm = navigator.storage;
    if (!sm?.persist) return false;
    if (sm.persisted && (await sm.persisted())) return true;
    return await sm.persist();
  } catch {
    return false;
  }
}

async function kvGet<T>(key: string): Promise<T | undefined> {
  try {
    return (await db()).get(STORE, key) as Promise<T | undefined>;
  } catch {
    return undefined;
  }
}
async function kvSet(key: string, val: unknown): Promise<void> {
  try {
    await (await db()).put(STORE, val, key);
  } catch {
    /* ignora errores de cuota/entorno */
  }
}
async function kvDel(key: string): Promise<void> {
  try {
    await (await db()).delete(STORE, key);
  } catch {
    /* noop */
  }
}

const K_COMPANY = 'company';
const K_DRAFT = 'draft';
const K_FOLIO = 'folioSeq';

export const saveCompany = (c: Company) => kvSet(K_COMPANY, c);
export const loadCompany = () => kvGet<Company>(K_COMPANY);
export const clearCompany = () => kvDel(K_COMPANY);

export const saveDraft = (q: Quote) => kvSet(K_DRAFT, q);
export const loadDraft = () => kvGet<Quote>(K_DRAFT);
export const clearDraft = () => kvDel(K_DRAFT);

/** Correlativo de folio simple guardado en local (nivel 2). */
export async function nextFolioSeq(): Promise<number> {
  const cur = (await kvGet<number>(K_FOLIO)) || 0;
  const next = cur + 1;
  await kvSet(K_FOLIO, next);
  return next;
}
export const peekFolioSeq = () => kvGet<number>(K_FOLIO);
export const setFolioSeq = (n: number) => kvSet(K_FOLIO, Math.max(0, Math.floor(n) || 0));

// ---------- Historial de cotizaciones ----------

/** Lista todas las cotizaciones guardadas, de la más reciente a la más antigua. */
export async function listQuotes(): Promise<SavedQuote[]> {
  try {
    const all = (await (await db()).getAll(STORE_QUOTES)) as SavedQuote[];
    return all.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  } catch {
    return [];
  }
}
export async function putQuote(rec: SavedQuote): Promise<void> {
  try { await (await db()).put(STORE_QUOTES, rec); } catch { /* cuota/entorno */ }
}
export async function getQuoteRec(id: string): Promise<SavedQuote | undefined> {
  try { return (await db()).get(STORE_QUOTES, id) as Promise<SavedQuote | undefined>; } catch { return undefined; }
}
export async function deleteQuoteRec(id: string): Promise<void> {
  try { await (await db()).delete(STORE_QUOTES, id); } catch { /* noop */ }
}
export async function clearQuotes(): Promise<void> {
  try { await (await db()).clear(STORE_QUOTES); } catch { /* noop */ }
}
/** Reemplaza el historial completo (usado al restaurar un respaldo). */
export async function restoreQuotes(list: SavedQuote[]): Promise<void> {
  await clearQuotes();
  for (const rec of list) await putQuote(rec);
}

// ---------- Catálogo de ítems frecuentes ----------

export async function listCatalog(): Promise<CatalogItem[]> {
  try {
    const all = (await (await db()).getAll(STORE_CATALOG)) as CatalogItem[];
    return all.sort((a, b) => a.descripcion.localeCompare(b.descripcion, 'es'));
  } catch {
    return [];
  }
}
export async function putCatalogItem(item: CatalogItem): Promise<void> {
  try { await (await db()).put(STORE_CATALOG, item); } catch { /* cuota/entorno */ }
}
export async function deleteCatalogItem(id: string): Promise<void> {
  try { await (await db()).delete(STORE_CATALOG, id); } catch { /* noop */ }
}
export async function clearCatalog(): Promise<void> {
  try { await (await db()).clear(STORE_CATALOG); } catch { /* noop */ }
}
export async function restoreCatalog(list: CatalogItem[]): Promise<void> {
  await clearCatalog();
  for (const item of list) await putCatalogItem(item);
}

/** Borra TODOS los datos locales: empresa, borrador, folio, historial y catálogo. */
export async function clearAllData(): Promise<void> {
  await Promise.all([clearCompany(), clearDraft(), kvDel(K_FOLIO), clearQuotes(), clearCatalog()]);
}

// ---------- Respaldo (exportar/importar) ----------
// Todo vive en el navegador: este respaldo permite no perder los datos al
// limpiar la caché o cambiar de equipo. Es un simple JSON portable.

export interface Backup {
  app: 'nexocotiza';
  version: number;
  exportedAt: string;
  company: Company | null;
  draft: Quote | null;
  folioSeq: number;
  quotes: SavedQuote[];
  catalog: CatalogItem[];
}

export async function exportBackup(): Promise<Backup> {
  const [company, draft, folioSeq, quotes, catalog] = await Promise.all([
    loadCompany(), loadDraft(), peekFolioSeq(), listQuotes(), listCatalog(),
  ]);
  return {
    app: 'nexocotiza',
    version: VERSION,
    exportedAt: new Date().toISOString(),
    company: company ?? null,
    draft: draft ?? null,
    folioSeq: folioSeq ?? 0,
    quotes,
    catalog,
  };
}

/** Valida que un objeto parseado sea un respaldo de NexoCotiza. */
export function isBackup(x: unknown): x is Backup {
  return !!x && typeof x === 'object' && (x as Backup).app === 'nexocotiza';
}
