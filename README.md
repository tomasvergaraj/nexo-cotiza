# NexoCotiza

**Crea cotizaciones profesionales y descárgalas en PDF o Word. Gratis, sin registro.**
Un producto de [Nexo Software](https://www.nexosoftware.cl).

Esta es la **Fase 1**: la herramienta funciona **100% en el navegador**. No hay backend. Los datos de la empresa, el logo y el borrador se guardan en el propio navegador (IndexedDB) y la exportación a PDF/Word ocurre en el cliente: nada sale del dispositivo del usuario.

---

## Requisitos

- **Node.js 20 o superior** (recomendado 20 LTS o 22)
- npm (viene con Node)

## Puesta en marcha

```bash
npm install      # instalar dependencias
npm run dev      # servidor de desarrollo en http://localhost:4321
```

Para producción:

```bash
npm run build    # genera el sitio estático en dist/
npm run preview  # previsualiza el build localmente
```

El resultado de `build` es **estático**, así que se publica tal cual en **Cloudflare Pages**, tu **VPS** (Caddy/Nginx) o cualquier hosting de archivos estáticos. Sin costo de servidor.

---

## Cómo funciona

- **Shell en Astro** (estático, SEO) + **isla React** para el editor, cargada con `client:only="react"` (el editor y el motor de PDF solo corren en el navegador).
- **Exportación client-side:**
  - **PDF** con [`@react-pdf/renderer`](https://react-pdf.org) — el mismo componente renderiza la vista previa en vivo y genera el archivo.
  - **Word (.docx)** con [`docx`](https://docx.js.org) — se arma el documento y se descarga, todo en el cliente.
- **Memoria local** con [`idb`](https://github.com/jakearchibald/idb) (IndexedDB): la empresa y el logo se guardan con el botón **Guardar datos**; el borrador en curso se autoguarda. Todo por navegador/dispositivo.
- **Sin registro:** no hay cuentas ni servidor en esta fase. El registro opcional (sincronización entre dispositivos, historial, links permanentes) llega en la Fase 2.

> Nota técnica: el bundle del editor pesa ~1.9 MB (~607 KB gzip) porque incluye el motor de PDF. Es esperable para la Fase 1. Una optimización futura es **cargar el preview/exportador con `import()` diferido** (lazy) para aligerar la carga inicial.

---

## Estructura

```
nexocotiza/
├── public/
│   ├── nexocotiza.png         # logo maestro (1024×1024) — fuente de todos los íconos
│   ├── favicon.ico            # favicon multi-tamaño (16/32/48)
│   ├── icon-16/32/48.png      # favicons PNG
│   ├── apple-touch-icon.png   # ícono iOS (180)
│   ├── icon-192/512.png       # íconos PWA / Android
│   ├── icon-maskable-512.png  # ícono maskable (Android adaptativo)
│   ├── og-image.png           # imagen para compartir (1200×630)
│   ├── site.webmanifest       # manifest PWA
│   └── fonts/                 # Sora y Manrope (estáticas, para UI y PDF)
├── src/
│   ├── layouts/Base.astro     # layout + metadatos
│   ├── pages/index.astro      # landing + editor (isla React)
│   ├── styles/global.css      # Tailwind v4 + tokens de marca + @font-face
│   ├── components/
│   │   ├── QuoteEditor.tsx     # raíz: estado, autoguardado, layout
│   │   ├── CompanyPanel.tsx    # datos de la empresa + subida de logo
│   │   ├── ClientPanel.tsx     # datos del cliente
│   │   ├── ItemsTable.tsx      # ítems (agregar/editar/eliminar)
│   │   ├── DetailsPanel.tsx    # folio, fechas, IVA, notas + totales
│   │   ├── Toolbar.tsx         # exportar PDF / Word
│   │   ├── Preview.tsx         # vista previa PDF en vivo (debounced)
│   │   └── ui.tsx              # primitivas (Input, Field, Button…)
│   ├── lib/
│   │   ├── types.ts            # tipos del dominio
│   │   ├── format.ts           # CLP, RUT (módulo 11), fechas
│   │   ├── calc.ts             # subtotales y totales (neto/IVA/total)
│   │   ├── storage.ts          # persistencia local (IndexedDB)
│   │   └── sample.ts           # datos de ejemplo / cotización nueva
│   ├── pdf/QuotePdf.tsx        # plantilla PDF (react-pdf)
│   └── docx/buildDocx.ts       # generador Word (docx)
├── astro.config.mjs
├── tsconfig.json
└── package.json
```

---

## Marca

Hereda el sistema visual de Nexo Software (estética editorial, plana, un solo azul de acento):

- **Tinta** `#171A1F` · **Azul** `#0E7BD6` · **Azul profundo** `#006CD8` · **Papel** `#F4F2EC` · **Gris** `#6A7078` · **Línea** `#D9D5CB`
- **Sora** para títulos/UI, **Manrope** para cuerpo y cifras (numerales tabulares en montos).
- El **PDF** usa Sora/Manrope embebidas; el **Word** usa Arial (fuente segura) + azul de marca, para verse bien en cualquier Word/LibreOffice.

---

## Próximos pasos (roadmap)

- **Fase 2 — Registro opcional + nube:** Auth.js (magic link/Google), `company_profile` + historial en Neon (PostgreSQL), migración de datos locales a la cuenta, multi-dispositivo. Requiere agregar un adapter de Astro (Cloudflare/Node).
- **Fase 3 — La cuña:** link compartible (apto WhatsApp), página pública `/c/[slug]`, tracking *vista/aceptada*, libreta de clientes.
- **Fase 4 — Si agarra vuelo (premium):** plantillas premium, links permanentes/ilimitados, quitar marca, multi-usuario, conversión a factura (LibreDTE/Nubox/Bsale).

---

*Una cotización no constituye documento tributario; NexoCotiza no emite DTE.*
