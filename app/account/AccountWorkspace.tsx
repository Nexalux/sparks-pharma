"use client";

import { useState, type FormEvent } from "react";
import Link from "../components/SafeLink";
import type { MemberAccount, QuoteDraft } from "../lib/data";
import type { MemberDashboardSummary } from "../lib/data";
import { authClient } from "../lib/auth-client";

type EnquiryRow = {
  id: string;
  status: string;
  business_name: string;
  created_at: string;
  expires_at: string;
  item_count: number;
  total_quantity: number;
  last_update_at?: string;
};

const BASKET_KEY = "sparks_quote_v1";

export function AccountWorkspace({ member, drafts: initialDrafts, enquiries, signOutHref, adminRole, summary }: {
  member: MemberAccount;
  drafts: QuoteDraft[];
  enquiries: EnquiryRow[];
  signOutHref: string;
  adminRole: "owner" | "editor" | null;
  summary: MemberDashboardSummary;
}) {
  const [profile, setProfile] = useState(member);
  const [drafts, setDrafts] = useState(initialDrafts);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [quoteSearch, setQuoteSearch] = useState("");
  const [enquirySearch, setEnquirySearch] = useState("");
  const [securityNotice, setSecurityNotice] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const visibleDrafts = drafts.filter((draft) => draft.name.toLowerCase().includes(quoteSearch.toLowerCase()));
  const visibleEnquiries = enquiries.filter((enquiry) => {
    const query = enquirySearch.trim().toLowerCase();
    return !query || enquiry.business_name.toLowerCase().includes(query) || enquiry.status.toLowerCase().includes(query) || (`sp-${enquiry.id.slice(0, 8)}`).toLowerCase().includes(query);
  });

  function update(key: keyof MemberAccount, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    const response = await fetch("/api/account", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(profile),
    });
    const result = await response.json() as { error?: string };
    setNotice(response.ok ? "Profile saved." : result.error || "Unable to save profile.");
    setSaving(false);
  }

  function resumeDraft(draft: QuoteDraft) {
    localStorage.setItem(BASKET_KEY, JSON.stringify(draft.items));
    window.location.assign("/quote");
  }

  async function removeDraft(id: string) {
    if (!window.confirm("Delete this saved quote draft?")) return;
    const response = await fetch("/api/account/quotes/" + encodeURIComponent(id), { method: "DELETE" });
    if (response.ok) setDrafts((current) => current.filter((draft) => draft.id !== id));
  }

  async function renameDraft(draft: QuoteDraft) {
    const name = window.prompt("Rename this quote", draft.name)?.trim(); if (!name || name === draft.name) return;
    const response = await fetch(`/api/account/quotes/${encodeURIComponent(draft.id)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, items: draft.items }) });
    if (response.ok) setDrafts((items) => items.map((item) => item.id === draft.id ? { ...item, name } : item));
  }

  async function duplicateDraft(draft: QuoteDraft) {
    const response = await fetch("/api/account/quotes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: `${draft.name} copy`, items: draft.items }) });
    const result = await response.json() as { id?: string };
    if (response.ok && result.id) setDrafts((items) => [{ ...draft, id: result.id!, name: `${draft.name} copy`, updatedAt: new Date().toISOString() }, ...items]);
  }

  function exportDraft(draft: QuoteDraft) {
    const blob = new Blob([JSON.stringify({ name: draft.name, items: draft.items }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${draft.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "quote"}.json`; link.click(); URL.revokeObjectURL(url);
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault(); setSecurityNotice("Updating…");
    const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
    setSecurityNotice(result.error ? "Password could not be updated. Check your current password." : "Password updated and other sessions signed out.");
    if (!result.error) { setCurrentPassword(""); setNewPassword(""); }
  }

  async function deleteAccount() {
    if (!window.confirm("Delete your profile, saved quotes, and linked enquiries? This cannot be undone.")) return;
    const confirmation = window.prompt("Type DELETE to confirm.");
    if (confirmation !== "DELETE") return;
    setDeleting(true);
    const response = await fetch("/api/account", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirmation }),
    });
    if (response.ok) window.location.assign(signOutHref);
    else {
      setNotice("Unable to delete the account.");
      setDeleting(false);
    }
  }

  return (
    <div className="account-shell">
      <header className="account-hero">
        <div>
          <span className="kicker">MEMBER WORKSPACE</span>
          <h1>Welcome back, {member.displayName.split(" ")[0]}.</h1>
          <p>Keep procurement conversations organized without turning the catalog into an online ordering system.</p>
        </div>
        <div className="account-hero-actions">
          {adminRole ? <Link className="primary-action" href="/admin">Open admin dashboard <span>→</span></Link> : null}
          <button className="secondary-action" type="button" onClick={async () => { await authClient.signOut(); window.location.assign(signOutHref); }}>Sign out</button>
        </div>
      </header>

      <section className="workspace-summary" aria-label="Workspace summary"><article><span>Profile ready</span><strong>{summary.profileCompletion}%</strong><small>{summary.profileCompletion === 100 ? "Ready to prefill enquiries" : "Complete missing buyer details"}</small></article><article><span>Saved quotes</span><strong>{summary.savedQuoteCount}</strong><small>Available across signed-in devices</small></article><article><span>Active enquiries</span><strong>{summary.activeEnquiryCount}</strong><small>{summary.recentEnquiryCount} submitted in 30 days</small></article></section>

      <nav className="account-subnav" aria-label="Member workspace">
        <a href="#profile">Profile</a><a href="#quotes">Saved quotes</a><a href="#security">Security</a><a href="#enquiries">Enquiries</a>
      </nav>

      {notice ? <p className="account-notice" role="status">{notice}</p> : null}

      <section className="account-panel" id="profile">
        <div className="account-panel-heading"><div><span>01 / PROFILE</span><h2>Business details</h2></div><p>These details prefill future enquiries. Your authenticated email remains read-only.</p></div>
        <form className="account-profile-grid" onSubmit={saveProfile}>
          <label><span>Contact name</span><input value={profile.displayName} onChange={(event) => update("displayName", event.target.value)} autoComplete="name" required /></label>
          <label><span>Verified email</span><input value={profile.email} readOnly aria-readonly="true" /></label>
          <label className="wide"><span>Business or company</span><input value={profile.businessName} onChange={(event) => update("businessName", event.target.value)} autoComplete="organization" /></label>
          <label><span>Mobile number</span><input value={profile.phone} onChange={(event) => update("phone", event.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" autoComplete="tel" /></label>
          <label><span>Preferred contact</span><select value={profile.preferredContact} onChange={(event) => update("preferredContact", event.target.value)}><option value="email">Email</option><option value="phone">Phone</option></select></label>
          <label><span>Buyer type</span><select value={profile.buyerType} onChange={(event) => update("buyerType", event.target.value)}><option value="">Select when relevant</option><option>Pharmacy</option><option>Stockist</option><option>Clinic</option><option>Hospital</option><option>Other licensed trade buyer</option></select></label>
          <label><span>State</span><input value={profile.state} onChange={(event) => update("state", event.target.value)} autoComplete="address-level1" /></label>
          <label><span>City</span><input value={profile.city} onChange={(event) => update("city", event.target.value)} autoComplete="address-level2" /></label>
          <label><span>PIN code</span><input value={profile.pincode} onChange={(event) => update("pincode", event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="postal-code" /></label>
          <button className="primary-action" type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button>
        </form>
      </section>

      <section className="account-panel" id="quotes">
        <div className="account-panel-heading"><div><span>02 / QUOTES</span><h2>Saved quote drafts</h2></div><Link className="secondary-action" href="/quote">Open current basket</Link></div>
        {drafts.length ? <><label className="workspace-search"><span className="sr-only">Search saved quotes</span><input type="search" placeholder="Search saved quotes…" value={quoteSearch} onChange={(event) => setQuoteSearch(event.target.value)} /></label><div className="saved-draft-list">{visibleDrafts.map((draft) => <article key={draft.id}><div><strong>{draft.name}</strong><span>{draft.items.length} product{draft.items.length === 1 ? "" : "s"} · Updated {new Date(draft.updatedAt).toLocaleDateString("en-IN")}</span></div><div><button type="button" onClick={() => resumeDraft(draft)}>Resume</button><button type="button" onClick={() => renameDraft(draft)}>Rename</button><button type="button" onClick={() => duplicateDraft(draft)}>Duplicate</button><button type="button" onClick={() => exportDraft(draft)}>Export</button><button type="button" className="danger-text" onClick={() => removeDraft(draft.id)}>Delete</button></div></article>)}</div></> : <div className="account-empty"><p>No saved quote drafts yet.</p><Link href="/products">Browse products and build one →</Link></div>}
      </section>

      <section className="account-panel" id="security"><div className="account-panel-heading"><div><span>03 / SECURITY</span><h2>Sign-in and sessions</h2></div><p>Changing your password signs out other sessions automatically.</p></div><div className="security-grid"><form onSubmit={changePassword}><label><span>Current password</span><input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required /></label><label><span>New password</span><input type="password" minLength={12} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" required /></label><button className="secondary-action" type="submit">Change password</button></form><div><strong>Google account</strong><p>Link a verified Google identity for faster sign-in.</p><button className="secondary-action" type="button" onClick={() => authClient.linkSocial({ provider: "google", callbackURL: "/account#security" })}>Link Google</button><button className="text-button" type="button" onClick={async () => { await authClient.revokeOtherSessions(); setSecurityNotice("Other sessions have been signed out."); }}>Sign out other sessions</button></div></div>{securityNotice ? <p className="account-notice" role="status">{securityNotice}</p> : null}</section>

      <section className="account-panel" id="enquiries">
        <div className="account-panel-heading"><div><span>04 / ENQUIRIES</span><h2>Track submitted enquiries</h2></div><p>Use the unique SP reference to find a request, review the exact medicine list, and follow buyer-visible progress updates.</p></div>
        {enquiries.length ? <><label className="workspace-search enquiry-search"><span className="sr-only">Search enquiries</span><input type="search" placeholder="Search by SP reference, business, or status…" value={enquirySearch} onChange={(event) => setEnquirySearch(event.target.value)} /></label><div className="member-enquiry-list">{visibleEnquiries.map((enquiry) => <Link href={"/account/enquiries/" + enquiry.id} key={enquiry.id}><div><strong>SP-{enquiry.id.slice(0, 8).toUpperCase()}</strong><span>{enquiry.business_name}</span><small>{enquiry.item_count} medicine line{Number(enquiry.item_count) === 1 ? "" : "s"} · {enquiry.total_quantity} units</small></div><div><span className={"member-status status-" + enquiry.status}>{enquiry.status}</span><small>Updated {new Date(enquiry.last_update_at || enquiry.created_at).toLocaleDateString("en-IN")}</small><b>View tracking →</b></div></Link>)}</div>{!visibleEnquiries.length ? <div className="account-empty compact"><p>No enquiry matches that reference or status.</p></div> : null}</> : <div className="account-empty"><p>No linked enquiries yet. Guest enquiries are intentionally not matched by email.</p></div>}
      </section>

      <section className="account-danger">
        <div><strong>Delete member account</strong><p>Removes your profile, saved drafts, and enquiries linked to this account.</p></div>
        <button type="button" disabled={deleting} onClick={deleteAccount}>{deleting ? "Deleting…" : "Delete account"}</button>
      </section>
    </div>
  );
}
