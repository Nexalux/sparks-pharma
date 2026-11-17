import { authorizeMember } from "../../lib/member-auth";
import { deleteMemberAccount, getThemePreference, updateMemberProfile } from "../../lib/repository";

export async function GET() {
  const auth = await authorizeMember();
  if (auth.response) return auth.response;
  return Response.json({
    member: auth.session!.member,
    adminRole: auth.session!.adminRole,
    provider: auth.session!.principal.provider,
    themePreference: await getThemePreference(auth.session!.member.id),
  });
}

export async function PATCH(request: Request) {
  const auth = await authorizeMember();
  if (auth.response) return auth.response;
  const input = await request.json() as Record<string, unknown>;
  const displayName = String(input.displayName || "").trim();
  const phone = String(input.phone || "").replace(/\D/g, "");
  const pincode = String(input.pincode || "").replace(/\D/g, "");
  if (!displayName) return Response.json({ error: "Name is required." }, { status: 400 });
  if (phone && !/^[6-9]\d{9}$/.test(phone)) return Response.json({ error: "Enter a valid Indian mobile number." }, { status: 400 });
  if (pincode && !/^\d{6}$/.test(pincode)) return Response.json({ error: "Enter a valid PIN code." }, { status: 400 });
  await updateMemberProfile(auth.session!.member.id, {
    displayName,
    email: auth.session!.principal.email,
    businessName: String(input.businessName || "").trim(),
    phone,
    preferredContact: input.preferredContact === "phone" ? "phone" : "email",
    buyerType: String(input.buyerType || "").trim(),
    state: String(input.state || "Gujarat").trim(),
    city: String(input.city || "").trim(),
    pincode,
  });
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await authorizeMember();
  if (auth.response) return auth.response;
  const input = await request.json().catch(() => ({})) as { confirmation?: string };
  if (input.confirmation !== "DELETE") return Response.json({ error: "Type DELETE to confirm account deletion." }, { status: 400 });
  await deleteMemberAccount(auth.session!.member.id, auth.session!.principal.providerSubject);
  return Response.json({ ok: true });
}
