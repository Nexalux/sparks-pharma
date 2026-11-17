import { authorizeAdmin } from "../../../../../lib/admin-auth";
import { getProductImageObjectKey, listProductImages, mediaBucket, readProductMedia, removeDatabaseMedia, removeProductImage, saveDatabaseMedia, saveImageMetadata, updateProductImage } from "../../../../../lib/repository";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maximumStoredBytes = 768 * 1024;

function hasExpectedSignature(type: string, bytes: Uint8Array) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;
  const preview = new URL(request.url).searchParams.get("preview");
  if (preview) {
    const objectKey = await getProductImageObjectKey(id, preview);
    return objectKey ? readProductMedia(request, objectKey, true) : new Response("Not found", { status: 404 });
  }
  return Response.json({ images: await listProductImages(id) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size > maximumStoredBytes) return Response.json({ error: "Upload an optimized JPEG, PNG, or WebP image up to 768 KB." }, { status: 400 });
  const data = await file.arrayBuffer();
  if (!hasExpectedSignature(file.type, new Uint8Array(data))) return Response.json({ error: "The uploaded file does not match its image format." }, { status: 400 });
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const key = crypto.randomUUID() + "." + extension;
  const bucket = mediaBucket();
  try {
    if (bucket) await bucket.put(key, data, { httpMetadata: { contentType: file.type }, customMetadata: { productId: id } });
    else await saveDatabaseMedia(key, id, file.type, data);
    await saveImageMetadata(id, { src: "/api/media/" + key, alt: String(form.get("alt") || "Product image"), referenceNote: String(form.get("referenceNote") || "Business-supplied product image."), sourceLabel: "Business-supplied image", sourceUrl: "", credit: "", licenseLabel: "Business supplied", licenseUrl: "" }, key);
  } catch (error) {
    if (bucket) await bucket.delete(key);
    else await removeDatabaseMedia(key);
    throw error;
  }
  return Response.json({ key, src: "/api/media/" + key }, { status: 201 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;
  const input = (await request.json()) as { imageId?: string; alt?: string; referenceNote?: string; sortOrder?: number };
  if (!input.imageId || !input.alt?.trim()) return Response.json({ error: "Image id and alt text are required." }, { status: 400 });
  await updateProductImage(id, input.imageId, input.alt.trim(), input.referenceNote?.trim() || "", Number(input.sortOrder || 0));
  return Response.json({ images: await listProductImages(id) });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;
  const imageId = new URL(request.url).searchParams.get("imageId");
  if (!imageId) return Response.json({ error: "Image id is required." }, { status: 400 });
  const objectKey = await removeProductImage(id, imageId);
  if (objectKey) {
    await mediaBucket()?.delete(objectKey);
    await removeDatabaseMedia(objectKey);
  }
  return Response.json({ images: await listProductImages(id) });
}
