// Tipos del dominio NexoCotiza

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
  moneda: 'CLP';
  ivaPct: number; // 19 por defecto
  ivaExento: boolean;
  notas: string;
  condiciones: string;
  cliente: Client;
  items: QuoteItem[];
}

export interface Totals {
  neto: number;
  iva: number;
  total: number;
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
});

export const emptyClient = (): Client => ({
  nombre: '',
  rut: '',
  contacto: '',
  email: '',
  telefono: '',
  direccion: '',
});
