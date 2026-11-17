import { getAuthPrincipal, requireAuthPrincipal } from "./auth";
import { adminRoleFor, ensureMemberAccount } from "./repository";

export async function getMemberSession() {
  const principal = await getAuthPrincipal();
  if (!principal) return null;
  const [member, adminRole] = await Promise.all([
    ensureMemberAccount(principal),
    adminRoleFor(principal.email),
  ]);
  return { principal, member, adminRole };
}

export async function requireMemberPage(returnTo: string) {
  const principal = await requireAuthPrincipal(returnTo);
  const [member, adminRole] = await Promise.all([
    ensureMemberAccount(principal),
    adminRoleFor(principal.email),
  ]);
  return { principal, member, adminRole };
}

export async function authorizeMember() {
  const session = await getMemberSession();
  if (!session) {
    return {
      session: null,
      response: Response.json({ code: "AUTH_REQUIRED", error: "Sign in is required to submit or save this enquiry.", signInUrl: "/sign-in?returnTo=%2Fquote" }, { status: 401 }),
    };
  }
  return { session, response: null };
}
