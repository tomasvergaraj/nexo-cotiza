import { useRef, useState } from 'react';
import { Upload, ImageUp, Trash2 } from 'lucide-react';
import type { Company } from '../lib/types';
import { validateRut, formatRut } from '../lib/format';
import { toast } from '../lib/toast';
import { Section, Field, Input, TextArea, Button } from './ui';

interface Props {
  company: Company;
  onChange: (c: Company) => void;
  onSaveLocal: () => void;
  saved: boolean;
}

export default function CompanyPanel({ company, onChange, onSaveLocal, saved }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const set = (patch: Partial<Company>) => onChange({ ...company, ...patch });

  function processFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('El logo debe ser una imagen (PNG, JPG…).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result);
      // Reescala a máx 600px para no inflar IndexedDB ni los exports (PDF/Word).
      const img = new Image();
      img.onload = () => {
        const maxDim = 600;
        const ratio = Math.min(maxDim / img.width, maxDim / img.height, 1);
        if (ratio >= 1) { set({ logoDataUrl: raw }); return; }
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { set({ logoDataUrl: raw }); return; }
        ctx.drawImage(img, 0, 0, w, h);
        set({ logoDataUrl: canvas.toDataURL('image/png') }); // PNG conserva transparencia
      };
      img.onerror = () => set({ logoDataUrl: raw });
      img.src = raw;
    };
    reader.readAsDataURL(file);
  }

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    processFile(e.target.files?.[0]);
    e.target.value = ''; // permite volver a subir el mismo archivo
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files?.[0]);
  }

  const rutOk = !company.rut || validateRut(company.rut);

  return (
    <Section
      title="Tu empresa"
      action={
        <Button variant="ghost" onClick={onSaveLocal} title="Guardar en este navegador para próximas cotizaciones">
          {saved ? '✓ Guardada' : 'Guardar datos'}
        </Button>
      }
    >
      {/* Logo */}
      <div className="mb-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          aria-label="Subir o arrastrar logo"
          className={`flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-paper transition ${
            dragging ? 'border-blue ring-2 ring-blue/20' : 'border-line hover:border-blue/50'
          }`}
        >
          {company.logoDataUrl ? (
            <img src={company.logoDataUrl} alt="Logo de la empresa" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="flex flex-col items-center gap-1 px-2 text-center text-[11px] text-gray">
              <ImageUp className="h-5 w-5 text-gray/70" />
              Arrastra o sube tu logo
            </span>
          )}
        </button>
        <div className="flex flex-col gap-2">
          <input ref={fileRef} type="file" accept="image/*" onChange={onLogo} className="hidden" />
          <Button onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> {company.logoDataUrl ? 'Cambiar' : 'Subir logo'}
          </Button>
          {company.logoDataUrl && (
            <Button variant="ghost" onClick={() => set({ logoDataUrl: '' })}>
              <Trash2 className="h-4 w-4" /> Quitar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Razón social" className="sm:col-span-2">
          <Input value={company.razonSocial} onChange={(e) => set({ razonSocial: e.target.value })} placeholder="Nexo Software SpA" />
        </Field>
        <Field label="RUT">
          <Input
            value={company.rut}
            onChange={(e) => set({ rut: e.target.value })}
            onBlur={(e) => e.target.value && set({ rut: formatRut(e.target.value) })}
            placeholder="76.123.456-7"
            className={!rutOk ? 'border-danger focus:border-danger focus:ring-danger/15' : ''}
          />
          {!rutOk && <span className="mt-1 block text-[11px] text-danger">RUT inválido</span>}
        </Field>
        <Field label="Giro">
          <Input value={company.giro} onChange={(e) => set({ giro: e.target.value })} placeholder="Desarrollo de software" />
        </Field>
        <Field label="Dirección">
          <Input value={company.direccion} onChange={(e) => set({ direccion: e.target.value })} placeholder="Calle 123" />
        </Field>
        <Field label="Comuna">
          <Input value={company.comuna} onChange={(e) => set({ comuna: e.target.value })} placeholder="Quillota" />
        </Field>
        <Field label="Teléfono">
          <Input value={company.telefono} onChange={(e) => set({ telefono: e.target.value })} placeholder="+56 9 ..." />
        </Field>
        <Field label="Email">
          <Input value={company.email} onChange={(e) => set({ email: e.target.value })} placeholder="contacto@empresa.cl" />
        </Field>
        <Field label="Sitio web" className="sm:col-span-2">
          <Input value={company.web} onChange={(e) => set({ web: e.target.value })} placeholder="www.empresa.cl" />
        </Field>
        <Field label="Condiciones por defecto" className="sm:col-span-2">
          <TextArea
            value={company.condicionesDefault}
            onChange={(e) => set({ condicionesDefault: e.target.value })}
            placeholder="Ej: Valores en CLP. Esta cotización no constituye documento tributario. Se aplican automáticamente a tus nuevas cotizaciones."
          />
        </Field>
      </div>

      {/* Datos de pago / transferencia */}
      <div className="mt-5 border-t border-line pt-4">
        <label className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <input
            type="checkbox"
            checked={company.pagoIncluir}
            onChange={(e) => set({ pagoIncluir: e.target.checked })}
            className="h-4 w-4 accent-blue"
          />
          Incluir datos de pago en el documento
        </label>
        {company.pagoIncluir && (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Banco">
              <Input value={company.pagoBanco} onChange={(e) => set({ pagoBanco: e.target.value })} placeholder="Banco de Chile" />
            </Field>
            <Field label="Tipo de cuenta">
              <Input value={company.pagoTipoCuenta} onChange={(e) => set({ pagoTipoCuenta: e.target.value })} placeholder="Cuenta corriente" />
            </Field>
            <Field label="N° de cuenta">
              <Input value={company.pagoNumero} onChange={(e) => set({ pagoNumero: e.target.value })} placeholder="000-12345678-90" />
            </Field>
            <Field label="Titular">
              <Input value={company.pagoTitular} onChange={(e) => set({ pagoTitular: e.target.value })} placeholder="Nexo Software SpA" />
            </Field>
            <Field label="RUT titular">
              <Input
                value={company.pagoRut}
                onChange={(e) => set({ pagoRut: e.target.value })}
                onBlur={(e) => e.target.value && set({ pagoRut: formatRut(e.target.value) })}
                placeholder="76.123.456-7"
              />
            </Field>
            <Field label="Email para comprobante">
              <Input value={company.pagoEmail} onChange={(e) => set({ pagoEmail: e.target.value })} placeholder="pagos@empresa.cl" />
            </Field>
          </div>
        )}
      </div>
    </Section>
  );
}
