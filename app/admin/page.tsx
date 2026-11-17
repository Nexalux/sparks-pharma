import Link from "../components/SafeLink";
import { requireAdminPage } from "../lib/admin-auth";
import { adminDashboardSummary, getSettings, listAdminProducts, listEnquiries } from "../lib/repository";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await requireAdminPage("/admin");
  const [products, enquiries, settings, additional] = await Promise.all([listAdminProducts(), listEnquiries(), getSettings(), adminDashboardSummary()]);
  const published = products.filter((product) => product.status === "published").length;
  return (
    <>
      <header className="admin-page-head admin-dashboard-hero"><div><span>CATALOG CONTROL CENTRE</span><h1>Good to see you, {session.user.displayName.split(" ")[0]}.</h1><p>Manage the catalog, enquiries, business information, and search visibility from one place.</p><div className="admin-hero-signals" aria-label="Workspace status"><span><i />{session.role} workspace</span><span>{published} products live</span><span>Search indexed</span></div></div><Link className="primary-action" href="/admin/products">Add a product <span>＋</span></Link></header>
      <section className="admin-stat-grid" aria-label="Catalog status">
        <article><span>Total products</span><strong>{products.length}</strong><small>{published} published</small></article>
        <article><span>Open enquiries</span><strong>{enquiries.filter((item) => (item as { status: string }).status !== "closed").length}</strong><small>Stored with consent</small></article>
        <article><span>Search mode</span><strong>Indexed</strong><small>Private routes remain protected</small></article>
        <article><span>Service coverage</span><strong>India</strong><small>{settings.serviceRegion.primaryState} primary</small></article>
        <article><span>Members</span><strong>{additional.totalMembers}</strong><small>Verified workspace identities</small></article>
        <article><span>Content ready</span><strong>{additional.contentReadyProducts}</strong><small>Published records with rich details</small></article>
      </section>
      <section className="admin-panel-grid">
        <article className="admin-panel"><div className="admin-panel-head"><div><span>CATALOG</span><h2>Publication pipeline</h2></div><Link href="/admin/products">Manage →</Link></div>{["draft", "review", "published", "archived"].map((status) => <div className="pipeline-row" key={status}><span>{status}</span><b>{products.filter((product) => product.status === status).length}</b></div>)}</article>
        <article className="admin-panel"><div className="admin-panel-head"><div><span>SEARCH VISIBILITY</span><h2>Public catalog active</h2></div>{session.role === "owner" ? <Link href="/admin/settings">Review →</Link> : null}</div><p className="admin-muted">Public pages and published product records can be discovered, while member, enquiry, sign-in, admin, and API routes stay excluded.</p></article>
      </section>
    </>
  );
}
