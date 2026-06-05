import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export function Section({
  title,
  children,
  action,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const heading = collapsible ? (
    <h2 className="font-sora text-[15px] font-semibold tracking-tight text-ink">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-blue/40 rounded"
      >
        <ChevronDown className={`h-4 w-4 text-muted transition-transform ${open ? '' : '-rotate-90'}`} aria-hidden />
        {title}
      </button>
    </h2>
  ) : (
    <h2 className="font-sora text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
  );
  return (
    <section className="rounded-xl border border-line bg-white p-5 shadow-sm">
      <div className={`flex items-center justify-between gap-3 ${open ? 'mb-4' : ''}`}>
        {heading}
        {action}
      </div>
      {open && children}
    </section>
  );
}

export function Field({
  label,
  children,
  className = '',
  hint,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
        {hint && (
          <span
            tabIndex={0}
            role="img"
            aria-label={hint}
            title={hint}
            className="inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full text-gray outline-none focus-visible:ring-2 focus-visible:ring-blue/40"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

const inputBase =
  'w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15 placeholder:text-gray';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ''}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputBase} min-h-[72px] resize-y ${props.className ?? ''}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputBase} cursor-pointer ${props.className ?? ''}`} />;
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'soft' };
export function Button({ variant = 'soft', className = '', children, ...rest }: BtnProps) {
  const styles =
    variant === 'primary'
      ? 'bg-blue text-white hover:bg-blue-deep'
      : variant === 'ghost'
      ? 'bg-transparent text-muted hover:text-ink hover:bg-paper'
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
