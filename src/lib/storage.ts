// Memoria local con IndexedDB (nivel 2: anónimo + persistencia).
// Guarda datos de empresa, logo y el borrador de cotización en el navegador.
// Nada de esto sale del dispositivo del usuario.
import { openDB, type IDBPDatabase } from 'idb';
import type { Company, Quote } from './types';

const DB_NAME = 'nexocotiza';
const STORE = 'kv';
const VERSION = 1;

let _db: Promise<IDBPDatabase> | null = null;
function db(): Promise<IDBPDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB no disponible (entorno sin navegador)'));
  }
  if (!_db) {
    _db = openDB(DB_NAME, VERSION, {
      upgrade(d) {
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE);
      },
    });
  }
  return _db;
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
