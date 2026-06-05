// Genera el .docx en el navegador con la librería `docx`. Devuelve un Blob.
// Misma marca que el PDF (azul Nexo, total destacado), tipografía segura (Arial)
// para que se vea bien en cualquier Word/LibreOffice aunque no tenga Sora/Manrope.
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ImageRun, ShadingType, VerticalAlign, Footer,
} from 'docx';
import type { Company, Quote, Totals } from '../lib/types';
import { formatCLP, formatMoneda, formatRut, formatFechaLarga, montoEnPalabras } from '../lib/format';
import { lineSubtotal, computeTotals } from '../lib/calc';

type Align = (typeof AlignmentType)[keyof typeof AlignmentType];

const INK = '171A1F';
const BLUE = '0E7BD6';
const GRAY = '6A7078';
const WHITE = 'FFFFFF';
const SOFT = 'F7F5EF';
const FONT = 'Arial';

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || '';
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function imageType(dataUrl: string): 'png' | 'jpg' | 'gif' | 'bmp' {
  const m = /^data:image\/(\w+)/.exec(dataUrl);
  const t = (m?.[1] || 'png').toLowerCase();
  if (t === 'jpeg') return 'jpg';
  if (t === 'png' || t === 'gif' || t === 'bmp') return t;
  return 'png';
}
function imageSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 160, h: img.naturalHeight || 64 });
    img.onerror = () => resolve({ w: 160, h: 64 });
    img.src = dataUrl;
  });
}

const txt = (text: string, opts: Partial<{ bold: boolean; color: string; size: number; font: string }> = {}) =>
  new TextRun({ text, bold: opts.bold, color: opts.color, size: (opts.size ?? 9) * 2, font: opts.font ?? FONT });

function cell(children: Paragraph[], opts: Partial<{ width: number; fill: string; align: Align }> = {}) {
  return new TableCell({
    children,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: opts.fill } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
  });
}
const para = (runs: TextRun[], align: Align = AlignmentType.LEFT, spacingAfter = 0) =>
  new Paragraph({ children: runs, alignment: align, spacing: { after: spacingAfter } });

const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
};
const lightRows = {
  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E3E0D8' },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
};

export async function buildDocxBlob(company: Company, quote: Quote): Promise<Blob> {
  const totals: Totals = computeTotals(quote);
  const body: (Paragraph | Table)[] = [];

  // --- Encabezado: logo / nombre emisor + bloque cotización ---
  if (company.logoDataUrl) {
    try {
      const { w, h } = await imageSize(company.logoDataUrl);
      const maxW = 150, maxH = 60;
      const ratio = Math.min(maxW / w, maxH / h, 1);
      body.push(
        new Paragraph({
          children: [
            new ImageRun({
              type: imageType(company.logoDataUrl),
              data: dataUrlToBytes(company.logoDataUrl),
              transformation: { width: Math.round(w * ratio), height: Math.round(h * ratio) },
            }),
          ],
          spacing: { after: 60 },
        }),
      );
    } catch { /* sin logo si falla */ }
  }

  const emisor: Paragraph[] = [];
  emisor.push(para([txt(company.razonSocial || 'Tu empresa', { bold: true, size: 13, color: INK })]));
  const lines: string[] = [];
  if (company.rut) lines.push(`RUT ${formatRut(company.rut)}`);
  if (company.giro) lines.push(company.giro);
  const dir = [company.direccion, company.comuna].filter(Boolean).join(', ');
  if (dir) lines.push(dir);
  const con = [company.telefono, company.email].filter(Boolean).join(' · ');
  if (con) lines.push(con);
  if (company.web) lines.push(company.web);
  for (const l of lines) emisor.push(para([txt(l, { color: GRAY, size: 8.5 })]));

  const docInfo: Paragraph[] = [
    para([txt('COTIZACIÓN', { bold: true, size: 16, color: BLUE })], AlignmentType.RIGHT),
    para([txt('N° ', { color: GRAY, size: 9 }), txt(quote.folio, { bold: true, color: INK, size: 9 })], AlignmentType.RIGHT),
    para([txt(`Fecha: ${formatFechaLarga(quote.fecha)}`, { color: GRAY, size: 8.5 })], AlignmentType.RIGHT),
  ];
  if (quote.validaHasta) {
    docInfo.push(para([txt(`Válida hasta: ${formatFechaLarga(quote.validaHasta)}`, { color: GRAY, size: 8.5 })], AlignmentType.RIGHT));
  }

  body.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noBorders,
      rows: [new TableRow({ children: [cell(emisor, { width: 55 }), cell(docInfo, { width: 45 })] })],
    }),
  );

  // Regla
  body.push(new Paragraph({ text: '', border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: INK, space: 1 } }, spacing: { before: 80, after: 200 } }));

  // --- Cliente ---
  body.push(para([txt('COTIZACIÓN PARA', { bold: true, size: 7.5, color: BLUE })], AlignmentType.LEFT, 40));
  body.push(para([txt(quote.cliente.nombre || '—', { bold: true, size: 10.5, color: INK })]));
  const cl: string[] = [];
  if (quote.cliente.rut) cl.push(`RUT ${formatRut(quote.cliente.rut)}`);
  if (quote.cliente.contacto) cl.push(quote.cliente.contacto);
  if (quote.cliente.direccion) cl.push(quote.cliente.direccion);
  const clcon = [quote.cliente.telefono, quote.cliente.email].filter(Boolean).join(' · ');
  if (clcon) cl.push(clcon);
  for (const l of cl) body.push(para([txt(l, { color: GRAY, size: 9 })]));
  body.push(new Paragraph({ text: '', spacing: { after: 160 } }));

  // --- Tabla de ítems ---
  const headRow = new TableRow({
    tableHeader: true,
    children: [
      cell([para([txt('Detalle', { bold: true, color: WHITE, size: 8 })])], { width: 50, fill: INK }),
      cell([para([txt('Cant.', { bold: true, color: WHITE, size: 8 })], AlignmentType.RIGHT)], { width: 11, fill: INK }),
      cell([para([txt('P. unitario', { bold: true, color: WHITE, size: 8 })], AlignmentType.RIGHT)], { width: 17, fill: INK }),
      cell([para([txt('Desc.', { bold: true, color: WHITE, size: 8 })], AlignmentType.RIGHT)], { width: 9, fill: INK }),
      cell([para([txt('Subtotal', { bold: true, color: WHITE, size: 8 })], AlignmentType.RIGHT)], { width: 13, fill: INK }),
    ],
  });
  const itemRows = quote.items.map((it, i) => {
    const fill = i % 2 === 1 ? SOFT : undefined;
    return new TableRow({
      children: [
        cell([para([txt(it.descripcion || '—', { size: 9 })])], { width: 50, fill }),
        cell([para([txt(`${it.cantidad}${it.unidad ? ` ${it.unidad}` : ''}`, { size: 9 })], AlignmentType.RIGHT)], { width: 11, fill }),
        cell([para([txt(formatMoneda(it.precioUnitario, quote.moneda), { size: 9 })], AlignmentType.RIGHT)], { width: 17, fill }),
        cell([para([txt(it.descuentoPct ? `${it.descuentoPct}%` : '—', { size: 9 })], AlignmentType.RIGHT)], { width: 9, fill }),
        cell([para([txt(formatMoneda(lineSubtotal(it, quote.moneda), quote.moneda), { size: 9 })], AlignmentType.RIGHT)], { width: 13, fill }),
      ],
    });
  });
  body.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: lightRows, rows: [headRow, ...itemRows] }));

  // --- Totales (alineados a la derecha) ---
  const totalsRows: TableRow[] = [];
  if (totals.descuentoGlobal > 0) {
    totalsRows.push(new TableRow({ children: [
      cell([para([txt('Subtotal', { color: GRAY, size: 9 })])], { width: 55 }),
      cell([para([txt(formatMoneda(totals.subtotal, quote.moneda), { bold: true, size: 9 })], AlignmentType.RIGHT)], { width: 45 }),
    ] }));
    totalsRows.push(new TableRow({ children: [
      cell([para([txt(`Descuento (${quote.descuentoGlobalPct}%)`, { color: GRAY, size: 9 })])], { width: 55 }),
      cell([para([txt(`−${formatMoneda(totals.descuentoGlobal, quote.moneda)}`, { bold: true, size: 9 })], AlignmentType.RIGHT)], { width: 45 }),
    ] }));
  }
  totalsRows.push(new TableRow({ children: [
    cell([para([txt('Neto', { color: GRAY, size: 9 })])], { width: 55 }),
    cell([para([txt(formatMoneda(totals.neto, quote.moneda), { bold: true, size: 9 })], AlignmentType.RIGHT)], { width: 45 }),
  ] }));
  totalsRows.push(new TableRow({ children: [
    cell([para([txt(quote.ivaExento ? 'IVA (exento)' : `IVA (${quote.ivaPct}%)`, { color: GRAY, size: 9 })])], { width: 55 }),
    cell([para([txt(formatMoneda(totals.iva, quote.moneda), { bold: true, size: 9 })], AlignmentType.RIGHT)], { width: 45 }),
  ] }));
  totalsRows.push(new TableRow({ children: [
    cell([para([txt('TOTAL', { bold: true, color: WHITE, size: 11 })])], { width: 55, fill: BLUE }),
    cell([para([txt(formatMoneda(totals.total, quote.moneda), { bold: true, color: WHITE, size: 12 })], AlignmentType.RIGHT)], { width: 45, fill: BLUE }),
  ] }));
  if (totals.abono > 0) {
    totalsRows.push(new TableRow({ children: [
      cell([para([txt('Abono', { color: GRAY, size: 9 })])], { width: 55 }),
      cell([para([txt(`−${formatMoneda(totals.abono, quote.moneda)}`, { bold: true, size: 9 })], AlignmentType.RIGHT)], { width: 45 }),
    ] }));
    totalsRows.push(new TableRow({ children: [
      cell([para([txt('Saldo', { bold: true, color: INK, size: 9 })])], { width: 55 }),
      cell([para([txt(formatMoneda(totals.saldo, quote.moneda), { bold: true, size: 9 })], AlignmentType.RIGHT)], { width: 45 }),
    ] }));
  }
  const totalsTable = new Table({
    width: { size: 46, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.RIGHT,
    borders: noBorders,
    rows: totalsRows,
  });
  body.push(new Paragraph({ text: '', spacing: { after: 100 } }));
  body.push(totalsTable);

  // Equivalencia en CLP (cuando la moneda es UF/USD y hay valor de conversión).
  if (quote.moneda !== 'CLP' && quote.valorMoneda > 0) {
    body.push(para([txt(`≈ ${formatCLP(totals.total * quote.valorMoneda)} CLP`, { color: GRAY, size: 8 })], AlignmentType.RIGHT, 0));
  }

  // Total en palabras.
  body.push(para([txt(montoEnPalabras(totals.total, quote.moneda), { color: GRAY, size: 8 })], AlignmentType.RIGHT, 0));

  // --- Datos de pago / transferencia ---
  const pago: Array<[string, string]> = [];
  if (company.pagoIncluir) {
    if (company.pagoBanco) pago.push(['Banco', company.pagoBanco]);
    if (company.pagoTipoCuenta) pago.push(['Tipo de cuenta', company.pagoTipoCuenta]);
    if (company.pagoNumero) pago.push(['N° de cuenta', company.pagoNumero]);
    if (company.pagoTitular) pago.push(['Titular', company.pagoTitular]);
    if (company.pagoRut) pago.push(['RUT', formatRut(company.pagoRut)]);
    if (company.pagoEmail) pago.push(['Email', company.pagoEmail]);
  }
  if (pago.length) {
    body.push(new Paragraph({ text: '', spacing: { after: 220 } }));
    body.push(para([txt('DATOS PARA TRANSFERENCIA', { bold: true, size: 7.5, color: BLUE })], AlignmentType.LEFT, 40));
    for (const [label, value] of pago) {
      body.push(para([txt(`${label}: `, { color: GRAY, size: 9 }), txt(value, { color: INK, size: 9 })]));
    }
  }

  // --- Notas y condiciones ---
  if (quote.notas) {
    body.push(new Paragraph({ text: '', spacing: { after: 220 } }));
    body.push(para([txt('NOTAS', { bold: true, size: 7.5, color: BLUE })], AlignmentType.LEFT, 40));
    body.push(para([txt(quote.notas, { color: INK, size: 9 })]));
  }
  if (quote.condiciones) {
    body.push(new Paragraph({ text: '', spacing: { after: 120 } }));
    body.push(para([txt('CONDICIONES', { bold: true, size: 7.5, color: BLUE })], AlignmentType.LEFT, 40));
    body.push(para([txt(quote.condiciones, { color: GRAY, size: 8 })]));
  }

  // --- Pie de página (en cada hoja, como el PDF): línea superior,
  //     nombre · fecha a la izquierda y marca a la derecha. ---
  const footer = new Footer({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { ...noBorders, top: { style: BorderStyle.SINGLE, size: 4, color: 'E3E0D8' } },
        rows: [
          new TableRow({
            children: [
              cell([para([txt(`${company.razonSocial || 'Cotización'} · ${formatFechaLarga(quote.fecha)}`, { color: GRAY, size: 7.5 })])], { width: 60 }),
              cell([para([
                txt('Generado con ', { color: GRAY, size: 7.5 }),
                txt('NexoCotiza', { bold: true, color: BLUE, size: 7.5 }),
              ], AlignmentType.RIGHT)], { width: 40 }),
            ],
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    creator: company.razonSocial || 'NexoCotiza',
    title: `Cotización ${quote.folio}`,
    styles: { default: { document: { run: { font: FONT } } } },
    sections: [{
      properties: { page: { margin: { top: 850, bottom: 1000, left: 850, right: 850 } } },
      footers: { default: footer },
      children: body,
    }],
  });

  return Packer.toBlob(doc);
}
