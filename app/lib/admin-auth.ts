import { redirect } from "next/navigation";
import { getAuthPrincipal, requireAuthPrincipal } from "./auth";
import { adminRoleFor } from "./repository";
import type { AdminRole } from "./data";

export type AdminSession = { user: Awaited<ReturnType<typeof requireAuthPrincipal>>; role: AdminRole };

export async function getAdminSession(): Promise<AdminSession | null> {
  const user = await getAuthPrincipal();
  if (!user) return null;
  const role = await adminRoleFor(user.email);
  return role ? { user, role } : null;
}

export async function requireAdminPage(returnTo: string, ownerOnly = false): Promise<AdminSession> {
  const user = await requireAuthPrincipal(returnTo);
  const role = await adminRoleFor(user.email);
  if (!role || (ownerOnly && role !== "owner")) redirect("/admin-denied");
  return { user, role };
}

export async function authorizeAdmin(ownerOnly = false) {
  const session = await getAdminSession();
  if (!session) return { session: null, response: Response.json({ error: "Authentication and admin access are required." }, { status: 401 }) };
  if (ownerOnly && session.role !== "owner") return { session: null, response: Response.json({ error: "Owner access is required." }, { status: 403 }) };
  return { session, response: null };
}
