// Formato chileno: pesos (CLP), RUT (módulo 11) y fechas

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
