import { useEffect, useRef, useState } from 'react';
import { Share2, Link2, ChevronDown, Loader2 } from 'lucide-react';
import type { Company, Quote } from '../lib/types';
import { buildShareLink } from '../lib/share';
import { toast } from '../lib/toast';
import { track } from '../lib/analytics';
import { useMenuKeyboard } from '../lib/useMenuKeyboard';
import { Button } from './ui';

interface Props {
  company: Company;
  quote: Quote;
}

export default function ShareMenu({ company, quote }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useMenuKeyboard(ref, open, () => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  async function copyLink() {
    try {
      setBusy(true);
      const { url, logoOmitido } = await buildShareLink(company, quote);
      await navigator.clipboard.writeText(url);
      track('compartir_enlace');
      toast.success(logoOmitido ? 'Enlace copiado (sin el logo, por tamaño).' : 'Enlace copiado al portapapeles.');
    } catch {
      toast.error('No se pudo copiar el enlace. Intenta de nuevo.');
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  async function shareWhatsApp() {
    try {
      setBusy(true);
      const { url, logoOmitido } = await buildShareLink(company, quote);
      const nombre = quote.cliente.nombre ? ` para ${quote.cliente.nombre}` : '';
      const msg = `Te comparto una cotización${nombre}:\n${url}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
      track('compartir_whatsapp');
      if (logoOmitido) toast.info('El enlace no incluye el logo por su tamaño.');
    } catch {
      toast.error('No se pudo generar el enlace.');
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  const item = 'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-medium text-ink transition hover:bg-paper disabled:opacity-50';

  return (
    <div className="relative" ref={ref}>
      <Button onClick={() => setOpen((o) => !o)} disabled={busy} aria-haspopup="menu" aria-expanded={open} title="Compartir esta cotización por enlace">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
        Compartir
        <ChevronDown className={`h-4 w-4 opacity-70 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>

      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-white shadow-lg">
          <button role="menuitem" onClick={copyLink} disabled={busy} className={item}>
            <Link2 className="h-4 w-4 text-blue" /> Copiar enlace
          </button>
          <div className="h-px bg-line" />
          <button role="menuitem" onClick={shareWhatsApp} disabled={busy} className={item}>
            <Share2 className="h-4 w-4 text-blue" /> Enviar por WhatsApp
          </button>
        </div>
      )}
    </div>
  );
}
