---
target: homepage + editor (index.astro) post-fixes
total_score: 36
p0_count: 0
p1_count: 0
timestamp: 2026-06-05T14-36-39Z
slug: src-pages-index-astro
---
# Critique — NexoCotiza (homepage + editor) · post-fixes

Target: `src/pages/index.astro`. Segunda corrida tras implementar el backlog P1–P3 (onboarding, autosave visible, tooltips, disclosure progresivo, tokens, a11y).

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Chip "Guardando…/Guardado" con aria-live |
| 2 | Match System / Real World | 4 | Dominio chileno nativo (CLP/RUT/IVA/UF/USD) |
| 3 | User Control and Freedom | 3 | Confirmaciones y Esc; aún sin undo al eliminar ítem |
| 4 | Consistency and Standards | 4 | Tokens en sistema (warning); títulos de panel consistentes |
| 5 | Error Prevention | 4 | RUT, fecha mínima, tipo de imagen, confirmaciones, autosave |
| 6 | Recognition Rather Than Recall | 4 | Labels, datalist, catálogo, tooltips en decisiones |
| 7 | Flexibility and Efficiency | 3 | Sin atajos de teclado ni acciones masivas |
| 8 | Aesthetic and Minimalist Design | 4 | Empresa colapsable + guía reducen el muro inicial |
| 9 | Error Recovery | 3 | Toasts accionables, errores inline claros |
| 10 | Help and Documentation | 3 | Guía de primer uso + tooltips; falta ayuda buscable |
| **Total** | | **36/40** | **Excellent (36–40): pulido menor restante** |

## Anti-Patterns Verdict

No parece IA. Detector limpio: `dist/index.html` → `[]`, `src/` → `[]`. El warning previo de jerarquía tipográfica se resolvió al anclar el h1 (30→36px). Sin overlays (sin navegador en este entorno).

## What's Working

- Primer uso ahora guiado: callout de 4 pasos con "Ver un ejemplo" como acción recomendada, solo para nuevos.
- Disclosure progresivo: el panel "Tu empresa" colapsa para quien ya guardó sus datos.
- Tranquilidad: autoguardado visible + tooltips en Moneda/IVA/Descuento/Abono/Vigencia.

## Priority Issues (restantes)

- **[P2] Eficiencia power-user**: sin atajos de teclado (agregar ítem, descargar) ni acciones masivas sobre ítems. Comando: /impeccable optimize.
- **[P3] Undo al eliminar ítem**: hoy solo se bloquea con 1 ítem; un undo por toast sería más amable. Comando: /impeccable harden.
- **[P3] Zona del pulgar (móvil)**: "Descargar" vive arriba; evaluar acción flotante inferior en móvil. Comando: /impeccable adapt.

## Persona Red Flags

- **Jordan (primerizo)**: ahora tiene guía y tooltips; riesgo bajo.
- **Alex (power user)**: sigue sin atajos; one-item-at-a-time en ítems.
- **Casey (móvil)**: autosave ya confirma; pendiente acción de descarga al alcance del pulgar.

## Questions to Consider

- ¿Vale un atajo global (p. ej. ⌘/Ctrl+S = guardar en historial, ⌘/Ctrl+E = descargar)?
- ¿El "deshacer" por toast al eliminar ítem cierra el último hueco de control?
