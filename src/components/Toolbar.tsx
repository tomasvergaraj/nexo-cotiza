import { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileType2, Printer, ChevronDown, Loader2 } from 'lucide-react';
import type { Company, Quote } from '../lib/types';
import { toast } from '../lib/toast';
import { track } from '../lib/analytics';
import { useMenuKeyboard } from '../lib/useMenuKeyboard';
import { Button } from './ui';

interface Props {
  company: Company;
  quote: Quote;
  /** Abre el menu hacia arriba (para la barra inferior fija en movil). */
  openUp?: boolean;
}

function slug(s: string): string {
  return (s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, 32);
}

export default function Toolbar({ company, quote, openUp = false }: Props) {
  const [busy, setBusy] = useState<'pdf' | 'docx' | 'print' | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useMenuKeyboard(ref, open, () => setOpen(false));
  const base = `Cotizacion-${quote.folio || 's-n'}${quote.cliente.nombre ? '-' + slug(quote.cliente.nombre) : ''}`;

  // Cerrar el menú al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  // Atajo: Ctrl/Cmd+Enter descarga el PDF (la exportacion mas comun).
  // Solo lo registra la instancia principal (no la barra movil) para no
  // disparar la descarga dos veces.
  useEffect(() => {
    if (openUp) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (busy === null) downloadPdf();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openUp, busy, company, quote]);

  // El motor PDF se carga solo al exportar/imprimir (no en la carga inicial).
  async function buildPdfBlob(): Promise<Blob> {
    const [{ pdf }, { QuotePdf }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('../pdf/QuotePdf'),
    ]);
    return pdf(<QuotePdf company={company} quote={quote} />).toBlob();
  }

  async function downloadPdf() {
    try {
      setBusy('pdf');
      const [blob, { saveAs }] = await Promise.all([buildPdfBlob(), import('file-saver')]);
      saveAs(blob, `${base}.pdf`);
      track('descarga_pdf');
      toast.success('PDF descargado.');
    } catch (err) {
      console.error(err);
      toast.error('No se pudo generar el PDF. Inténtalo de nuevo.');
    } finally {
      setBusy(null);
    }
  }

  // Imprime el MISMO PDF de la vista previa (idéntico), vía un iframe oculto.
  async function printPdf() {
    try {
      setBusy('print');
      const blob = await buildPdfBlob();
      track('imprimir_pdf');
      const url = URL.createObjectURL(blob);
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
      let cleaned = false;
      const cleanup = () => { if (cleaned) return; cleaned = true; URL.revokeObjectURL(url); iframe.remove(); };
      iframe.onload = () => {
        const w = iframe.contentWindow;
        if (!w) { cleanup(); return; }
        // Esperamos a que el visor pinte el PDF antes de abrir el diálogo.
        setTimeout(() => {
          try {
            w.focus();
            w.addEventListener('afterprint', cleanup);
            w.print();
          } catch {
            window.open(url, '_blank', 'noopener'); // respaldo: abrir en pestaña
          }
          setTimeout(cleanup, 60000); // respaldo de limpieza
        }, 300);
      };
      iframe.src = url;
      document.body.appendChild(iframe);
    } catch (err) {
      console.error(err);
      toast.error('No se pudo preparar la impresión.');
    } finally {
      setBusy(null);
    }
  }

  async function downloadDocx() {
    try {
      setBusy('docx');
      const [{ buildDocxBlob }, { saveAs }] = await Promise.all([
        import('../docx/buildDocx'),
        import('file-saver'),
      ]);
      const blob = await buildDocxBlob(company, quote);
      saveAs(blob, `${base}.docx`);
      track('descarga_word');
      toast.success('Word descargado.');
    } catch (err) {
      console.error(err);
      toast.error('No se pudo generar el Word. Inténtalo de nuevo.');
    } finally {
      setBusy(null);
    }
  }

  const item = 'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-medium text-ink transition hover:bg-paper';

  return (
    <div className={`relative ${openUp ? 'w-full' : ''}`} ref={ref}>
      <Button variant="primary" className={openUp ? 'w-full justify-center' : ''} onClick={() => setOpen((o) => !o)} disabled={busy !== null} aria-haspopup="menu" aria-expanded={open}>
        {busy !== null ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Generando…</>
        ) : (
          <><Download className="h-4 w-4" /> Descargar <ChevronDown className={`h-4 w-4 opacity-70 transition-transform ${open ? 'rotate-180' : ''}`} /></>
        )}
      </Button>

      {open && (
        <div role="menu" className={`absolute right-0 z-30 w-48 overflow-hidden rounded-xl border border-line bg-white shadow-lg ${openUp ? 'bottom-full mb-2' : 'mt-2'}`}>
          <button role="menuitem" onClick={() => { setOpen(false); downloadPdf(); }} className={item}>
            <FileText className="h-4 w-4 text-blue" /> Descargar PDF
          </button>
          <div className="h-px bg-line" />
          <button role="menuitem" onClick={() => { setOpen(false); downloadDocx(); }} className={item}>
            <FileType2 className="h-4 w-4 text-blue" /> Descargar Word
          </button>
          <div className="h-px bg-line" />
          <button role="menuitem" onClick={() => { setOpen(false); printPdf(); }} className={item}>
            <Printer className="h-4 w-4 text-blue" /> Imprimir / Guardar PDF
          </button>
        </div>
      )}
    </div>
  );
}
