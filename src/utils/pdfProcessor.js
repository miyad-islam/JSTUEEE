import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker source
try {
  // Use Vite modern worker import
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('PDF worker setup fallback:', e);
}

/**
 * Loads a PDF file and converts all its pages into high-resolution canvas Data URLs
 * @param {File|ArrayBuffer} fileOrBuffer The PDF File object or buffer
 * @param {number} scale Rendering scale (2.0 for crisp OCR resolution)
 * @returns {Promise<Array<{ pageNumber: number, dataUrl: string, width: number, height: number }>>}
 */
export async function convertPdfToImages(fileOrBuffer, scale = 2.0) {
  let arrayBuffer;
  if (fileOrBuffer instanceof ArrayBuffer) {
    arrayBuffer = fileOrBuffer;
  } else if (fileOrBuffer instanceof Blob || fileOrBuffer instanceof File) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else {
    throw new Error('Invalid PDF input type');
  }

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const pages = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const context = canvas.getContext('2d');
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    await page.render(renderContext).promise;
    
    // High quality JPEG for vision API
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    pages.push({
      pageNumber: i,
      dataUrl,
      width: viewport.width,
      height: viewport.height
    });
  }

  return pages;
}
