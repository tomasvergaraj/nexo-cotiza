import type { ReactNode } from 'react';

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-sora text-[13px] font-semibold uppercase tracking-wide text-blue">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}

const inputBase =
  'w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15 placeholder:text-gray/60';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ''}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputBase} min-h-[72px] resize-y ${props.className ?? ''}`} />;
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'soft' };
export function Button({ variant = 'soft', className = '', children, ...rest }: BtnProps) {
  const styles =
    variant === 'primary'
      ? 'bg-blue text-white hover:bg-blue-deep'
      : variant === 'ghost'
      ? 'bg-transparent text-gray hover:text-ink hover:bg-paper'
      : 'bg-paper text-ink border border-line hover:border-blue/40';
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-blue/40 disabled:opacity-50 disabled:cursor-not-allowed ${styles} ${className}`}
    >
      {children}
    </button>
  );
}
