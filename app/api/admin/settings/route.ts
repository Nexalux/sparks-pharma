import { authorizeAdmin } from "../../../lib/admin-auth";
import { getSettings, updateSettings } from "../../../lib/repository";
import type { SiteSettings } from "../../../lib/data";

export async function GET() {
  const auth = await authorizeAdmin(true);
  if (auth.response) return auth.response;
  const settings = await getSettings();
  return Response.json({ settings });
}

export async function PATCH(request: Request) {
  const auth = await authorizeAdmin(true);
  if (auth.response) return auth.response;
  const settings = (await request.json()) as SiteSettings;
  try {
    await updateSettings(settings);
    return Response.json({ settings: await getSettings() });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update settings." }, { status: 409 });
  }
}
