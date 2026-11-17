import Link from "../components/SafeLink";
import { PageHero } from "../components/PageHero";
import { publicPageMetadata } from "../lib/seo";

export const metadata = publicPageMetadata(
  "Quality & compliance",
  "Publication, sourcing, and trade-verification controls used by the Sparks Pharma catalog.",
  "/quality",
);

const gates = [
  { number: "01", title: "Source verification", text: "Composition, strength, dosage form, pack size, and manufacturer fields require an approved source." },
  { number: "02", title: "Publication approval", text: "The public catalog renders only records explicitly approved for visibility." },
  { number: "03", title: "Claim review", text: "Copy remains factual and avoids diagnostic, therapeutic, or exaggerated promises." },
  { number: "04", title: "Trade verification", text: "An enquiry is never an order; eligibility and applicable licences remain subject to human review." },
];

export default function QualityPage() {
  return (
    <main>
      <PageHero
        eyebrow="Quality and compliance"
        title="Trust begins with what we refuse to assume."
        intro="Every catalog record follows a controlled path from structured source data to publication and procurement review."
        aside={<div className="service-aside"><span>Catalog governance</span><strong>Controlled release</strong><small>Human review at every stage</small></div>}
        code="SP / QUALITY"
        signals={["Source", "Review", "Release"]}
      />
      <section className="quality-gates">
        <div className="section-heading">
          <div><span className="kicker">RELEASE GATES</span><h2>Four checks before a product becomes public.</h2></div>
          <p>Each product record carries a publication state, enquiry eligibility, availability, and independent search-visibility controls.</p>
        </div>
        <div className="gate-list">
          {gates.map((gate) => <article key={gate.number}><span>{gate.number}</span><h3>{gate.title}</h3><p>{gate.text}</p></article>)}
        </div>
      </section>
      <section className="compliance-panel">
        <div>
          <span className="kicker">TRADE REVIEW</span>
          <h2>What is confirmed before fulfilment.</h2>
        </div>
        <ul>
          <li>Buyer business identity and applicable trade documentation</li>
          <li>Current manufacturer, batch, expiry, and pack information</li>
          <li>Serviceability, stock position, and quotation validity</li>
          <li>Privacy consent and appropriate handling of enquiry details</li>
          <li>Final review of product descriptions and classifications</li>
        </ul>
      </section>
      <section className="legal-links">
        <div><h3>Reference framework</h3><p>Final review should consider applicable CDSCO rules, pharmaceutical marketing practices, advertising restrictions, and Indian data-protection requirements.</p></div>
        <div>
          <a href="https://www.cdsco.gov.in/opencms/opencms/en/Acts-and-rules/Drugs-Rules/" target="_blank" rel="noreferrer">CDSCO Drugs Rules ↗</a>
          <a href="https://www.pharmaceuticals.gov.in/sites/default/files/UCPMP%202024%20for%20website_0.pdf" target="_blank" rel="noreferrer">UCPMP 2024 ↗</a>
          <a href="https://www.indiacode.nic.in/handle/123456789/1412?view_type=browse" target="_blank" rel="noreferrer">Drugs and Magic Remedies Act ↗</a>
        </div>
      </section>
      <section className="simple-cta"><div><span className="kicker">STRUCTURED ENQUIRY</span><h2>See the human-verification handoff.</h2></div><Link className="primary-action" href="/quote">Open quote basket <span>→</span></Link></section>
    </main>
  );
}
