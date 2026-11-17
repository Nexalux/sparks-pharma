import type { CatalogListing } from "../app/lib/catalog-listing";

type ListingRow = Omit<CatalogListing, "image" | "retailReference" | "enquiryEligible"> & {
  enquiryEligible: number;
  src: string;
  alt: string;
};

const publishedListings = `
  SELECT p.slug, p.generic_name AS genericName, p.brand_name AS brandName,
    p.composition, p.category, p.dosage_form AS dosageForm, p.strength,
    p.pack_size AS packSize, p.manufacturer, p.availability,
    p.price_display AS priceDisplay, p.price_value AS priceValue, p.price_unit AS priceUnit,
    p.enquiry_eligible AS enquiryEligible,
    COALESCE(i.src, '/product-images/paracetamol.jpg') AS src,
    COALESCE(i.alt, p.generic_name || ' product image') AS alt
  FROM products p
  LEFT JOIN product_images i ON i.id = (
    SELECT id FROM product_images WHERE product_id = p.id ORDER BY sort_order, created_at LIMIT 1
  )
  WHERE p.status = 'published'
  ORDER BY p.generic_name COLLATE NOCASE, p.slug
`;

export async function publicCatalogResponse(db: D1Database) {
  const { results } = await db.prepare(publishedListings).all<ListingRow>();
  return Response.json(results.map(({ src, alt, enquiryEligible, ...row }): CatalogListing => ({
    ...row,
    enquiryEligible: enquiryEligible !== 0,
    image: { src, alt },
    retailReference: { display: row.priceValue || "Price on request", unit: row.priceUnit || "" },
  })));
}
