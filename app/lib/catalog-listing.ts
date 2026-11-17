import type { Product } from "./data";

export type CatalogListing = Pick<Product,
  "slug" | "genericName" | "brandName" | "composition" | "category" | "dosageForm" |
  "strength" | "packSize" | "manufacturer" | "availability" | "priceDisplay" |
  "priceValue" | "priceUnit" | "enquiryEligible"
> & {
  image: Pick<Product["image"], "src" | "alt">;
  retailReference: Pick<Product["retailReference"], "display" | "unit">;
};
