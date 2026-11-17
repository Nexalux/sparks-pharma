import Link from "../components/SafeLink";
import { PageHero } from "../components/PageHero";
import { getSettings } from "../lib/repository";
import { publicPageMetadata } from "../lib/seo";

export const metadata = publicPageMetadata(
  "Contact",
  "Contact and service-area information for Sparks Pharma trade enquiries.",
  "/contact",
);

export default async function ContactPage() {
  const settings = await getSettings();
  return (
    <main>
      <PageHero
        eyebrow="Contact and coverage"
        title="Begin with a structured India trade enquiry."
        intro="The quote basket collects products, quantities, and verified business details into one trackable on-site enquiry."
        aside={<div className="service-aside"><span>Current coverage</span><strong>India-wide enquiries</strong><small>{settings.serviceRegion.primaryState} primary region</small></div>}
        code="SP / CONTACT"
        signals={["Select", "Detail", "Submit"]}
      />
      <section className="contact-grid">
        <div className="contact-primary">
          <span className="kicker">RECOMMENDED</span>
          <h2>Prepare one consolidated enquiry.</h2>
          <p>Browse catalog records, add quantities, and choose whether to save the enquiry for follow-up. Nothing is stored without explicit consent.</p>
          <Link className="primary-action" href="/products">Start with the catalog <span>→</span></Link>
        </div>
        <div className="contact-detail">
          <div><span>Trade brand</span><strong>{settings.brandName}</strong></div>
          <div><span>Business identity</span><strong>{settings.legalName}<small className="detail-note">{settings.identityStatus}</small></strong></div>
          <div><span>Primary region</span><strong>{settings.serviceRegion.primaryState}, India</strong></div>
          <div><span>Address</span><strong>{settings.address}<a className="detail-link" href={settings.mapUrl} target="_blank" rel="noreferrer">View service hub ↗</a></strong></div>
          <div><span>Trade desk</span><strong>{settings.phone}<span className="detail-link">{settings.email}</span><small className="detail-note">{settings.businessHours}</small></strong></div>
          <div><span>Documentation references</span><strong>{settings.licenceReferences.length ? settings.licenceReferences.join(" · ") : "Provided during buyer onboarding"}</strong></div>
        </div>
      </section>
      <section className="boundary-section">
        <div className="boundary-mark">IN</div>
        <div><span className="kicker">SERVICE COVERAGE</span><h2>India-wide enquiries, manually confirmed.</h2><p>{settings.serviceRegion.message}</p></div>
      </section>
    </main>
  );
}
