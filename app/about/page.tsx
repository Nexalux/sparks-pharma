import Link from "../components/SafeLink";
import { PageHero } from "../components/PageHero";
import { publicPageMetadata } from "../lib/seo";

export const metadata = publicPageMetadata(
  "About",
  "The operating approach and portfolio disclosure for the Sparks Pharma digital trade catalog.",
  "/about",
);

export default function AboutPage() {
  return (
    <main>
      <PageHero
        eyebrow="About Sparks Pharma"
        title="A clearer digital front door for medicine procurement."
        intro="Sparks Pharma brings structured product discovery and trade enquiries together for pharmacies, stockists, clinics, hospitals, and other eligible business buyers across India."
        aside={<div className="stat-aside"><strong>IN</strong><span>India-wide enquiries</span></div>}
        code="SP / ABOUT"
        signals={["Discover", "Structure", "Connect"]}
      />
      <section className="story-grid">
        <div className="story-lead">
          <span className="kicker">OUR APPROACH</span>
          <h2>Make procurement easier to begin, while keeping people responsible for the final decision.</h2>
        </div>
        <div className="story-copy">
          <p>The catalog brings product discovery, pack comparison, and multi-item enquiries into one calm and structured experience.</p>
          <p>It deliberately stops before payment or order acceptance. Every enquiry moves to a human conversation where business eligibility, licences, stock, pricing, and fulfilment can be verified.</p>
          <div className="inline-notice">The workflow is designed for procurement clarity: searchable records, one consolidated request, explicit consent, and a trackable review handoff.</div>
        </div>
      </section>
      <section className="values-section">
        <div className="section-heading"><div><span className="kicker">DESIGN PRINCIPLES</span><h2>What the experience should stand for.</h2></div></div>
        <div className="value-grid">
          <article><span>01</span><h3>Clarity</h3><p>Factual records, consistent product fields, and no exaggerated medical language.</p></article>
          <article><span>02</span><h3>Restraint</h3><p>No false urgency, automatic acceptance, or display of unverified credentials.</p></article>
          <article><span>03</span><h3>Regional clarity</h3><p>India-wide enquiry support with Gujarat presented as the primary service region.</p></article>
          <article><span>04</span><h3>Human verification</h3><p>Business and regulatory checks remain part of the sales team’s process.</p></article>
        </div>
      </section>
      <section className="portfolio-disclosure" aria-labelledby="portfolio-disclosure-title">
        <div><span className="kicker">PORTFOLIO DISCLOSURE</span><h2 id="portfolio-disclosure-title">An independently created product case study.</h2></div>
        <div><p>This website was designed and developed by Tanishq Chaudhary as a portfolio project exploring a modern B2B pharmaceutical catalog and admin-controlled enquiry system.</p><p>Sparks Pharma Distribution Private Limited is a fictional business identity. Company details, addresses, contact endpoints, documentation references, manufacturers, catalog availability, pricing, and submitted enquiries are simulated for presentation. This website is not an operating pharmacy, medicine distributor, medical service, or offer to sell medicines.</p></div>
      </section>
      <section className="simple-cta"><div><span className="kicker">EXPLORE THE EXPERIENCE</span><h2>Browse the complete catalog journey.</h2></div><Link className="primary-action" href="/products">Browse products <span>→</span></Link></section>
    </main>
  );
}
