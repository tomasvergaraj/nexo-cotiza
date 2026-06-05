// Mini store de notificaciones (toasts) sin dependencias ni context.
// `toast.success(...)` / `toast.error(...)` se pueden llamar desde cualquier
// componente; el <Toaster/> (montado una vez) se suscribe y los muestra.
import { useSyncExternalStore } from 'react';

export type ToastType = 'success' | 'error' | 'info';
export interface ToastAction {
  label: string;
  onClick: () => void;
}
export interface ToastItem {
  id: number;
  type: ToastType;
  msg: string;
  action?: ToastAction;
}
export interface ToastOptions {
  ttl?: number;
  action?: ToastAction;
}

let items: ToastItem[] = [];
let seq = 0;
const subscribers = new Set<() => void>();

function emit() {
  for (const fn of subscribers) fn();
}

function push(type: ToastType, msg: string, opts: ToastOptions = {}) {
  // Un toast con acción (p. ej. "Deshacer") vive un poco más para dar tiempo a reaccionar.
  const { ttl = opts.action ? 6000 : 3500, action } = opts;
  const id = ++seq;
  items = [...items, { id, type, msg, action }];
  emit();
  setTimeout(() => dismiss(id), ttl);
  return id;
}

export function dismiss(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

export const toast = {
  success: (msg: string, opts?: ToastOptions) => push('success', msg, opts),
  error: (msg: string, opts?: ToastOptions) => push('error', msg, opts),
  info: (msg: string, opts?: ToastOptions) => push('info', msg, opts),
};

export function useToasts(): ToastItem[] {
  return useSyncExternalStore(
    (cb) => {
      subscribers.add(cb);
      return () => subscribers.delete(cb);
    },
    () => items,
    () => items,
  );
}
