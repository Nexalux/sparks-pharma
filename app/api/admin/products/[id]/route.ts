import { authorizeAdmin } from "../../../../lib/admin-auth";
import { deleteProduct, duplicateProduct, saveProduct, type ProductInput } from "../../../../lib/repository";
import { validateProduct } from "../../../../lib/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;
  const input = (await request.json()) as ProductInput;
  const validation = validateProduct(input);
  if (!validation.valid) return Response.json({ errors: validation.errors }, { status: 400 });
  try {
    await saveProduct({ ...input, slug: validation.slug }, id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update product." }, { status: 400 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;
  const url = new URL(request.url);
  if (url.searchParams.get("action") !== "duplicate") return Response.json({ error: "Unsupported action." }, { status: 400 });
  try {
    return Response.json({ id: await duplicateProduct(id) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to duplicate product." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;
  await deleteProduct(id);
  return Response.json({ ok: true });
}
