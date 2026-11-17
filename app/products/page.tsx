import { PublicCatalog } from "./PublicCatalog";
import { PageHero } from "../components/PageHero";
import { publicPageMetadata } from "../lib/seo";

export const metadata = publicPageMetadata(
  "Product catalog",
  "Browse generic medicine records for India-wide B2B trade enquiries.",
  "/products",
);

export default function ProductsPage() {
  return (
    <main>
      <PageHero
        className="catalog-page-hero"
        eyebrow="Generic medicine catalog"
        title="Find the right trade record."
        intro="Search and filter product records by composition, therapeutic category, dosage form, strength, manufacturer, pack format, availability, pricing, and enquiry status."
        code="SP / CATALOG"
        signals={["Search", "Compare", "Shortlist"]}
      />
      <PublicCatalog />
    </main>
  );
}
