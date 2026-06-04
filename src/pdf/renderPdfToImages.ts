import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// El worker se sirve como asset; Vite emite la URL en build.
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

/**
 * Renderiza cada página de un PDF (Blob) a un data-URL PNG.
 * Se usa para la vista previa en móvil, donde el visor del `<iframe>` no funciona.
 */
export async function renderPdfToImages(blob: Blob, scale = 1.6): Promise<string[]> {
  const data = await blob.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data });
  const doc = await loadingTask.promise;
  const out: string[] = [];
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      out.push(canvas.toDataURL('image/png'));
      page.cleanup();
    }
  } finally {
    await loadingTask.destroy();
  }
  return out;
}
