import { PageHero } from "../components/PageHero";
import { publicPageMetadata } from "../lib/seo";

export const metadata = publicPageMetadata(
  "Privacy",
  "How Sparks Pharma handles browser preferences and consented business enquiries.",
  "/privacy",
);

export default function PrivacyPage() {
  return (
    <main>
      <PageHero
        eyebrow="Privacy notice"
        title="Clear consent. Limited retention."
        intro="Quote preferences stay on your device. Business enquiry details are stored only after explicit consent and expire automatically after 90 days."
      />
      <article className="policy-article">
        <section><span>01</span><div><h2>What stays on your device</h2><p>The selected Ocean or Galaxy palette, Light or Dark mode, and quote-basket product references are saved in local browser storage. They can be removed by clearing the basket or browser data.</p></div></section>
        <section><span>02</span><div><h2>What an enquiry stores</h2><p>With consent, the website stores the business name, contact name, buyer type, phone number, optional email, location, selected products, quantities, notes, consent timestamp, and follow-up status.</p></div></section>
        <section><span>03</span><div><h2>Purpose and retention</h2><p>Stored details are used only for business follow-up and enquiry management. Records expire automatically after 90 days and can also be deleted manually from the administration dashboard.</p></div></section>
        <section><span>04</span><div><h2>What not to submit</h2><p>Do not enter patient names, prescriptions, diagnoses, treatment histories, payment credentials, or other health information. This website does not provide patient accounts, prescription processing, checkout, or online payment.</p></div></section>
      </article>
    </main>
  );
}
