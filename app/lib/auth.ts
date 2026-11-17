import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthPrincipal } from "./data";
import { createAuth, hasAuthDatabase, isLocalAuth } from "./better-auth";

function fromSession(user: { id: string; email: string; emailVerified: boolean; name: string }): AuthPrincipal {
  return {
    provider: "credential",
    providerSubject: user.id,
    email: user.email.trim().toLowerCase(),
    emailVerified: user.emailVerified,
    displayName: user.name || user.email,
  };
}

export async function getAuthPrincipal(): Promise<AuthPrincipal | null> {
  if (hasAuthDatabase()) {
    const session = await createAuth().api.getSession({ headers: await headers() });
    if (session?.user && (session.user.emailVerified || isLocalAuth())) return fromSession(session.user);
  }
  return null;
}

export async function requireAuthPrincipal(returnTo: string): Promise<AuthPrincipal> {
  const principal = await getAuthPrincipal();
  if (!principal) redirect(`/sign-in?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`);
  return principal;
}

export function safeReturnTo(value: string | null | undefined, fallback = "/account") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const url = new URL(value, "https://sparks.local");
    if (url.origin !== "https://sparks.local") return fallback;
    if (url.pathname.startsWith("/api/auth") || ["/sign-in", "/reset-password"].includes(url.pathname)) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function signInPath(returnTo = "/account") {
  return `/sign-in?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`;
}

export function signOutPath(returnTo = "/") {
  return `/sign-in?signedOut=1&returnTo=${encodeURIComponent(safeReturnTo(returnTo, "/"))}`;
}
