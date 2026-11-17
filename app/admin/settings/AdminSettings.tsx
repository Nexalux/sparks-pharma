"use client";

import { useState, type FormEvent } from "react";
import type { SiteSettings } from "../../lib/data";

type AdminRow = { id: string; email: string; role: string; display_name?: string };

export function AdminSettings({ initialSettings, initialAdmins }: { initialSettings: SiteSettings; initialAdmins: unknown[] }) {
  const [settings, setSettings] = useState(initialSettings);
  const [admins, setAdmins] = useState(initialAdmins as AdminRow[]);
  const [message, setMessage] = useState("");
  const [editor, setEditor] = useState({ email: "", displayName: "" });

  async function save(event: FormEvent) {
    event.preventDefault(); setMessage("Saving settings…");
    const response = await fetch("/api/admin/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(settings) });
    const data = await response.json() as { error?: string; settings?: SiteSettings };
    if (data.settings) setSettings(data.settings);
    setMessage(response.ok ? "Settings saved." : data.error || "Settings could not be saved.");
  }

  async function addEditor(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/editors", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(editor) });
    const data = await response.json() as { admins?: AdminRow[]; error?: string };
    if (data.admins) setAdmins(data.admins); setMessage(response.ok ? "Editor added." : data.error || "Unable to add editor.");
    if (response.ok) setEditor({ email: "", displayName: "" });
  }

  async function removeEditor(id: string) {
    const response = await fetch("/api/admin/editors?id=" + encodeURIComponent(id), { method: "DELETE" });
    const data = await response.json() as { admins?: AdminRow[] };
    if (data.admins) setAdmins(data.admins); setMessage(response.ok ? "Editor removed." : "Unable to remove editor.");
  }

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => setSettings((current) => ({ ...current, [key]: value }));
  const checks: Array<[keyof SiteSettings, string]> = [["identityVerified", "Legal identity and address verified"], ["contactsVerified", "Public phone and email verified"], ["licencesVerified", "Displayed licences verified or removed"], ["privacyAcknowledged", "Privacy review complete"], ["disclaimerAcknowledged", "Disclaimer review complete"], ["advertisingAcknowledged", "Advertising claims reviewed"], ["legalReviewAcknowledged", "Formal pharmaceutical/legal review complete"]];

  return <>
    <header className="admin-page-head"><div><span>OWNER CONTROLS</span><h1>Settings & launch</h1><p>Manage public business information, service coverage, administrators, and search-review checks.</p></div></header>
    {message ? <p className="admin-flash" role="status">{message}</p> : null}
    <form className="settings-layout" onSubmit={save}>
      <section className="admin-panel"><div className="admin-panel-head"><div><span>PUBLIC IDENTITY</span><h2>Company and contact details</h2></div></div><div className="admin-form-grid">
        <label><span>Working brand</span><input value={settings.brandName} onChange={(e) => set("brandName", e.target.value)} /></label><label><span>Legal name</span><input value={settings.legalName} onChange={(e) => set("legalName", e.target.value)} /></label><label className="wide"><span>Identity note</span><textarea value={settings.identityStatus} onChange={(e) => set("identityStatus", e.target.value)} /></label><label className="wide"><span>Address</span><textarea value={settings.address} onChange={(e) => set("address", e.target.value)} /></label><label className="wide"><span>Map URL</span><input value={settings.mapUrl} onChange={(e) => set("mapUrl", e.target.value)} /></label><label><span>Phone</span><input value={settings.phone} onChange={(e) => set("phone", e.target.value)} /></label><label className="wide"><span>Email</span><input type="email" value={settings.email} onChange={(e) => set("email", e.target.value)} /></label><label className="wide"><span>Documentation references <small>One per line</small></span><textarea value={settings.licenceReferences.join("\n")} onChange={(e) => set("licenceReferences", e.target.value.split("\n").map((value) => value.trim()).filter(Boolean))} /></label><label className="wide"><span>Business hours</span><input value={settings.businessHours} onChange={(e) => set("businessHours", e.target.value)} /></label>
      </div></section>
      <section className="admin-panel"><div className="admin-panel-head"><div><span>PUBLIC MESSAGING</span><h2>Homepage and coverage</h2></div></div><div className="admin-form-grid"><label className="wide"><span>Homepage headline</span><input value={settings.homepageHeadline} onChange={(e) => set("homepageHeadline", e.target.value)} /></label><label className="wide"><span>Homepage introduction</span><textarea rows={3} value={settings.homepageIntro} onChange={(e) => set("homepageIntro", e.target.value)} /></label><label><span>Primary state</span><input value={settings.serviceRegion.primaryState} onChange={(e) => set("serviceRegion", { ...settings.serviceRegion, primaryState: e.target.value })} /></label><label className="wide"><span>India-wide service message</span><textarea rows={3} value={settings.serviceRegion.message} onChange={(e) => set("serviceRegion", { ...settings.serviceRegion, message: e.target.value })} /></label><label className="wide"><span>Trade disclaimer</span><textarea rows={4} value={settings.disclaimer} onChange={(e) => set("disclaimer", e.target.value)} /></label></div></section>
      <section className="admin-panel launch-panel"><div className="admin-panel-head"><div><span>SEARCH VISIBILITY</span><h2>Public catalog indexing enabled</h2></div><span className="ready-badge">Active</span></div><p>Public pages and published catalog records are open to search engines. Account, enquiry, sign-in, administration, and API routes remain excluded.</p><div className="launch-checks">{checks.map(([key, label]) => <label className="check-field" key={key}><input type="checkbox" checked={Boolean(settings[key])} onChange={(e) => set(key, e.target.checked as never)} /><span>{label}</span></label>)}</div></section>
      <button className="primary-action settings-save" type="submit">Save all settings <span>→</span></button>
    </form>
    <section className="admin-panel editors-panel"><div className="admin-panel-head"><div><span>ADMIN ACCESS</span><h2>Owner and editors</h2></div></div><div className="admin-list">{admins.map((admin) => <div key={admin.id}><span><strong>{admin.display_name || admin.email}</strong><small>{admin.email} · {admin.role}</small></span>{admin.role === "editor" ? <button className="text-button danger-text" type="button" onClick={() => void removeEditor(admin.id)}>Remove</button> : null}</div>)}</div><form className="editor-add" onSubmit={addEditor}><input placeholder="Editor name" value={editor.displayName} onChange={(e) => setEditor({ ...editor, displayName: e.target.value })} /><input type="email" required placeholder="editor@example.com" value={editor.email} onChange={(e) => setEditor({ ...editor, email: e.target.value })} /><button className="secondary-action" type="submit">Add editor</button></form></section>
  </>;
}
