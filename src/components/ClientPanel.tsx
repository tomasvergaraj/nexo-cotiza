import type { Client } from '../lib/types';
import { validateRut, formatRut } from '../lib/format';
import { Section, Field, Input } from './ui';

interface Props {
  client: Client;
  onChange: (c: Client) => void;
}

export default function ClientPanel({ client, onChange }: Props) {
  const set = (patch: Partial<Client>) => onChange({ ...client, ...patch });
  const rutOk = !client.rut || validateRut(client.rut);

  return (
    <Section title="Cliente">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Nombre / Razón social" className="sm:col-span-2">
          <Input value={client.nombre} onChange={(e) => set({ nombre: e.target.value })} placeholder="Empresa del cliente" />
        </Field>
        <Field label="RUT">
          <Input
            value={client.rut}
            onChange={(e) => set({ rut: e.target.value })}
            onBlur={(e) => e.target.value && set({ rut: formatRut(e.target.value) })}
            placeholder="76.543.210-8"
            className={!rutOk ? 'border-danger focus:border-danger focus:ring-danger/15' : ''}
          />
          {!rutOk && <span className="mt-1 block text-[11px] text-danger">RUT inválido</span>}
        </Field>
        <Field label="Persona de contacto">
          <Input value={client.contacto} onChange={(e) => set({ contacto: e.target.value })} placeholder="Nombre del contacto" />
        </Field>
        <Field label="Teléfono">
          <Input value={client.telefono} onChange={(e) => set({ telefono: e.target.value })} placeholder="+56 9 ..." />
        </Field>
        <Field label="Email">
          <Input value={client.email} onChange={(e) => set({ email: e.target.value })} placeholder="cliente@correo.cl" />
        </Field>
        <Field label="Dirección" className="sm:col-span-2">
          <Input value={client.direccion} onChange={(e) => set({ direccion: e.target.value })} placeholder="Dirección del cliente" />
        </Field>
      </div>
    </Section>
  );
}
