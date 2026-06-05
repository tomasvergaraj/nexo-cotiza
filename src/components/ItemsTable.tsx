import { useEffect, useRef, useState } from 'react';
import { Plus, ChevronUp, ChevronDown, Copy, Trash2, BookmarkPlus, Library, X } from 'lucide-react';
import type { CatalogItem, Moneda, QuoteItem } from '../lib/types';
import { lineSubtotal } from '../lib/calc';
import { formatMoneda, formatMiles, parseDecimal } from '../lib/format';
import { emptyItem, newId } from '../lib/sample';
import { listCatalog, putCatalogItem, deleteCatalogItem } from '../lib/storage';
import { toast } from '../lib/toast';
import { useFocusTrap } from '../lib/useFocusTrap';
import { Section, Input, Button } from './ui';

interface Props {
  items: QuoteItem[];
  moneda: Moneda;
  onChange: (items: QuoteItem[]) => void;
}

// Strings literales (no construidos en runtime) para que Tailwind los detecte.
const GRID_HEAD = 'grid-cols-[1fr_52px_60px_100px_48px_100px_152px]';
const GRID_ROW = 'md:grid-cols-[1fr_52px_60px_100px_48px_100px_152px]';

export default function ItemsTable({ items, moneda, onChange }: Props) {
  const update = (id: string, patch: Partial<QuoteItem>) =>
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id: string) => {
    const prev = items; // snapshot para poder deshacer
    onChange(items.filter((it) => it.id !== id));
    toast.info('Ítem eliminado.', { action: { label: 'Deshacer', onClick: () => onChange(prev) } });
  };
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

  // Cantidad/descuento admiten decimales. El precio depende de la moneda:
  // CLP es entero (sin decimales); UF/USD admiten decimales.
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v.replace(/[^\d.]/g, '')) || 0));
  const esCLP = moneda === 'CLP';
  const parsePrecio = (v: string) => (esCLP ? Number(v.replace(/\D/g, '')) || 0 : parseDecimal(v));
  const showPrecio = (n: number) => (n === 0 ? '' : esCLP ? formatMiles(n) : String(n));

  const iconBtn =
    'rounded-md p-1.5 text-gray transition hover:bg-paper hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent';

  // --- Catálogo ---
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const catalogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(catalogRef, showCatalog);

  useEffect(() => {
    if (showCatalog) listCatalog().then(setCatalog);
  }, [showCatalog]);

  useEffect(() => {
    if (!showCatalog) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowCatalog(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showCatalog]);

  function saveToCatalog(it: QuoteItem) {
    if (!it.descripcion.trim()) { toast.error('Escribe una descripción antes de guardar en el catálogo.'); return; }
    putCatalogItem({ id: newId(), descripcion: it.descripcion.trim(), unidad: it.unidad ?? '', precioUnitario: it.precioUnitario });
    toast.success('Ítem guardado en el catálogo.');
  }

  function insertFromCatalog(c: CatalogItem) {
    onChange([...items, { id: newId(), descripcion: c.descripcion, unidad: c.unidad, cantidad: 1, precioUnitario: c.precioUnitario, descuentoPct: 0 }]);
    toast.success('Ítem agregado.');
  }

  async function deleteFromCatalog(id: string) {
    await deleteCatalogItem(id);
    setCatalog((cs) => cs.filter((c) => c.id !== id));
  }

  return (
    <Section
      title="Ítems"
      action={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setShowCatalog(true)} title="Insertar un ítem guardado en el catálogo">
            <Library className="h-4 w-4" /> Catálogo
          </Button>
          <Button variant="primary" onClick={add}>
            <Plus className="h-4 w-4" /> Agregar ítem
          </Button>
        </div>
      }
    >
      {/* Sugerencias de unidad para el datalist (las puede ignorar y escribir otra). */}
      <datalist id="unidades-sugeridas">
        {['un', 'hr', 'día', 'mes', 'm²', 'm', 'kg', 'lt', 'global'].map((u) => <option key={u} value={u} />)}
      </datalist>

      {/* Encabezado (solo en pantallas medianas+) */}
      <div className={`mb-2 hidden ${GRID_HEAD} gap-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted md:grid`}>
        <span className="pl-3">Detalle</span>
        <span className="pr-3 text-right">Cant.</span>
        <span className="text-center">Unidad</span>
        <span className="pr-3 text-right">P. unitario</span>
        <span className="pr-3 text-right">Desc. %</span>
        <span className="pr-3 text-right">Subtotal</span>
        <span className="text-right">Acciones</span>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((it, i) => (
          <div
            key={it.id}
            className={`grid grid-cols-2 items-end gap-2 rounded-lg border border-line p-2 transition-colors ${GRID_ROW} md:items-center md:rounded-md md:border-transparent md:px-2 md:py-1 md:hover:bg-paper/60`}
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
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted md:hidden">Unidad</span>
              <Input
                list="unidades-sugeridas"
                className="text-center"
                value={it.unidad ?? ''}
                onChange={(e) => update(it.id, { unidad: e.target.value })}
                placeholder="un"
                aria-label="Unidad de medida"
              />
            </div>

            <div>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted md:hidden">P. unitario</span>
              <Input
                inputMode={esCLP ? 'numeric' : 'decimal'}
                className="text-right [font-variant-numeric:tabular-nums]"
                value={showPrecio(it.precioUnitario)}
                onChange={(e) => update(it.id, { precioUnitario: parsePrecio(e.target.value) })}
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
                {formatMoneda(lineSubtotal(it, moneda), moneda)}
              </div>
            </div>

            <div className="col-span-2 flex justify-end gap-0.5 md:col-span-1">
              <button onClick={() => saveToCatalog(it)} className={iconBtn} title="Guardar en el catálogo" aria-label="Guardar ítem en el catálogo">
                <BookmarkPlus className="h-4 w-4" />
              </button>
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

      {/* Modal del catálogo */}
      {showCatalog && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/40 p-3" onClick={() => setShowCatalog(false)}>
          <div
            ref={catalogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Catálogo de ítems"
            className="mx-auto flex h-full w-full max-w-[560px] flex-col overflow-hidden rounded-xl border border-line bg-paper shadow-2xl outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line bg-white px-5 py-3">
              <h2 className="flex items-center gap-2 font-sora text-[15px] font-bold text-ink">
                <Library className="h-5 w-5 text-blue" /> Catálogo de ítems
              </h2>
              <Button variant="ghost" onClick={() => setShowCatalog(false)} aria-label="Cerrar">
                <X className="h-4 w-4" /> Cerrar
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {catalog.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
                  <Library className="mb-3 h-10 w-10 text-gray" />
                  <p className="text-[14px] font-semibold text-ink">Tu catálogo está vacío</p>
                  <p className="mt-1 max-w-sm text-[13px] text-muted">
                    Guarda los productos o servicios que cotizas seguido con el ícono <BookmarkPlus className="inline h-3.5 w-3.5" /> de cada ítem y reutilízalos aquí.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {catalog.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white p-3 shadow-sm">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-ink">{c.descripcion}</p>
                        <p className="mt-0.5 text-[12px] text-gray [font-variant-numeric:tabular-nums]">
                          {formatMoneda(c.precioUnitario, moneda)}{c.unidad ? ` · ${c.unidad}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <Button onClick={() => insertFromCatalog(c)} title="Agregar a la cotización">
                          <Plus className="h-4 w-4" /> Insertar
                        </Button>
                        <button
                          onClick={() => deleteFromCatalog(c.id)}
                          className="rounded-md p-1.5 text-gray transition hover:bg-danger/10 hover:text-danger"
                          title="Quitar del catálogo"
                          aria-label="Quitar del catálogo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}
