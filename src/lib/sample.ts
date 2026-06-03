import type { Quote, QuoteItem } from './types';
import { emptyClient } from './types';
import { todayISO, addDaysISO } from './format';

let _id = 0;
export const newId = () => `it_${Date.now().toString(36)}_${(_id++).toString(36)}`;
/** Id único para un registro del historial. */
export const newQuoteId = () => `q_${Date.now().toString(36)}_${(_id++).toString(36)}`;

export const emptyItem = (): QuoteItem => ({
  id: newId(),
  descripcion: '',
  cantidad: 1,
  unidad: '',
  precioUnitario: 0,
  descuentoPct: 0,
});

/** Cotización nueva con valores por defecto (fecha hoy, vigencia +30 días). */
export function newQuote(folio = ''): Quote {
  const fecha = todayISO();
  return {
    folio: folio || '0001',
    fecha,
    validaHasta: addDaysISO(fecha, 30),
    moneda: 'CLP',
    valorMoneda: 0,
    valorMonedaFecha: '',
    ivaPct: 19,
    ivaExento: false,
    descuentoGlobalPct: 0,
    abono: 0,
    notas: '',
    condiciones:
      'Valores en pesos chilenos (CLP). Precios válidos hasta la fecha indicada. ' +
      'Esta cotización no constituye documento tributario.',
    cliente: emptyClient(),
    items: [emptyItem()],
  };
}

/** Carga una cotización de demostración para ver la herramienta funcionando. */
export function demoQuote(): Quote {
  const q = newQuote('0001');
  q.cliente = {
    nombre: 'Comercializadora Los Aromos SpA',
    rut: '76.543.210-8',
    contacto: 'Javiera Rojas',
    email: 'compras@losaromos.cl',
    telefono: '+56 9 1234 5678',
    direccion: 'Av. O’Higgins 1234, Quillota',
  };
  q.items = [
    { id: newId(), descripcion: 'Desarrollo de sitio web institucional (5 secciones)', cantidad: 1, unidad: 'un', precioUnitario: 850000, descuentoPct: 0 },
    { id: newId(), descripcion: 'Diseño de identidad visual y logotipo', cantidad: 1, unidad: 'un', precioUnitario: 320000, descuentoPct: 10 },
    { id: newId(), descripcion: 'Mantención mensual y hosting', cantidad: 6, unidad: 'mes', precioUnitario: 45000, descuentoPct: 0 },
  ];
  q.notas = 'Incluye 2 rondas de ajustes. Plazo estimado de entrega: 4 semanas.';
  return q;
}
