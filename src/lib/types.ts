// Tipos del dominio NexoCotiza

/** Moneda de la cotización. CLP sin decimales; UF/USD con 2 decimales. */
export type Moneda = 'CLP' | 'UF' | 'USD';

export interface Company {
  razonSocial: string;
  rut: string;
  giro: string;
  direccion: string;
  comuna: string;
  telefono: string;
  email: string;
  web: string;
  /** Logo del cliente como data URL (base64). No sale del navegador en modo anónimo. */
  logoDataUrl: string;
  condicionesDefault: string;
  // --- Datos de pago / transferencia (opcionales, se guardan con la empresa) ---
  /** Si se muestran los datos de pago en el documento (PDF/Word). */
  pagoIncluir: boolean;
  pagoBanco: string;
  pagoTipoCuenta: string;
  pagoNumero: string;
  pagoTitular: string;
  pagoRut: string;
  pagoEmail: string;
}

export interface Client {
  nombre: string;
  rut: string;
  contacto: string;
  email: string;
  telefono: string;
  direccion: string;
}

export interface QuoteItem {
  id: string;
  descripcion: string;
  cantidad: number;
  /** Unidad de medida (un, hr, mes, m²…). Vacío = sin unidad. */
  unidad: string;
  precioUnitario: number;
  /** Descuento por línea, en porcentaje (0–100). */
  descuentoPct: number;
}

export interface Quote {
  folio: string;
  /** Fecha de emisión, ISO yyyy-mm-dd */
  fecha: string;
  /** Válida hasta, ISO yyyy-mm-dd */
  validaHasta: string;
  moneda: Moneda;
  /** Valor de 1 UF o 1 USD en CLP, para mostrar la equivalencia. 0 = no mostrar. */
  valorMoneda: number;
  /** Fecha (ISO yyyy-mm-dd) del valor traído desde mindicador.cl. '' si es manual. */
  valorMonedaFecha: string;
  ivaPct: number; // 19 por defecto
  ivaExento: boolean;
  /** Descuento global sobre el subtotal, en porcentaje (0–100). */
  descuentoGlobalPct: number;
  /** Abono / anticipo en la moneda de la cotización. 0 = sin abono. */
  abono: number;
  notas: string;
  condiciones: string;
  cliente: Client;
  items: QuoteItem[];
}

export interface Totals {
  /** Suma de las líneas, antes del descuento global. */
  subtotal: number;
  descuentoGlobal: number;
  /** subtotal − descuento global. */
  neto: number;
  iva: number;
  total: number;
  abono: number;
  /** total − abono. */
  saldo: number;
}

/** Ítem reutilizable guardado en el catálogo (producto/servicio frecuente). */
export interface CatalogItem {
  id: string;
  descripcion: string;
  unidad: string;
  precioUnitario: number;
}

/** Estado de una cotización guardada en el historial. */
export type QuoteStatus = 'borrador' | 'enviada' | 'aceptada' | 'rechazada';

/** Registro del historial: una cotización guardada con su empresa al momento. */
export interface SavedQuote {
  id: string;
  /** Última vez que se guardó, ISO. */
  updatedAt: string;
  estado: QuoteStatus;
  /** Snapshot de la empresa para reproducir el documento tal como se guardó. */
  company: Company;
  quote: Quote;
}

export const emptyCompany = (): Company => ({
  razonSocial: '',
  rut: '',
  giro: '',
  direccion: '',
  comuna: '',
  telefono: '',
  email: '',
  web: '',
  logoDataUrl: '',
  condicionesDefault: '',
  pagoIncluir: false,
  pagoBanco: '',
  pagoTipoCuenta: '',
  pagoNumero: '',
  pagoTitular: '',
  pagoRut: '',
  pagoEmail: '',
});

export const emptyClient = (): Client => ({
  nombre: '',
  rut: '',
  contacto: '',
  email: '',
  telefono: '',
  direccion: '',
});
