import { authorizeAdmin } from "../../../lib/admin-auth";
import { listAdmins, removeEditor, upsertEditor } from "../../../lib/repository";

export async function GET() {
  const auth = await authorizeAdmin(true);
  if (auth.response) return auth.response;
  return Response.json({ admins: await listAdmins() });
}

export async function POST(request: Request) {
  const auth = await authorizeAdmin(true);
  if (auth.response) return auth.response;
  const { email, displayName } = (await request.json()) as { email?: string; displayName?: string };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Enter a valid editor email." }, { status: 400 });
  await upsertEditor(email, displayName || "Editor");
  return Response.json({ admins: await listAdmins() }, { status: 201 });
}

export async function DELETE(request: Request) {
  const auth = await authorizeAdmin(true);
  if (auth.response) return auth.response;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Editor id is required." }, { status: 400 });
  await removeEditor(id);
  return Response.json({ admins: await listAdmins() });
}
