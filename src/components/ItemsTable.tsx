import { Plus, ChevronUp, ChevronDown, Copy, Trash2 } from 'lucide-react';
import type { QuoteItem } from '../lib/types';
import { lineSubtotal } from '../lib/calc';
import { formatCLP, formatMiles } from '../lib/format';
import { emptyItem, newId } from '../lib/sample';
import { Section, Input, Button } from './ui';

interface Props {
  items: QuoteItem[];
  onChange: (items: QuoteItem[]) => void;
}

export default function ItemsTable({ items, onChange }: Props) {
  const update = (id: string, patch: Partial<QuoteItem>) =>
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id: string) => onChange(items.filter((it) => it.id !== id));
  const add = () => onChange([...items, emptyItem()]);

  const duplicate = (i: number) => {
    const copy = [...items];
    copy.splice(i + 1, 0, { ...items[i], id: newId() });
    onChange(copy);
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const copy = [...items];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  };

  // Cantidad/descuento admiten decimales; el precio es CLP entero (sin decimales).
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v.replace(/[^\d.]/g, '')) || 0));
  const toCLP = (v: string) => Number(v.replace(/\D/g, '')) || 0;

  const iconBtn =
    'rounded-md p-1.5 text-gray transition hover:bg-paper hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent';

  return (
    <Section
      title="Ítems"
      action={
        <Button variant="primary" onClick={add}>
          <Plus className="h-4 w-4" /> Agregar ítem
        </Button>
      }
    >
      {/* Encabezado (solo en pantallas medianas+) */}
      <div className="mb-2 hidden grid-cols-[1fr_64px_104px_64px_104px_120px] gap-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted md:grid">
        <span className="pl-3">Detalle</span>
        <span className="pr-3 text-right">Cant.</span>
        <span className="pr-3 text-right">P. unitario</span>
        <span className="pr-3 text-right">Desc. %</span>
        <span className="pr-3 text-right">Subtotal</span>
        <span className="text-right">Acciones</span>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((it, i) => (
          <div
            key={it.id}
            className="grid grid-cols-2 items-end gap-2 rounded-lg border border-line p-2 transition-colors md:grid-cols-[1fr_64px_104px_64px_104px_120px] md:items-center md:rounded-md md:border-transparent md:px-2 md:py-1 md:hover:bg-paper/60"
          >
            <div className="col-span-2 md:col-span-1">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted md:hidden">Detalle</span>
              <Input
                value={it.descripcion}
                onChange={(e) => update(it.id, { descripcion: e.target.value })}
                placeholder="Descripción del producto o servicio"
              />
            </div>

            <div>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted md:hidden">Cant.</span>
              <Input
                inputMode="decimal"
                className="text-right [font-variant-numeric:tabular-nums]"
                value={String(it.cantidad)}
                onChange={(e) => update(it.id, { cantidad: num(e.target.value) })}
                aria-label="Cantidad"
              />
            </div>

            <div>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted md:hidden">P. unitario</span>
              <Input
                inputMode="numeric"
                className="text-right [font-variant-numeric:tabular-nums]"
                value={it.precioUnitario === 0 ? '' : formatMiles(it.precioUnitario)}
                onChange={(e) => update(it.id, { precioUnitario: toCLP(e.target.value) })}
                placeholder="0"
                aria-label="Precio unitario"
              />
            </div>

            <div>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted md:hidden">Desc. %</span>
              <Input
                inputMode="numeric"
                className="text-right [font-variant-numeric:tabular-nums]"
                value={it.descuentoPct === 0 ? '' : String(it.descuentoPct)}
                onChange={(e) => update(it.id, { descuentoPct: Math.min(100, num(e.target.value)) })}
                placeholder="0"
                aria-label="Descuento %"
              />
            </div>

            <div className="text-right">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted md:hidden">Subtotal</span>
              <div className="py-2 text-[14px] font-semibold text-ink [font-variant-numeric:tabular-nums] md:py-0 md:pr-3">
                {formatCLP(lineSubtotal(it))}
              </div>
            </div>

            <div className="col-span-2 flex justify-end gap-0.5 md:col-span-1">
              <button onClick={() => move(i, -1)} disabled={i === 0} className={iconBtn} title="Subir" aria-label="Subir ítem">
                <ChevronUp className="h-4 w-4" />
              </button>
              <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className={iconBtn} title="Bajar" aria-label="Bajar ítem">
                <ChevronDown className="h-4 w-4" />
              </button>
              <button onClick={() => duplicate(i)} className={iconBtn} title="Duplicar" aria-label="Duplicar ítem">
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={() => remove(it.id)}
                disabled={items.length === 1}
                className="rounded-md p-1.5 text-gray transition hover:bg-danger/10 hover:text-danger disabled:opacity-30 disabled:hover:bg-transparent"
                title="Eliminar ítem"
                aria-label="Eliminar ítem"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
