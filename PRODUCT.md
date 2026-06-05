# Product

## Register

product

## Users

Pymes, freelancers y profesionales independientes en Chile que necesitan enviar
cotizaciones de aspecto profesional sin pagar por software contable ni aprender
una herramienta compleja. Trabajan con CLP, RUT e IVA chilenos. Su contexto al
usar NexoCotiza es puntual y orientado a una tarea: "necesito mandar una
cotización ahora y que se vea seria". Muchos llegan desde el celular, sin cuenta
y sin ganas de crear una. El trabajo a resolver: completar datos de empresa y
cliente, agregar ítems, y descargar un PDF o Word listo para enviar por correo o
WhatsApp, en minutos.

## Product Purpose

NexoCotiza crea cotizaciones profesionales gratis y las exporta a PDF o Word,
100% en el navegador: sin backend, sin registro y sin que los datos salgan del
dispositivo (empresa, logo y borrador viven en IndexedDB). Es la Fase 1 de un
producto de Nexo Software. El éxito se mide en que un usuario nuevo llegue,
genere su primera cotización descargable y la envíe sin fricción, confiando en
que el documento resultante lo hace ver profesional ante su cliente.

## Brand Personality

Profesional y confiable, simple y sin fricción. Hereda el sistema visual de Nexo
Software: editorial, plano, con un solo azul de acento. Tres palabras: confiable,
directo, sobrio. La interfaz debe desaparecer en la tarea; el protagonismo es del
documento que el usuario va a enviar, no de la herramienta. Tono en español de
Chile: cercano y claro, nunca corporativo-vacío ni infantil.

## Anti-references

- **SaaS genérico de IA**: gradientes morado-azul, cards idénticas en grilla,
  eyebrows en mayúsculas tracked sobre cada sección, plantilla hero-metric.
- **Software contable pesado** (estilo SII / ERP / sistema tributario): denso,
  anticuado, intimidante, pantallas saturadas de campos.
- **Plantilla de marketing recargada**: theme comprado con secciones de relleno,
  ilustraciones genéricas y copy de buzzwords.
- **Infantil o juguetón**: colores chillones, radios exagerados, emojis, cualquier
  tono que reste seriedad a un documento comercial.

## Design Principles

1. **La herramienta desaparece en la tarea.** Familiaridad sobre sorpresa:
   controles estándar, vocabulario de componentes consistente, cero affordances
   inventadas. El usuario está trabajando, no explorando.
2. **El documento es el héroe, no la app.** El acento y el cuidado tipográfico
   sirven a que la cotización exportada se vea profesional; la UI se mantiene
   sobria para no competir.
3. **Confianza sin pedir nada.** Sin registro, sin "tus datos en la nube":
   comunicar privacidad (todo local) como una ventaja real, no como disclaimer.
4. **Rápido de verdad.** Skeleton que pinta al instante, autoguardado,
   exportación sin esperas innecesarias. Minutos, no sesiones.
5. **Local de Chile sin disfraz.** CLP, RUT (módulo 11), IVA y lenguaje directo
   chileno tratados como ciudadanos de primera clase, no como una localización.

## Accessibility & Inclusion

Objetivo WCAG 2.1 AA. Texto de cuerpo con contraste ≥4.5:1 (texto grande ≥3:1),
incluidos placeholders; foco siempre visible (`focus-visible`). Toda animación
debe tener alternativa bajo `@media (prefers-reduced-motion: reduce)`. Soporte
táctil y de teclado completo, objetivos de toque cómodos en móvil, y formularios
con labels asociadas correctamente.
