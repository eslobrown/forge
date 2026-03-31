import { NextRequest, NextResponse } from "next/server";
import { del, list } from "@vercel/blob";
import { deleteDocumentChunks } from "@/lib/vector-store";

/**
 * DELETE /api/documents/[id] — Remove document manifest and all vector chunks.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find the document manifest in Vercel Blob
    const { blobs } = await list({ prefix: `documents/${id}.json` });
    const blob = blobs[0];

    if (!blob) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Read manifest to get chunk count
    const res = await fetch(blob.url);
    const manifest = await res.json();

    // Delete vectors from Upstash
    await deleteDocumentChunks(id, manifest.chunkCount);

    // Delete manifest from Vercel Blob
    await del(blob.url);

    return NextResponse.json({ deleted: true });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Delete failed";
    console.error("Document delete error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
