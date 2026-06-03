import type { Moneda, Quote, QuoteItem, Totals } from './types';
import { monedaDecimales } from './format';

/** Redondea un monto a los decimales de su moneda (CLP entero, UF/USD a 2). */
export function roundMoney(n: number, moneda: Moneda): number {
  const f = Math.pow(10, monedaDecimales(moneda));
  return Math.round((Number.isFinite(n) ? n : 0) * f) / f;
}

/** Subtotal de una línea: cantidad × precio − descuento%, redondeado según moneda. */
export function lineSubtotal(item: QuoteItem, moneda: Moneda = 'CLP'): number {
  const cantidad = Number(item.cantidad) || 0;
  const precio = Number(item.precioUnitario) || 0;
  const desc = Number(item.descuentoPct) || 0;
  const base = cantidad * precio;
  const conDesc = base * (1 - desc / 100);
  return roundMoney(conDesc, moneda);
}

/** Totales: subtotal, descuento global, neto, IVA (19% salvo exento), total, abono y saldo. */
export function computeTotals(quote: Quote): Totals {
  const moneda = quote.moneda;
  const subtotal = roundMoney(quote.items.reduce((sum, it) => sum + lineSubtotal(it, moneda), 0), moneda);
  const descPct = Math.min(100, Math.max(0, Number(quote.descuentoGlobalPct) || 0));
  const descuentoGlobal = roundMoney(subtotal * (descPct / 100), moneda);
  const neto = roundMoney(subtotal - descuentoGlobal, moneda);
  const iva = quote.ivaExento ? 0 : roundMoney(neto * ((Number(quote.ivaPct) || 0) / 100), moneda);
  const total = roundMoney(neto + iva, moneda);
  const abono = Math.min(total, Math.max(0, roundMoney(Number(quote.abono) || 0, moneda)));
  const saldo = roundMoney(total - abono, moneda);
  return { subtotal, descuentoGlobal, neto, iva, total, abono, saldo };
}
