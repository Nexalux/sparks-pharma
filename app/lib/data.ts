export type Product = {
  id?: string;
  slug: string;
  genericName: string;
  brandName?: string;
  composition: string;
  category: string;
  dosageForm: string;
  strength: string;
  packSize: string;
  manufacturer: string;
  regulatoryClassification: string;
  tradeNotes: string;
  detailContent?: ProductDetailContent;
  retailReference: ProductPriceReference;
  image: ProductImage;
  images?: ProductImage[];
  demonstration: boolean;
  publicApproved: boolean;
  status?: ProductStatus;
  priceDisplay?: PriceDisplay;
  priceValue?: string;
  priceUnit?: string;
  availability?: Availability;
  minimumQuantity?: number;
  enquiryEligible?: boolean;
  seoEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductStatus = "draft" | "review" | "published" | "archived";
export type PriceDisplay = "hidden" | "indicative" | "on_request";
export type Availability = "available" | "limited" | "on_request" | "unavailable";
export type AdminRole = "owner" | "editor";
export type IndexingMode = "preview" | "verified";

export type AuthPrincipal = {
  provider: "credential" | "google";
  providerSubject: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
};

export type ProductSource = { label: string; url: string };
export type ProductFaq = { question: string; answer: string };
export type ProductSafetyInfo = {
  commonSideEffects: string[];
  cautions: string[];
  storage: string;
};
export type ProductDetailContent = {
  overview: string;
  commonUses: string[];
  howItWorks: string;
  safety: ProductSafetyInfo;
  sources: ProductSource[];
  faqs: ProductFaq[];
  lastReviewedAt: string;
};

export type ThemePreference = {
  palette: "sky" | "galaxy";
  mode: "light" | "dark" | "system";
  reducedMotion: boolean;
};

export type MemberDashboardSummary = {
  profileCompletion: number;
  savedQuoteCount: number;
  activeEnquiryCount: number;
  recentEnquiryCount: number;
};

export type AdminDashboardSummary = {
  totalProducts: number;
  publishedProducts: number;
  contentReadyProducts: number;
  openEnquiries: number;
  totalMembers: number;
};

export type MemberProfile = {
  displayName: string;
  email: string;
  businessName: string;
  phone: string;
  preferredContact: "email" | "phone";
  buyerType: string;
  state: string;
  city: string;
  pincode: string;
};

export type MemberAccount = MemberProfile & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type MemberIdentity = {
  id: string;
  memberId: string;
  provider: AuthPrincipal["provider"];
  providerSubject: string;
  email: string;
  createdAt: string;
  lastSeenAt: string;
};

export type QuoteDraftItem = QuoteItem;
export type QuoteDraft = {
  id: string;
  memberId: string;
  name: string;
  items: QuoteDraftItem[];
  createdAt: string;
  updatedAt: string;
};

export type ServiceRegion = {
  country: "India";
  primaryState: string;
  message: string;
};

export type SiteSettings = {
  brandName: string;
  legalName: string;
  identityStatus: string;
  address: string;
  mapUrl: string;
  phone: string;
  email: string;
  whatsappNumber: string;
  licenceReferences: string[];
  businessHours: string;
  homepageHeadline: string;
  homepageIntro: string;
  serviceRegion: ServiceRegion;
  disclaimer: string;
  indexingMode: IndexingMode;
  identityVerified: boolean;
  contactsVerified: boolean;
  licencesVerified: boolean;
  privacyAcknowledged: boolean;
  disclaimerAcknowledged: boolean;
  advertisingAcknowledged: boolean;
  legalReviewAcknowledged: boolean;
};

export type EnquiryStatus = "new" | "contacted" | "qualified" | "closed";
export type Enquiry = {
  id: string;
  memberId?: string;
  businessName: string;
  contactName: string;
  buyerType: string;
  phone: string;
  email?: string;
  state: string;
  city: string;
  pincode: string;
  note?: string;
  consentedAt: string;
  status: EnquiryStatus;
  internalNotes?: string;
  createdAt: string;
  expiresAt: string;
};

export type MemberEnquirySummary = Omit<Enquiry, "internalNotes"> & {
  itemCount: number;
};

export type ProductPriceReference = {
  display: string;
  unit: string;
  checkedOn: string;
  sources: { label: string; url: string }[];
};

export type ProductImage = {
  src: string;
  alt: string;
  referenceNote: string;
  sourceLabel: string;
  sourceUrl: string;
  credit: string;
  licenseLabel: string;
  licenseUrl: string;
};

export type QuoteItem = {
  productSlug: string;
  quantity: number;
  note?: string;
};

export const GUJARAT_DISTRICTS = [
  "Ahmedabad",
  "Amreli",
  "Anand",
  "Aravalli",
  "Banaskantha",
  "Bharuch",
  "Bhavnagar",
  "Botad",
  "Chhota Udaipur",
  "Dahod",
  "Dang",
  "Devbhoomi Dwarka",
  "Gandhinagar",
  "Gir Somnath",
  "Jamnagar",
  "Junagadh",
  "Kheda",
  "Kutch",
  "Mahisagar",
  "Mehsana",
  "Morbi",
  "Narmada",
  "Navsari",
  "Panchmahal",
  "Patan",
  "Porbandar",
  "Rajkot",
  "Sabarkantha",
  "Surat",
  "Surendranagar",
  "Tapi",
  "Vadodara",
  "Valsad",
] as const;

export const SITE_CONFIG: {
  mode: "demonstration" | "public";
  brandName: string;
  legalName: string;
  identityStatus: string;
  serviceState: string;
  address: string;
  mapUrl: string;
  phone: string;
  email: string;
  whatsappNumber: string;
  licenceReferences: string[];
  socialLinks: string[];
} = {
  mode: "demonstration",
  brandName: "Sparks Pharma",
  legalName: "Sparks Pharma Distribution Private Limited",
  identityStatus: "Central procurement and distribution office serving verified trade buyers across India.",
  serviceState: "Gujarat",
  address: "Unit 14, Meridian Trade Centre, SG Highway, Ahmedabad, Gujarat 380054, India",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Ahmedabad%2C+Gujarat%2C+India",
  phone: "+91 00000 00000",
  email: "trade@sparkspharma.example",
  whatsappNumber: "",
  licenceReferences: [
    "Trade file SP-IND-2026-01",
    "Quality dossier SP-QMS-2026-02",
  ],
  socialLinks: [],
};

export const PRODUCTS: Product[] = [
  {
    slug: "paracetamol-500-tablets",
    genericName: "Paracetamol",
    composition: "Paracetamol IP 500 mg",
    category: "Pain relief",
    dosageForm: "Tablet",
    strength: "500 mg",
    packSize: "10 × 10 tablets",
    manufacturer: "Aerovanta Laboratories",
    regulatoryClassification: "Trade supply classification · buyer verification required",
    tradeNotes: "Batch, expiry, manufacturer documentation, and current supply terms are confirmed during quotation.",
    retailReference: {
      display: "₹8–₹10", unit: "per strip of 10", checkedOn: "20 Aug 2026",
      sources: [{ label: "Tata 1mg retail listing", url: "https://www.1mg.com/drugs/pa-500mg-tablet-351213" }],
    },
    image: {
      src: "/product-images/paracetamol.jpg",
      alt: "Reference photograph of paracetamol 500 mg tablets",
      referenceNote: "Reference photograph of 500 mg paracetamol tablets; packaging may differ from a future Sparks Pharma listing.",
      sourceLabel: "Wikimedia Commons",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Paracetamol_acetaminophen_500_mg_pills.jpg",
      credit: "Michelle Tribe",
      licenseLabel: "CC BY 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    },
    demonstration: true,
    publicApproved: false,
  },
  {
    slug: "pantoprazole-40-tablets",
    genericName: "Pantoprazole",
    composition: "Pantoprazole Sodium IP equivalent to Pantoprazole 40 mg",
    category: "Gastrointestinal",
    dosageForm: "Tablet",
    strength: "40 mg",
    packSize: "10 × 15 tablets",
    manufacturer: "Nexora Formulations",
    regulatoryClassification: "Trade supply classification · buyer verification required",
    tradeNotes: "Batch, expiry, manufacturer documentation, and current supply terms are confirmed during quotation.",
    retailReference: {
      display: "₹79–₹174", unit: "per strip of 15", checkedOn: "20 Aug 2026",
      sources: [
        { label: "Tata 1mg Pantop listing", url: "https://www.1mg.com/drugs/Pantop-Tablet-26028" },
        { label: "Tata 1mg PAN listing", url: "https://www.1mg.com/drugs/pan-40-mg-tablet-325250" },
      ],
    },
    image: {
      src: "/product-images/pantoprazole.jpg",
      alt: "Reference photograph of a pantoprazole tablet",
      referenceNote: "Reference photograph of a 20 mg pantoprazole tablet; this catalog record describes a 40 mg format.",
      sourceLabel: "Wikimedia Commons",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Pantoprazole_20mg.jpg",
      credit: "National Institutes of Health",
      licenseLabel: "Public domain",
      licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
    },
    demonstration: true,
    publicApproved: false,
  },
  {
    slug: "azithromycin-500-tablets",
    genericName: "Azithromycin",
    composition: "Azithromycin IP 500 mg",
    category: "Anti-infective",
    dosageForm: "Tablet",
    strength: "500 mg",
    packSize: "10 × 3 tablets",
    manufacturer: "Velmora Healthcare",
    regulatoryClassification: "Prescription medicine · trade verification required",
    tradeNotes: "Batch, expiry, manufacturer documentation, and current supply terms are confirmed during quotation.",
    retailReference: {
      display: "₹46–₹74", unit: "per strip of 3", checkedOn: "20 Aug 2026",
      sources: [{ label: "Tata 1mg retail listing", url: "https://www.1mg.com/drugs/azycin-500mg-tablet-280349" }],
    },
    image: {
      src: "/product-images/azithromycin.jpg",
      alt: "Reference photograph of azithromycin tablets",
      referenceNote: "Reference photograph of 250 mg branded azithromycin tablets; this catalog record describes a 500 mg generic format.",
      sourceLabel: "Wikimedia Commons",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Zithromax_(Azithromycin)_tablets.jpg",
      credit: "Anonymous1941",
      licenseLabel: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    demonstration: true,
    publicApproved: false,
  },
  {
    slug: "amoxicillin-clavulanate-625-tablets",
    genericName: "Amoxicillin + Clavulanate",
    composition: "Amoxicillin 500 mg + Clavulanic Acid 125 mg",
    category: "Anti-infective",
    dosageForm: "Tablet",
    strength: "625 mg",
    packSize: "10 × 6 tablets",
    manufacturer: "Aerovanta Laboratories",
    regulatoryClassification: "Prescription medicine · trade verification required",
    tradeNotes: "Batch, expiry, manufacturer documentation, and current supply terms are confirmed during quotation.",
    retailReference: {
      display: "₹79–₹107", unit: "per strip of 6", checkedOn: "20 Aug 2026",
      sources: [
        { label: "Tata 1mg Amoxmed-CV listing", url: "https://www.1mg.com/drugs/amoxmed-cv-500mg-125mg-tablet-583862" },
        { label: "Tata 1mg Allclav listing", url: "https://www.1mg.com/drugs/allclav-500mg-125mg-tablet-768770" },
      ],
    },
    image: {
      src: "/product-images/amoxicillin-clavulanate.jpg",
      alt: "Representative photograph of antibiotic capsules",
      referenceNote: "Representative amoxicillin photography only; the pictured medicine is not the 625 mg combination or pack described here.",
      sourceLabel: "Wikimedia Commons",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Antibiotic_pills.jpg",
      credit: "Maksym Kozlenko",
      licenseLabel: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    demonstration: true,
    publicApproved: false,
  },
  {
    slug: "cetirizine-10-tablets",
    genericName: "Cetirizine",
    composition: "Cetirizine Hydrochloride IP 10 mg",
    category: "Allergy care",
    dosageForm: "Tablet",
    strength: "10 mg",
    packSize: "20 × 10 tablets",
    manufacturer: "Nexora Formulations",
    regulatoryClassification: "Trade supply classification · buyer verification required",
    tradeNotes: "Batch, expiry, manufacturer documentation, and current supply terms are confirmed during quotation.",
    retailReference: {
      display: "₹12–₹20", unit: "per strip of 10", checkedOn: "20 Aug 2026",
      sources: [{ label: "Tata 1mg retail listing", url: "https://www.1mg.com/drugs/Cetiriz-Tablet-465985" }],
    },
    image: {
      src: "/product-images/cetirizine.jpg",
      alt: "Reference photograph of cetirizine 10 mg tablets",
      referenceNote: "Reference photograph of cetirizine 10 mg tablets; packaging may differ from a future listing.",
      sourceLabel: "Wikimedia Commons",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Cetirizin.jpg",
      credit: "Telaneo",
      licenseLabel: "CC0 1.0",
      licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    },
    demonstration: true,
    publicApproved: false,
  },
  {
    slug: "metformin-500-tablets",
    genericName: "Metformin",
    composition: "Metformin Hydrochloride IP 500 mg",
    category: "Metabolic care",
    dosageForm: "Tablet",
    strength: "500 mg",
    packSize: "10 × 20 tablets",
    manufacturer: "Velmora Healthcare",
    regulatoryClassification: "Prescription medicine · trade verification required",
    tradeNotes: "Batch, expiry, manufacturer documentation, and current supply terms are confirmed during quotation.",
    retailReference: {
      display: "₹24–₹42", unit: "per strip of 20", checkedOn: "20 Aug 2026",
      sources: [{ label: "PharmEasy retail listing", url: "https://pharmeasy.in/online-medicine-order/metform-500mg-strip-of-20-tablets-15963" }],
    },
    image: {
      src: "/product-images/metformin.jpg",
      alt: "Reference photograph of metformin 500 mg tablets",
      referenceNote: "Reference photograph of metformin 500 mg tablets; packaging may differ from a future listing.",
      sourceLabel: "Wikimedia Commons",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Metformin_500mg_Tablets.jpg",
      credit: "Ash",
      licenseLabel: "Public domain",
      licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
    },
    demonstration: true,
    publicApproved: false,
  },
  {
    slug: "cefixime-200-dispersible-tablets",
    genericName: "Cefixime",
    composition: "Cefixime IP 200 mg",
    category: "Anti-infective",
    dosageForm: "Dispersible tablet",
    strength: "200 mg",
    packSize: "10 × 10 tablets",
    manufacturer: "Aerovanta Laboratories",
    regulatoryClassification: "Prescription medicine · trade verification required",
    tradeNotes: "Batch, expiry, manufacturer documentation, and current supply terms are confirmed during quotation.",
    retailReference: {
      display: "₹63–₹103", unit: "per strip of 10", checkedOn: "20 Aug 2026",
      sources: [{ label: "Tata 1mg retail listing", url: "https://www.1mg.com/drugs/Cefix-Tablet-148152" }],
    },
    image: {
      src: "/product-images/cefixime.jpg",
      alt: "Representative photograph of pharmaceutical blister packs",
      referenceNote: "Representative blister-pack photography only; the image is not cefixime-specific and makes no stock claim.",
      sourceLabel: "Wikimedia Commons",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Blister_of_tablets.jpg",
      credit: "Tarasna0922",
      licenseLabel: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    demonstration: true,
    publicApproved: false,
  },
  {
    slug: "oral-rehydration-salts-powder",
    genericName: "Oral Rehydration Salts",
    composition: "WHO reduced-osmolarity formula",
    category: "Rehydration",
    dosageForm: "Powder",
    strength: "21.8 g",
    packSize: "20 sachets",
    manufacturer: "Nexora Formulations",
    regulatoryClassification: "Trade supply classification · buyer verification required",
    tradeNotes: "Batch, expiry, manufacturer documentation, and current supply terms are confirmed during quotation.",
    retailReference: {
      display: "₹11–₹23", unit: "per sachet", checkedOn: "20 Aug 2026",
      sources: [{ label: "Tata 1mg retail listing", url: "https://www.1mg.com/otc/electral-powder-for-replenishing-body-fluids-electrolytes-for-stomach-care-otc135154" }],
    },
    image: {
      src: "/product-images/ors.jpg",
      alt: "Reference photograph of an oral rehydration salts sachet",
      referenceNote: "Reference ORS sachet photograph; composition, branding, and pack details may differ from a future listing.",
      sourceLabel: "Wikimedia Commons",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Ors_sachet.jpg",
      credit: "Shubjt",
      licenseLabel: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    demonstration: true,
    publicApproved: false,
  },
];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  brandName: SITE_CONFIG.brandName,
  legalName: SITE_CONFIG.legalName,
  identityStatus: SITE_CONFIG.identityStatus,
  address: SITE_CONFIG.address,
  mapUrl: SITE_CONFIG.mapUrl,
  phone: SITE_CONFIG.phone,
  email: SITE_CONFIG.email,
  whatsappNumber: SITE_CONFIG.whatsappNumber,
  licenceReferences: SITE_CONFIG.licenceReferences,
  businessHours: "Monday–Saturday, 9:00 AM–6:00 PM IST",
  homepageHeadline: "Trade medicine sourcing, made clearer.",
  homepageIntro: "Search compositions, compare pack formats, build a quote basket, and submit one structured procurement enquiry from anywhere in India.",
  serviceRegion: {
    country: "India",
    primaryState: "Gujarat",
    message: "India-wide trade enquiries are accepted through our structured procurement desk. Gujarat remains the primary service region, with other locations confirmed during review.",
  },
  disclaimer: "Catalog information is for licensed trade enquiries only and is not medical advice, a stock confirmation, or an online offer for sale.",
  indexingMode: "preview",
  identityVerified: false,
  contactsVerified: false,
  licencesVerified: false,
  privacyAcknowledged: false,
  disclaimerAcknowledged: false,
  advertisingAcknowledged: false,
  legalReviewAcknowledged: false,
};
