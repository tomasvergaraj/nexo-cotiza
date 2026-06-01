import type { Quote, Totals } from '../lib/types';
import { formatCLP, todayISO } from '../lib/format';
import { Section, Field, Input, TextArea } from './ui';

interface Props {
  quote: Quote;
  totals: Totals;
  onChange: (q: Quote) => void;
}

export default function DetailsPanel({ quote, totals, onChange }: Props) {
  const set = (patch: Partial<Quote>) => onChange({ ...quote, ...patch });

  const fechaInvalida = !!quote.validaHasta && quote.validaHasta < quote.fecha;
  const vencida = !fechaInvalida && !!quote.validaHasta && quote.validaHasta < todayISO();

  return (
    <>
      <Section title="Detalles">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="N° de folio">
            <Input value={quote.folio} onChange={(e) => set({ folio: e.target.value })} placeholder="0001" />
          </Field>
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
          <div className="flex items-center justify-between py-1 text-[14px]">
            <span className="text-gray">Neto</span>
            <span className="font-semibold text-ink [font-variant-numeric:tabular-nums]">{formatCLP(totals.neto)}</span>
          </div>
          <div className="flex items-center justify-between py-1 text-[14px]">
            <span className="text-gray">{quote.ivaExento ? 'IVA (exento)' : `IVA (${quote.ivaPct}%)`}</span>
            <span className="font-semibold text-ink [font-variant-numeric:tabular-nums]">{formatCLP(totals.iva)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between rounded-lg bg-blue px-4 py-3 text-white">
            <span className="font-sora text-[15px] font-bold">TOTAL</span>
            <span className="font-sora text-[18px] font-bold [font-variant-numeric:tabular-nums]">{formatCLP(totals.total)}</span>
          </div>
        </div>
      </div>
    </>
  );
}
