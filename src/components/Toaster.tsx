import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToasts, dismiss, type ToastType } from '../lib/toast';

const icon: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};
const accent: Record<ToastType, string> = {
  success: 'text-blue',
  error: 'text-danger',
  info: 'text-gray',
};

export default function Toaster() {
  const items = useToasts();
  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:left-auto sm:right-4 sm:translate-x-0"
    >
      {items.map((t) => {
        const Icon = icon[t.type];
        return (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-white px-4 py-3 shadow-lg"
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${accent[t.type]}`} aria-hidden />
            <p className="flex-1 text-[13px] text-ink">{t.msg}</p>
            {t.action && (
              <button
                onClick={() => { t.action!.onClick(); dismiss(t.id); }}
                className="-my-0.5 shrink-0 rounded-md px-2 py-1 text-[13px] font-semibold text-blue transition hover:bg-blue/10"
              >
                {t.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(t.id)}
              className="-mr-1 rounded-md p-0.5 text-gray transition hover:text-ink"
              aria-label="Cerrar notificación"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
