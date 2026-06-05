---
name: NexoCotiza
description: Cotizaciones profesionales gratis, exportables a PDF o Word, 100% en el navegador.
colors:
  ink: "#171A1F"
  blue: "#0E7BD6"
  blue-deep: "#006CD8"
  celeste: "#6CD8FC"
  paper: "#F4F2EC"
  gray: "#6A7078"
  muted: "#565C64"
  line: "#D9D5CB"
  danger: "#DC2626"
  surface: "#FFFFFF"
typography:
  display:
    fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.04em"
rounded:
  sm: "8px"
  md: "12px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "{colors.blue-deep}"
    textColor: "{colors.surface}"
  button-soft:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
  button-ghost:
    backgroundColor: "#00000000"
    textColor: "{colors.gray}"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "20px"
---

# Design System: NexoCotiza

## 1. Overview

**Creative North Star: "El Taller Silencioso" (The Quiet Workbench)**

NexoCotiza es una herramienta, no un escaparate. El sistema visual existe para
desaparecer en la tarea: el usuario llega con un trabajo concreto (mandar una
cotización que se vea seria) y la interfaz le da controles familiares, sobrios y
predecibles, sin pedirle que aprenda nada. El protagonista no es la app sino el
documento que va a enviar; por eso la pantalla se mantiene plana y callada, y todo
el "brillo" se reserva para la cotización exportada en PDF o Word.

La estética se hereda de Nexo Software: editorial y plana, con un único azul de
acento sobre papel cálido casi blanco. La densidad es media-baja, pensada para
funcionar en celular tan bien como en escritorio. La confianza se construye con
restricción, no con decoración: sin gradientes, sin sombras dramáticas, sin
animaciones que hagan esperar.

Este sistema rechaza explícitamente cuatro cosas: el **SaaS genérico de IA**
(gradientes morado-azul, grillas de cards idénticas, eyebrows en mayúsculas sobre
cada sección, plantillas hero-metric); el **software contable pesado** (denso,
anticuado, intimidante); la **plantilla de marketing recargada** (relleno,
ilustraciones genéricas, buzzwords); y cualquier tono **infantil o juguetón**
(colores chillones, radios exagerados, emojis).

**Key Characteristics:**
- Plano por defecto: bordes finos de 1px y sombras mínimas, nunca elevación dramática.
- Un solo azul de acento, reservado para acción y estado, nunca decoración.
- Papel cálido (#F4F2EC) como lienzo; blanco puro solo para superficies de trabajo.
- Tipografía dual sobria: Sora para títulos/UI, Manrope para cuerpo y cifras.
- Densidad amable y mobile-first; la herramienta cabe en una mano.

## 2. Colors

Paleta restringida: neutros cálidos heredados de Nexo más un único azul de marca
que carga toda la intención.

### Primary
- **Azul Nexo** (#0E7BD6): el único acento. Acciones primarias, enlaces, foco,
  iconografía de confianza y títulos de sección. Su escasez es lo que lo hace leer
  como intención, no como adorno.
- **Azul Profundo** (#006CD8): estado hover/activo del azul primario. Nunca como
  color de reposo.

### Secondary
- **Celeste** (#6CD8FC): tono de apoyo muy puntual (realces suaves, fondos de
  estado al 10% de opacidad como `bg-blue/10`). No es un segundo acento competidor.

### Neutral
- **Tinta** (#171A1F): texto principal y titulares sobre superficies claras.
- **Gris** (#6A7078): texto secundario y de apoyo. Solo sobre blanco puro, donde
  alcanza ≥4.5:1; sobre papel queda al límite (ver regla de contraste).
- **Muted** (#565C64): el gris más oscuro, para labels y texto secundario que debe
  cumplir contraste sobre papel.
- **Papel** (#F4F2EC): fondo cálido casi blanco del lienzo general (body, header,
  footer translúcidos sobre él).
- **Superficie** (#FFFFFF): blanco puro para tarjetas, paneles e inputs, la capa
  donde realmente se trabaja.
- **Línea** (#D9D5CB): bordes y divisores de 1px. Cálida, nunca un gris frío.

### Tertiary
- **Peligro** (#DC2626): exclusivo de errores y acciones destructivas (eliminar
  ítem). Nunca decorativo.

### Named Rules
**The One Blue Rule.** Hay exactamente un azul de marca. Aparece en ≤10% de
cualquier pantalla y solo sobre acción o estado (botón primario, enlace, foco,
selección). Si el azul empieza a decorar, una de esas apariciones está de más.

**The Warm-Line Rule.** Todo borde y divisor usa Línea (#D9D5CB), un neutro cálido.
Prohibido el gris frío de navegador (`#ccc`, `#e5e7eb`) que rompe la calidez del papel.

## 3. Typography

**Display Font:** Sora (fallback ui-sans-serif, system-ui)
**Body Font:** Manrope (fallback ui-sans-serif, system-ui)

**Character:** Dos sans geométrico-humanistas afinadas para sobriedad editorial.
Sora aporta estructura y autoridad a títulos y etiquetas de UI; Manrope es legible
y tiene numerales tabulares, clave para que los montos en CLP se alineen en
columnas. El contraste entre ambas es de peso y rol, no de drama.

### Hierarchy
- **Display** (Sora 700, 1.875–3rem, line-height 1.15, tracking -0.02em): el h1 del
  intro ("Crea cotizaciones profesionales en minutos"). Único por página.
- **Title** (Sora 700, 1.25rem, tracking -0.01em): wordmark NexoCotiza y titulares
  de panel.
- **Body** (Manrope 400, 0.9375rem, line-height 1.5): texto general, descripciones,
  valores de formulario. Prosa acotada a 65–75ch.
- **Label** (Manrope 600, 0.6875–0.8125rem, tracking 0.04em, MAYÚSCULAS): etiquetas
  de campo (≤4 palabras) y encabezados de contacto en el footer.

### Named Rules
**The Tabular-Money Rule.** Todo monto en CLP usa numerales tabulares de Manrope
(`font-variant-numeric: tabular-nums`) para que las cifras se alineen en la tabla
de ítems y en los totales. Un total desalineado lee como error de cálculo.

**The Label-Only Caps Rule.** Las MAYÚSCULAS tracked se reservan para labels cortas
(≤4 palabras) y encabezados puntuales. Prohibido el eyebrow en mayúsculas sobre
cada sección: es gramática de IA, no jerarquía. Una frase en mayúsculas a tamaño de
cuerpo es ilegible.

## 4. Elevation

Sistema plano. La profundidad se transmite con bordes finos de 1px (#D9D5CB) y un
fondo blanco que se despega apenas del papel cálido, no con sombras. La única sombra
es `shadow-sm` (`0 1px 2px 0 rgb(0 0 0 / 0.05)`), un asiento sutil para tarjetas y
paneles; nada más profundo. El foco se comunica con un anillo de color
(`ring-2 ring-blue/15` a `/40`), no con elevación.

### Shadow Vocabulary
- **Asiento de tarjeta** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`): único nivel,
  para `Section`, paneles y la tira de beneficios. Despega la superficie del papel.

### Named Rules
**The Flat-By-Default Rule.** Las superficies son planas en reposo. Si una sombra
quiere ser visible, es demasiado: la jerarquía la cargan el borde, el fondo blanco y
el espaciado, no el drama de la elevación. Prohibida la glassmorphism decorativa.

## 5. Components

### Buttons
- **Shape:** esquinas suaves de 8px (`rounded-lg`); altura cómoda con `px-3.5 py-2`,
  `text-[13px]` semibold, ícono + texto con `gap-2`.
- **Primary:** fondo Azul Nexo (#0E7BD6) + texto blanco. Para la acción principal
  (exportar, guardar).
- **Hover / Focus:** hover → Azul Profundo (#006CD8); foco → `ring-2 ring-blue/40`
  visible (`focus-visible`). Transición de color, sin movimiento.
- **Soft:** fondo Papel + texto Tinta + borde Línea, hover sube el borde a `blue/40`.
  Acción secundaria, la variante por defecto.
- **Ghost:** transparente, texto Gris que vira a Tinta con fondo Papel en hover.
  Acciones terciarias y de barra.
- **Disabled:** `opacity-50` + `cursor-not-allowed`. Nunca color a plena saturación
  en estado inactivo.

### Cards / Containers (`Section`)
- **Corner Style:** 12px (`rounded-xl`).
- **Background:** Superficie blanca (#FFFFFF) sobre el papel.
- **Shadow Strategy:** solo `shadow-sm` (ver Elevation).
- **Border:** 1px Línea (#D9D5CB).
- **Internal Padding:** 20px (`p-5`). Encabezado con título de sección (Sora 600,
  Tinta, sentence case) + acción opcional alineada a la derecha.

### Inputs / Fields
- **Style:** fondo blanco, borde 1px Línea, 8px de radio, `text-[14px]` Tinta. Label
  encima (`Field`) en mayúsculas cortas color Muted.
- **Focus:** el borde vira a Azul Nexo + `ring-2 ring-blue/15`. Glow sutil, no salto.
- **Placeholder:** debe cumplir ≥4.5:1; nada de gris fantasma.
- **Variantes:** `Input`, `TextArea` (min-h 72px, resize-y) y `Select` comparten el
  mismo `inputBase`: vocabulario de control idéntico en toda la app.

### Navigation
- **Header:** wordmark (logo + Sora 700) a la izquierda; a la derecha un pill
  "Gratis · sin registro" (borde Línea, `rounded-full`) y el enlace a Nexo Software.
  Borde inferior de 1px, fondo `white/70` translúcido sobre el papel.
- **Footer:** marca + redes + contacto + empresa en grilla; enlaces en Gris que viran
  a Azul en hover.

### Signature: Tabla de ítems y totales
La `ItemsTable` y el bloque de totales (neto / IVA / total) son el corazón funcional.
Montos en numerales tabulares, alineados a la derecha, con el azul reservado para el
total final. Es donde la herramienta demuestra que entiende CLP, RUT e IVA chilenos.

## 6. Do's and Don'ts

### Do:
- **Do** mantener el azul (#0E7BD6) en ≤10% de la pantalla, solo en acción, enlace,
  foco y selección.
- **Do** usar bordes de 1px Línea (#D9D5CB) y `shadow-sm` para jerarquía; plano por
  defecto.
- **Do** numerales tabulares (`tabular-nums`) en todo monto CLP para que las columnas
  cuadren.
- **Do** garantizar contraste ≥4.5:1 en cuerpo y placeholders; subir Gris hacia Muted
  (#565C64) o Tinta cuando el fondo sea Papel.
- **Do** dar a cada control sus estados (default, hover, focus-visible, disabled,
  error) con el mismo vocabulario en toda la app.
- **Do** ofrecer alternativa `@media (prefers-reduced-motion: reduce)` en cualquier
  animación.

### Don't:
- **Don't** poner eyebrows en mayúsculas tracked sobre cada sección: es gramática de
  IA. Reservar mayúsculas para labels cortas (≤4 palabras), no para títulos de panel.
- **Don't** usar gradientes morado-azul, `background-clip: text`, ni la plantilla
  hero-metric: es el SaaS genérico de IA que rechazamos.
- **Don't** caer en grillas de cards idénticas (icono + título + texto repetido) como
  recurso por defecto.
- **Don't** parecer software contable pesado: nada de pantallas saturadas de campos ni
  estética de sistema tributario.
- **Don't** usar glassmorphism, sombras profundas ni elevación dramática; el sistema
  es plano.
- **Don't** colores chillones, radios exagerados ni emojis: resta seriedad al documento.
- **Don't** usar gris frío de navegador (#e5e7eb) para bordes; rompe la calidez del papel.
- **Don't** usar em dashes (—) ni buzzwords de marketing en el copy.
