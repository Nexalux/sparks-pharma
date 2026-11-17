import {
  DEFAULT_SITE_SETTINGS,
  type AdminRole,
  type AuthPrincipal,
  type Enquiry,
  type EnquiryStatus,
  type MemberAccount,
  type MemberProfile,
  type Product,
  type ProductDetailContent,
  type ProductImage,
  type ProductStatus,
  type QuoteDraft,
  type QuoteDraftItem,
  type SiteSettings,
  type ThemePreference,
} from "./data";
import { EXPANDED_PRODUCTS } from "./catalog-expansion";
import { PUBLIC_CATALOG } from "./catalog";
import { productMediaResponse } from "./product-media";
import { runtimeBindings } from "./runtime";

const ALL_PRODUCTS = PUBLIC_CATALOG;

// Bump this only when the runtime schema/content migrations change. A single
// marker lookup keeps ordinary cold starts from replaying every migration.
const RUNTIME_SCHEMA_MARKER = "runtime-schema-v1";
const initializedDatabases = new WeakSet<D1Database>();
const requestInitializations = new WeakMap<object, Promise<void>>();

const schemaStatements = [
  "CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, generic_name TEXT NOT NULL, brand_name TEXT, composition TEXT NOT NULL, category TEXT NOT NULL, dosage_form TEXT NOT NULL, strength TEXT NOT NULL, pack_size TEXT NOT NULL, manufacturer TEXT NOT NULL, regulatory_classification TEXT NOT NULL, trade_notes TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', is_demo INTEGER NOT NULL DEFAULT 1, public_approved INTEGER NOT NULL DEFAULT 0, price_display TEXT NOT NULL DEFAULT 'indicative', price_value TEXT, price_unit TEXT, price_checked_on TEXT, price_sources_json TEXT NOT NULL DEFAULT '[]', availability TEXT NOT NULL DEFAULT 'on_request', minimum_quantity INTEGER NOT NULL DEFAULT 1, enquiry_eligible INTEGER NOT NULL DEFAULT 1, seo_enabled INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug)",
  "CREATE INDEX IF NOT EXISTS idx_products_public_status ON products(status, is_demo, seo_enabled)",
  "CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)",
  "CREATE TABLE IF NOT EXISTS product_images (id TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE, object_key TEXT, src TEXT NOT NULL, alt TEXT NOT NULL, reference_note TEXT NOT NULL DEFAULT '', source_label TEXT NOT NULL DEFAULT 'Business-supplied image', source_url TEXT NOT NULL DEFAULT '', credit TEXT NOT NULL DEFAULT '', license_label TEXT NOT NULL DEFAULT 'Business supplied', license_url TEXT NOT NULL DEFAULT '', sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS media_objects (object_key TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE, content_type TEXT NOT NULL, byte_size INTEGER NOT NULL, data BLOB NOT NULL, created_at TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS idx_media_objects_product ON media_objects(product_id)",
  "CREATE TABLE IF NOT EXISTS content_migrations (key TEXT PRIMARY KEY, applied_at TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS idx_product_images_product_order ON product_images(product_id, sort_order)",
  "CREATE TABLE IF NOT EXISTS admin_users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, role TEXT NOT NULL, display_name TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS members (id TEXT PRIMARY KEY, display_name TEXT NOT NULL, email TEXT NOT NULL, business_name TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', preferred_contact TEXT NOT NULL DEFAULT 'email', buyer_type TEXT NOT NULL DEFAULT '', state TEXT NOT NULL DEFAULT 'Gujarat', city TEXT NOT NULL DEFAULT '', pincode TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS idx_members_email ON members(email)",
  "CREATE TABLE IF NOT EXISTS member_identities (id TEXT PRIMARY KEY, member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE, provider TEXT NOT NULL, provider_subject TEXT NOT NULL, email TEXT NOT NULL, created_at TEXT NOT NULL, last_seen_at TEXT NOT NULL)",
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_member_identities_provider_subject ON member_identities(provider, provider_subject)",
  "CREATE INDEX IF NOT EXISTS idx_member_identities_member ON member_identities(member_id)",
  "CREATE TABLE IF NOT EXISTS quote_drafts (id TEXT PRIMARY KEY, member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE, name TEXT NOT NULL, items_json TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS idx_quote_drafts_member_updated ON quote_drafts(member_id, updated_at)",
  "CREATE TABLE IF NOT EXISTS site_settings (id INTEGER PRIMARY KEY DEFAULT 1, brand_name TEXT NOT NULL, legal_name TEXT NOT NULL, identity_status TEXT NOT NULL, address TEXT NOT NULL, map_url TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL, whatsapp_number TEXT NOT NULL, licence_references_json TEXT NOT NULL DEFAULT '[]', business_hours TEXT NOT NULL, homepage_headline TEXT NOT NULL, homepage_intro TEXT NOT NULL, primary_state TEXT NOT NULL DEFAULT 'Gujarat', service_message TEXT NOT NULL, disclaimer TEXT NOT NULL, indexing_mode TEXT NOT NULL DEFAULT 'preview', identity_verified INTEGER NOT NULL DEFAULT 0, contacts_verified INTEGER NOT NULL DEFAULT 0, licences_verified INTEGER NOT NULL DEFAULT 0, privacy_acknowledged INTEGER NOT NULL DEFAULT 0, disclaimer_acknowledged INTEGER NOT NULL DEFAULT 0, advertising_acknowledged INTEGER NOT NULL DEFAULT 0, legal_review_acknowledged INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS enquiries (id TEXT PRIMARY KEY, member_id TEXT REFERENCES members(id) ON DELETE SET NULL, business_name TEXT NOT NULL, contact_name TEXT NOT NULL, buyer_type TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, state TEXT NOT NULL, city TEXT NOT NULL, pincode TEXT NOT NULL, note TEXT, consented_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', internal_notes TEXT, created_at TEXT NOT NULL, expires_at TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS idx_enquiries_status_created ON enquiries(status, created_at)",
  "CREATE INDEX IF NOT EXISTS idx_enquiries_expires_at ON enquiries(expires_at)",
  "CREATE TABLE IF NOT EXISTS enquiry_items (id TEXT PRIMARY KEY, enquiry_id TEXT NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE, product_id TEXT, product_slug TEXT NOT NULL, product_name TEXT NOT NULL, quantity INTEGER NOT NULL, note TEXT)",
  "CREATE INDEX IF NOT EXISTS idx_enquiry_items_enquiry ON enquiry_items(enquiry_id)",
  "CREATE TABLE IF NOT EXISTS enquiry_status_events (id TEXT PRIMARY KEY, enquiry_id TEXT NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE, status TEXT NOT NULL, message TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS idx_enquiry_status_events_enquiry_created ON enquiry_status_events(enquiry_id, created_at)",
];

function database(): D1Database | null {
  return runtimeBindings().DB || null;
}

function asBoolean(value: unknown) {
  return value === 1 || value === true;
}

function safeJson<T>(value: unknown, fallback: T): T {
  try {
    return typeof value === "string" ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function initialize(db: D1Database) {
  if (initializedDatabases.has(db)) return;
  const request = runtimeBindings();
  let initialization = requestInitializations.get(request);
  if (!initialization) {
    initialization = (async () => {
      try {
        const applied = await db.prepare("SELECT key FROM content_migrations WHERE key = ?")
          .bind(RUNTIME_SCHEMA_MARKER).first();
        if (applied) return;
      } catch {
        // A brand-new database does not have content_migrations yet.
      }

      await db.batch(schemaStatements.map((sql) => db.prepare(sql)));
      await migrateMemberSchema(db);
      await migratePlan4Schema(db);
      await migrateRetiredEarthTheme(db);
      await migrateEnquiryTracking(db);
      const count = await db.prepare("SELECT COUNT(*) AS count FROM products").first<{ count: number }>();
      if (!count?.count) await seedCatalog(db);
      const settings = await db.prepare("SELECT id FROM site_settings WHERE id = 1").first();
      if (!settings) await insertDefaultSettings(db);
      await migratePortfolioContent(db);
      await migrateExpandedCatalog(db);
      await migrateExpandedProductArtwork(db);
      await db.prepare("PRAGMA optimize").run();
      await db.prepare("INSERT OR REPLACE INTO content_migrations (key, applied_at) VALUES (?, ?)")
        .bind(RUNTIME_SCHEMA_MARKER, new Date().toISOString()).run();
    })().then(() => {
      initializedDatabases.add(db);
    }).catch((error) => {
      requestInitializations.delete(request);
      throw error;
    });
    requestInitializations.set(request, initialization);
  }
  await initialization;
}

async function migratePlan4Schema(db: D1Database) {
  const [productColumns, memberColumns] = await Promise.all([
    db.prepare("PRAGMA table_info(products)").all<{ name: string }>(),
    db.prepare("PRAGMA table_info(members)").all<{ name: string }>(),
  ]);
  const statements: D1PreparedStatement[] = [];
  if (!productColumns.results.some((column) => column.name === "detail_content_json")) statements.push(db.prepare("ALTER TABLE products ADD COLUMN detail_content_json TEXT NOT NULL DEFAULT '{}'"));
  if (!memberColumns.results.some((column) => column.name === "theme_preference_json")) statements.push(db.prepare("ALTER TABLE members ADD COLUMN theme_preference_json TEXT NOT NULL DEFAULT '{\"palette\":\"sky\",\"mode\":\"system\",\"reducedMotion\":false}'"));
  if (statements.length) await db.batch(statements);
}

async function migrateEnquiryTracking(db: D1Database) {
  const missing = await db.prepare("SELECT e.id, e.status, e.created_at FROM enquiries e WHERE NOT EXISTS (SELECT 1 FROM enquiry_status_events se WHERE se.enquiry_id = e.id)").all<{ id: string; status: EnquiryStatus; created_at: string }>();
  if (!missing.results.length) return;
  const messages: Record<EnquiryStatus, string> = {
    new: "Enquiry received and queued for review.",
    contacted: "Buyer contact has started.",
    qualified: "Requirements are under detailed review.",
    closed: "Enquiry follow-up has been completed.",
  };
  await db.batch(missing.results.map((row) => db.prepare("INSERT INTO enquiry_status_events (id, enquiry_id, status, message, created_at) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), row.id, row.status, messages[row.status] || "Enquiry status updated.", row.created_at)));
}

async function migrateRetiredEarthTheme(db: D1Database) {
  await db.prepare("UPDATE members SET theme_preference_json = json_set(theme_preference_json, '$.palette', 'sky'), updated_at = ? WHERE json_valid(theme_preference_json) AND json_extract(theme_preference_json, '$.palette') = 'earth'")
    .bind(new Date().toISOString()).run();
}

const categoryEducation: Record<string, { uses: string[]; mechanism: string; effects: string[]; cautions: string[] }> = {
  "Pain relief": { uses: ["General relief of mild to moderate pain", "Reduction of fever when clinically appropriate"], mechanism: "The active ingredient influences chemical messengers involved in pain and temperature regulation. Exact action and suitability depend on the composition.", effects: ["Nausea or stomach discomfort may occur", "Allergic reactions are uncommon but require urgent attention"], cautions: ["Check the total amount of the same active ingredient across products", "People with liver or kidney conditions should seek professional advice"] },
  "Gastrointestinal": { uses: ["Management of composition-specific digestive or acid-related conditions"], mechanism: "Gastrointestinal medicines act through composition-specific pathways such as reducing acid production or supporting digestive function.", effects: ["Headache, nausea, or digestive changes may occur"], cautions: ["Persistent or severe symptoms require professional assessment", "Long-term use should follow approved medical guidance"] },
  "Anti-infective": { uses: ["Treatment of susceptible bacterial infections when prescribed by a qualified professional"], mechanism: "The active ingredient targets susceptible bacteria through a composition-specific mechanism. It does not treat viral infections.", effects: ["Nausea, diarrhoea, or abdominal discomfort may occur", "Rash or serious allergic reaction requires prompt medical attention"], cautions: ["Use only when prescribed and complete the prescribed course", "Allergy history and antimicrobial-resistance guidance must be considered"] },
  "Allergy care": { uses: ["Relief of composition-appropriate allergy symptoms"], mechanism: "Many allergy medicines reduce the effect of histamine, a chemical involved in allergic symptoms.", effects: ["Drowsiness, dry mouth, or headache may occur"], cautions: ["Check whether the specific product can impair alertness", "Seek urgent help for breathing difficulty or severe swelling"] },
  "Metabolic care": { uses: ["Management of composition-specific metabolic conditions under professional supervision"], mechanism: "The active ingredient supports metabolic control through composition-specific effects on glucose handling or related pathways.", effects: ["Digestive discomfort or appetite changes may occur"], cautions: ["Monitoring and professional supervision are important", "This catalog does not provide dosing or treatment decisions"] },
  "Rehydration": { uses: ["Replacement of water and electrolytes during dehydration when appropriate"], mechanism: "Glucose and electrolytes support absorption of water through the intestine when prepared exactly as directed on the approved pack.", effects: ["Nausea or fullness may occur if taken too quickly"], cautions: ["Use the exact water volume shown on the pack", "Severe dehydration, persistent vomiting, or reduced consciousness needs urgent care"] },
};

function defaultDetailContent(product: Pick<Product, "genericName" | "composition" | "category" | "dosageForm">): ProductDetailContent {
  const info = categoryEducation[product.category] || { uses: ["Composition-specific use under qualified professional guidance"], mechanism: "The active ingredient works through a composition-specific mechanism described in its approved product information.", effects: ["Side effects vary by active ingredient and individual"], cautions: ["Review approved product information and seek qualified advice"] };
  return {
    overview: `${product.genericName} is presented in this B2B catalog as ${product.composition} in ${product.dosageForm.toLowerCase()} form. Pack, batch, expiry, manufacturer documents, and current supply terms are confirmed during enquiry review.`,
    commonUses: info.uses,
    howItWorks: info.mechanism,
    safety: { commonSideEffects: info.effects, cautions: info.cautions, storage: "Store according to the approved pack instructions, protected from unsuitable heat, moisture, and direct light. Keep out of reach of children." },
    sources: [{ label: "MedlinePlus drug information", url: "https://medlineplus.gov/druginformation.html" }, { label: "NHS medicines guidance", url: "https://www.nhs.uk/medicines/" }],
    faqs: [{ question: "Is this an online order?", answer: "No. This page supports a B2B trade enquiry. Price, stock, documentation, and serviceability require human confirmation." }, { question: "Does this page provide dosage advice?", answer: "No. It provides general catalog information only and does not replace approved prescribing information or professional advice." }],
    lastReviewedAt: "2026-08-23",
  };
}

async function migrateMemberSchema(db: D1Database) {
  const columns = await db.prepare("PRAGMA table_info(enquiries)").all<{ name: string }>();
  if (!columns.results.some((column) => column.name === "member_id")) {
    await db.prepare("ALTER TABLE enquiries ADD COLUMN member_id TEXT REFERENCES members(id) ON DELETE SET NULL").run();
  }
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_enquiries_member_created ON enquiries(member_id, created_at)").run();
}

async function migratePortfolioContent(db: D1Database) {
  const legacy = await db.prepare("SELECT legal_name, email FROM site_settings WHERE id = 1").first<{ legal_name: string; email: string }>();
  if (legacy?.legal_name === "Vanguard Chudil Pharmaceuticals" || legacy?.email === "tanishq.temp.acc@gmail.com") {
    const s = DEFAULT_SITE_SETTINGS;
    await db.prepare("UPDATE site_settings SET brand_name = ?, legal_name = ?, identity_status = ?, address = ?, map_url = ?, phone = ?, email = ?, whatsapp_number = ?, licence_references_json = ?, business_hours = ?, homepage_headline = ?, homepage_intro = ?, primary_state = ?, service_message = ?, disclaimer = ?, updated_at = ? WHERE id = 1")
      .bind(s.brandName, s.legalName, s.identityStatus, s.address, s.mapUrl, s.phone, s.email, s.whatsappNumber, JSON.stringify(s.licenceReferences), s.businessHours, s.homepageHeadline, s.homepageIntro, s.serviceRegion.primaryState, s.serviceRegion.message, s.disclaimer, new Date().toISOString()).run();
  }

  const legacyProducts = await db.prepare("SELECT COUNT(*) AS count FROM products WHERE manufacturer LIKE 'Sample manufacturer %' OR regulatory_classification LIKE 'Demo classification%'").first<{ count: number }>();
  if (Number(legacyProducts?.count || 0) > 0) {
    const now = new Date().toISOString();
    await db.batch([
      db.prepare("UPDATE products SET manufacturer = CASE manufacturer WHEN 'Sample manufacturer A' THEN 'Aerovanta Laboratories' WHEN 'Sample manufacturer B' THEN 'Nexora Formulations' WHEN 'Sample manufacturer C' THEN 'Velmora Healthcare' ELSE manufacturer END, regulatory_classification = CASE WHEN category = 'Anti-infective' OR category = 'Metabolic care' THEN 'Prescription medicine · trade verification required' ELSE 'Trade supply classification · buyer verification required' END, trade_notes = 'Batch, expiry, manufacturer documentation, and current supply terms are confirmed during quotation.', updated_at = ? WHERE manufacturer LIKE 'Sample manufacturer %' OR regulatory_classification LIKE 'Demo classification%'").bind(now),
      db.prepare("UPDATE product_images SET alt = (SELECT generic_name || ' product image' FROM products WHERE products.id = product_images.product_id), reference_note = 'Catalog image for product identification. Pack presentation may vary by manufacturer and batch.' WHERE alt LIKE '%Representative%' OR alt LIKE '%Reference%' OR reference_note LIKE '%demo%' OR reference_note LIKE '%future%' OR reference_note LIKE '%Representative%' OR reference_note LIKE '%reference%'"),
    ]);
  }
}

async function seedCatalog(db: D1Database) {
  const now = new Date().toISOString();
  const statements: D1PreparedStatement[] = [];
  for (const product of ALL_PRODUCTS) {
    const id = crypto.randomUUID();
    statements.push(
      db.prepare("INSERT INTO products (id, slug, generic_name, brand_name, composition, category, dosage_form, strength, pack_size, manufacturer, regulatory_classification, trade_notes, status, is_demo, public_approved, price_display, price_value, price_unit, price_checked_on, price_sources_json, availability, minimum_quantity, enquiry_eligible, seo_enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 1, 0, 'indicative', ?, ?, ?, ?, 'on_request', 1, 1, 0, ?, ?)")
        .bind(id, product.slug, product.genericName, product.brandName || null, product.composition, product.category, product.dosageForm, product.strength, product.packSize, product.manufacturer, product.regulatoryClassification, product.tradeNotes, product.retailReference.display, product.retailReference.unit, product.retailReference.checkedOn, JSON.stringify(product.retailReference.sources), now, now),
    );
    for (const [sortOrder, image] of (product.images || [product.image]).entries()) {
      statements.push(db.prepare("INSERT INTO product_images (id, product_id, src, alt, reference_note, source_label, source_url, credit, license_label, license_url, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(crypto.randomUUID(), id, image.src, image.alt, image.referenceNote, image.sourceLabel, image.sourceUrl, image.credit, image.licenseLabel, image.licenseUrl, sortOrder, now));
    }
  }
  for (let index = 0; index < statements.length; index += 50) await db.batch(statements.slice(index, index + 50));
}

async function migrateExpandedCatalog(db: D1Database) {
  const existing = await db.prepare("SELECT slug FROM products").all<{ slug: string }>();
  const slugs = new Set(existing.results.map((row) => row.slug));
  const statements: D1PreparedStatement[] = [];
  const now = new Date().toISOString();
  for (const product of EXPANDED_PRODUCTS) {
    if (slugs.has(product.slug)) continue;
    const id = crypto.randomUUID();
    statements.push(db.prepare("INSERT INTO products (id, slug, generic_name, brand_name, composition, category, dosage_form, strength, pack_size, manufacturer, regulatory_classification, trade_notes, status, is_demo, public_approved, price_display, price_value, price_unit, price_checked_on, price_sources_json, availability, minimum_quantity, enquiry_eligible, seo_enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 1, 0, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)")
      .bind(id, product.slug, product.genericName, product.brandName || null, product.composition, product.category, product.dosageForm, product.strength, product.packSize, product.manufacturer, product.regulatoryClassification, product.tradeNotes, product.priceDisplay, product.priceValue || null, product.priceUnit || null, product.retailReference.checkedOn, JSON.stringify(product.retailReference.sources), product.availability, product.minimumQuantity, product.enquiryEligible === false ? 0 : 1, now, now));
    for (const [sortOrder, image] of product.images.entries()) {
      statements.push(db.prepare("INSERT INTO product_images (id, product_id, src, alt, reference_note, source_label, source_url, credit, license_label, license_url, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(crypto.randomUUID(), id, image.src, image.alt, image.referenceNote, image.sourceLabel, image.sourceUrl, image.credit, image.licenseLabel, image.licenseUrl, sortOrder, now));
    }
  }
  for (let index = 0; index < statements.length; index += 50) await db.batch(statements.slice(index, index + 50));
}

async function migrateExpandedProductArtwork(db: D1Database) {
  const migrationKey = "expanded-real-product-photography-v2";
  const applied = await db.prepare("SELECT key FROM content_migrations WHERE key = ?").bind(migrationKey).first();
  if (applied) return;
  const statements: D1PreparedStatement[] = [];
  for (const product of EXPANDED_PRODUCTS) {
    for (const [sortOrder, image] of product.images.entries()) {
      statements.push(db.prepare("UPDATE product_images SET src = ?, alt = ?, reference_note = ?, source_label = ?, source_url = ?, credit = ?, license_label = ?, license_url = ? WHERE product_id = (SELECT id FROM products WHERE slug = ?) AND sort_order = ? AND (src LIKE '/api/catalog-art/%' OR src LIKE '/product-images/%.jpg')")
        .bind(image.src, image.alt, image.referenceNote, image.sourceLabel, image.sourceUrl, image.credit, image.licenseLabel, image.licenseUrl, product.slug, sortOrder));
    }
  }
  for (let index = 0; index < statements.length; index += 50) await db.batch(statements.slice(index, index + 50));
  await db.prepare("INSERT OR REPLACE INTO content_migrations (key, applied_at) VALUES (?, ?)").bind(migrationKey, new Date().toISOString()).run();
}

async function insertDefaultSettings(db: D1Database) {
  const s = DEFAULT_SITE_SETTINGS;
  await db.prepare("INSERT INTO site_settings (id, brand_name, legal_name, identity_status, address, map_url, phone, email, whatsapp_number, licence_references_json, business_hours, homepage_headline, homepage_intro, primary_state, service_message, disclaimer, indexing_mode, identity_verified, contacts_verified, licences_verified, privacy_acknowledged, disclaimer_acknowledged, advertising_acknowledged, legal_review_acknowledged, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, ?)")
    .bind(s.brandName, s.legalName, s.identityStatus, s.address, s.mapUrl, s.phone, s.email, s.whatsappNumber, JSON.stringify(s.licenceReferences), s.businessHours, s.homepageHeadline, s.homepageIntro, s.serviceRegion.primaryState, s.serviceRegion.message, s.disclaimer, s.indexingMode, new Date().toISOString()).run();
}

function fallbackProduct(product: Product): Product {
  const images = (product.images || [product.image]).map((image) => ({
    ...image,
    alt: `${product.genericName} product image`,
    referenceNote: "Catalog image for product identification. Pack presentation may vary by manufacturer and batch.",
  }));
  return {
    ...product,
    image: images[0],
    images,
    id: product.slug,
    status: "published",
    priceDisplay: "indicative",
    priceValue: product.retailReference.display,
    priceUnit: product.retailReference.unit,
    availability: "on_request",
    minimumQuantity: 1,
    enquiryEligible: true,
    seoEnabled: false,
    detailContent: product.detailContent || defaultDetailContent(product),
  };
}

function rowToProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    slug: String(row.slug),
    genericName: String(row.generic_name),
    brandName: row.brand_name ? String(row.brand_name) : undefined,
    composition: String(row.composition),
    category: String(row.category),
    dosageForm: String(row.dosage_form),
    strength: String(row.strength),
    packSize: String(row.pack_size),
    manufacturer: String(row.manufacturer),
    regulatoryClassification: String(row.regulatory_classification),
    tradeNotes: String(row.trade_notes),
    detailContent: Object.keys(safeJson<Record<string, unknown>>(row.detail_content_json, {})).length ? safeJson<ProductDetailContent>(row.detail_content_json, defaultDetailContent({ genericName: String(row.generic_name), composition: String(row.composition), category: String(row.category), dosageForm: String(row.dosage_form) })) : defaultDetailContent({ genericName: String(row.generic_name), composition: String(row.composition), category: String(row.category), dosageForm: String(row.dosage_form) }),
    retailReference: {
      display: String(row.price_value || "Price on request"),
      unit: String(row.price_unit || ""),
      checkedOn: String(row.price_checked_on || "Not published"),
      sources: safeJson(row.price_sources_json, []),
    },
    image: {
      src: String(row.image_src || "/product-images/paracetamol.jpg"),
      alt: String(row.image_alt || (String(row.generic_name) + " product image")),
      referenceNote: String(row.reference_note || "Product image supplied for catalog reference."),
      sourceLabel: String(row.source_label || "Business-supplied image"),
      sourceUrl: String(row.source_url || ""),
      credit: String(row.credit || ""),
      licenseLabel: String(row.license_label || "Business supplied"),
      licenseUrl: String(row.license_url || ""),
    },
    demonstration: asBoolean(row.is_demo),
    publicApproved: asBoolean(row.public_approved),
    status: String(row.status) as ProductStatus,
    priceDisplay: String(row.price_display) as Product["priceDisplay"],
    priceValue: row.price_value ? String(row.price_value) : undefined,
    priceUnit: row.price_unit ? String(row.price_unit) : undefined,
    availability: String(row.availability) as Product["availability"],
    minimumQuantity: Number(row.minimum_quantity || 1),
    enquiryEligible: asBoolean(row.enquiry_eligible),
    seoEnabled: asBoolean(row.seo_enabled),
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || ""),
  };
}

const productSelect = "SELECT p.*, i.src AS image_src, i.alt AS image_alt, i.reference_note, i.source_label, i.source_url, i.credit, i.license_label, i.license_url FROM products p LEFT JOIN product_images i ON i.id = (SELECT id FROM product_images WHERE product_id = p.id ORDER BY sort_order, created_at LIMIT 1)";

export async function listPublicProducts(): Promise<Product[]> {
  const db = database();
  if (!db) return ALL_PRODUCTS.map(fallbackProduct);
  await initialize(db);
  const result = await db.prepare(productSelect + " WHERE p.status = 'published' ORDER BY p.generic_name").all<Record<string, unknown>>();
  return result.results.map(rowToProduct);
}

export async function getPublicProduct(slug: string): Promise<Product | null> {
  const db = database();
  if (!db) {
    const product = ALL_PRODUCTS.find((item) => item.slug === slug);
    return product ? fallbackProduct(product) : null;
  }
  await initialize(db);
  const row = await db.prepare(productSelect + " WHERE p.slug = ? AND p.status = 'published' LIMIT 1").bind(slug).first<Record<string, unknown>>();
  return row ? rowToProduct(row) : null;
}

export async function listAdminProducts(): Promise<Product[]> {
  const db = database();
  if (!db) return ALL_PRODUCTS.map(fallbackProduct);
  await initialize(db);
  const result = await db.prepare(productSelect + " ORDER BY p.updated_at DESC").all<Record<string, unknown>>();
  return result.results.map(rowToProduct);
}

export type ProductInput = Omit<Product, "id" | "image" | "retailReference" | "createdAt" | "updatedAt"> & {
  id?: string;
  image?: Product["image"];
  retailReference?: Product["retailReference"];
};

export async function saveProduct(input: ProductInput, existingId?: string) {
  const db = database();
  if (!db) throw new Error("Database unavailable");
  await initialize(db);
  const now = new Date().toISOString();
  const id = existingId || crypto.randomUUID();
  const price = input.retailReference || { display: input.priceValue || "", unit: input.priceUnit || "", checkedOn: "", sources: [] };
  if (existingId) {
    await db.prepare("UPDATE products SET slug = ?, generic_name = ?, brand_name = ?, composition = ?, category = ?, dosage_form = ?, strength = ?, pack_size = ?, manufacturer = ?, regulatory_classification = ?, trade_notes = ?, detail_content_json = ?, status = ?, is_demo = ?, public_approved = ?, price_display = ?, price_value = ?, price_unit = ?, price_checked_on = ?, price_sources_json = ?, availability = ?, minimum_quantity = ?, enquiry_eligible = ?, seo_enabled = ?, updated_at = ? WHERE id = ?")
      .bind(input.slug, input.genericName, input.brandName || null, input.composition, input.category, input.dosageForm, input.strength, input.packSize, input.manufacturer, input.regulatoryClassification, input.tradeNotes, JSON.stringify(input.detailContent || defaultDetailContent(input)), input.status || "draft", input.demonstration ? 1 : 0, input.publicApproved ? 1 : 0, input.priceDisplay || "hidden", input.priceValue || price.display || null, input.priceUnit || price.unit || null, price.checkedOn || null, JSON.stringify(price.sources || []), input.availability || "on_request", input.minimumQuantity || 1, input.enquiryEligible === false ? 0 : 1, input.seoEnabled ? 1 : 0, now, existingId).run();
  } else {
    await db.prepare("INSERT INTO products (id, slug, generic_name, brand_name, composition, category, dosage_form, strength, pack_size, manufacturer, regulatory_classification, trade_notes, detail_content_json, status, is_demo, public_approved, price_display, price_value, price_unit, price_checked_on, price_sources_json, availability, minimum_quantity, enquiry_eligible, seo_enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(id, input.slug, input.genericName, input.brandName || null, input.composition, input.category, input.dosageForm, input.strength, input.packSize, input.manufacturer, input.regulatoryClassification, input.tradeNotes, JSON.stringify(input.detailContent || defaultDetailContent(input)), input.status || "draft", input.demonstration ? 1 : 0, input.publicApproved ? 1 : 0, input.priceDisplay || "hidden", input.priceValue || price.display || null, input.priceUnit || price.unit || null, price.checkedOn || null, JSON.stringify(price.sources || []), input.availability || "on_request", input.minimumQuantity || 1, input.enquiryEligible === false ? 0 : 1, input.seoEnabled ? 1 : 0, now, now).run();
  }
  if (input.image && !existingId) await saveImageMetadata(id, input.image);
  return id;
}

export async function saveImageMetadata(productId: string, image: Product["image"], objectKey?: string) {
  const db = database();
  if (!db) throw new Error("Database unavailable");
  await initialize(db);
  await db.prepare("INSERT INTO product_images (id, product_id, object_key, src, alt, reference_note, source_label, source_url, credit, license_label, license_url, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT MAX(sort_order) + 1 FROM product_images WHERE product_id = ?), 0), ?)")
    .bind(crypto.randomUUID(), productId, objectKey || null, image.src, image.alt, image.referenceNote, image.sourceLabel, image.sourceUrl, image.credit, image.licenseLabel, image.licenseUrl, productId, new Date().toISOString()).run();
}

export async function listProductImages(productId: string) {
  const db = database();
  if (!db) return [];
  await initialize(db);
  const { results } = await db.prepare("SELECT id, product_id, object_key, src, alt, reference_note, source_label, source_url, credit, license_label, license_url, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order, created_at").bind(productId).all();
  return results.map((image) => image.object_key
    ? { ...image, src: `/api/admin/products/${encodeURIComponent(productId)}/images?preview=${encodeURIComponent(String(image.id))}` }
    : image);
}

export async function listPublicProductImages(productId: string): Promise<(ProductImage & { id?: string; sortOrder?: number })[]> {
  const db = database();
  if (!db) {
    const product = ALL_PRODUCTS.find((item) => item.slug === productId || item.id === productId);
    return (product?.images || (product ? [product.image] : [])).map((image, index) => ({
      ...image,
      id: productId + "-" + index,
      referenceNote: "Catalog image for product identification. Pack presentation may vary by manufacturer and batch.",
    }));
  }
  await initialize(db);
  const result = await db.prepare("SELECT id, src, alt, reference_note, source_label, source_url, credit, license_label, license_url, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order, created_at").bind(productId).all<Record<string, unknown>>();
  return result.results.map((row) => ({
    id: String(row.id),
    src: String(row.src),
    alt: String(row.alt),
    referenceNote: String(row.reference_note || "Catalog image for product identification."),
    sourceLabel: String(row.source_label || "Business-supplied image"),
    sourceUrl: String(row.source_url || ""),
    credit: String(row.credit || ""),
    licenseLabel: String(row.license_label || "Business supplied"),
    licenseUrl: String(row.license_url || ""),
    sortOrder: Number(row.sort_order || 0),
  }));
}

export async function updateProductImage(productId: string, imageId: string, alt: string, referenceNote: string, sortOrder: number) {
  const db = database();
  if (!db) throw new Error("Database unavailable");
  await initialize(db);
  await db.prepare("UPDATE product_images SET alt = ?, reference_note = ?, sort_order = ? WHERE id = ? AND product_id = ?").bind(alt, referenceNote, sortOrder, imageId, productId).run();
}

export async function removeProductImage(productId: string, imageId: string) {
  const db = database();
  if (!db) throw new Error("Database unavailable");
  await initialize(db);
  const image = await db.prepare("SELECT object_key FROM product_images WHERE id = ? AND product_id = ?").bind(imageId, productId).first<{ object_key?: string }>();
  await db.prepare("DELETE FROM product_images WHERE id = ? AND product_id = ?").bind(imageId, productId).run();
  return image?.object_key || null;
}

export async function saveDatabaseMedia(objectKey: string, productId: string, contentType: string, data: ArrayBuffer) {
  const db = database();
  if (!db) throw new Error("Database unavailable");
  await initialize(db);
  await db.prepare("INSERT INTO media_objects (object_key, product_id, content_type, byte_size, data, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(objectKey, productId, contentType, data.byteLength, data, new Date().toISOString()).run();
}

export function readProductMedia(request: Request, objectKey: string, adminPreview = false) {
  const { DB, MEDIA } = runtimeBindings();
  return productMediaResponse(request, objectKey, DB, MEDIA, adminPreview);
}

export async function getProductImageObjectKey(productId: string, imageId: string) {
  const db = database();
  if (!db) return null;
  await initialize(db);
  return db.prepare("SELECT object_key FROM product_images WHERE product_id = ? AND id = ?")
    .bind(productId, imageId).first<string>("object_key");
}

export async function removeDatabaseMedia(objectKey: string) {
  const db = database();
  if (!db) return;
  await initialize(db);
  await db.prepare("DELETE FROM media_objects WHERE object_key = ?").bind(objectKey).run();
}

export async function duplicateProduct(id: string) {
  const products = await listAdminProducts();
  const source = products.find((product) => product.id === id);
  if (!source) throw new Error("Product not found");
  const suffix = crypto.randomUUID().slice(0, 6);
  return saveProduct({ ...source, slug: source.slug + "-copy-" + suffix, genericName: source.genericName + " (copy)", status: "draft", publicApproved: false, seoEnabled: false }, undefined);
}

export async function deleteProduct(id: string) {
  const db = database();
  if (!db) throw new Error("Database unavailable");
  await initialize(db);
  await db.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
}

export async function getSettings(): Promise<SiteSettings> {
  const db = database();
  if (!db) return DEFAULT_SITE_SETTINGS;
  await initialize(db);
  const row = await db.prepare("SELECT * FROM site_settings WHERE id = 1").first<Record<string, unknown>>();
  if (!row) return DEFAULT_SITE_SETTINGS;
  return {
    brandName: String(row.brand_name), legalName: String(row.legal_name), identityStatus: String(row.identity_status), address: String(row.address), mapUrl: String(row.map_url), phone: String(row.phone), email: String(row.email), whatsappNumber: String(row.whatsapp_number), licenceReferences: safeJson(row.licence_references_json, []), businessHours: String(row.business_hours), homepageHeadline: String(row.homepage_headline), homepageIntro: String(row.homepage_intro), serviceRegion: { country: "India", primaryState: String(row.primary_state), message: String(row.service_message) }, disclaimer: String(row.disclaimer), indexingMode: String(row.indexing_mode) as SiteSettings["indexingMode"], identityVerified: asBoolean(row.identity_verified), contactsVerified: asBoolean(row.contacts_verified), licencesVerified: asBoolean(row.licences_verified), privacyAcknowledged: asBoolean(row.privacy_acknowledged), disclaimerAcknowledged: asBoolean(row.disclaimer_acknowledged), advertisingAcknowledged: asBoolean(row.advertising_acknowledged), legalReviewAcknowledged: asBoolean(row.legal_review_acknowledged),
  };
}

export async function updateSettings(settings: SiteSettings) {
  const db = database();
  if (!db) throw new Error("Database unavailable");
  await initialize(db);
  await db.prepare("UPDATE site_settings SET brand_name = ?, legal_name = ?, identity_status = ?, address = ?, map_url = ?, phone = ?, email = ?, whatsapp_number = ?, licence_references_json = ?, business_hours = ?, homepage_headline = ?, homepage_intro = ?, primary_state = ?, service_message = ?, disclaimer = ?, indexing_mode = ?, identity_verified = ?, contacts_verified = ?, licences_verified = ?, privacy_acknowledged = ?, disclaimer_acknowledged = ?, advertising_acknowledged = ?, legal_review_acknowledged = ?, updated_at = ? WHERE id = 1")
    .bind(settings.brandName, settings.legalName, settings.identityStatus, settings.address, settings.mapUrl, settings.phone, settings.email, settings.whatsappNumber, JSON.stringify(settings.licenceReferences), settings.businessHours, settings.homepageHeadline, settings.homepageIntro, settings.serviceRegion.primaryState, settings.serviceRegion.message, settings.disclaimer, settings.indexingMode, settings.identityVerified ? 1 : 0, settings.contactsVerified ? 1 : 0, settings.licencesVerified ? 1 : 0, settings.privacyAcknowledged ? 1 : 0, settings.disclaimerAcknowledged ? 1 : 0, settings.advertisingAcknowledged ? 1 : 0, settings.legalReviewAcknowledged ? 1 : 0, new Date().toISOString()).run();
}

export async function adminRoleFor(email: string): Promise<AdminRole | null> {
  const db = database();
  if (!db) return null;
  await initialize(db);
  const address = email.trim().toLowerCase();
  const roleQuery = db.prepare("SELECT role FROM admin_users WHERE lower(email) = ?").bind(address);
  const row = await roleQuery.first<{ role: AdminRole }>();
  if (row?.role) return row.role;
  if (address && address === runtimeBindings().SPARKS_OWNER_EMAIL?.trim().toLowerCase()) {
    const now = new Date().toISOString();
    await db.prepare("INSERT INTO admin_users (id, email, role, display_name, created_at, updated_at) SELECT ?, ?, 'owner', 'Owner', ?, ? WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE role = 'owner') ON CONFLICT(email) DO NOTHING")
      .bind(crypto.randomUUID(), address, now, now).run();
    return (await roleQuery.first<{ role: AdminRole }>())?.role ?? null;
  }
  return null;
}

export async function listAdmins() {
  const db = database();
  if (!db) return [];
  await initialize(db);
  return (await db.prepare("SELECT id, email, role, display_name FROM admin_users ORDER BY role DESC, email").all()).results;
}

export async function upsertEditor(email: string, displayName: string) {
  const db = database();
  if (!db) throw new Error("Database unavailable");
  await initialize(db);
  const now = new Date().toISOString();
  await db.prepare("INSERT INTO admin_users (id, email, role, display_name, created_at, updated_at) VALUES (?, ?, 'editor', ?, ?, ?) ON CONFLICT(email) DO UPDATE SET display_name = excluded.display_name, role = CASE WHEN admin_users.role = 'owner' THEN 'owner' ELSE 'editor' END, updated_at = excluded.updated_at")
    .bind(crypto.randomUUID(), email.toLowerCase(), displayName, now, now).run();
}

export async function removeEditor(id: string) {
  const db = database();
  if (!db) throw new Error("Database unavailable");
  await initialize(db);
  await db.prepare("DELETE FROM admin_users WHERE id = ? AND role = 'editor'").bind(id).run();
}

function rowToMember(row: Record<string, unknown>): MemberAccount {
  return {
    id: String(row.id),
    displayName: String(row.display_name || row.email),
    email: String(row.email),
    businessName: String(row.business_name || ""),
    phone: String(row.phone || ""),
    preferredContact: row.preferred_contact === "phone" ? "phone" : "email",
    buyerType: String(row.buyer_type || ""),
    state: String(row.state || "Gujarat"),
    city: String(row.city || ""),
    pincode: String(row.pincode || ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function ensureMemberAccount(principal: AuthPrincipal): Promise<MemberAccount> {
  const db = database();
  if (!db) throw new Error("Database unavailable");
  await initialize(db);
  const existing = await db.prepare("SELECT m.* FROM members m JOIN member_identities i ON i.member_id = m.id WHERE i.provider = ? AND i.provider_subject = ? LIMIT 1")
    .bind(principal.provider, principal.providerSubject).first<Record<string, unknown>>();
  const now = new Date().toISOString();
  if (existing) {
    await db.batch([
      db.prepare("UPDATE member_identities SET email = ?, last_seen_at = ? WHERE provider = ? AND provider_subject = ?").bind(principal.email, now, principal.provider, principal.providerSubject),
      db.prepare("UPDATE members SET email = ?, updated_at = ? WHERE id = ?").bind(principal.email, now, String(existing.id)),
    ]);
    return rowToMember({ ...existing, email: principal.email, updated_at: now });
  }

  if (principal.emailVerified) {
    const emailMatch = await db.prepare("SELECT * FROM members WHERE lower(email) = ? ORDER BY created_at LIMIT 1").bind(principal.email).first<Record<string, unknown>>();
    if (emailMatch) {
      await db.prepare("INSERT INTO member_identities (id, member_id, provider, provider_subject, email, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), String(emailMatch.id), principal.provider, principal.providerSubject, principal.email, now, now).run();
      return rowToMember(emailMatch);
    }
  }

  const memberId = crypto.randomUUID();
  await db.batch([
    db.prepare("INSERT INTO members (id, display_name, email, business_name, phone, preferred_contact, buyer_type, state, city, pincode, created_at, updated_at) VALUES (?, ?, ?, '', '', 'email', '', 'Gujarat', '', '', ?, ?)")
      .bind(memberId, principal.displayName, principal.email, now, now),
    db.prepare("INSERT INTO member_identities (id, member_id, provider, provider_subject, email, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), memberId, principal.provider, principal.providerSubject, principal.email, now, now),
  ]);
  return {
    id: memberId,
    displayName: principal.displayName,
    email: principal.email,
    businessName: "",
    phone: "",
    preferredContact: "email",
    buyerType: "",
    state: "Gujarat",
    city: "",
    pincode: "",
    createdAt: now,
    updatedAt: now,
  };
}

export async function getThemePreference(memberId: string): Promise<ThemePreference> {
  const db = database();
  const fallback: ThemePreference = { palette: "sky", mode: "system", reducedMotion: false };
  if (!db) return fallback;
  await initialize(db);
  const row = await db.prepare("SELECT theme_preference_json FROM members WHERE id = ?").bind(memberId).first<{ theme_preference_json: string }>();
  return safeJson(row?.theme_preference_json, fallback);
}

export async function updateThemePreference(memberId: string, preference: ThemePreference) {
  const db = database();
  if (!db) throw new Error("Database unavailable");
  await initialize(db);
  await db.prepare("UPDATE members SET theme_preference_json = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(preference), new Date().toISOString(), memberId).run();
}

export async function memberDashboardSummary(memberId: string) {
  const db = database();
  if (!db) return { savedQuoteCount: 0, activeEnquiryCount: 0, recentEnquiryCount: 0 };
  await initialize(db);
  const row = await db.prepare("SELECT (SELECT COUNT(*) FROM quote_drafts WHERE member_id = ?) AS saved_quotes, (SELECT COUNT(*) FROM enquiries WHERE member_id = ? AND status != 'closed') AS active_enquiries, (SELECT COUNT(*) FROM enquiries WHERE member_id = ? AND created_at >= datetime('now','-30 day')) AS recent_enquiries").bind(memberId, memberId, memberId).first<Record<string, number>>();
  return { savedQuoteCount: Number(row?.saved_quotes || 0), activeEnquiryCount: Number(row?.active_enquiries || 0), recentEnquiryCount: Number(row?.recent_enquiries || 0) };
}

export async function adminDashboardSummary() {
  const db = database();
  if (!db) return { contentReadyProducts: 0, totalMembers: 0 };
  await initialize(db);
  const row = await db.prepare("SELECT (SELECT COUNT(*) FROM products WHERE detail_content_json != '{}' AND status = 'published') AS content_ready, (SELECT COUNT(*) FROM members) AS total_members").first<Record<string, number>>();
  return { contentReadyProducts: Number(row?.content_ready || 0), totalMembers: Number(row?.total_members || 0) };
}

export async function updateMemberProfile(memberId: string, profile: MemberProfile) {
  const db = database();
  if (!db) throw new Error("Database unavailable");
  await initialize(db);
  const now = new Date().toISOString();
  await db.prepare("UPDATE members SET display_name = ?, business_name = ?, phone = ?, preferred_contact = ?, buyer_type = ?, state = ?, city = ?, pincode = ?, updated_at = ? WHERE id = ?")
    .bind(profile.displayName, profile.businessName, profile.phone, profile.preferredContact, profile.buyerType, profile.state, profile.city, profile.pincode, now, memberId).run();
}

function rowToQuoteDraft(row: Record<string, unknown>): QuoteDraft {
  return {
    id: String(row.id),
    memberId: String(row.member_id),
    name: String(row.name),
    items: safeJson<QuoteDraftItem[]>(row.items_json, []),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listQuoteDrafts(memberId: string): Promise<QuoteDraft[]> {
  const db = database();
  if (!db) return [];
  await initialize(db);
  const rows = await db.prepare("SELECT * FROM quote_drafts WHERE member_id = ? ORDER BY updated_at DESC").bind(memberId).all<Record<string, unknown>>();
  return rows.results.map(rowToQuoteDraft);
}

export async function saveQuoteDraft(memberId: string, name: string, items: QuoteDraftItem[], draftId?: string) {
  const db = database();
  if (!db) throw new Error("Database unavailable");
  await initialize(db);
  const now = new Date().toISOString();
  if (draftId) {
    const result = await db.prepare("UPDATE quote_drafts SET name = ?, items_json = ?, updated_at = ? WHERE id = ? AND member_id = ?")
      .bind(name, JSON.stringify(items), now, draftId, memberId).run();
    if (!result.meta.changes) throw new Error("Quote draft not found.");
    return draftId;
  }
  const id = crypto.randomUUID();
  await db.prepare("INSERT INTO quote_drafts (id, member_id, name, items_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(id, memberId, name, JSON.stringify(items), now, now).run();
  return id;
}

export async function deleteQuoteDraft(memberId: string, draftId: string) {
  const db = database();
  if (!db) throw new Error("Database unavailable");
  await initialize(db);
  await db.prepare("DELETE FROM quote_drafts WHERE id = ? AND member_id = ?").bind(draftId, memberId).run();
}

export async function listMemberEnquiries(memberId: string) {
  const db = database();
  if (!db) return [];
  await initialize(db);
  await purgeExpiredEnquiries();
  const result = await db.prepare("SELECT e.id, e.member_id, e.business_name, e.contact_name, e.buyer_type, e.phone, e.email, e.state, e.city, e.pincode, e.note, e.consented_at, e.status, e.created_at, e.expires_at, COUNT(i.id) AS item_count, COALESCE(SUM(i.quantity), 0) AS total_quantity, (SELECT MAX(created_at) FROM enquiry_status_events WHERE enquiry_id = e.id) AS last_update_at FROM enquiries e LEFT JOIN enquiry_items i ON i.enquiry_id = e.id WHERE e.member_id = ? GROUP BY e.id ORDER BY e.created_at DESC")
    .bind(memberId).all<Record<string, unknown>>();
  return result.results;
}

export async function getMemberEnquiry(memberId: string, enquiryId: string) {
  const db = database();
  if (!db) return null;
  await initialize(db);
  await purgeExpiredEnquiries();
  const enquiry = await db.prepare("SELECT id, member_id, business_name, contact_name, buyer_type, phone, email, state, city, pincode, note, consented_at, status, created_at, expires_at FROM enquiries WHERE id = ? AND member_id = ?")
    .bind(enquiryId, memberId).first<Record<string, unknown>>();
  if (!enquiry) return null;
  const [items, events] = await Promise.all([
    db.prepare("SELECT product_slug, product_name, quantity, note FROM enquiry_items WHERE enquiry_id = ? ORDER BY rowid").bind(enquiryId).all(),
    db.prepare("SELECT status, message, created_at FROM enquiry_status_events WHERE enquiry_id = ? ORDER BY created_at").bind(enquiryId).all(),
  ]);
  return { ...enquiry, items: items.results, events: events.results };
}

export async function deleteMemberAccount(memberId: string, authUserId: string) {
  const db = database();
  if (!db) throw new Error("Database unavailable");
  await initialize(db);
  await db.batch([
    db.prepare("DELETE FROM enquiries WHERE member_id = ?").bind(memberId),
    db.prepare("DELETE FROM members WHERE id = ?").bind(memberId),
    db.prepare('DELETE FROM "user" WHERE id = ?').bind(authUserId),
  ]);
}

export type EnquiryInput = Omit<Enquiry, "id" | "memberId" | "status" | "internalNotes" | "createdAt" | "expiresAt"> & { items: Array<{ productId?: string; productSlug: string; productName: string; quantity: number; note?: string }> };

export async function getEnquiryProducts(slugs: string[]) {
  const db = database();
  if (!db) throw new Error("Database unavailable");
  await initialize(db);
  const placeholders = slugs.map(() => "?").join(", ");
  const { results } = await db.prepare(`
    SELECT slug, id AS productId, generic_name AS productName
    FROM products WHERE status = 'published' AND enquiry_eligible = 1
      AND availability != 'unavailable' AND slug IN (${placeholders})
  `).bind(...slugs).all<{ slug: string; productId: string; productName: string }>();
  return new Map(results.map(({ slug, ...product }) => [slug, product]));
}

export async function createEnquiry(input: EnquiryInput, memberId?: string) {
  if (!input.consentedAt) throw new Error("Consent is required before storage.");
  const db = database();
  if (!db) throw new Error("Database unavailable");
  await initialize(db);
  await purgeExpiredEnquiries();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  const statements = [
    db.prepare("INSERT INTO enquiries (id, member_id, business_name, contact_name, buyer_type, phone, email, state, city, pincode, note, consented_at, status, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)").bind(id, memberId || null, input.businessName, input.contactName, input.buyerType, input.phone, input.email || null, input.state, input.city, input.pincode, input.note || null, input.consentedAt, createdAt, expiresAt),
    db.prepare("INSERT INTO enquiry_status_events (id, enquiry_id, status, message, created_at) VALUES (?, ?, 'new', ?, ?)").bind(crypto.randomUUID(), id, "Enquiry received and queued for review.", createdAt),
  ];
  for (const item of input.items) statements.push(db.prepare("INSERT INTO enquiry_items (id, enquiry_id, product_id, product_slug, product_name, quantity, note) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), id, item.productId || null, item.productSlug, item.productName, item.quantity, item.note || null));
  await db.batch(statements);
  return { id, expiresAt };
}

export async function purgeExpiredEnquiries() {
  const db = database();
  if (!db) return;
  await initialize(db);
  await db.prepare("DELETE FROM enquiries WHERE expires_at <= ?").bind(new Date().toISOString()).run();
}

export async function listEnquiries(search = "", status = ""): Promise<Record<string, unknown>[]> {
  const db = database();
  if (!db) return [];
  await initialize(db);
  await purgeExpiredEnquiries();
  const query = "%" + search.toLowerCase() + "%";
  const result = await db.prepare("SELECT e.*, COUNT(i.id) AS item_count, COALESCE(SUM(i.quantity), 0) AS total_quantity FROM enquiries e LEFT JOIN enquiry_items i ON i.enquiry_id = e.id WHERE (? = '' OR lower(e.id || ' ' || ('sp-' || substr(e.id, 1, 8)) || ' ' || e.business_name || ' ' || e.contact_name || ' ' || e.phone || ' ' || COALESCE(e.email, '')) LIKE ? OR EXISTS (SELECT 1 FROM enquiry_items si WHERE si.enquiry_id = e.id AND lower(si.product_name || ' ' || si.product_slug) LIKE ?)) AND (? = '' OR e.status = ?) GROUP BY e.id ORDER BY e.created_at DESC").bind(search, query, query, status, status).all<Record<string, unknown>>();
  if (!result.results.length) return [];
  const ids = result.results.map((row) => String(row.id));
  const placeholders = ids.map(() => "?").join(",");
  const [items, events] = await Promise.all([
    db.prepare(`SELECT enquiry_id, product_slug, product_name, quantity, note FROM enquiry_items WHERE enquiry_id IN (${placeholders}) ORDER BY rowid`).bind(...ids).all<Record<string, unknown>>(),
    db.prepare(`SELECT enquiry_id, status, message, created_at FROM enquiry_status_events WHERE enquiry_id IN (${placeholders}) ORDER BY created_at`).bind(...ids).all<Record<string, unknown>>(),
  ]);
  return result.results.map((row) => ({
    ...row,
    items: items.results.filter((item) => item.enquiry_id === row.id),
    events: events.results.filter((event) => event.enquiry_id === row.id),
  }));
}

export async function updateEnquiry(id: string, status: EnquiryStatus, internalNotes: string, publicUpdate = "") {
  const db = database();
  if (!db) throw new Error("Database unavailable");
  await initialize(db);
  const current = await db.prepare("SELECT status FROM enquiries WHERE id = ?").bind(id).first<{ status: EnquiryStatus }>();
  if (!current) throw new Error("Enquiry not found");
  const statements = [db.prepare("UPDATE enquiries SET status = ?, internal_notes = ? WHERE id = ?").bind(status, internalNotes, id)];
  const message = publicUpdate.trim();
  if (current.status !== status || message) {
    statements.push(db.prepare("INSERT INTO enquiry_status_events (id, enquiry_id, status, message, created_at) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), id, status, message || `Status changed to ${status}.`, new Date().toISOString()));
  }
  await db.batch(statements);
}

export async function deleteEnquiry(id: string) {
  const db = database();
  if (!db) throw new Error("Database unavailable");
  await initialize(db);
  await db.prepare("DELETE FROM enquiries WHERE id = ?").bind(id).run();
}

export function mediaBucket(): R2Bucket | null {
  return runtimeBindings().MEDIA || null;
}
