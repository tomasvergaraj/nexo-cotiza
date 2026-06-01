import type { Quote, QuoteItem, Totals } from './types';

/** Subtotal de una línea: cantidad × precio − descuento%, redondeado a peso. */
export function lineSubtotal(item: QuoteItem): number {
  const cantidad = Number(item.cantidad) || 0;
  const precio = Number(item.precioUnitario) || 0;
  const desc = Number(item.descuentoPct) || 0;
  const base = cantidad * precio;
  const conDesc = base * (1 - desc / 100);
  return Math.round(conDesc);
}

/** Totales de la cotización: neto, IVA (19% salvo exento) y total. */
export function computeTotals(quote: Quote): Totals {
  const neto = quote.items.reduce((sum, it) => sum + lineSubtotal(it), 0);
  const iva = quote.ivaExento ? 0 : Math.round(neto * ((Number(quote.ivaPct) || 0) / 100));
  const total = neto + iva;
  return { neto, iva, total };
}
