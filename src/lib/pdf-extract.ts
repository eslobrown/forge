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
  // Dynamic import to avoid bundling issues in serverless
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Configure worker for serverless — point to the actual worker file
  // Using new URL() with import.meta.url lets Next.js webpack resolve the path
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

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
