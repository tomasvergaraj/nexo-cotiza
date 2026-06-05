import { useEffect, type RefObject } from 'react';

/**
 * Teclado para un menú desplegable (patrón WAI-ARIA menu button) dentro de
 * `containerRef`, mientras `open` es true:
 * - al abrir, mueve el foco al primer `[role="menuitem"]`;
 * - ArrowDown / ArrowUp hacen ciclo entre ítems; Home / End van a los extremos;
 * - Escape cierra y devuelve el foco al disparador (`[aria-haspopup="menu"]`).
 *
 * El cierre por clic afuera lo siguen manejando los componentes; este hook solo
 * agrega la navegación por teclado.
 */
export function useMenuKeyboard(containerRef: RefObject<HTMLElement | null>, open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const root = containerRef.current;
    if (!root) return;
    const trigger = root.querySelector<HTMLElement>('[aria-haspopup="menu"]');
    const items = () => Array.from(root.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])'));

    items()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      const list = items();
      if (list.length === 0) return;
      const idx = list.indexOf(document.activeElement as HTMLElement);
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          list[(idx + 1) % list.length]?.focus();
          break;
        case 'ArrowUp':
          e.preventDefault();
          list[(idx - 1 + list.length) % list.length]?.focus();
          break;
        case 'Home':
          e.preventDefault();
          list[0]?.focus();
          break;
        case 'End':
          e.preventDefault();
          list[list.length - 1]?.focus();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          trigger?.focus();
          break;
      }
    };

    root.addEventListener('keydown', onKey);
    return () => root.removeEventListener('keydown', onKey);
  }, [open, containerRef, onClose]);
}
