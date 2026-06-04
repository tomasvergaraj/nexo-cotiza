import { useEffect, useRef, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { ExternalLink } from 'lucide-react';
import type { Company, Quote } from '../lib/types';
import { QuotePdf } from '../pdf/QuotePdf';

interface Props {
  company: Company;
  quote: Quote;
  /** `panel` (sticky en la columna) o `fill` (ocupa el alto del contenedor, p.ej. un modal). */
  variant?: 'panel' | 'fill';
}

const IFRAME_HASH = '#toolbar=0&navpanes=0&statusbar=0&view=FitH';

function slug(s: string): string {
  return (s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, 32);
}

/** Espera a que el usuario deje de tipear antes de re-renderizar el PDF. */
function useDebounced<T>(value: T, delay = 500): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function Preview({ company, quote, variant = 'panel' }: Props) {
  const dCompany = useDebounced(company);
  const dQuote = useDebounced(quote);

  // Doble buffer: `front` es el PDF visible; `back` el nuevo, que se carga
  // oculto y se promueve cuando termina de pintar (evita el flash negro).
  const [front, setFront] = useState<string | null>(null);
  const [back, setBack] = useState<string | null>(null);
  const frontRef = useRef<string | null>(null);
  const backRef = useRef<string | null>(null);
  const promoteTimer = useRef<number | null>(null);
  // Guardamos el último Blob renderizado para poder abrirlo/descargarlo en móvil,
  // donde el visor del iframe no funciona (ver botón "Abrir PDF").
  const blobRef = useRef<Blob | null>(null);

  // Móvil (`fill`): el iframe no muestra PDFs, así que renderizamos cada página
  // a imagen con pdf.js. `pdfBlob` dispara ese renderizado al cambiar.
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [rendering, setRendering] = useState(false);

  // IMPORTANTE: generamos con una instancia FRESCA de `pdf()` en cada cambio,
  // en lugar de la reconciliación incremental de `usePDF`. Esa reconciliación
  // duplicaba el contenido al reordenar ítems y corrompía el renderer que
  // comparte la descarga (haciéndola fallar). Una instancia nueva por cambio
  // renderiza desde cero, sin ese bug.
  useEffect(() => {
    let cancelled = false;
    pdf(<QuotePdf company={dCompany} quote={dQuote} />)
      .toBlob()
      .then((blob) => {
        if (cancelled) return;
        blobRef.current = blob;
        // En móvil renderizamos imágenes desde el Blob; no usamos iframes.
        if (variant === 'fill') { setPdfBlob(blob); return; }
        const url = URL.createObjectURL(blob);
        if (frontRef.current === null) {
          frontRef.current = url;
          setFront(url);
        } else {
          if (backRef.current) URL.revokeObjectURL(backRef.current); // back pendiente sin usar
          backRef.current = url;
          setBack(url);
        }
      })
      .catch((e) => console.error('No se pudo renderizar la vista previa:', e));
    return () => { cancelled = true; };
  }, [dCompany, dQuote, variant]);

  // Renderiza el PDF a imágenes (solo móvil). pdf.js se carga bajo demanda, así
  // que no pesa en el bundle de escritorio. Mantenemos las páginas anteriores
  // mientras re-renderiza para evitar parpadeos.
  useEffect(() => {
    if (variant !== 'fill' || !pdfBlob) return;
    let cancelled = false;
    setRendering(true);
    import('../pdf/renderPdfToImages')
      .then(({ renderPdfToImages }) => renderPdfToImages(pdfBlob))
      .then((imgs) => { if (!cancelled) setPages(imgs); })
      .catch((e) => console.error('No se pudo renderizar la vista previa:', e))
      .finally(() => { if (!cancelled) setRendering(false); });
    return () => { cancelled = true; };
  }, [pdfBlob, variant]);

  // Limpieza al desmontar.
  useEffect(() => () => {
    if (promoteTimer.current) window.clearTimeout(promoteTimer.current);
    if (frontRef.current) URL.revokeObjectURL(frontRef.current);
    if (backRef.current) URL.revokeObjectURL(backRef.current);
  }, []);

  // El `onLoad` avisa cuando carga el visor, pero el PDF se PINTA un instante
  // después. Esperamos un poco antes de revelarlo (sin ver el fondo del visor).
  function promoteWhenPainted(u: string) {
    if (promoteTimer.current) window.clearTimeout(promoteTimer.current);
    promoteTimer.current = window.setTimeout(() => {
      if (frontRef.current && frontRef.current !== u) URL.revokeObjectURL(frontRef.current);
      frontRef.current = u;
      setFront(u);
      if (backRef.current === u) { backRef.current = null; setBack(null); }
    }, 220);
  }

  // En móvil el iframe no renderiza el PDF (el navegador muestra su propio
  // marcador con un botón "Abrir" que no funciona con URLs blob:). Este botón
  // descarga el PDF con nombre, y el sistema lo abre con su visor nativo.
  function openPdf() {
    const blob = blobRef.current;
    if (!blob) return;
    const base = `Cotizacion-${quote.folio || 's-n'}${quote.cliente.nombre ? '-' + slug(quote.cliente.nombre) : ''}`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${base}.pdf`;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  const fillStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    border: 'none',
  };

  // Capas vivas, sin duplicados, renderizadas como una sola lista keyed.
  const layers = [front, back].filter((u, i, a): u is string => !!u && a.indexOf(u) === i);

  const containerClass =
    variant === 'fill'
      ? 'flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white shadow-sm'
      : 'sticky top-[68px] flex h-[calc(100vh-84px)] flex-col overflow-hidden rounded-xl border border-line bg-white shadow-sm';

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="font-sora text-[12px] font-semibold uppercase tracking-wide text-gray">Vista previa</span>
        {variant === 'fill' ? (
          <button
            type="button"
            onClick={openPdf}
            disabled={!pdfBlob}
            className="flex items-center gap-1.5 rounded-lg bg-blue px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-blue/90 disabled:opacity-50"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Abrir PDF
          </button>
        ) : (
          <span className="text-[11px] text-gray">PDF en vivo</span>
        )}
      </div>
      <div className="relative flex-1 bg-white">
        {variant === 'fill' ? (
          // Móvil: páginas como imágenes (scroll vertical).
          <div className="absolute inset-0 overflow-y-auto bg-paper p-3">
            {pages.length === 0 ? (
              <div className="flex h-full items-center justify-center px-6 text-center text-[12px] text-gray">
                {rendering || !pdfBlob
                  ? 'Generando vista previa…'
                  : 'No se pudo mostrar la vista previa aquí. Toca “Abrir PDF”.'}
              </div>
            ) : (
              <div className="mx-auto flex max-w-[640px] flex-col gap-3">
                {pages.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Página ${i + 1}`}
                    className="w-full rounded-lg border border-line bg-white shadow-sm"
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {layers.length === 0 && (
              <div className="flex h-full items-center justify-center text-[12px] text-gray">
                Generando vista previa…
              </div>
            )}
            {layers.map((u) => {
              const isBack = u === back && u !== front;
              return (
                <iframe
                  key={u}
                  src={`${u}${IFRAME_HASH}`}
                  title={isBack ? '' : 'Vista previa de la cotización'}
                  aria-hidden={isBack || undefined}
                  onLoad={isBack ? () => promoteWhenPainted(u) : undefined}
                  style={isBack ? { ...fillStyle, opacity: 0, pointerEvents: 'none' } : fillStyle}
                />
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
