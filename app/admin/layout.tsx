import Link from "../components/SafeLink";
import { signOutPath } from "../lib/auth";
import { requireAdminPage } from "../lib/admin-auth";

export const metadata = { title: "Admin dashboard", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPage("/admin");
  return (
    <div className="admin-frame">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin"><span>✦</span><b>Sparks control</b></Link>
        <nav aria-label="Admin navigation">
          <Link href="/admin">Overview</Link>
          <Link href="/admin/products">Products</Link>
          <Link href="/admin/enquiries">Enquiries</Link>
          {session.role === "owner" ? <Link href="/admin/settings">Settings & launch</Link> : null}
          <Link href="/">View public site</Link>
        </nav>
        <div className="admin-user">
          <span>{session.role}</span>
          <strong>{session.user.displayName}</strong>
          <small>{session.user.email}</small>
          <a href={signOutPath("/")}>Sign out</a>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
