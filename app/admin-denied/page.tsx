import Link from "../components/SafeLink";

export const metadata = { title: "Admin access required", robots: { index: false, follow: false } };
export default function AdminDeniedPage() {
  return <main className="simple-message"><span className="kicker">ACCESS CONTROL</span><h1>This account is not an administrator.</h1><p>You can still use the member workspace. Ask the Sparks Pharma owner to add your verified email as an editor if you need catalog controls.</p><div className="confirmation-actions"><Link className="primary-action" href="/account">Open member workspace</Link><Link className="secondary-action" href="/">Return to catalog</Link></div></main>;
}
