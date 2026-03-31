const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".md"];

export interface ExtractionResult {
  text: string;
  pageCount: number | null;
}

/**
 * Extract text content from a file buffer.
 * Supports PDF (via pdf-parse) and plain text (.txt, .md).
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
  // Polyfill DOMMatrix — pdfjs-dist requires it but Node.js serverless doesn't have it
  if (typeof globalThis.DOMMatrix === "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).DOMMatrix = class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      m11 = 1; m12 = 0; m13 = 0; m14 = 0;
      m21 = 0; m22 = 1; m23 = 0; m24 = 0;
      m31 = 0; m32 = 0; m33 = 1; m34 = 0;
      m41 = 0; m42 = 0; m43 = 0; m44 = 1;
      is2D = true; isIdentity = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(_init?: any) {}
      multiply() { return new DOMMatrix(); }
      translate() { return new DOMMatrix(); }
      scale() { return new DOMMatrix(); }
      inverse() { return new DOMMatrix(); }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transformPoint(p: any) { return p || { x: 0, y: 0, z: 0, w: 1 }; }
    };
  }

  // Dynamic import — avoid loading pdfjs-dist at module level which crashes GET /api/documents
  const { PDFParse } = await import("pdf-parse");

  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  const pageCount = result.total;
  await parser.destroy();
  return {
    text: result.text,
    pageCount,
  };
}

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot).toLowerCase();
}
