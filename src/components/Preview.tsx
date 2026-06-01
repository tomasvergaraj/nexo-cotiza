import { useEffect, useRef, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import type { Company, Quote } from '../lib/types';
import { QuotePdf } from '../pdf/QuotePdf';

interface Props {
  company: Company;
  quote: Quote;
  /** `panel` (sticky en la columna) o `fill` (ocupa el alto del contenedor, p.ej. un modal). */
  variant?: 'panel' | 'fill';
}

const IFRAME_HASH = '#toolbar=0&navpanes=0&statusbar=0&view=FitH';

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
  }, [dCompany, dQuote]);

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
        <span className="text-[11px] text-gray">PDF en vivo</span>
      </div>
      <div className="relative flex-1 bg-white">
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
      </div>
    </div>
  );
}
