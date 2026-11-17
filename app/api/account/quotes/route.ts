import { authorizeMember } from "../../../lib/member-auth";
import { listQuoteDrafts, saveQuoteDraft } from "../../../lib/repository";
import { readQuoteItems } from "../../../lib/validation";

export async function GET() {
  const auth = await authorizeMember();
  if (auth.response) return auth.response;
  return Response.json({ drafts: await listQuoteDrafts(auth.session!.member.id) });
}

export async function POST(request: Request) {
  const auth = await authorizeMember();
  if (auth.response) return auth.response;
  const input = await request.json().catch(() => null) as { name?: unknown; items?: unknown } | null;
  const name = typeof input?.name === "string" ? input.name.trim().slice(0, 80) : "";
  const items = readQuoteItems(input?.items);
  if (!name || !items) return Response.json({ error: "Add a draft name and at least one valid item." }, { status: 400 });
  const id = await saveQuoteDraft(auth.session!.member.id, name, items);
  return Response.json({ id }, { status: 201 });
}
