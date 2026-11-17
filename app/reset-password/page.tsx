import type { Metadata } from "next";
import { ResetPassword } from "./ResetPassword";

export const metadata: Metadata = { title: "Reset password", robots: { index: false, follow: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <main className="sign-in-page"><ResetPassword token={token} /></main>;
}
