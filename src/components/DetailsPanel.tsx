import { useState } from 'react';
import type { Moneda, Quote, Totals } from '../lib/types';
import { formatCLP, formatMoneda, formatFechaLarga, todayISO, parseDecimal, montoEnPalabras } from '../lib/format';
import { toast } from '../lib/toast';
import { Section, Field, Input, TextArea, Select, Button } from './ui';

interface Props {
  quote: Quote;
  totals: Totals;
  onChange: (q: Quote) => void;
}

export default function DetailsPanel({ quote, totals, onChange }: Props) {
  const set = (patch: Partial<Quote>) => onChange({ ...quote, ...patch });
  const [fetching, setFetching] = useState(false);

  const fechaInvalida = !!quote.validaHasta && quote.validaHasta < quote.fecha;
  const vencida = !fechaInvalida && !!quote.validaHasta && quote.validaHasta < todayISO();

  const conValor = quote.moneda !== 'CLP';
  const equivCLP = conValor && quote.valorMoneda > 0 ? totals.total * quote.valorMoneda : 0;

  // Trae el valor del día (UF/USD) desde mindicador.cl. Opcional: si falla,
  // el usuario simplemente lo ingresa a mano.
  async function traerValor() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      setFetching(true);
      const endpoint = quote.moneda === 'UF' ? 'uf' : 'dolar';
      const res = await fetch(`https://mindicador.cl/api/${endpoint}`, { signal: controller.signal });
      const json = await res.json();
      const dato = json?.serie?.[0];
      const valor = dato?.valor;
      if (typeof valor !== 'number' || !Number.isFinite(valor)) throw new Error('sin dato');
      const redondeado = Math.round(valor * 100) / 100; // conserva los 2 decimales
      const fecha = typeof dato?.fecha === 'string' ? dato.fecha.slice(0, 10) : '';
      set({ valorMoneda: redondeado, valorMonedaFecha: fecha });
      toast.success(`Valor ${quote.moneda} actualizado: ${formatCLP(redondeado)}`);
    } catch {
      toast.error('No se pudo obtener el valor. Ingrésalo manualmente.');
    } finally {
      clearTimeout(timeout);
      setFetching(false);
    }
  }

  return (
    <>
      <Section title="Detalles">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="N° de folio">
            <Input value={quote.folio} onChange={(e) => set({ folio: e.target.value })} placeholder="0001" />
          </Field>
          <Field label="Moneda">
            <Select
              value={quote.moneda}
              onChange={(e) => set({ moneda: e.target.value as Moneda, ...(e.target.value === 'CLP' ? { valorMoneda: 0 } : {}) })}
            >
              <option value="CLP">Peso chileno (CLP)</option>
              <option value="UF">UF</option>
              <option value="USD">Dólar (USD)</option>
            </Select>
          </Field>
          {conValor && (
            <Field label={`Valor ${quote.moneda} en CLP`} className="sm:col-span-2">
              <div className="flex gap-2">
                <Input
                  inputMode="decimal"
                  className="text-right [font-variant-numeric:tabular-nums]"
                  value={quote.valorMoneda === 0 ? '' : String(quote.valorMoneda)}
                  onChange={(e) => set({ valorMoneda: Math.round(parseDecimal(e.target.value) * 100) / 100, valorMonedaFecha: '' })}
                  placeholder="0"
                />
                <Button onClick={traerValor} disabled={fetching} title="Traer el valor de hoy desde mindicador.cl (Banco Central)">
                  {fetching ? 'Buscando…' : 'Traer hoy'}
                </Button>
              </div>
              <span className="mt-1 block text-[11px] text-muted">
                {quote.valorMonedaFecha
                  ? `${quote.moneda === 'UF' ? 'UF' : 'Dólar observado'} al ${formatFechaLarga(quote.valorMonedaFecha)} (Banco Central).`
                  : 'Opcional: muestra la equivalencia aproximada en pesos.'}
              </span>
            </Field>
          )}
          <Field label="IVA">
            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-2 text-[13px] text-ink">
                <input
                  type="checkbox"
                  checked={!quote.ivaExento}
                  onChange={(e) => set({ ivaExento: !e.target.checked })}
                  className="h-4 w-4 accent-blue"
                />
                Afecto {quote.ivaPct}%
              </label>
            </div>
          </Field>
          <Field label="Descuento global %">
            <Input
              inputMode="numeric"
              className="text-right [font-variant-numeric:tabular-nums]"
              value={quote.descuentoGlobalPct === 0 ? '' : String(quote.descuentoGlobalPct)}
              onChange={(e) => set({ descuentoGlobalPct: Math.min(100, Math.max(0, parseDecimal(e.target.value))) })}
              placeholder="0"
            />
          </Field>
          <Field label={`Abono / anticipo (${quote.moneda})`}>
            <Input
              inputMode="decimal"
              className="text-right [font-variant-numeric:tabular-nums]"
              value={quote.abono === 0 ? '' : String(quote.abono)}
              onChange={(e) => set({ abono: parseDecimal(e.target.value) })}
              placeholder="0"
            />
          </Field>
          <Field label="Fecha de emisión">
            <Input type="date" value={quote.fecha} onChange={(e) => set({ fecha: e.target.value })} />
          </Field>
          <Field label="Válida hasta">
            <Input
              type="date"
              min={quote.fecha}
              value={quote.validaHasta}
              onChange={(e) => set({ validaHasta: e.target.value })}
              className={fechaInvalida ? 'border-danger focus:border-danger focus:ring-danger/15' : ''}
            />
            {fechaInvalida && <span className="mt-1 block text-[11px] text-danger">Debe ser igual o posterior a la emisión.</span>}
            {vencida && <span className="mt-1 block text-[11px] text-muted">Esta vigencia ya está vencida.</span>}
          </Field>
          <Field label="Notas" className="sm:col-span-2">
            <TextArea value={quote.notas} onChange={(e) => set({ notas: e.target.value })} placeholder="Plazos de entrega, alcances, etc." />
          </Field>
          <Field label="Condiciones" className="sm:col-span-2">
            <TextArea value={quote.condiciones} onChange={(e) => set({ condiciones: e.target.value })} />
          </Field>
        </div>
      </Section>

      {/* Resumen de totales */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
        <div className="ml-auto w-full max-w-xs">
          {totals.descuentoGlobal > 0 && (
            <>
              <div className="flex items-center justify-between py-1 text-[14px]">
                <span className="text-gray">Subtotal</span>
                <span className="font-semibold text-ink [font-variant-numeric:tabular-nums]">{formatMoneda(totals.subtotal, quote.moneda)}</span>
              </div>
              <div className="flex items-center justify-between py-1 text-[14px]">
                <span className="text-gray">Descuento ({quote.descuentoGlobalPct}%)</span>
                <span className="font-semibold text-danger [font-variant-numeric:tabular-nums]">−{formatMoneda(totals.descuentoGlobal, quote.moneda)}</span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between py-1 text-[14px]">
            <span className="text-gray">Neto</span>
            <span className="font-semibold text-ink [font-variant-numeric:tabular-nums]">{formatMoneda(totals.neto, quote.moneda)}</span>
          </div>
          <div className="flex items-center justify-between py-1 text-[14px]">
            <span className="text-gray">{quote.ivaExento ? 'IVA (exento)' : `IVA (${quote.ivaPct}%)`}</span>
            <span className="font-semibold text-ink [font-variant-numeric:tabular-nums]">{formatMoneda(totals.iva, quote.moneda)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between rounded-lg bg-blue px-4 py-3 text-white">
            <span className="font-sora text-[15px] font-bold">TOTAL</span>
            <span className="font-sora text-[18px] font-bold [font-variant-numeric:tabular-nums]">{formatMoneda(totals.total, quote.moneda)}</span>
          </div>
          {equivCLP > 0 && (
            <div className="mt-1 text-right text-[12px] text-gray [font-variant-numeric:tabular-nums]">
              ≈ {formatCLP(equivCLP)} CLP
            </div>
          )}
          {totals.abono > 0 && (
            <div className="mt-2 border-t border-line pt-2">
              <div className="flex items-center justify-between py-1 text-[14px]">
                <span className="text-gray">Abono</span>
                <span className="font-semibold text-ink [font-variant-numeric:tabular-nums]">−{formatMoneda(totals.abono, quote.moneda)}</span>
              </div>
              <div className="flex items-center justify-between py-1 text-[14px]">
                <span className="font-semibold text-ink">Saldo</span>
                <span className="font-bold text-ink [font-variant-numeric:tabular-nums]">{formatMoneda(totals.saldo, quote.moneda)}</span>
              </div>
            </div>
          )}
          <p className="mt-3 text-right text-[11px] italic text-muted">{montoEnPalabras(totals.total, quote.moneda)}</p>
        </div>
      </div>
    </>
  );
}
