const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".md"];

export interface ExtractionResult {
  text: string;
  pageCount: number | null;
}

/**
 * Extract text content from a file buffer.
 * Supports PDF (via pdfjs-dist) and plain text (.txt, .md).
 */
export async function extractText(
  buffer: Buffer,
  filename: string
): Promise<ExtractionResult> {
  const ext = getExtension(filename);

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(
      `Unsupported file type: ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`
    );
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(
      `File too large: ${(buffer.length / 1024 / 1024).toFixed(1)}MB. Maximum: 10MB`
    );
  }

  if (ext === ".pdf") {
    return extractPdf(buffer);
  }

  // Plain text
  return {
    text: buffer.toString("utf-8"),
    pageCount: null,
  };
}

async function extractPdf(buffer: Buffer): Promise<ExtractionResult> {
  // Polyfill DOMMatrix for Node.js serverless (pdfjs-dist requires it)
  if (typeof globalThis.DOMMatrix === "undefined") {
    // Minimal stub — only basic properties are needed for text extraction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.DOMMatrix = class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      m11 = 1; m12 = 0; m13 = 0; m14 = 0;
      m21 = 0; m22 = 1; m23 = 0; m24 = 0;
      m31 = 0; m32 = 0; m33 = 1; m34 = 0;
      m41 = 0; m42 = 0; m43 = 0; m44 = 1;
      is2D = true; isIdentity = true;
      multiply() { return new DOMMatrix(); }
      translate() { return new DOMMatrix(); }
      scale() { return new DOMMatrix(); }
      inverse() { return new DOMMatrix(); }
      transformPoint(p: any) { return p || { x: 0, y: 0, z: 0, w: 1 }; }
    } as any;
  }

  // Dynamic import to avoid bundling issues in serverless
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Point worker to the actual file via require.resolve so Node.js can find it
  const { createRequire } = await import("module");
  const req = createRequire(import.meta.url);
  pdfjs.GlobalWorkerOptions.workerSrc = req.resolve(
    "pdfjs-dist/legacy/build/pdf.worker.mjs"
  );

  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: true,
  }).promise;

  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => item.str || "")
      .join(" ");
    text += pageText + "\n";
    page.cleanup();
  }

  const pageCount = doc.numPages;
  doc.destroy();

  return { text, pageCount };
}

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot).toLowerCase();
}
