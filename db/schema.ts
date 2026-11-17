import { blob, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    genericName: text("generic_name").notNull(),
    brandName: text("brand_name"),
    composition: text("composition").notNull(),
    category: text("category").notNull(),
    dosageForm: text("dosage_form").notNull(),
    strength: text("strength").notNull(),
    packSize: text("pack_size").notNull(),
    manufacturer: text("manufacturer").notNull(),
    regulatoryClassification: text("regulatory_classification").notNull(),
    tradeNotes: text("trade_notes").notNull(),
    detailContentJson: text("detail_content_json").notNull().default("{}"),
    status: text("status").notNull().default("draft"),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(true),
    publicApproved: integer("public_approved", { mode: "boolean" }).notNull().default(false),
    priceDisplay: text("price_display").notNull().default("indicative"),
    priceValue: text("price_value"),
    priceUnit: text("price_unit"),
    priceCheckedOn: text("price_checked_on"),
    priceSourcesJson: text("price_sources_json").notNull().default("[]"),
    availability: text("availability").notNull().default("on_request"),
    minimumQuantity: integer("minimum_quantity").notNull().default(1),
    enquiryEligible: integer("enquiry_eligible", { mode: "boolean" }).notNull().default(true),
    seoEnabled: integer("seo_enabled", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_products_slug").on(table.slug),
    index("idx_products_public_status").on(table.status, table.isDemo, table.seoEnabled),
    index("idx_products_category").on(table.category),
  ],
);

export const productImages = sqliteTable(
  "product_images",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    objectKey: text("object_key"),
    src: text("src").notNull(),
    alt: text("alt").notNull(),
    referenceNote: text("reference_note").notNull().default(""),
    sourceLabel: text("source_label").notNull().default("Business-supplied image"),
    sourceUrl: text("source_url").notNull().default(""),
    credit: text("credit").notNull().default(""),
    licenseLabel: text("license_label").notNull().default("Business supplied"),
    licenseUrl: text("license_url").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_product_images_product_order").on(table.productId, table.sortOrder)],
);

export const mediaObjects = sqliteTable(
  "media_objects",
  {
    objectKey: text("object_key").primaryKey(),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    contentType: text("content_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    data: blob("data", { mode: "buffer" }).notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_media_objects_product").on(table.productId)],
);

export const contentMigrations = sqliteTable("content_migrations", {
  key: text("key").primaryKey(),
  appliedAt: text("applied_at").notNull(),
});

export const adminUsers = sqliteTable(
  "admin_users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    role: text("role").notNull(),
    displayName: text("display_name"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [uniqueIndex("idx_admin_users_email").on(table.email)],
);

export const members = sqliteTable("members", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
  businessName: text("business_name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  preferredContact: text("preferred_contact").notNull().default("email"),
  buyerType: text("buyer_type").notNull().default(""),
  state: text("state").notNull().default("Gujarat"),
  city: text("city").notNull().default(""),
  pincode: text("pincode").notNull().default(""),
  themePreferenceJson: text("theme_preference_json").notNull().default('{"palette":"sky","mode":"system","reducedMotion":false}'),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [index("idx_members_email").on(table.email)]);

export const authUsers = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
}, (table) => [uniqueIndex("idx_auth_user_email").on(table.email)]);

export const authSessions = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => authUsers.id, { onDelete: "cascade" }),
}, (table) => [uniqueIndex("idx_auth_session_token").on(table.token), index("idx_auth_session_user").on(table.userId)]);

export const authAccounts = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  issuer: text("issuer").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => authUsers.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
}, (table) => [index("idx_auth_account_user").on(table.userId), uniqueIndex("idx_auth_account_issuer").on(table.issuer, table.accountId)]);

export const authVerifications = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
}, (table) => [index("idx_auth_verification_identifier").on(table.identifier)]);

export const memberIdentities = sqliteTable("member_identities", {
  id: text("id").primaryKey(),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  providerSubject: text("provider_subject").notNull(),
  email: text("email").notNull(),
  createdAt: text("created_at").notNull(),
  lastSeenAt: text("last_seen_at").notNull(),
}, (table) => [
  uniqueIndex("idx_member_identities_provider_subject").on(table.provider, table.providerSubject),
  index("idx_member_identities_member").on(table.memberId),
]);

export const quoteDrafts = sqliteTable("quote_drafts", {
  id: text("id").primaryKey(),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  itemsJson: text("items_json").notNull().default("[]"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [index("idx_quote_drafts_member_updated").on(table.memberId, table.updatedAt)]);

export const siteSettings = sqliteTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  brandName: text("brand_name").notNull(),
  legalName: text("legal_name").notNull(),
  identityStatus: text("identity_status").notNull(),
  address: text("address").notNull(),
  mapUrl: text("map_url").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  whatsappNumber: text("whatsapp_number").notNull(),
  licenceReferencesJson: text("licence_references_json").notNull().default("[]"),
  businessHours: text("business_hours").notNull(),
  homepageHeadline: text("homepage_headline").notNull(),
  homepageIntro: text("homepage_intro").notNull(),
  primaryState: text("primary_state").notNull().default("Gujarat"),
  serviceMessage: text("service_message").notNull(),
  disclaimer: text("disclaimer").notNull(),
  indexingMode: text("indexing_mode").notNull().default("preview"),
  identityVerified: integer("identity_verified", { mode: "boolean" }).notNull().default(false),
  contactsVerified: integer("contacts_verified", { mode: "boolean" }).notNull().default(false),
  licencesVerified: integer("licences_verified", { mode: "boolean" }).notNull().default(false),
  privacyAcknowledged: integer("privacy_acknowledged", { mode: "boolean" }).notNull().default(false),
  disclaimerAcknowledged: integer("disclaimer_acknowledged", { mode: "boolean" }).notNull().default(false),
  advertisingAcknowledged: integer("advertising_acknowledged", { mode: "boolean" }).notNull().default(false),
  legalReviewAcknowledged: integer("legal_review_acknowledged", { mode: "boolean" }).notNull().default(false),
  updatedAt: text("updated_at").notNull(),
});

export const enquiries = sqliteTable(
  "enquiries",
  {
    id: text("id").primaryKey(),
    memberId: text("member_id").references(() => members.id, { onDelete: "set null" }),
    businessName: text("business_name").notNull(),
    contactName: text("contact_name").notNull(),
    buyerType: text("buyer_type").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    state: text("state").notNull(),
    city: text("city").notNull(),
    pincode: text("pincode").notNull(),
    note: text("note"),
    consentedAt: text("consented_at").notNull(),
    status: text("status").notNull().default("new"),
    internalNotes: text("internal_notes"),
    createdAt: text("created_at").notNull(),
    expiresAt: text("expires_at").notNull(),
  },
  (table) => [
    index("idx_enquiries_status_created").on(table.status, table.createdAt),
    index("idx_enquiries_expires_at").on(table.expiresAt),
    index("idx_enquiries_member_created").on(table.memberId, table.createdAt),
  ],
);

export const enquiryItems = sqliteTable(
  "enquiry_items",
  {
    id: text("id").primaryKey(),
    enquiryId: text("enquiry_id").notNull().references(() => enquiries.id, { onDelete: "cascade" }),
    productId: text("product_id"),
    productSlug: text("product_slug").notNull(),
    productName: text("product_name").notNull(),
    quantity: integer("quantity").notNull(),
    note: text("note"),
  },
  (table) => [index("idx_enquiry_items_enquiry").on(table.enquiryId)],
);

export const enquiryStatusEvents = sqliteTable(
  "enquiry_status_events",
  {
    id: text("id").primaryKey(),
    enquiryId: text("enquiry_id").notNull().references(() => enquiries.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    message: text("message").notNull().default(""),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_enquiry_status_events_enquiry_created").on(table.enquiryId, table.createdAt)],
);
