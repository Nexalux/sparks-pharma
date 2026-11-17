"use client";

import { useMemo, useState } from "react";
import type { EnquiryStatus } from "../../lib/data";

type EnquiryItem = { product_slug: string; product_name: string; quantity: number; note?: string };
type StatusEvent = { status: EnquiryStatus; message: string; created_at: string };
type EnquiryRow = { id: string; business_name: string; contact_name: string; buyer_type: string; phone: string; email?: string; state: string; city: string; pincode: string; note?: string; status: EnquiryStatus; internal_notes?: string; public_update?: string; created_at: string; expires_at: string; item_count: number; total_quantity: number; items: EnquiryItem[]; events: StatusEvent[] };

const STATUS_LABELS: Record<EnquiryStatus, string> = { new: "New", contacted: "Contacted", qualified: "Qualified", closed: "Closed" };
const STATUS_HELP: Record<EnquiryStatus, string> = {
  new: "Awaiting the first review",
  contacted: "Buyer contact has started",
  qualified: "Requirements are being assessed",
  closed: "Follow-up has been completed",
};

function reference(id: string) { return `SP-${id.slice(0, 8).toUpperCase()}`; }

export function AdminEnquiries({ initialEnquiries }: { initialEnquiries: unknown[] }) {
  const [enquiries, setEnquiries] = useState(initialEnquiries as EnquiryRow[]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const counts = useMemo(() => ({
    total: enquiries.length,
    new: enquiries.filter((row) => row.status === "new").length,
    active: enquiries.filter((row) => row.status === "contacted" || row.status === "qualified").length,
    units: enquiries.reduce((sum, row) => sum + Number(row.total_quantity || 0), 0),
  }), [enquiries]);

  async function refresh(nextSearch = search, nextStatus = status) {
    const response = await fetch("/api/admin/enquiries?search=" + encodeURIComponent(nextSearch) + "&status=" + encodeURIComponent(nextStatus));
    const data = await response.json() as { enquiries: EnquiryRow[] };
    setEnquiries(data.enquiries || []);
  }

  function changeRow(id: string, patch: Partial<EnquiryRow>) {
    setEnquiries((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  async function update(row: EnquiryRow) {
    setSavingId(row.id); setMessage("");
    const response = await fetch("/api/admin/enquiries", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: row.id, status: row.status, internalNotes: row.internal_notes || "", publicUpdate: row.public_update || "" }) });
    const result = await response.json() as { error?: string };
    setMessage(response.ok ? `${reference(row.id)} updated. The buyer can now see the latest public update.` : result.error || "Unable to update enquiry.");
    if (response.ok) await refresh();
    setSavingId("");
  }

  async function copyReference(row: EnquiryRow) {
    await navigator.clipboard.writeText(reference(row.id));
    setCopiedId(row.id); window.setTimeout(() => setCopiedId(""), 1800);
  }

  async function remove(row: EnquiryRow) {
    if (!window.confirm("Delete " + reference(row.id) + " from " + row.business_name + "?")) return;
    const response = await fetch("/api/admin/enquiries?id=" + encodeURIComponent(row.id), { method: "DELETE" });
    setMessage(response.ok ? "Enquiry deleted." : "Unable to delete enquiry.");
    if (response.ok) await refresh();
  }

  return <>
    <header className="admin-page-head"><div><span>CONSENTED BUSINESS LEADS</span><h1>Enquiries</h1><p>Review the complete medicine request, coordinate follow-up, and publish clear buyer-facing progress against each tracking reference.</p></div><a className="secondary-action" href={"/api/admin/enquiries?format=csv&search=" + encodeURIComponent(search) + "&status=" + encodeURIComponent(status)}>Export detailed CSV</a></header>
    <section className="admin-stat-grid enquiry-stats"><article><span>Visible enquiries</span><strong>{counts.total}</strong><small>Current filtered view</small></article><article><span>Awaiting review</span><strong>{counts.new}</strong><small>New submissions</small></article><article><span>In progress</span><strong>{counts.active}</strong><small>Contacted or qualified</small></article><article><span>Requested units</span><strong>{counts.units}</strong><small>Across visible lines</small></article></section>
    <form className="admin-toolbar" onSubmit={(event) => { event.preventDefault(); void refresh(); }}><label><span className="sr-only">Search enquiries</span><input type="search" placeholder="Reference, buyer, phone, or medicine…" value={search} onChange={(event) => setSearch(event.target.value)} /></label><label><span className="sr-only">Filter enquiry status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><button className="secondary-action" type="submit">Apply filters</button>{search || status ? <button className="text-button" type="button" onClick={() => { setSearch(""); setStatus(""); void refresh("", ""); }}>Clear</button> : null}</form>
    {message ? <p className="admin-flash" role="status">{message}</p> : null}
    <section className="enquiry-admin-list">{enquiries.length ? enquiries.map((row) => <article className="enquiry-admin-card" key={row.id}>
      <header className="enquiry-card-head"><div><span className="enquiry-reference">{reference(row.id)}</span><button className="copy-reference" type="button" onClick={() => void copyReference(row)}>{copiedId === row.id ? "Copied" : "Copy"}</button></div><span className={"member-status status-" + row.status}>{STATUS_LABELS[row.status]}</span></header>
      <div className="enquiry-admin-layout">
        <aside className="enquiry-admin-summary"><span>SUBMITTED {new Date(row.created_at).toLocaleString("en-IN")}</span><h2>{row.business_name}</h2><p>{row.contact_name} · {row.buyer_type}</p><div className="enquiry-contact-actions"><a href={"tel:+91" + row.phone}>Call +91 {row.phone}</a>{row.email ? <a href={"mailto:" + row.email + "?subject=" + encodeURIComponent(reference(row.id) + " enquiry follow-up")}>Email buyer</a> : null}</div><small>{row.city}, {row.state} · {row.pincode}</small><small>Stored until {new Date(row.expires_at).toLocaleDateString("en-IN")}</small>{row.note ? <div className="enquiry-buyer-note"><span>Buyer note</span><p>{row.note}</p></div> : null}</aside>
        <div className="enquiry-request-panel"><div className="enquiry-request-head"><div><span>REQUESTED MEDICINES</span><h3>{row.item_count} line{Number(row.item_count) === 1 ? "" : "s"} · {row.total_quantity} units</h3></div></div><div className="admin-enquiry-items">{row.items.map((item, index) => <article key={item.product_slug + index}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.product_name}</strong>{item.note ? <small>{item.note}</small> : null}</div><b>Qty {item.quantity}</b></article>)}</div></div>
        <div className="enquiry-admin-edit"><div className="workflow-current"><span>CURRENT STAGE</span><strong>{STATUS_LABELS[row.status]}</strong><small>{STATUS_HELP[row.status]}</small></div><label><span>Status</span><select value={row.status} onChange={(event) => changeRow(row.id, { status: event.target.value as EnquiryStatus })}>{Object.entries(STATUS_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label><span>Update visible to buyer</span><textarea rows={3} maxLength={500} placeholder="Example: We are reviewing pack availability and will contact you by email." value={row.public_update || ""} onChange={(event) => changeRow(row.id, { public_update: event.target.value })} /><small>Added to the member’s tracking timeline. Do not include private notes.</small></label><label><span>Internal notes</span><textarea rows={3} placeholder="Private team context; never shown to the buyer." value={row.internal_notes || ""} onChange={(event) => changeRow(row.id, { internal_notes: event.target.value })} /></label><div><button className="primary-action" type="button" disabled={savingId === row.id} onClick={() => void update(row)}>{savingId === row.id ? "Saving…" : "Save update"}</button><button className="text-button danger-text" type="button" onClick={() => void remove(row)}>Delete</button></div>{row.events.length ? <details className="admin-update-history"><summary>{row.events.length} timeline update{row.events.length === 1 ? "" : "s"}</summary><ol>{row.events.slice().reverse().map((event, index) => <li key={event.created_at + index}><strong>{STATUS_LABELS[event.status]}</strong><span>{event.message || "Status updated."}</span><small>{new Date(event.created_at).toLocaleString("en-IN")}</small></li>)}</ol></details> : null}</div>
      </div>
    </article>) : <div className="empty-state"><span aria-hidden="true">⌕</span><h2>No enquiries found</h2><p>Try a different reference, buyer, medicine, or status.</p></div>}</section>
  </>;
}
