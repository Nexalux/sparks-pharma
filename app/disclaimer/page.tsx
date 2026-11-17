import { PageHero } from "../components/PageHero";
import { publicPageMetadata } from "../lib/seo";

export const metadata = publicPageMetadata(
  "Trade and medical disclaimer",
  "Important trade, pricing, and medical limitations of the Sparks Pharma catalog.",
  "/disclaimer",
);

export default function DisclaimerPage() {
  return (
    <main>
      <PageHero
        eyebrow="Important notice"
        title="A trade catalog, not medical advice or an online order."
        intro="Product discovery and enquiry submission do not diagnose, prescribe, reserve stock, accept payment, or confirm supply."
      />
      <article className="policy-article disclaimer-article">
        <section><span>01</span><div><h2>Not an order</h2><p>Adding an item to the quote basket or submitting an enquiry does not create, accept, or confirm a purchase order. Pricing, stock, supply, and fulfilment remain subject to separate human confirmation.</p></div></section>
        <section><span>02</span><div><h2>Trade enquiries only</h2><p>The catalog is structured for eligible business buyers across India. Business identity and applicable documentation must be reviewed before any supply discussion progresses.</p></div></section>
        <section><span>03</span><div><h2>No medical advice</h2><p>Product records do not provide diagnosis, treatment recommendations, dosing guidance, substitution advice, or claims about clinical outcomes. Patients and consumers should consult an appropriately qualified healthcare professional.</p></div></section>
        <section><span>04</span><div><h2>Serviceability</h2><p>India-wide enquiries may be submitted, while serviceability, distribution permissions, delivery terms, and fulfilment are confirmed individually for every location.</p></div></section>
        <section><span>05</span><div><h2>Human verification</h2><p>Business eligibility, product details, manufacturer documentation, regulatory classification, pricing, stock, and serviceability remain subject to review.</p></div></section>
        <section><span>06</span><div><h2>Indicative prices only</h2><p>Displayed price ranges are dated retail-market references from linked third-party listings. They are not wholesale quotations, MRPs, invoices, stock confirmations, or promises of supply.</p></div></section>
        <section><span>07</span><div><h2>No prescription processing</h2><p>The website does not accept prescriptions, patient records, payments, or medicine orders. Do not submit personal health information through the enquiry form.</p></div></section>
      </article>
    </main>
  );
}
