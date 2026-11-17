import { authorizeMember } from "../../../../lib/member-auth";
import { deleteQuoteDraft, saveQuoteDraft } from "../../../../lib/repository";
import { readQuoteItems } from "../../../../lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorizeMember();
  if (auth.response) return auth.response;
  const { id } = await context.params;
  const input = await request.json().catch(() => null) as { name?: unknown; items?: unknown } | null;
  const name = typeof input?.name === "string" ? input.name.trim().slice(0, 80) : "";
  const items = readQuoteItems(input?.items);
  if (!name || !items) return Response.json({ error: "A name and valid items are required." }, { status: 400 });
  await saveQuoteDraft(auth.session!.member.id, name, items, id);
  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorizeMember();
  if (auth.response) return auth.response;
  const { id } = await context.params;
  await deleteQuoteDraft(auth.session!.member.id, id);
  return Response.json({ ok: true });
}
