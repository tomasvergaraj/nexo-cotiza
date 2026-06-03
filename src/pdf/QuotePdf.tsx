import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';
import type { Company, Quote, Totals } from '../lib/types';
import { formatCLP, formatMoneda, formatRut, formatFechaLarga, montoEnPalabras } from '../lib/format';
import { lineSubtotal, computeTotals } from '../lib/calc';

// Fuentes de marca (estáticas en /public/fonts) — se cargan en el navegador.
Font.register({
  family: 'Sora',
  fonts: [
    { src: '/fonts/Sora-600.ttf', fontWeight: 600 },
    { src: '/fonts/Sora-700.ttf', fontWeight: 700 },
  ],
});
Font.register({
  family: 'Manrope',
  fonts: [
    { src: '/fonts/Manrope-400.ttf', fontWeight: 400 },
    { src: '/fonts/Manrope-600.ttf', fontWeight: 600 },
    { src: '/fonts/Manrope-700.ttf', fontWeight: 700 },
  ],
});

// Paleta Nexo
const INK = '#171A1F';
const BLUE = '#0E7BD6';
const GRAY = '#6A7078';
const LINE = '#E3E0D8';
const PAPER = '#FFFFFF';
const SOFT = '#F7F5EF';

const s = StyleSheet.create({
  page: { backgroundColor: PAPER, paddingTop: 42, paddingHorizontal: 42, paddingBottom: 64, fontFamily: 'Manrope', fontSize: 9.5, color: INK },
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  logo: { maxWidth: 150, maxHeight: 64, objectFit: 'contain' },
  emisorName: { fontFamily: 'Sora', fontWeight: 700, fontSize: 15, color: INK, maxWidth: 150 },
  emisorLine: { color: GRAY, fontSize: 8.5, marginTop: 2 },
  docBox: { alignItems: 'flex-end' },
  docTitle: { fontFamily: 'Sora', fontWeight: 700, fontSize: 16, color: BLUE, letterSpacing: 0.5 },
  docMeta: { color: GRAY, fontSize: 8.5, marginTop: 4, textAlign: 'right' },
  docMetaStrong: { color: INK, fontWeight: 700 },
  rule: { borderBottomWidth: 1.5, borderBottomColor: INK, marginTop: 14, marginBottom: 16 },
  // Cliente
  twoCol: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  block: { width: '48%' },
  eyebrow: { fontFamily: 'Sora', fontWeight: 600, fontSize: 7.5, letterSpacing: 1.2, color: BLUE, textTransform: 'uppercase', marginBottom: 4 },
  clientName: { fontWeight: 700, fontSize: 10.5 },
  clientLine: { color: GRAY, marginTop: 1.5 },
  // Tabla
  thead: { flexDirection: 'row', backgroundColor: INK, color: '#FFFFFF', paddingVertical: 6, paddingHorizontal: 8, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  th: { fontFamily: 'Sora', fontWeight: 600, fontSize: 7.5, letterSpacing: 0.6, textTransform: 'uppercase' },
  row: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: LINE },
  rowAlt: { backgroundColor: SOFT },
  cDesc: { width: '50%', paddingRight: 8 },
  cQty: { width: '11%', textAlign: 'right' },
  cPrice: { width: '17%', textAlign: 'right' },
  cDisc: { width: '9%', textAlign: 'right' },
  cSub: { width: '13%', textAlign: 'right' },
  num: { fontVariant: ['tabular-nums'] },
  // Totales
  totalsWrap: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 },
  totals: { width: '46%' },
  tRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  tLabel: { color: GRAY },
  tValue: { fontWeight: 600 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 8, paddingHorizontal: 10, paddingBottom: 8, backgroundColor: BLUE, borderRadius: 4 },
  totalLabel: { fontFamily: 'Sora', fontWeight: 700, fontSize: 11, color: '#FFFFFF' },
  totalValue: { fontFamily: 'Sora', fontWeight: 700, fontSize: 13, color: '#FFFFFF' },
  equiv: { color: GRAY, fontSize: 8, marginTop: 4, textAlign: 'right' },
  palabras: { color: GRAY, fontSize: 8, marginTop: 6, textAlign: 'right' },
  // Datos de pago
  pay: { marginTop: 22, borderWidth: 1, borderColor: LINE, borderRadius: 4, backgroundColor: SOFT, padding: 10 },
  payLine: { color: INK, marginTop: 2 },
  payLabel: { color: GRAY },
  // Notas
  notes: { marginTop: 22 },
  notesText: { color: INK, marginTop: 3, lineHeight: 1.4 },
  condText: { color: GRAY, fontSize: 8, marginTop: 3, lineHeight: 1.4 },
  // Footer
  footer: { position: 'absolute', bottom: 26, left: 42, right: 42, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: LINE, paddingTop: 8 },
  footerText: { color: GRAY, fontSize: 7.5 },
  footerBrand: { color: GRAY, fontSize: 7.5 },
  footerBrandStrong: { color: BLUE, fontWeight: 700 },
});

function emisorLines(c: Company): string[] {
  const out: string[] = [];
  if (c.rut) out.push(`RUT ${formatRut(c.rut)}`);
  if (c.giro) out.push(c.giro);
  const dir = [c.direccion, c.comuna].filter(Boolean).join(', ');
  if (dir) out.push(dir);
  const con = [c.telefono, c.email].filter(Boolean).join(' · ');
  if (con) out.push(con);
  if (c.web) out.push(c.web);
  return out;
}

export interface QuotePdfProps {
  company: Company;
  quote: Quote;
}

/** Líneas del bloque de datos de pago (solo las que tengan valor). */
function pagoLines(c: Company): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  if (c.pagoBanco) out.push(['Banco', c.pagoBanco]);
  if (c.pagoTipoCuenta) out.push(['Tipo de cuenta', c.pagoTipoCuenta]);
  if (c.pagoNumero) out.push(['N° de cuenta', c.pagoNumero]);
  if (c.pagoTitular) out.push(['Titular', c.pagoTitular]);
  if (c.pagoRut) out.push(['RUT', formatRut(c.pagoRut)]);
  if (c.pagoEmail) out.push(['Email', c.pagoEmail]);
  return out;
}

export function QuotePdf({ company, quote }: QuotePdfProps) {
  const totals: Totals = computeTotals(quote);
  const equivCLP = quote.moneda !== 'CLP' && quote.valorMoneda > 0 ? totals.total * quote.valorMoneda : 0;
  const pago = company.pagoIncluir ? pagoLines(company) : [];
  return (
    <Document title={`Cotización ${quote.folio}`} author={company.razonSocial || 'NexoCotiza'}>
      <Page size="A4" style={s.page} wrap>
        {/* Header */}
        <View style={s.header}>
          <View>
            {company.logoDataUrl ? (
              <Image style={s.logo} src={company.logoDataUrl} />
            ) : (
              <Text style={s.emisorName}>{company.razonSocial || 'Tu empresa'}</Text>
            )}
            {company.logoDataUrl && company.razonSocial ? (
              <Text style={[s.emisorName, { fontSize: 11, marginTop: 6 }]}>{company.razonSocial}</Text>
            ) : null}
            {emisorLines(company).map((l, i) => (
              <Text key={i} style={s.emisorLine}>{l}</Text>
            ))}
          </View>
          <View style={s.docBox}>
            <Text style={s.docTitle}>COTIZACIÓN</Text>
            <Text style={s.docMeta}>
              N° <Text style={s.docMetaStrong}>{quote.folio}</Text>
            </Text>
            <Text style={s.docMeta}>Fecha: {formatFechaLarga(quote.fecha)}</Text>
            <Text style={s.docMeta}>Válida hasta: {formatFechaLarga(quote.validaHasta)}</Text>
          </View>
        </View>

        <View style={s.rule} />

        {/* Cliente */}
        <View style={s.twoCol}>
          <View style={s.block}>
            <Text style={s.eyebrow}>Cotización para</Text>
            <Text style={s.clientName}>{quote.cliente.nombre || '—'}</Text>
            {quote.cliente.rut ? <Text style={s.clientLine}>RUT {formatRut(quote.cliente.rut)}</Text> : null}
            {quote.cliente.contacto ? <Text style={s.clientLine}>{quote.cliente.contacto}</Text> : null}
            {quote.cliente.direccion ? <Text style={s.clientLine}>{quote.cliente.direccion}</Text> : null}
            {[quote.cliente.telefono, quote.cliente.email].filter(Boolean).length ? (
              <Text style={s.clientLine}>{[quote.cliente.telefono, quote.cliente.email].filter(Boolean).join(' · ')}</Text>
            ) : null}
          </View>
        </View>

        {/* Tabla de ítems */}
        <View style={s.thead}>
          <Text style={[s.th, s.cDesc]}>Detalle</Text>
          <Text style={[s.th, s.cQty]}>Cant.</Text>
          <Text style={[s.th, s.cPrice]}>P. unitario</Text>
          <Text style={[s.th, s.cDisc]}>Desc.</Text>
          <Text style={[s.th, s.cSub]}>Subtotal</Text>
        </View>
        {quote.items.map((it, i) => (
          <View key={it.id} style={i % 2 === 1 ? [s.row, s.rowAlt] : s.row} wrap={false}>
            <Text style={s.cDesc}>{it.descripcion || '—'}</Text>
            <Text style={[s.cQty, s.num]}>{it.cantidad}{it.unidad ? ` ${it.unidad}` : ''}</Text>
            <Text style={[s.cPrice, s.num]}>{formatMoneda(it.precioUnitario, quote.moneda)}</Text>
            <Text style={[s.cDisc, s.num]}>{it.descuentoPct ? `${it.descuentoPct}%` : '—'}</Text>
            <Text style={[s.cSub, s.num]}>{formatMoneda(lineSubtotal(it, quote.moneda), quote.moneda)}</Text>
          </View>
        ))}

        {/* Totales: bloque indivisible (no se parte entre páginas), de modo que
            el salto, si lo hay, caiga después del monto en palabras. */}
        <View style={s.totalsWrap} wrap={false}>
          <View style={s.totals}>
            {totals.descuentoGlobal > 0 ? (
              <View>
                <View style={s.tRow}>
                  <Text style={s.tLabel}>Subtotal</Text>
                  <Text style={[s.tValue, s.num]}>{formatMoneda(totals.subtotal, quote.moneda)}</Text>
                </View>
                <View style={s.tRow}>
                  <Text style={s.tLabel}>Descuento ({quote.descuentoGlobalPct}%)</Text>
                  <Text style={[s.tValue, s.num]}>−{formatMoneda(totals.descuentoGlobal, quote.moneda)}</Text>
                </View>
              </View>
            ) : null}
            <View style={s.tRow}>
              <Text style={s.tLabel}>Neto</Text>
              <Text style={[s.tValue, s.num]}>{formatMoneda(totals.neto, quote.moneda)}</Text>
            </View>
            <View style={s.tRow}>
              <Text style={s.tLabel}>{quote.ivaExento ? 'IVA (exento)' : `IVA (${quote.ivaPct}%)`}</Text>
              <Text style={[s.tValue, s.num]}>{formatMoneda(totals.iva, quote.moneda)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>TOTAL</Text>
              <Text style={[s.totalValue, s.num]}>{formatMoneda(totals.total, quote.moneda)}</Text>
            </View>
            {equivCLP > 0 ? <Text style={s.equiv}>≈ {formatCLP(equivCLP)} CLP</Text> : null}
            {totals.abono > 0 ? (
              <View style={{ marginTop: 6 }}>
                <View style={s.tRow}>
                  <Text style={s.tLabel}>Abono</Text>
                  <Text style={[s.tValue, s.num]}>−{formatMoneda(totals.abono, quote.moneda)}</Text>
                </View>
                <View style={s.tRow}>
                  <Text style={[s.tLabel, { color: INK, fontWeight: 700 }]}>Saldo</Text>
                  <Text style={[s.tValue, s.num]}>{formatMoneda(totals.saldo, quote.moneda)}</Text>
                </View>
              </View>
            ) : null}
            <Text style={s.palabras}>{montoEnPalabras(totals.total, quote.moneda)}</Text>
          </View>
        </View>

        {/* Datos de pago / transferencia */}
        {pago.length ? (
          <View style={s.pay} wrap={false}>
            <Text style={s.eyebrow}>Datos para transferencia</Text>
            {pago.map(([label, value], i) => (
              <Text key={i} style={s.payLine}>
                <Text style={s.payLabel}>{label}: </Text>{value}
              </Text>
            ))}
          </View>
        ) : null}

        {/* Notas y condiciones */}
        {(quote.notas || quote.condiciones) ? (
          <View style={s.notes}>
            {quote.notas ? (
              <View style={{ marginBottom: 10 }}>
                <Text style={s.eyebrow}>Notas</Text>
                <Text style={s.notesText}>{quote.notas}</Text>
              </View>
            ) : null}
            {quote.condiciones ? (
              <View>
                <Text style={s.eyebrow}>Condiciones</Text>
                <Text style={s.condText}>{quote.condiciones}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{company.razonSocial || 'Cotización'} · {formatFechaLarga(quote.fecha)}</Text>
          <Text style={s.footerBrand}>
            Generado con <Text style={s.footerBrandStrong}>NexoCotiza</Text>
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default QuotePdf;
