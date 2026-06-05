import { useEffect, useState } from 'react';
import { X, FolderOpen, Copy, Trash2, Download, Upload, FileClock, ShieldX } from 'lucide-react';
import type { QuoteStatus, SavedQuote } from '../lib/types';
import { listQuotes, deleteQuoteRec, putQuote } from '../lib/storage';
import { computeTotals } from '../lib/calc';
import { formatMoneda, formatFechaLarga } from '../lib/format';
import { newQuoteId } from '../lib/sample';
import { toast } from '../lib/toast';
import { Button } from './ui';

interface Props {
  open: boolean;
  currentId: string | null;
  /** Cambia al subir/guardar para forzar recarga de la lista. */
  reloadKey: number;
  onClose: () => void;
  onOpen: (rec: SavedQuote) => void;
  onStatusChange: (id: string, estado: QuoteStatus) => void;
  onExport: () => void;
  onImportClick: () => void;
  onClearAll: () => void;
}

const ESTADOS: { value: QuoteStatus; label: string; dot: string }[] = [
  { value: 'borrador', label: 'Borrador', dot: 'bg-gray/50' },
  { value: 'enviada', label: 'Enviada', dot: 'bg-blue' },
  { value: 'aceptada', label: 'Aceptada', dot: 'bg-success' },
  { value: 'rechazada', label: 'Rechazada', dot: 'bg-danger' },
];
const dotOf = (e: QuoteStatus) => ESTADOS.find((x) => x.value === e)?.dot ?? 'bg-gray/50';

export default function HistoryModal({ open, currentId, reloadKey, onClose, onOpen, onStatusChange, onExport, onImportClick, onClearAll }: Props) {
  const [items, setItems] = useState<SavedQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    listQuotes().then((list) => { if (active) { setItems(list); setLoading(false); } });
    return () => { active = false; };
  }, [open, reloadKey]);

  // Cerrar con Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const refresh = () => listQuotes().then(setItems);

  async function handleDelete(rec: SavedQuote) {
    // Borrado optimista con "Deshacer" (en vez de un confirm() bloqueante):
    // si el usuario no deshace, el registro simplemente queda eliminado.
    await deleteQuoteRec(rec.id);
    await refresh();
    toast.info('Cotización eliminada del historial.', {
      action: {
        label: 'Deshacer',
        onClick: async () => { await putQuote(rec); await refresh(); },
      },
    });
  }

  async function handleDuplicate(rec: SavedQuote) {
    const copy: SavedQuote = { ...rec, id: newQuoteId(), updatedAt: new Date().toISOString(), estado: 'borrador' };
    await putQuote(copy);
    await refresh();
    toast.success('Cotización duplicada.');
  }

  async function handleStatus(rec: SavedQuote, estado: QuoteStatus) {
    await putQuote({ ...rec, estado });
    await refresh();
    onStatusChange(rec.id, estado);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/40 p-3" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Historial de cotizaciones"
        className="mx-auto flex h-full w-full max-w-[760px] flex-col overflow-hidden rounded-xl border border-line bg-paper shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-line bg-white px-5 py-3">
          <h2 className="flex items-center gap-2 font-sora text-[15px] font-bold text-ink">
            <FileClock className="h-5 w-5 text-blue" /> Historial de cotizaciones
          </h2>
          <Button variant="ghost" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4" /> Cerrar
          </Button>
        </div>

        {/* Lista */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-lg border border-line bg-white/60" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
              <FileClock className="mb-3 h-10 w-10 text-gray" />
              <p className="text-[14px] font-semibold text-ink">Aún no guardas cotizaciones</p>
              <p className="mt-1 max-w-sm text-[13px] text-muted">
                Usa <b className="text-ink">Guardar</b> en la barra para añadir la cotización actual al historial.
                Se guarda en este navegador.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {items.map((rec) => {
                const t = computeTotals(rec.quote);
                const activa = rec.id === currentId;
                return (
                  <li
                    key={rec.id}
                    className={`rounded-lg border bg-white p-3 shadow-sm transition ${activa ? 'border-blue ring-1 ring-blue/20' : 'border-line'}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${dotOf(rec.estado)}`} />
                          <span className="truncate text-[14px] font-semibold text-ink">
                            {rec.quote.cliente.nombre || 'Sin cliente'}
                          </span>
                          {activa && <span className="rounded-full bg-blue/10 px-2 py-0.5 text-[10px] font-semibold text-blue">Abierta</span>}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-gray">
                          <span>Folio {rec.quote.folio || 's/n'}</span>
                          <span>·</span>
                          <span>{formatFechaLarga(rec.quote.fecha)}</span>
                          <span>·</span>
                          <span className="font-semibold text-ink [font-variant-numeric:tabular-nums]">
                            {formatMoneda(t.total, rec.quote.moneda)}
                          </span>
                        </div>
                      </div>
                      <select
                        value={rec.estado}
                        onChange={(e) => handleStatus(rec, e.target.value as QuoteStatus)}
                        className="rounded-md border border-line bg-white px-2 py-1 text-[12px] font-semibold text-ink outline-none focus:border-blue"
                        aria-label="Estado"
                      >
                        {ESTADOS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>

                    <div className="mt-2 flex flex-wrap justify-end gap-1.5">
                      <Button onClick={() => onOpen(rec)} title="Abrir en el editor">
                        <FolderOpen className="h-4 w-4" /> Abrir
                      </Button>
                      <Button variant="ghost" onClick={() => handleDuplicate(rec)} title="Crear una copia">
                        <Copy className="h-4 w-4" /> Duplicar
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDelete(rec)}
                        className="text-gray hover:text-danger hover:bg-danger/10"
                        title="Eliminar del historial"
                      >
                        <Trash2 className="h-4 w-4" /> Eliminar
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Pie: respaldo y datos */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-white px-5 py-3">
          <Button
            variant="ghost"
            onClick={onClearAll}
            className="text-gray hover:bg-danger/10 hover:text-danger"
            title="Borrar todos tus datos de este navegador"
          >
            <ShieldX className="h-4 w-4" /> Borrar datos
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onExport} title="Descargar un respaldo (JSON) con empresa, borrador, historial y catálogo">
              <Download className="h-4 w-4" /> Exportar
            </Button>
            <Button variant="ghost" onClick={onImportClick} title="Restaurar desde un respaldo (JSON)">
              <Upload className="h-4 w-4" /> Importar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
