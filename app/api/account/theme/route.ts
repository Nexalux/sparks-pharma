import { authorizeMember } from "../../../lib/member-auth";
import { getThemePreference, updateThemePreference } from "../../../lib/repository";

export async function GET() {
  const auth = await authorizeMember(); if (auth.response) return auth.response;
  return Response.json(await getThemePreference(auth.session!.member.id));
}

export async function PUT(request: Request) {
  const auth = await authorizeMember(); if (auth.response) return auth.response;
  const input = await request.json() as { palette?: string; mode?: string; reducedMotion?: boolean };
  if (!["sky", "galaxy"].includes(input.palette || "") || !["light", "dark", "system"].includes(input.mode || "")) return Response.json({ error: "Invalid appearance preference." }, { status: 400 });
  await updateThemePreference(auth.session!.member.id, { palette: input.palette as "sky" | "galaxy", mode: input.mode as "light" | "dark" | "system", reducedMotion: Boolean(input.reducedMotion) });
  return Response.json({ ok: true });
}
