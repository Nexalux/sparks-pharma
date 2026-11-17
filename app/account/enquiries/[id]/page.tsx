import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "../../../components/SafeLink";
import { requireMemberPage } from "../../../lib/member-auth";
import { getMemberEnquiry } from "../../../lib/repository";
import type { EnquiryStatus } from "../../../lib/data";
import { TrackingReference } from "./TrackingReference";

export const metadata: Metadata = { title: "Enquiry details", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MemberEnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireMemberPage("/account/enquiries/" + id);
  const enquiry = await getMemberEnquiry(session.member.id, id);
  if (!enquiry) notFound();
  const row = enquiry as Record<string, unknown> & { items: Array<Record<string, unknown>>; events: Array<Record<string, unknown>> };
  const status = String(row.status) as EnquiryStatus;
  const stages: Array<{ value: EnquiryStatus; label: string; detail: string }> = [
    { value: "new", label: "Received", detail: "Queued for review" },
    { value: "contacted", label: "Contacted", detail: "Buyer follow-up started" },
    { value: "qualified", label: "In review", detail: "Requirements being assessed" },
    { value: "closed", label: "Complete", detail: "Follow-up concluded" },
  ];
  const currentStage = stages.findIndex((stage) => stage.value === status);
  const events = row.events.length ? row.events : [{ status: "new", message: "Enquiry received and queued for review.", created_at: row.created_at }];
  const totalQuantity = row.items.reduce((sum, item) => sum + Number(item.quantity), 0);
  const ref = "SP-" + id.slice(0, 8).toUpperCase();
  return <main className="member-detail-page">
    <Link className="text-button" href="/account#enquiries">← Back to workspace</Link>
    <section className="member-detail-card">
      <span className="kicker">ENQUIRY TRACKING</span>
      <div className="member-detail-head"><div><TrackingReference value={ref} /><p>Submitted {new Date(String(row.created_at)).toLocaleString("en-IN")}</p></div><span className={"member-status status-" + status}>{stages[currentStage]?.label || status}</span></div>
      <section className="tracking-progress" aria-label="Enquiry progress">{stages.map((stage, index) => <div className={index < currentStage ? "complete" : index === currentStage ? "current" : ""} key={stage.value}><span>{index < currentStage ? "✓" : String(index + 1).padStart(2, "0")}</span><strong>{stage.label}</strong><small>{stage.detail}</small></div>)}</section>
      <div className="tracking-next-step"><span>WHAT HAPPENS NEXT</span><p>{status === "new" ? "The procurement desk will review the requested products and use your saved contact details for follow-up." : status === "contacted" ? "Please watch your saved email or phone for questions about pack, quantity, documentation, or serviceability." : status === "qualified" ? "The request is under detailed review. Commercial terms and availability still require direct confirmation." : "This enquiry’s follow-up is complete. Contact the procurement desk and quote the reference above if you need clarification."}</p></div>
      <div className="member-detail-facts"><div><span>Business</span><strong>{String(row.business_name)}</strong></div><div><span>Contact</span><strong>{String(row.contact_name)}</strong></div><div><span>Location</span><strong>{String(row.city)}, {String(row.state)} · {String(row.pincode)}</strong></div><div><span>Stored until</span><strong>{new Date(String(row.expires_at)).toLocaleDateString("en-IN")}</strong></div></div>
      <div className="member-products-heading"><div><span>REQUEST SUMMARY</span><h2>Requested products</h2></div><strong>{row.items.length} lines · {totalQuantity} units</strong></div>
      <div className="member-detail-items">{row.items.map((item, index) => <article key={String(item.product_slug) + index}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{String(item.product_name)}</strong>{item.note ? <small>{String(item.note)}</small> : null}</div><b>Qty {String(item.quantity)}</b></article>)}</div>
      {row.note ? <div className="member-note"><span>Enquiry note</span><p>{String(row.note)}</p></div> : null}
      <section className="tracking-history"><span className="kicker">TRACKING HISTORY</span><h2>Updates</h2><ol>{events.slice().reverse().map((event, index) => <li key={String(event.created_at) + index}><i aria-hidden="true" /><div><strong>{stages.find((stage) => stage.value === event.status)?.label || String(event.status)}</strong><p>{String(event.message || "Status updated.")}</p><small>{new Date(String(event.created_at)).toLocaleString("en-IN")}</small></div></li>)}</ol></section>
      <p className="member-detail-boundary">Status reflects the portfolio workflow only. This is not an order confirmation, stock reservation, or medical service.</p>
    </section>
  </main>;
}
