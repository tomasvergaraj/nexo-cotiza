import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Eye, X, Save, FileClock, Loader2, Check } from 'lucide-react';
import type { Company, Quote, QuoteStatus, SavedQuote } from '../lib/types';
import { emptyCompany } from '../lib/types';
import { newQuote, demoQuote, newQuoteId } from '../lib/sample';
import { computeTotals } from '../lib/calc';
import {
  loadCompany, saveCompany, loadDraft, saveDraft, clearDraft, nextFolioSeq,
  exportBackup, isBackup, setFolioSeq, putQuote, restoreQuotes, restoreCatalog, requestPersistence, clearAllData,
} from '../lib/storage';
import { toast } from '../lib/toast';
import { track } from '../lib/analytics';
import { readShareFromHash, clearShareHash } from '../lib/share';
import CompanyPanel from './CompanyPanel';
import ClientPanel from './ClientPanel';
import ItemsTable from './ItemsTable';
import DetailsPanel from './DetailsPanel';
import Toolbar from './Toolbar';
import ShareMenu from './ShareMenu';
import InstallButton from './InstallButton';
import Toaster from './Toaster';
import HistoryModal from './HistoryModal';
import { Button } from './ui';

// El visor (y con él el motor PDF ~600 KB) se carga aparte, no en el bundle inicial.
const Preview = lazy(() => import('./Preview'));

const pad4 = (n: number) => String(n).padStart(4, '0');

/** ¿La cotización tiene datos que valga la pena no perder? */
function hasContent(q: Quote): boolean {
  return (
    q.cliente.nombre.trim() !== '' ||
    q.notas.trim() !== '' ||
    q.items.some((it) => it.descripcion.trim() !== '' || it.precioUnitario > 0)
  );
}

export default function QuoteEditor() {
  const [company, setCompany] = useState<Company>(emptyCompany());
  const [quote, setQuote] = useState<Quote>(() => newQuote());
  const [savedBadge, setSavedBadge] = useState(false);
  const [ready, setReady] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const firstSave = useRef(true);
  const importRef = useRef<HTMLInputElement>(null);
  // Vínculo con el historial: el registro que estamos editando (si lo hay).
  const [current, setCurrent] = useState<{ id: string; estado: QuoteStatus } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyReload, setHistoryReload] = useState(0);
  // ¿Hay cambios sin guardar respecto al registro abierto del historial?
  const [dirty, setDirty] = useState(false);
  const skipDirty = useRef(true); // ignora el cambio de estado tras cargar/abrir/guardar
  // Estado visible del autoguardado del borrador local.
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  // Guía de primer uso (solo para usuarios nuevos, se descarta una vez).
  const [showGuide, setShowGuide] = useState(false);
  // Difiere el montaje del preview de escritorio (y con él el chunk del motor PDF,
  // ~491 KB gzip) hasta que el hilo principal esté libre: el editor queda
  // interactivo al instante y la vista previa entra después.
  const [deferPreview, setDeferPreview] = useState(false);

  // Crea una cotización nueva aplicando las condiciones por defecto de la empresa.
  function freshQuote(c: Company, folio = ''): Quote {
    const q = newQuote(folio);
    if (c.condicionesDefault.trim()) q.condiciones = c.condicionesDefault;
    return q;
  }

  // Quita el skeleton estático del HTML en cuanto React monta (su propio
  // skeleton `!ready` toma el relevo sin parpadeo).
  useLayoutEffect(() => {
    document.getElementById('boot-skeleton')?.remove();
  }, []);

  // Pide al navegador no purgar los datos por espacio (best-effort).
  useEffect(() => { requestPersistence(); }, []);

  // Carga inicial desde el navegador (empresa guardada + borrador en curso).
  // Si la URL trae una cotización compartida (#q=…), esa tiene prioridad.
  useEffect(() => {
    let active = true;
    (async () => {
      const shared = await readShareFromHash();
      if (!active) return;
      if (shared) {
        setCompany({ ...emptyCompany(), ...shared.c });
        setQuote({ ...newQuote(), ...shared.q });
        setCurrent(null);
        clearShareHash();
        setReady(true);
        toast.success('Cotización compartida cargada.');
        return;
      }
      const [c, d] = await Promise.all([loadCompany(), loadDraft()]);
      if (!active) return;
      // Fusiona con los defaults: empresas guardadas antes pueden no traer campos nuevos.
      const comp = c ? { ...emptyCompany(), ...c } : emptyCompany();
      if (c) setCompany(comp);
      if (d) {
        // Fusiona con los defaults: borradores guardados antes pueden no traer
        // campos nuevos (p. ej. moneda/valorMoneda).
        setQuote({ ...newQuote(), ...d });
      } else {
        const seq = await nextFolioSeq();
        setQuote(freshQuote(comp, pad4(seq)));
      }
      setReady(true);
    })();
    return () => { active = false; };
  }, []);

  // Marca cambios sin guardar. El primer cambio tras cargar/abrir/guardar/nueva
  // se ignora (es el propio set programático, no una edición del usuario).
  useEffect(() => {
    if (!ready) return;
    if (skipDirty.current) { skipDirty.current = false; return; }
    setDirty(true);
  }, [quote, company, ready]);

  // Autoguardado del borrador (local). La empresa se guarda con el botón.
  // Refleja el estado en un chip ("Guardando…" / "Guardado") para dar tranquilidad
  // en un producto sin cuenta.
  useEffect(() => {
    if (!ready) return;
    if (firstSave.current) { firstSave.current = false; return; }
    setSaveState('saving');
    let cancelled = false;
    const t = setTimeout(async () => {
      await saveDraft(quote);
      if (!cancelled) setSaveState('saved');
    }, 600);
    return () => { cancelled = true; clearTimeout(t); };
  }, [quote, ready]);

  // Muestra la guía de primer uso solo a usuarios nuevos (sin empresa guardada,
  // sin contenido y sin registro abierto), y solo si no la han descartado antes.
  useEffect(() => {
    if (!ready) return;
    try {
      const onboarded = localStorage.getItem('nexocotiza:onboarded');
      if (!onboarded && !company.razonSocial && !hasContent(quote) && !current) setShowGuide(true);
    } catch { /* localStorage no disponible: simplemente no mostramos la guía */ }
    // Solo al quedar listo; no queremos que reaparezca al editar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  function dismissGuide() {
    setShowGuide(false);
    try { localStorage.setItem('nexocotiza:onboarded', '1'); } catch { /* noop */ }
  }

  // Atajo de teclado: Ctrl/Cmd+S guarda la cotización en el historial.
  useEffect(() => {
    if (!ready) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveToHistory();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, company, quote, current]);

  // Cuando el editor queda listo, espera a que el navegador esté ocioso para
  // montar el preview de escritorio (con timeout de respaldo de 2 s).
  useEffect(() => {
    if (!ready) return;
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (h: number) => void;
    };
    if (typeof w.requestIdleCallback === 'function') {
      const h = w.requestIdleCallback(() => setDeferPreview(true), { timeout: 2000 });
      return () => w.cancelIdleCallback?.(h);
    }
    const t = setTimeout(() => setDeferPreview(true), 1200);
    return () => clearTimeout(t);
  }, [ready]);

  const totals = computeTotals(quote);

  function handleSaveCompany() {
    saveCompany(company);
    track('empresa_guardada');
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 2000);
  }

  async function handleNew() {
    if (hasContent(quote) && !confirm('¿Crear una cotización nueva? Se perderán los datos no descargados de la actual.')) return;
    await clearDraft();
    const seq = await nextFolioSeq();
    setQuote(freshQuote(company, pad4(seq)));
    setCurrent(null);
    skipDirty.current = true; setDirty(false);
  }

  // --- Historial ---

  // Guarda la cotización actual en el historial. Si ya provenía de un registro,
  // lo actualiza; si no, crea uno nuevo y deja el editor vinculado a él.
  async function handleSaveToHistory() {
    const id = current?.id ?? newQuoteId();
    const estado: QuoteStatus = current?.estado ?? 'borrador';
    const rec: SavedQuote = { id, estado, updatedAt: new Date().toISOString(), company, quote };
    await putQuote(rec);
    track('cotizacion_guardada', { nueva: !current });
    setCurrent({ id, estado });
    setDirty(false);
    setHistoryReload((n) => n + 1);
    toast.success(current ? 'Cotización actualizada en el historial.' : 'Cotización guardada en el historial.');
  }

  // Abre un registro del historial en el editor (pasa a ser el borrador vivo).
  function handleOpenFromHistory(rec: SavedQuote) {
    setCompany({ ...emptyCompany(), ...rec.company });
    setQuote({ ...newQuote(), ...rec.quote });
    setCurrent({ id: rec.id, estado: rec.estado });
    skipDirty.current = true; setDirty(false);
    setShowHistory(false);
    toast.success('Cotización abierta.');
  }

  // Borra todos los datos locales (privacidad) y deja el editor en blanco.
  async function handleClearAll() {
    if (!confirm('¿Borrar TODOS tus datos de este navegador (empresa, borrador, historial y catálogo)? No se puede deshacer.')) return;
    await clearAllData();
    const fresh = emptyCompany();
    setCompany(fresh);
    setQuote(freshQuote(fresh));
    setCurrent(null);
    skipDirty.current = true; setDirty(false);
    setHistoryReload((n) => n + 1);
    setShowHistory(false);
    toast.success('Datos borrados de este navegador.');
  }

  // Sincroniza el estado si se cambió desde el modal para el registro abierto.
  function handleStatusSync(id: string, estado: QuoteStatus) {
    setCurrent((c) => (c && c.id === id ? { ...c, estado } : c));
  }

  // Respaldo: descarga un JSON con la empresa, el borrador y el correlativo.
  // Usa el estado en memoria (lo que el usuario ve ahora mismo).
  async function handleExport() {
    const backup = await exportBackup();
    backup.company = company;
    backup.draft = quote;
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexocotiza-respaldo-${quote.folio || 's-n'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Respaldo descargado.');
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite reimportar el mismo archivo
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!isBackup(data)) { toast.error('El archivo no es un respaldo de NexoCotiza.'); return; }
      if (!confirm('¿Restaurar este respaldo? Reemplazará los datos actuales en este navegador.')) return;
      // Fusiona con los defaults por compatibilidad con respaldos antiguos.
      const comp = data.company ? { ...emptyCompany(), ...data.company } : emptyCompany();
      const draft = data.draft ? { ...newQuote(), ...data.draft } : freshQuote(comp);
      setCompany(comp);
      setQuote(draft);
      setCurrent(null);
      skipDirty.current = true; setDirty(false);
      await Promise.all([
        saveCompany(comp),
        saveDraft(draft),
        setFolioSeq(data.folioSeq || 0),
        restoreQuotes(Array.isArray(data.quotes) ? data.quotes : []),
        restoreCatalog(Array.isArray(data.catalog) ? data.catalog : []),
      ]);
      setHistoryReload((n) => n + 1);
      toast.success('Respaldo restaurado.');
    } catch {
      toast.error('No se pudo leer el archivo de respaldo.');
    }
  }

  function handleDemo() {
    if (hasContent(quote) && !confirm('¿Cargar el ejemplo? Reemplazará la cotización actual.')) return;
    setQuote(demoQuote());
    setCurrent(null);
    skipDirty.current = true; setDirty(false);
    if (!company.razonSocial) {
      setCompany({
        ...emptyCompany(),
        razonSocial: 'Nexo Software SpA',
        rut: '77.123.456-7',
        giro: 'Desarrollo de software a medida',
        direccion: 'Quillota',
        comuna: 'Quillota',
        telefono: '+56 9 8196 4119',
        email: 'contacto@nexosoftware.cl',
        web: 'www.nexosoftware.cl',
        condicionesDefault: '',
      });
    }
  }

  // Mientras carga el borrador local, mostramos un esqueleto para no parpadear
  // (los datos por defecto serían reemplazados al instante por el borrador).
  if (!ready) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 pb-16">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)]">
          <div className="flex flex-col gap-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl border border-line bg-white/60 shadow-sm" />
            ))}
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-[68px] h-[calc(100vh-84px)] animate-pulse rounded-xl border border-line bg-white/60 shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-24 lg:pb-16">
      {/* Barra de acciones */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 border-b border-line bg-paper/85 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={handleDemo}>Ver ejemplo</Button>
            <Button variant="ghost" onClick={handleNew}>Nueva</Button>
            <span className="hidden h-5 w-px bg-line sm:inline" />
            <Button onClick={handleSaveToHistory} title="Guardar esta cotización en el historial">
              <Save className="h-4 w-4" /> {current ? 'Actualizar' : 'Guardar'}
              {current && dirty && <span className="ml-0.5 h-2 w-2 rounded-full bg-warning" title="Cambios sin guardar" aria-label="Cambios sin guardar" />}
            </Button>
            <Button variant="ghost" onClick={() => setShowHistory(true)} title="Ver el historial de cotizaciones">
              <FileClock className="h-4 w-4" /> Historial
            </Button>
            <InstallButton />
            {saveState !== 'idle' && (
              <span
                className="hidden items-center gap-1.5 text-[12px] text-muted sm:inline-flex"
                aria-live="polite"
              >
                {saveState === 'saving' ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Guardando…</>
                ) : (
                  <><Check className="h-3.5 w-3.5 text-blue" aria-hidden /> Guardado</>
                )}
              </span>
            )}
            <input ref={importRef} type="file" accept="application/json,.json" onChange={handleImportFile} className="hidden" />
          </div>
          <div className="flex items-center gap-2">
            <ShareMenu company={company} quote={quote} />
            {/* En móvil la descarga vive en la barra inferior (zona del pulgar). */}
            <div className="hidden lg:block">
              <Toolbar company={company} quote={quote} />
            </div>
          </div>
        </div>
      </div>

      {/* Dos columnas: formulario + vista previa */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)]">
        <div className="flex flex-col gap-5">
          {showGuide && (
            <div className="rounded-xl border border-blue/30 bg-blue/5 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-sora text-[15px] font-semibold tracking-tight text-ink">
                    ¿Primera vez? Así funciona
                  </h2>
                  <ol className="mt-3 grid gap-2.5 sm:grid-cols-2">
                    {[
                      'Completa los datos de tu empresa (se guardan para la próxima).',
                      'Agrega los datos de tu cliente.',
                      'Carga tus ítems con cantidades y precios.',
                      'Descarga la cotización en PDF o Word.',
                    ].map((paso, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[13px] text-muted">
                        <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue text-[11px] font-bold text-white [font-variant-numeric:tabular-nums]">
                          {i + 1}
                        </span>
                        {paso}
                      </li>
                    ))}
                  </ol>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="primary" onClick={() => { handleDemo(); dismissGuide(); }}>
                      <Eye className="h-4 w-4" /> Ver un ejemplo
                    </Button>
                    <Button variant="ghost" onClick={dismissGuide}>Empezar de cero</Button>
                  </div>
                </div>
                <button
                  onClick={dismissGuide}
                  aria-label="Cerrar la guía"
                  className="-mr-1 -mt-1 rounded-md p-1 text-gray transition hover:bg-white/60 hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          <CompanyPanel company={company} onChange={setCompany} onSaveLocal={handleSaveCompany} saved={savedBadge} />
          <ClientPanel client={quote.cliente} onChange={(cliente) => setQuote({ ...quote, cliente })} />
          <ItemsTable items={quote.items} moneda={quote.moneda} onChange={(items) => setQuote({ ...quote, items })} />
          <DetailsPanel quote={quote} totals={totals} onChange={setQuote} />
        </div>

        <div className="hidden lg:block">
          {deferPreview ? (
            <Suspense fallback={<div className="sticky top-[68px] h-[calc(100vh-84px)] animate-pulse rounded-xl border border-line bg-white/60 shadow-sm" />}>
              <Preview company={company} quote={quote} />
            </Suspense>
          ) : (
            <div className="sticky top-[68px] h-[calc(100vh-84px)] animate-pulse rounded-xl border border-line bg-white/60 shadow-sm" />
          )}
        </div>
      </div>

      {/* Barra inferior fija en móvil: acciones primarias en la zona del pulgar. */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
        <Button variant="soft" className="flex-1 justify-center" onClick={() => setShowPreview(true)}>
          <Eye className="h-4 w-4" /> Vista previa
        </Button>
        <div className="flex-1">
          <Toolbar company={company} quote={quote} openUp />
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/40 p-3 lg:hidden" onClick={() => setShowPreview(false)}>
          <div role="dialog" aria-modal="true" aria-label="Vista previa" className="mx-auto flex h-full w-full max-w-[640px] flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex justify-end">
              <Button variant="soft" onClick={() => setShowPreview(false)}>
                <X className="h-4 w-4" /> Cerrar
              </Button>
            </div>
            <div className="min-h-0 flex-1">
              <Suspense fallback={<div className="flex h-full items-center justify-center rounded-xl border border-line bg-white text-[12px] text-gray">Cargando vista previa…</div>}>
                <Preview company={company} quote={quote} variant="fill" />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      <HistoryModal
        open={showHistory}
        currentId={current?.id ?? null}
        reloadKey={historyReload}
        onClose={() => setShowHistory(false)}
        onOpen={handleOpenFromHistory}
        onStatusChange={handleStatusSync}
        onExport={handleExport}
        onImportClick={() => importRef.current?.click()}
        onClearAll={handleClearAll}
      />

      <Toaster />
    </div>
  );
}
