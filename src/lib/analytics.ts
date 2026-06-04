// Eventos personalizados de Vercel Web Analytics.
//
// El script de medición se carga en `Base.astro` (solo en producción) y expone
// una función global `window.va`. Aquí solo empujamos eventos a esa función.
// Si la analítica no está cargada (p. ej. en dev local), los eventos se
// descartan en silencio: nunca lanza error ni rompe la acción del usuario.

type AllowedValue = string | number | boolean | null;

declare global {
  interface Window {
    va?: (event: 'event', props: { name: string; data?: Record<string, AllowedValue> }) => void;
  }
}

/** Acciones que medimos. Mantener en sincronía con el panel de Vercel. */
export type AnalyticsEvent =
  | 'cotizacion_guardada'
  | 'descarga_pdf'
  | 'descarga_word'
  | 'imprimir_pdf'
  | 'empresa_guardada'
  | 'app_instalada'
  | 'compartir_enlace'
  | 'compartir_whatsapp';

export function track(name: AnalyticsEvent, data?: Record<string, AllowedValue>): void {
  if (typeof window === 'undefined' || typeof window.va !== 'function') return;
  window.va('event', data ? { name, data } : { name });
}
