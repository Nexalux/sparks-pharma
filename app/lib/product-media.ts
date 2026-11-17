import { Buffer } from "node:buffer";

type StoredMedia = { content_type: string; byte_size: number; encoded: string | null };

export async function productMediaResponse(request: Request, key: string, db?: D1Database, bucket?: R2Bucket, adminPreview = false) {
  if (!key || key.includes("..") || key.includes("/") || key.includes("\\") || key.includes("\0")) {
    return new Response("Not found", { status: 404 });
  }

  const head = request.method === "HEAD";
  const cacheControl = adminPreview ? "no-store" : "public, max-age=300";
  const visibleImage = `
    SELECT 1 FROM product_images i JOIN products p ON p.id = i.product_id
    WHERE i.object_key = ? AND (? OR p.status = 'published') LIMIT 1
  `;
  const preview = adminPreview ? 1 : 0;
  if (bucket && !await db?.prepare(visibleImage).bind(key, preview).first()) {
    return new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });
  }

  const object = await bucket?.get(key);
  if (object) {
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", cacheControl);
    return new Response(head ? null : object.body, { headers });
  }

  // D1 serializes BLOB values as arrays. A string decodes natively without
  // parsing and allocating one JavaScript number for each image byte.
  const stored = await db?.prepare(`
    SELECT content_type, byte_size, CASE WHEN ? THEN NULL ELSE hex(data) END AS encoded
    FROM media_objects WHERE object_key = ? AND EXISTS (${visibleImage})
  `).bind(head ? 1 : 0, key, key, preview).first<StoredMedia>();
  if (!stored) return new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });

  const body = stored.encoded === null ? null : Buffer.from(stored.encoded, "hex");
  return new Response(body, {
    headers: {
      "content-type": stored.content_type,
      "content-length": String(stored.byte_size),
      "cache-control": cacheControl,
      "x-content-type-options": "nosniff",
    },
  });
}

