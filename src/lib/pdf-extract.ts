import { PDFParse } from "pdf-parse";

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
