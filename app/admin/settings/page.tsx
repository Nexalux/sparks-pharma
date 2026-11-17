import { requireAdminPage } from "../../lib/admin-auth";
import { getSettings, listAdmins } from "../../lib/repository";
import { AdminSettings } from "./AdminSettings";

export const dynamic = "force-dynamic";
export default async function AdminSettingsPage() {
  await requireAdminPage("/admin/settings", true);
  const settings = await getSettings();
  return <AdminSettings initialSettings={settings} initialAdmins={await listAdmins()} />;
}
