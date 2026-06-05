import { useEffect, type RefObject } from 'react';

// Selector de elementos enfocables dentro de un diálogo.
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Atrapa el foco dentro de un contenedor mientras `active` es true:
 * - al activarse, mueve el foco al primer elemento enfocable (o al contenedor);
 * - Tab / Shift+Tab hacen ciclo dentro del diálogo, sin escapar al fondo;
 * - al desactivarse (cerrar), devuelve el foco a donde estaba antes de abrir.
 *
 * El contenedor debe tener `tabIndex={-1}` para poder recibir el foco inicial.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;

    const prevFocused = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));

    const first = focusables()[0];
    (first ?? node).focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        node.focus();
        return;
      }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      const activeEl = document.activeElement;
      if (e.shiftKey) {
        if (activeEl === firstEl || !node.contains(activeEl)) {
          e.preventDefault();
          lastEl.focus();
        }
      } else if (activeEl === lastEl || !node.contains(activeEl)) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    node.addEventListener('keydown', onKey);
    return () => {
      node.removeEventListener('keydown', onKey);
      // Devuelve el foco al disparador (p. ej. el botón que abrió el modal).
      prevFocused?.focus?.();
    };
  }, [active, ref]);
}
