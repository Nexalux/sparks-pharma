import type { Metadata } from "next";
import { PageHero } from "../components/PageHero";
import { QuoteBuilder } from "../components/QuoteBuilder";
import { getSettings, listPublicProducts } from "../lib/repository";
import { getMemberSession } from "../lib/member-auth";

export const metadata: Metadata = {
  title: "Quote basket",
  description: "Submit a structured India B2B medicine procurement enquiry.",
  robots: { index: false, follow: false },
};

export default async function QuotePage() {
  const [products, settings, session] = await Promise.all([listPublicProducts(), getSettings(), getMemberSession()]);
  return (
    <main>
      <PageHero
        className="quote-page-hero"
        eyebrow="India B2B trade enquiry"
        title="One basket. One clear conversation."
        intro="Review products, add business details, and submit one complete request to the procurement desk. Final pricing, stock, and fulfilment require human confirmation."
        aside={<div className="service-aside"><span>Enquiry coverage</span><strong>India-wide</strong><small>{settings.serviceRegion.primaryState} primary region</small></div>}
      />
      <QuoteBuilder products={products} member={session?.member} signInHref="/sign-in?returnTo=%2Fquote" />
    </main>
  );
}
