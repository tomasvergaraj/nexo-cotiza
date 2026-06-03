// Compartir por link, sin backend: el estado se serializa, comprime (gzip nativo
// cuando está disponible) y se codifica en base64url dentro del hash de la URL.
// Quien abre el link reconstruye la cotización en su navegador.
import type { Company, Quote } from './types';

export interface SharePayload {
  /** company */
  c: Company;
  /** quote */
  q: Quote;
}

// Longitud máxima de URL. El hash no lo procesa ningún servidor, pero una URL
// gigante es poco usable (WhatsApp, portapapeles). Para el enlace, el logo se
// reduce; este límite solo descarta el logo en casos extremos.
const MAX_URL = 120000;

/** Reduce una imagen (dataURL) a `maxDim` px, conservando transparencia (PNG). */
function shrinkDataUrl(dataUrl: string, maxDim: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(maxDim / img.width, maxDim / img.height, 1);
      if (ratio >= 1) { resolve(dataUrl); return; }
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlToBytes(s: string): Uint8Array {
  const norm = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(norm);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function gzip(text: string): Promise<Uint8Array> {
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(new TextEncoder().encode(text) as BufferSource);
  writer.close();
  const buf = await new Response(cs.readable).arrayBuffer();
  return new Uint8Array(buf);
}
async function gunzip(bytes: Uint8Array): Promise<string> {
  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  writer.write(bytes as BufferSource);
  writer.close();
  const buf = await new Response(ds.readable).arrayBuffer();
  return new TextDecoder().decode(buf);
}

const hasCompression = () => typeof CompressionStream !== 'undefined';

/** Serializa el payload. Prefijo 'z' = gzip, 'r' = crudo (utf8 base64url). */
async function encode(payload: SharePayload): Promise<string> {
  const json = JSON.stringify(payload);
  if (hasCompression()) return 'z' + bytesToB64url(await gzip(json));
  return 'r' + bytesToB64url(new TextEncoder().encode(json));
}

async function decode(token: string): Promise<SharePayload> {
  const scheme = token[0];
  const bytes = b64urlToBytes(token.slice(1));
  const json = scheme === 'z' ? await gunzip(bytes) : new TextDecoder().decode(bytes);
  return JSON.parse(json) as SharePayload;
}

/**
 * Construye el link para compartir. Si la URL resulta muy larga (por el logo),
 * lo omite y avisa con `logoOmitido`.
 */
export async function buildShareLink(company: Company, quote: Quote): Promise<{ url: string; logoOmitido: boolean }> {
  const base = location.origin + location.pathname;
  // Para el enlace usamos una versión reducida del logo (no afecta el logo real).
  const companyLink = company.logoDataUrl
    ? { ...company, logoDataUrl: await shrinkDataUrl(company.logoDataUrl, 220) }
    : company;
  let token = await encode({ c: companyLink, q: quote });
  let logoOmitido = false;
  if (base.length + 3 + token.length > MAX_URL && company.logoDataUrl) {
    token = await encode({ c: { ...company, logoDataUrl: '' }, q: quote });
    logoOmitido = true;
  }
  return { url: `${base}#q=${token}`, logoOmitido };
}

/** Si el hash actual contiene una cotización compartida, la decodifica. */
export async function readShareFromHash(): Promise<SharePayload | null> {
  const hash = location.hash || '';
  const m = /^#q=(.+)$/.exec(hash);
  if (!m) return null;
  try {
    return await decode(m[1]);
  } catch {
    return null;
  }
}

/** Limpia el hash de la URL sin recargar ni dejar entrada en el historial. */
export function clearShareHash(): void {
  history.replaceState(null, '', location.pathname + location.search);
}
