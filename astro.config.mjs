// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Salida estática: el editor corre 100% en el navegador (client:only).
// Para la Fase 2 (cuentas/links) se agrega un adapter (Cloudflare, Node…).
export default defineConfig({
  // URL pública del sitio (usada para canonical, og:url y sitemap).
  // Ajusta al dominio/subdominio real de producción.
  site: 'https://cotiza.nexosoftware.cl',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    // Pre-optimiza las dependencias que se cargan con import() dinámico (export
    // PDF/Word). Evita el 504 "Outdated Optimize Dep" de Vite al hacer clic,
    // que hacía fallar la descarga en modo dev.
    optimizeDeps: {
      include: ['file-saver', '@react-pdf/renderer', 'docx'],
    },
  },
});
