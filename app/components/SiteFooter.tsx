import Link from "./SafeLink";
import { getSettings } from "../lib/repository";

export async function SiteFooter() {
  const settings = await getSettings();
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <Link className="brand brand-inverse" href="/">
            <span className="brand-mark" aria-hidden="true">✦</span>
            <span>SPARKS <b>PHARMA</b></span>
          </Link>
          <p>A B2B catalog for India-wide generic medicine trade enquiries, with Gujarat as the primary region.</p>
        </div>
        <div>
          <h3>Explore</h3>
          <Link href="/products">Product catalog</Link>
          <Link href="/quote">Quote basket</Link>
          <Link href="/quality">Quality approach</Link>
        </div>
        <div>
          <h3>Company</h3>
          <Link href="/about">About Sparks Pharma</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
        <div>
          <h3>Service area</h3>
          <strong>India-wide enquiries</strong>
          <p>{settings.serviceRegion.primaryState} primary · Trade desk: {settings.phone}<br />{settings.email}</p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} {settings.brandName} · B2B trade catalog</span>
        <Link href="/disclaimer">Trade and medical disclaimer</Link>
      </div>
    </footer>
  );
}
