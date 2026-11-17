import { PRODUCTS, type Product, type ProductImage } from "./data";
import { EXPANDED_PRODUCTS } from "./catalog-expansion";

const referenceNote = "Reference photograph for product identification only. Pack presentation may vary by manufacturer and batch.";

function image(src: string, alt: string, sourceLabel: string, sourceUrl: string, credit: string): ProductImage {
  return { src, alt, referenceNote, sourceLabel, sourceUrl, credit, licenseLabel: "Third-party catalogue image · source attributed", licenseUrl: sourceUrl };
}

const CATALOG_ADDITIONS: Product[] = [
  {
    id: "portfolio-esom-40",
    slug: "esomeprazole-40mg-tablets",
    genericName: "Esomeprazole",
    composition: "Esomeprazole 40 mg",
    category: "Gastrointestinal",
    dosageForm: "Tablet",
    strength: "40 mg",
    packSize: "10 × 15 tablets",
    manufacturer: "Multiple source manufacturers",
    regulatoryClassification: "Trade supply classification · buyer verification required",
    tradeNotes: "Brand, manufacturer, batch, expiry, documentation, stock, and current terms are confirmed during enquiry review.",
    retailReference: { display: "Price on request", unit: "", checkedOn: "Not published", sources: [] },
    image: image("/product-images/catalog-additions/esomeprazole-40-tablets-1.webp", "Esomeprazole 40 mg tablets product photograph", "TradeIndia", "https://www.tradeindia.com/products/eso-40-tablets-c10476949.html", "ESO-40 tablets product photograph"),
    images: [
      image("/product-images/catalog-additions/esomeprazole-40-tablets-1.webp", "Esomeprazole 40 mg tablets product photograph", "TradeIndia", "https://www.tradeindia.com/products/eso-40-tablets-c10476949.html", "ESO-40 tablets product photograph"),
      image("/product-images/catalog-additions/esomeprazole-40-tablets-2.webp", "Esomeprazole 40 mg tablets alternate product photograph", "Medzone Poonch", "https://www.medzonepoonch.com/products/sompraz-40-tablet-1-strip-15-tablets-esomeprazole-40mg-SKU-3367", "Sompraz 40 tablets product photograph"),
    ],
    demonstration: true, publicApproved: false, status: "published", priceDisplay: "on_request", availability: "on_request", minimumQuantity: 10, enquiryEligible: true, seoEnabled: false,
  },
  {
    id: "portfolio-bude-200",
    slug: "budesonide-200mcg-inhaler",
    genericName: "Budesonide",
    composition: "Budesonide 200 mcg per actuation",
    category: "Allergy & respiratory",
    dosageForm: "Inhaler",
    strength: "200 mcg",
    packSize: "200 metered doses",
    manufacturer: "Multiple source manufacturers",
    regulatoryClassification: "Trade supply classification · buyer verification required",
    tradeNotes: "Brand, manufacturer, batch, expiry, documentation, stock, and current terms are confirmed during enquiry review.",
    retailReference: { display: "Price on request", unit: "", checkedOn: "Not published", sources: [] },
    image: image("/product-images/catalog-additions/budesonide-200-inhaler-1.webp", "Budesonide 200 mcg inhaler product photograph", "Maya Biotech", "https://mayabiotechindia.com/products/budesonide-inhaler-200-mcg/", "Budesonide inhaler product photograph"),
    images: [
      image("/product-images/catalog-additions/budesonide-200-inhaler-1.webp", "Budesonide 200 mcg inhaler product photograph", "Maya Biotech", "https://mayabiotechindia.com/products/budesonide-inhaler-200-mcg/", "Budesonide inhaler product photograph"),
      image("/product-images/catalog-additions/budesonide-200-inhaler-2.webp", "Budesonide 200 mcg inhaler alternate product photograph", "Cafoli", "https://cafoli.in/budesonide-200mcg-inhaler", "Budesonide inhaler product photograph"),
    ],
    demonstration: true, publicApproved: false, status: "published", priceDisplay: "on_request", availability: "on_request", minimumQuantity: 6, enquiryEligible: true, seoEnabled: false,
  },
  {
    id: "portfolio-adap-01",
    slug: "adapalene-01-gel",
    genericName: "Adapalene",
    composition: "Adapalene 0.1% w/w",
    category: "Dermatology",
    dosageForm: "Gel",
    strength: "0.1% w/w",
    packSize: "15 g tube",
    manufacturer: "Multiple source manufacturers",
    regulatoryClassification: "Trade supply classification · buyer verification required",
    tradeNotes: "Brand, manufacturer, batch, expiry, documentation, stock, and current terms are confirmed during enquiry review.",
    retailReference: { display: "Price on request", unit: "", checkedOn: "Not published", sources: [] },
    image: image("/product-images/catalog-additions/adapalene-gel-01-1.webp", "Adapalene 0.1% gel product photograph", "PharmEasy", "https://pharmeasy.in/online-medicine-order/adaferin-0-1-gel-15gm-33042", "Adaferin gel product photograph"),
    images: [
      image("/product-images/catalog-additions/adapalene-gel-01-1.webp", "Adapalene 0.1% gel product photograph", "PharmEasy", "https://pharmeasy.in/online-medicine-order/adaferin-0-1-gel-15gm-33042", "Adaferin gel product photograph"),
      image("/product-images/catalog-additions/adapalene-gel-01-2.webp", "Adapalene 0.1% gel alternate product photograph", "Jan Aushadhi Store", "https://janaushadhistore.online/product/adapalene-0-1-gel/", "Adapalene gel product photograph"),
    ],
    demonstration: true, publicApproved: false, status: "published", priceDisplay: "on_request", availability: "on_request", minimumQuantity: 12, enquiryEligible: true, seoEnabled: false,
  },
  {
    id: "portfolio-aspi-75",
    slug: "aspirin-75mg-tablets",
    genericName: "Aspirin",
    composition: "Aspirin 75 mg",
    category: "Cardio-metabolic",
    dosageForm: "Gastro-resistant tablet",
    strength: "75 mg",
    packSize: "25 × 14 tablets",
    manufacturer: "Multiple source manufacturers",
    regulatoryClassification: "Trade supply classification · buyer verification required",
    tradeNotes: "Brand, manufacturer, batch, expiry, documentation, stock, and current terms are confirmed during enquiry review.",
    retailReference: { display: "Price on request", unit: "", checkedOn: "Not published", sources: [] },
    image: image("/product-images/catalog-additions/aspirin-75-tablets-1.webp", "Aspirin 75 mg tablets product photograph", "Avecia Healthcare", "https://www.aveciahealthcare.com/product/avesprin-75-heart-health/", "Avesprin 75 tablets product photograph"),
    images: [
      image("/product-images/catalog-additions/aspirin-75-tablets-1.webp", "Aspirin 75 mg tablets product photograph", "Avecia Healthcare", "https://www.aveciahealthcare.com/product/avesprin-75-heart-health/", "Avesprin 75 tablets product photograph"),
      image("/product-images/catalog-additions/aspirin-75-tablets-2.webp", "Aspirin 75 mg tablets alternate product photograph", "West-Coast Pharmaceutical Works", "https://westcoastin.com/pharmaceutical/asp-300-75/682", "ASP-75 tablets product photograph"),
    ],
    demonstration: true, publicApproved: false, status: "published", priceDisplay: "on_request", availability: "on_request", minimumQuantity: 20, enquiryEligible: true, seoEnabled: false,
  },
];

export const PUBLIC_CATALOG: Product[] = [...PRODUCTS, ...EXPANDED_PRODUCTS, ...CATALOG_ADDITIONS]
  .sort((a, b) => a.genericName.localeCompare(b.genericName));
