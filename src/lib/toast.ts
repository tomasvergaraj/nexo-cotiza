// Mini store de notificaciones (toasts) sin dependencias ni context.
// `toast.success(...)` / `toast.error(...)` se pueden llamar desde cualquier
// componente; el <Toaster/> (montado una vez) se suscribe y los muestra.
import { useSyncExternalStore } from 'react';

export type ToastType = 'success' | 'error' | 'info';
export interface ToastItem {
  id: number;
  type: ToastType;
  msg: string;
}

let items: ToastItem[] = [];
let seq = 0;
const subscribers = new Set<() => void>();

function emit() {
  for (const fn of subscribers) fn();
}

function push(type: ToastType, msg: string, ttl = 3500) {
  const id = ++seq;
  items = [...items, { id, type, msg }];
  emit();
  setTimeout(() => dismiss(id), ttl);
  return id;
}

export function dismiss(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

export const toast = {
  success: (msg: string) => push('success', msg),
  error: (msg: string) => push('error', msg),
  info: (msg: string) => push('info', msg),
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
