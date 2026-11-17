import { authorizeAdmin } from "../../../lib/admin-auth";
import { listAdminProducts, saveProduct, type ProductInput } from "../../../lib/repository";
import { validateProduct } from "../../../lib/validation";

export async function GET() {
  const auth = await authorizeAdmin();
  if (auth.response) return auth.response;
  return Response.json({ products: await listAdminProducts() });
}

export async function POST(request: Request) {
  const auth = await authorizeAdmin();
  if (auth.response) return auth.response;
  const input = (await request.json()) as ProductInput;
  const validation = validateProduct(input);
  if (!validation.valid) return Response.json({ errors: validation.errors }, { status: 400 });
  try {
    const id = await saveProduct({ ...input, slug: validation.slug });
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save product." }, { status: 400 });
  }
}
