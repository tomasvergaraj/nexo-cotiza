import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Eye, X } from 'lucide-react';
import type { Company, Quote } from '../lib/types';
import { emptyCompany } from '../lib/types';
import { newQuote, demoQuote } from '../lib/sample';
import { computeTotals } from '../lib/calc';
import { loadCompany, saveCompany, loadDraft, saveDraft, clearDraft, nextFolioSeq } from '../lib/storage';
import CompanyPanel from './CompanyPanel';
import ClientPanel from './ClientPanel';
import ItemsTable from './ItemsTable';
import DetailsPanel from './DetailsPanel';
import Toolbar from './Toolbar';
import Toaster from './Toaster';
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

  // Crea una cotización nueva aplicando las condiciones por defecto de la empresa.
  function freshQuote(c: Company, folio = ''): Quote {
    const q = newQuote(folio);
    if (c.condicionesDefault.trim()) q.condiciones = c.condicionesDefault;
    return q;
  }

  // Carga inicial desde el navegador (empresa guardada + borrador en curso)
  useEffect(() => {
    let active = true;
    (async () => {
      const [c, d] = await Promise.all([loadCompany(), loadDraft()]);
      if (!active) return;
      // Fusiona con los defaults: empresas guardadas antes pueden no traer campos nuevos.
      const comp = c ? { ...emptyCompany(), ...c } : emptyCompany();
      if (c) setCompany(comp);
      if (d) {
        setQuote(d);
      } else {
        const seq = await nextFolioSeq();
        setQuote(freshQuote(comp, pad4(seq)));
      }
      setReady(true);
    })();
    return () => { active = false; };
  }, []);

  // Autoguardado del borrador (local). La empresa se guarda con el botón.
  useEffect(() => {
    if (!ready) return;
    if (firstSave.current) { firstSave.current = false; return; }
    const t = setTimeout(() => saveDraft(quote), 600);
    return () => clearTimeout(t);
  }, [quote, ready]);

  const totals = computeTotals(quote);

  function handleSaveCompany() {
    saveCompany(company);
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 2000);
  }

  async function handleNew() {
    if (hasContent(quote) && !confirm('¿Crear una cotización nueva? Se perderán los datos no descargados de la actual.')) return;
    await clearDraft();
    const seq = await nextFolioSeq();
    setQuote(freshQuote(company, pad4(seq)));
  }

  function handleDemo() {
    if (hasContent(quote) && !confirm('¿Cargar el ejemplo? Reemplazará la cotización actual.')) return;
    setQuote(demoQuote());
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
    <div className="mx-auto max-w-[1280px] px-4 pb-16">
      {/* Barra de acciones */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 border-b border-line bg-paper/85 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleDemo}>Ver ejemplo</Button>
            <Button variant="ghost" onClick={handleNew}>Nueva</Button>
          </div>
          <Toolbar company={company} quote={quote} />
        </div>
      </div>

      {/* Dos columnas: formulario + vista previa */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)]">
        <div className="flex flex-col gap-5">
          <CompanyPanel company={company} onChange={setCompany} onSaveLocal={handleSaveCompany} saved={savedBadge} />
          <ClientPanel client={quote.cliente} onChange={(cliente) => setQuote({ ...quote, cliente })} />
          <ItemsTable items={quote.items} onChange={(items) => setQuote({ ...quote, items })} />
          <DetailsPanel quote={quote} totals={totals} onChange={setQuote} />
        </div>

        <div className="hidden lg:block">
          <Suspense fallback={<div className="sticky top-[68px] flex h-[calc(100vh-84px)] items-center justify-center rounded-xl border border-line bg-white text-[12px] text-gray">Cargando vista previa…</div>}>
            <Preview company={company} quote={quote} />
          </Suspense>
        </div>
      </div>

      {/* Vista previa en móvil: botón que abre un modal a pantalla completa */}
      <div className="mt-6 text-center lg:hidden">
        <Button variant="primary" onClick={() => setShowPreview(true)}>
          <Eye className="h-4 w-4" /> Ver vista previa
        </Button>
        <p className="mt-2 text-[12px] text-gray">O usa el botón <b>Descargar</b> arriba.</p>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/40 p-3 lg:hidden" onClick={() => setShowPreview(false)}>
          <div className="mx-auto flex h-full w-full max-w-[640px] flex-col" onClick={(e) => e.stopPropagation()}>
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

      <Toaster />
    </div>
  );
}
