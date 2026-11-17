import type { Metadata } from "next";
import { AccountWorkspace } from "./AccountWorkspace";
import { signOutPath } from "../lib/auth";
import { requireMemberPage } from "../lib/member-auth";
import { listMemberEnquiries, listQuoteDrafts, memberDashboardSummary } from "../lib/repository";

export const metadata: Metadata = { title: "Member workspace", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await requireMemberPage("/account");
  const [drafts, enquiries, counts] = await Promise.all([
    listQuoteDrafts(session.member.id),
    listMemberEnquiries(session.member.id),
    memberDashboardSummary(session.member.id),
  ]);
  const completed = [session.member.displayName, session.member.businessName, session.member.phone, session.member.buyerType, session.member.state, session.member.city, session.member.pincode].filter(Boolean).length;
  return <main><AccountWorkspace member={session.member} drafts={drafts} enquiries={enquiries as never} summary={{ ...counts, profileCompletion: Math.round(completed / 7 * 100) }} signOutHref={signOutPath("/")} adminRole={session.adminRole} /></main>;
}
