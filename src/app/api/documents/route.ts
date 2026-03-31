import { NextRequest, NextResponse } from "next/server";
import { put, list } from "@vercel/blob";
import { extractText } from "@/lib/pdf-extract";
import { chunkText } from "@/lib/chunker";
import { embedBatch } from "@/lib/embeddings";
import { upsertChunks } from "@/lib/vector-store";
import { randomBytes } from "crypto";

/**
 * POST /api/documents — Upload a document, extract text, chunk, embed, store.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Generate document ID
    const documentId = `doc_${randomBytes(8).toString("hex")}`;
    const documentName = file.name;

    // Extract text from file
    const buffer = Buffer.from(await file.arrayBuffer());
    const { text, pageCount } = await extractText(buffer, file.name);

    if (!text.trim()) {
      return NextResponse.json(
        { error: "No text content could be extracted from the file" },
        { status: 400 }
      );
    }

    // Chunk the text
    const chunks = chunkText(text);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "File produced no usable text chunks" },
        { status: 400 }
      );
    }

    // Embed all chunks
    const embeddings = await embedBatch(chunks.map((c) => c.text));

    // Store in Upstash Vector
    await upsertChunks(documentId, documentName, chunks, embeddings);

    // Store document manifest in Vercel Blob
    const manifest = {
      id: documentId,
      name: documentName,
      size: file.size,
      chunkCount: chunks.length,
      pageCount,
      uploadedAt: new Date().toISOString(),
    };

    await put(`documents/${documentId}.json`, JSON.stringify(manifest), {
      access: "public",
      contentType: "application/json",
    });

    return NextResponse.json(manifest);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Upload failed";
    console.error("Document upload error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * GET /api/documents — List all uploaded documents.
 */
export async function GET() {
  try {
    const { blobs } = await list({ prefix: "documents/" });

    const documents = await Promise.all(
      blobs.map(async (blob) => {
        try {
          const res = await fetch(blob.url);
          const manifest = await res.json();
          return manifest;
        } catch {
          return null;
        }
      })
    );

    return NextResponse.json({
      documents: documents.filter(Boolean),
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to list documents";
    console.error("Document list error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
