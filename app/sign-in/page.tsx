import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthExperience } from "./AuthExperience";
import { authCapabilities } from "../lib/better-auth";
import { safeReturnTo } from "../lib/auth";
import { getMemberSession } from "../lib/member-auth";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; signedOut?: string; mode?: string }> }) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.returnTo);
  const session = await getMemberSession();
  if (session) redirect(session.adminRole ? "/admin" : returnTo);
  const capabilities = authCapabilities();
  return <main className="sign-in-page"><AuthExperience returnTo={returnTo} emailEnabled={capabilities.email} googleEnabled={capabilities.google} localMode={capabilities.local} signedOut={params.signedOut === "1"} initialMode={params.mode === "create" ? "create" : "sign-in"} /></main>;
}
