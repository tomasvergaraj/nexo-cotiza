---
target: homepage + editor (index.astro)
total_score: 32
p0_count: 0
p1_count: 2
timestamp: 2026-06-05T14-11-44Z
slug: src-pages-index-astro
---
# Critique — NexoCotiza (homepage + editor)

Target: `src/pages/index.astro` (landing intro + isla React del editor de cotizaciones).

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Autoguardado del borrador es silencioso (sin indicador "guardado") |
| 2 | Match System / Real World | 4 | Dominio chileno impecable: CLP, RUT, IVA, folio, UF/USD |
| 3 | User Control and Freedom | 3 | Confirmaciones y Esc presentes; sin undo al eliminar ítem |
| 4 | Consistency and Standards | 3 | Primitivas uniformes; un par de tokens ad-hoc (`#D97706`, `gray/40`) |
| 5 | Error Prevention | 4 | Valida RUT, fecha mínima, tipo de imagen, confirma destructivos, autosave |
| 6 | Recognition Rather Than Recall | 4 | Labels en todo, datalist de unidades, catálogo, iconos con texto |
| 7 | Flexibility and Efficiency | 3 | Catálogo/duplicar/mover; sin atajos de teclado ni acciones masivas |
| 8 | Aesthetic and Minimalist Design | 3 | Limpio y plano; primer pantallazo carga 4 paneles completos a la vez |
| 9 | Error Recovery | 3 | Toasts accionables y errores inline claros en lenguaje natural |
| 10 | Help and Documentation | 2 | Sin ayuda contextual, sin estado vacío que enseñe, sin onboarding de primer uso |
| **Total** | | **32/40** | **Good (28–35): base sólida, faltan onboarding y ayuda** |

## Anti-Patterns Verdict

**¿Parece hecho por IA?** No. Tras los fixes recientes (eyebrows fuera, título de panel en sentence case, contraste corregido) la interfaz lee como una herramienta real y de oficio, no como una plantilla. El azul único, el papel cálido y los numerales tabulares dan identidad propia.

**LLM assessment**: Sin tells de slop. No hay gradientes morado-azul, ni hero-metric, ni glassmorphism. La tira de 3 cards de beneficios roza "identical card grid" pero es un trust-strip legítimo de 3 sobre superficie blanca.

**Deterministic scan**: 1 hallazgo (warning) en el HTML estático — `flat-type-hierarchy`: tamaños 18/20/24/30px con pasos de 1.1–1.2. El editor (JSX) sale limpio (`[]`). Para registro *product* un ratio 1.125–1.2 es aceptable y deseable; el único matiz es que el **h1 del intro** (momento semi-brand) podría anclar más.

**Visual overlays**: No disponibles en este entorno (sin automatización de navegador). Reporte por inspección de fuente + detector CLI.

## Overall Impression

Una herramienta honesta y bien hecha que cumple su promesa: cotizar rápido, sin cuenta, con un documento serio al final. Lo que funciona es la ingeniería de UX (validación, autosave, estados). La mayor oportunidad no es estética sino de **primer uso**: el editor abre con todo desplegado y sin una señal de "empieza por aquí", lo que castiga al primerizo.

## What's Working

- **Prevención de errores de primera**: RUT con módulo 11 inline, fecha "válida hasta" con mínimo, chequeo de tipo de imagen del logo, confirmaciones antes de borrar. Raro de ver tan completo.
- **Dominio chileno nativo**: CLP/UF/USD con "Traer hoy" desde el Banco Central, IVA afecto/exento, folio, monto en palabras. Habla el idioma del usuario.
- **Privacidad como producto**: todo local, respaldo export/import, "Borrar todos mis datos". Coherente con la promesa.

## Priority Issues

- **[P1] Carga cognitiva en el primer uso**: el editor monta 4 paneles completos a la vez (Empresa con logo + ~9 campos + datos de pago, Cliente, Ítems, Detalles). Un primerizo enfrenta un muro sin jerarquía de "qué primero". **Por qué importa**: abandono en el paso 1; el valor (descargar un PDF) queda lejos. **Fix**: estado de primer uso que destaque "Ver ejemplo" como acción recomendada, o disclosure progresivo (Empresa colapsable tras guardarla, pago oculto por defecto ya lo está). **Comando**: /impeccable onboard.
- **[P1] Vacío de ayuda y onboarding (heurística 10 = 2)**: no hay ayuda contextual ni un estado que enseñe la interfaz; "Ver ejemplo" existe pero no está señalizado como el mejor primer paso. **Por qué importa**: el primerizo no descubre el camino feliz. **Fix**: micro-onboarding no intrusivo + tooltips en los puntos de decisión (moneda, IVA, abono). **Comando**: /impeccable onboard.
- **[P2] Autoguardado silencioso**: el borrador se autoguarda cada 600 ms sin ningún indicador. En un producto "sin cuenta" eso genera ansiedad de "¿se guardó?". **Por qué importa**: Casey (móvil interrumpido) no sabe si puede irse sin perder nada. **Fix**: chip discreto "Guardado" / "Guardando…" cerca de la barra de acciones. **Comando**: /impeccable harden.
- **[P2] Anclaje tipográfico del intro**: h1 24→30px compite poco con el resto (wordmark 20, total 18). En el momento semi-brand del intro, un h1 más rotundo daría jerarquía sin romper la sobriedad del editor. **Comando**: /impeccable typeset.
- **[P3] Tokens ad-hoc**: `bg-[#D97706]` (punto naranja de "sin guardar") y `text-gray/40` quedan fuera del sistema. Llevar a tokens (`--color-warning`, opacidades definidas). **Comando**: /impeccable polish.

## Persona Red Flags

**Jordan (primerizo)**: abre el editor y ve 4 paneles llenos sin saber por dónde empezar; "Ver ejemplo" no se lee como el primer paso recomendado; sin ayuda visible en decisiones como Moneda/IVA/Abono.

**Casey (móvil interrumpido)**: la vista previa vive en un botón aparte (bien), pero el autoguardado no confirma nada; si lo interrumpen, no sabe si el borrador quedó a salvo. Acciones principales (Descargar) están arriba, fuera de la zona del pulgar.

**Sam (accesibilidad)**: bien servido — labels asociadas, foco visible, Esc en menús/modales, contraste ya corregido a AA y `prefers-reduced-motion` agregado. Pendiente verificar el orden de tabulación entre los dos modales (catálogo/vista previa) y que los toasts se anuncien (aria-live).

**Marcela (dueña de pyme, apurada — persona del proyecto)**: quiere mandar la cotización ya; le sobra el panel de datos de pago expandible si no transfiere; agradecería recordar su empresa (ya lo hace con "Guardar datos") y un atajo para exportar sin abrir el menú.

## Minor Observations

- El menú "Descargar" usa `position: absolute` dentro de la barra; verificar que no se recorte en contenedores con overflow en móvil.
- `text-gray/40` en el ícono del estado vacío del catálogo puede quedar bajo 3:1 (componente no-texto); subir un paso.
- Los toasts deberían exponer `aria-live="polite"` para lectores de pantalla.

## Questions to Consider

- ¿Y si el editor abriera enfocando "Ver ejemplo" o una cotización ya iniciada, en vez de 4 paneles en blanco?
- ¿El panel de datos de pago debería estar oculto tras un toggle (ya lo está) y además el de Empresa colapsarse una vez guardado?
- ¿Cuál es el momento "ajá" y cuántos campos hay entre el usuario y ese momento?
