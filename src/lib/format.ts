// Formato chileno: pesos (CLP), UF/USD, RUT (módulo 11) y fechas
import type { Moneda } from './types';

/** $1.250.000 — sin decimales, separador de miles con punto (es-CL). */
export function formatCLP(n: number): string {
  const v = Math.round(Number.isFinite(n) ? n : 0);
  return '$' + v.toLocaleString('es-CL');
}

/** 1.250.000 sin signo peso (para inputs/celdas). */
export function formatMiles(n: number): string {
  const v = Math.round(Number.isFinite(n) ? n : 0);
  return v.toLocaleString('es-CL');
}

/** Decimales según la moneda: CLP entero, UF/USD con 2 decimales. */
export function monedaDecimales(m: Moneda): number {
  return m === 'CLP' ? 0 : 2;
}

const PREFIJO: Record<Moneda, string> = { CLP: '$', UF: 'UF ', USD: 'US$ ' };

/** Formatea un monto en la moneda dada: $1.250.000 · UF 12,50 · US$ 1.200,00 */
export function formatMoneda(n: number, m: Moneda): string {
  const dec = monedaDecimales(m);
  const v = Number.isFinite(n) ? n : 0;
  return PREFIJO[m] + v.toLocaleString('es-CL', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

/** Etiqueta corta de la moneda (para encabezados y notas). */
export const monedaLabel = (m: Moneda): string => (m === 'CLP' ? 'pesos (CLP)' : m === 'UF' ? 'UF' : 'dólares (USD)');

/** Parsea un número que puede venir con coma o punto decimal (inputs UF/USD). */
export function parseDecimal(s: string): number {
  const cleaned = (s || '').replace(/[^\d.,]/g, '').replace(/\.(?=.*[.,])/g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

// ---------- Número en palabras (español) ----------

const UNIDADES = [
  '', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
  'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve',
  'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve',
];
const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

/** Apócope de "uno" → "un" / "veintiuno" → "veintiún" al preceder un sustantivo. */
const apocopar = (s: string) => s.replace(/veintiuno$/, 'veintiún').replace(/(\b|y )uno$/, '$1un');

/** Palabras para 0–999. */
function centenasEnPalabras(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cien';
  const c = Math.floor(n / 100);
  const resto = n % 100;
  let out = c ? CENTENAS[c] + ' ' : '';
  if (resto < 30) {
    out += UNIDADES[resto];
  } else {
    const d = Math.floor(resto / 10);
    const u = resto % 10;
    out += DECENAS[d] + (u ? ' y ' + UNIDADES[u] : '');
  }
  return out.trim();
}

/** Entero no negativo a palabras (hasta miles de millones). */
export function numeroEnPalabras(num: number): string {
  let n = Math.floor(Math.abs(Number(num) || 0));
  if (n === 0) return 'cero';
  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  const partes: string[] = [];
  if (millones) partes.push(millones === 1 ? 'un millón' : apocopar(numeroEnPalabras(millones)) + ' millones');
  if (miles) partes.push(miles === 1 ? 'mil' : apocopar(centenasEnPalabras(miles)) + ' mil');
  if (resto) partes.push(centenasEnPalabras(resto));
  return partes.join(' ').trim();
}

/** Monto en palabras con el nombre de la moneda. Ej: "Un millón doscientos mil pesos". */
export function montoEnPalabras(n: number, moneda: Moneda): string {
  const v = Math.abs(Number(n) || 0);
  const entero = Math.floor(v);
  const decimales = Math.round((v - entero) * 100);
  const nombre =
    moneda === 'CLP' ? (entero === 1 ? 'peso' : 'pesos')
    : moneda === 'UF' ? (entero === 1 ? 'unidad de fomento' : 'unidades de fomento')
    : (entero === 1 ? 'dólar' : 'dólares');
  let out = `${apocopar(numeroEnPalabras(entero))} ${nombre}`;
  if (moneda !== 'CLP' && decimales > 0) out += ` con ${String(decimales).padStart(2, '0')}/100`;
  return out.charAt(0).toUpperCase() + out.slice(1);
}

// ---------- RUT ----------

export function cleanRut(rut: string): string {
  return (rut || '').replace(/[^0-9kK]/g, '').toUpperCase();
}

/** Calcula el dígito verificador para un cuerpo numérico (sin DV). */
export function computeDv(body: string): string {
  let sum = 0;
  let mul = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const res = 11 - (sum % 11);
  if (res === 11) return '0';
  if (res === 10) return 'K';
  return String(res);
}

/** Valida un RUT completo (cuerpo + DV). */
export function validateRut(rut: string): boolean {
  const c = cleanRut(rut);
  if (c.length < 2) return false;
  const body = c.slice(0, -1);
  const dv = c.slice(-1);
  if (!/^\d+$/.test(body)) return false;
  return computeDv(body) === dv;
}

/** Formatea como 12.345.678-5 */
export function formatRut(rut: string): string {
  const c = cleanRut(rut);
  if (c.length < 2) return rut || '';
  const body = c.slice(0, -1);
  const dv = c.slice(-1);
  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${withDots}-${dv}`;
}

// ---------- Fechas ----------

/** Hoy en ISO yyyy-mm-dd (hora local). */
export function todayISO(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

/** Suma días a una fecha ISO y devuelve ISO. */
export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

/** ISO yyyy-mm-dd -> 01 jun 2026 */
export function formatFechaLarga(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}
