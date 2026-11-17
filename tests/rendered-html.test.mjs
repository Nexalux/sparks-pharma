import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import ts from "typescript";

async function loadStandaloneModule(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  });
  return import("data:text/javascript;base64," + Buffer.from(outputText).toString("base64"));
}

async function request(pathname = "/", options = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", String(process.pid) + "-" + String(Date.now()) + "-" + pathname);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("https://sparks-pharma.example" + pathname, { headers: { accept: options.accept || "text/html", host: "sparks-pharma.example", ...(options.headers || {}) }, method: options.method || "GET", body: options.body }), { ASSETS: { fetch: options.assetFetch || (async () => new Response("Not found", { status: 404 })) }, DB: options.db }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the discoverable portfolio-ready B2B catalog", async () => {
  const response = await request("/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>Sparks Pharma \| India B2B Medicine Catalog<\/title>/i);
  assert.match(html, /India-wide enquiries/i);
  assert.match(html, /STRUCTURED PROCUREMENT/i);
  assert.match(html, /Trade medicine sourcing/i);
  assert.match(html, /Loading published products/i);
  assert.match(html, /View the complete catalog/i);
  assert.match(html, /name="robots" content="index, follow"/i);
  assert.match(html, /application\/ld\+json/i);
  assert.match(html, /"@type":"WebSite"/i);
  assert.doesNotMatch(html, /DEMO RECORD|DEMO DATA|prototype|public preview|plan 2|WhatsApp/i);
});

test("renders every public catalog route", async () => {
  for (const route of ["/products", "/quote", "/about", "/quality", "/contact", "/privacy", "/disclaimer", "/robots.txt", "/sitemap.xml"]) {
    const response = await request(route);
    assert.equal(response.status, 200, route);
  }
});

test("keeps request-time account and settings lookup out of the public layout", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(layout, /getMemberSession|getThemePreference|getSettings/);
});

test("the public catalog API reflects publishing and archiving database records", async () => {
  const sqlite = new DatabaseSync(":memory:");
  try {
    const migrations = new URL("../drizzle/", import.meta.url);
    for (const file of (await readdir(migrations)).filter((name) => name.endsWith(".sql")).sort()) {
      sqlite.exec(await readFile(new URL(file, migrations), "utf8"));
    }
    sqlite.exec("INSERT INTO content_migrations (key, applied_at) VALUES ('runtime-schema-v1', CURRENT_TIMESTAMP)");
    const insert = sqlite.prepare(`
      INSERT INTO products (
        id, slug, generic_name, composition, category, dosage_form, strength, pack_size,
        manufacturer, regulatory_classification, trade_notes, status, created_at, updated_at
      ) VALUES (?, ?, ?, 'Fixture', 'Trade', 'Tablet', '5 mg', '10 tablets',
        'Fixture', 'Trade', 'Fixture', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    insert.run("existing", "existing-listing", "Existing Listing", "published");
    insert.run("new", "new-listing", "New Listing", "draft");
    const db = {
      prepare(sql) {
        const statement = sqlite.prepare(sql);
        return {
          all: async () => ({ results: statement.all() }),
        };
      },
    };

    async function catalog() {
      const response = await request("/api/catalog", { db, accept: "application/json" });
      assert.equal(response.status, 200);
      assert.match(response.headers.get("cache-control"), /no-store/);
      return response.json();
    }

    assert.deepEqual((await catalog()).map((product) => product.slug), ["existing-listing"]);

    sqlite.exec("UPDATE products SET status = 'published' WHERE id = 'new'");
    const published = await catalog();
    assert.deepEqual(published.map((product) => product.slug), ["existing-listing", "new-listing"]);
    assert.equal(published[1].image.alt, "New Listing product image");
    assert.equal("detailContent" in published[1], false);

    sqlite.exec("UPDATE products SET status = 'archived' WHERE id = 'existing'");
    assert.deepEqual((await catalog()).map((product) => product.slug), ["new-listing"]);
  } finally {
    sqlite.close();
  }
});

test("serves the public HTML shells through the assets binding", async () => {
  const assetFetch = async (request) => new Response(new URL(request.url).pathname);
  for (const [route, file] of [["/", "home.snapshot"], ["/products?category=Trade", "products.snapshot"]]) {
    const response = await request(route, { assetFetch });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /text\/html/);
    assert.equal(await response.text(), "/_sparks-pages/" + file);
  }
  assert.equal((await request("/_sparks-pages/home.snapshot", { assetFetch })).status, 404);
});

test("rejects unsupported server action traffic and cross-origin writes", async () => {
  const serverAction = await request("/api/account", { method: "POST", headers: { "next-action": "unexpected" } });
  assert.equal(serverAction.status, 405);
  const pageWrite = await request("/products", { method: "POST", body: "unexpected" });
  assert.equal(pageWrite.status, 405);
  const crossOrigin = await request("/api/account", { method: "DELETE", headers: { origin: "https://other.example" } });
  assert.equal(crossOrigin.status, 403);
  const sameOrigin = await request("/api/account", { method: "DELETE", headers: { origin: "https://sparks-pharma.example" } });
  assert.equal(sameOrigin.status, 401);
  const oversized = await request("/api/enquiries", { method: "POST", body: "x".repeat(1024 * 1024 + 1) });
  assert.equal(oversized.status, 413);
  const withinLimit = await request("/api/enquiries", { method: "POST", body: "{}" });
  assert.equal(withinLimit.status, 401);
});

test("keeps concurrent request bindings isolated", async () => {
  const { runtimeBindings, withRuntimeBindings } = await loadStandaloneModule("../app/lib/runtime.ts");
  let release;
  const proceed = new Promise((resolve) => { release = resolve; });
  const first = withRuntimeBindings({ BETTER_AUTH_URL: "https://first.example" }, async () => {
    await proceed;
    return runtimeBindings().BETTER_AUTH_URL;
  });
  const second = withRuntimeBindings({ BETTER_AUTH_URL: "https://second.example" }, async () => {
    release();
    await Promise.resolve();
    return runtimeBindings().BETTER_AUTH_URL;
  });
  assert.deepEqual(await Promise.all([first, second]), ["https://first.example", "https://second.example"]);
  assert.equal(runtimeBindings().BETTER_AUTH_URL, undefined);
});

test("exports spreadsheet formulas as text and validates quote lines", async () => {
  const { csvCell, readQuoteItems } = await loadStandaloneModule("../app/lib/validation.ts");
  assert.equal(csvCell("=1+1"), "\"'=1+1\"");
  assert.equal(csvCell("ordinary;text"), "\"ordinary;text\"");
  assert.equal(csvCell(-5), "-5");
  assert.equal(readQuoteItems([{ productSlug: "product", quantity: 0 }]), null);
  assert.equal(readQuoteItems([{ productSlug: "product", quantity: 3, note: {} }]), null);
  assert.deepEqual(readQuoteItems([{ productSlug: "product", quantity: 3, productId: "forged" }]), [
    { productSlug: "product", quantity: 3, note: undefined },
  ]);
});

test("serves uploaded image bytes and metadata without rendering a page", async () => {
  const db = new DatabaseSync(":memory:");
  try {
    db.exec(`
      CREATE TABLE media_objects (object_key TEXT PRIMARY KEY, content_type TEXT, byte_size INTEGER, data BLOB);
      CREATE TABLE products (id TEXT PRIMARY KEY, status TEXT);
      CREATE TABLE product_images (object_key TEXT, product_id TEXT);
      INSERT INTO products VALUES ('product', 'published');
      INSERT INTO product_images VALUES ('photo.webp', 'product');
    `);
    const bytes = Uint8Array.of(0, 1, 128, 255);
    db.prepare("INSERT INTO media_objects VALUES (?, ?, ?, ?)").run("photo.webp", "image/webp", bytes.length, bytes);
    const options = {
      db: {
        prepare(sql) {
          const statement = db.prepare(sql);
          return { bind: (...params) => ({ first: async () => statement.get(...params) ?? null }) };
        },
      },
    };
    const response = await request("/api/media/photo.webp", options);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/webp");
    assert.equal(response.headers.get("content-length"), String(bytes.length));
    assert.match(response.headers.get("cache-control"), /max-age=300/);
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);

    const head = await request("/api/media/photo.webp", { ...options, method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(head.headers.get("content-length"), String(bytes.length));
    assert.equal(await head.text(), "");
    assert.equal((await request("/api/media/missing.webp", options)).status, 404);
    assert.equal((await request("/api/media/folder%2Fphoto.webp", options)).status, 404);
    db.exec("UPDATE products SET status = 'draft'");
    const draft = await request("/api/media/photo.webp", options);
    assert.equal(draft.status, 404);
    assert.match(draft.headers.get("cache-control"), /no-store/);
  } finally {
    db.close();
  }
});

test("product detail metadata is record-specific, product-facing, and indexable", async () => {
  for (const [slug, name] of [["paracetamol-500-tablets", "Paracetamol"], ["azithromycin-500-tablets", "Azithromycin"]]) {
    const response = await request("/products/" + slug);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, new RegExp("<title>" + name + " \\| Sparks Pharma<\\/title>", "i"));
    assert.match(html, /PRODUCT PHOTOGRAPHY/i);
    assert.match(html, /PRODUCT INFORMATION/i);
    assert.match(html, /Trade catalog, not prescribing guidance/i);
    assert.match(html, /name="robots" content="index, follow"/i);
    assert.doesNotMatch(html, /DEMO RECORD|prototype|representative/i);
  }
});

test("keeps all eight reference images and their source context", async () => {
  const data = await readFile(new URL("../app/lib/data.ts", import.meta.url), "utf8");
  for (const file of ["paracetamol.jpg", "pantoprazole.jpg", "azithromycin.jpg", "amoxicillin-clavulanate.jpg", "cetirizine.jpg", "metformin.jpg", "cefixime.jpg", "ors.jpg"]) {
    const bytes = await readFile(new URL("../public/product-images/" + file, import.meta.url));
    assert.deepEqual([...bytes.subarray(0, 3)], [0xff, 0xd8, 0xff], file);
    assert.match(data, new RegExp("/product-images/" + file.replace(".", "\\.")));
  }
  assert.equal((data.match(/^\s{4}retailReference:/gm) ?? []).length, 8);
});

test("expands the catalog with fifty varied two-image records and richer filters", async () => {
  const [expansion, photos, repository, filters, detail] = await Promise.all([
    "../app/lib/catalog-expansion.ts",
    "../app/lib/catalog-photo-sources.ts",
    "../app/lib/repository.ts",
    "../app/components/CatalogExplorer.tsx",
    "../app/products/[slug]/page.tsx",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  assert.equal((expansion.match(/^\s+\["/gm) ?? []).length, 50);
  assert.match(expansion, /images,\s*demonstration: true/s);
  assert.doesNotMatch(expansion, /licensedImages|\/api\/catalog-art/);
  assert.match(expansion, /CATALOG_PHOTO_SOURCES\[slug\]/);
  assert.equal((photos.match(/"src": "\/product-images\/catalog\//g) ?? []).length, 100);
  assert.equal((photos.match(/"sourceUrl": "https:\/\//g) ?? []).length, 100);
  assert.match(repository, /migrateExpandedCatalog/);
  assert.doesNotMatch(repository, /''published''/);
  assert.match(repository, /product\.images \|\| \[product\.image\]/);
  for (const label of ["Availability", "Pricing", "Enquiry status", "Sort by"]) assert.match(filters, new RegExp(label));
  assert.match(detail, /ProductGallery/);
});

test("stores two real attributed photographs for every expanded product", async () => {
  const photos = await readFile(new URL("../app/lib/catalog-photo-sources.ts", import.meta.url), "utf8");
  const paths = [...photos.matchAll(/"src": "(\/product-images\/catalog\/[^"]+\.jpg)"/g)].map((match) => match[1]);
  assert.equal(paths.length, 100);
  assert.equal(new Set(paths).size, 100);
  for (const photoPath of paths) {
    const bytes = await readFile(new URL("../public" + photoPath, import.meta.url));
    assert.deepEqual([...bytes.subarray(0, 3)], [0xff, 0xd8, 0xff], photoPath);
  }
});

test("renders coherent fictional business identity while presenting India-wide coverage", async () => {
  const response = await request("/contact");
  const html = await response.text();
  assert.match(html, /Sparks Pharma Distribution Private Limited/i);
  assert.match(html, /00000 00000/);
  assert.match(html, /trade@sparkspharma\.example/i);
  assert.match(html, /India-wide enquiries/i);
  assert.match(html, /Documentation references/i);
});

test("quote flow supports India, required consent, tracking references, remove and clear", async () => {
  const quote = await readFile(new URL("../app/components/QuoteBuilder.tsx", import.meta.url), "utf8");
  assert.match(quote, /INDIA_STATES/);
  assert.match(quote, /\^\\d\{6\}\$/);
  assert.match(quote, /consentStorage/);
  assert.match(quote, /consentedAt/);
  assert.match(quote, /\/api\/enquiries/);
  assert.match(quote, /90 days/);
  assert.match(quote, /ENQUIRY SUBMITTED/);
  assert.match(quote, /Tracking reference/);
  assert.match(quote, /Consent is required to submit/);
  assert.doesNotMatch(quote, /wa\.me|WhatsApp|mailto:/);
  assert.match(quote, /removeItem/);
  assert.match(quote, /clearBasket/);
  assert.match(quote, /Do not include prescription or patient information/i);
});

test("keeps the complete portfolio disclosure on About and off the storefront", async () => {
  const about = await (await request("/about")).text();
  assert.match(about, /PORTFOLIO DISCLOSURE/i);
  assert.match(about, /designed and developed by Tanishq Chaudhary/i);
  assert.match(about, /fictional business identity/i);
  for (const route of ["/", "/products", "/quality", "/contact", "/privacy", "/disclaimer"]) {
    const html = await (await request(route)).text();
    assert.doesNotMatch(html, /portfolio project|fictional business|prototype|demo data/i, route);
  }
});

test("admin APIs enforce server authorization and owner-only settings", async () => {
  const products = await request("/api/admin/products", { accept: "application/json" });
  const settings = await request("/api/admin/settings", { accept: "application/json" });
  assert.equal(products.status, 401);
  assert.equal(settings.status, 401);
  const auth = await readFile(new URL("../app/lib/admin-auth.ts", import.meta.url), "utf8");
  const settingsRoute = await readFile(new URL("../app/api/admin/settings/route.ts", import.meta.url), "utf8");
  assert.match(auth, /adminRoleFor/);
  assert.match(settingsRoute, /authorizeAdmin\(true\)/);
});

test("database schema and catalog APIs cover the planned durable workflows", async () => {
  const [schema, repository, csv, images] = await Promise.all(["../db/schema.ts", "../app/lib/repository.ts", "../app/api/admin/products/csv/route.ts", "../app/api/admin/products/[id]/images/route.ts"].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  for (const table of ["products", "product_images", "media_objects", "admin_users", "site_settings", "enquiries", "enquiry_items"]) assert.match(schema, new RegExp('"' + table + '"'));
  assert.match(repository, /draft.*review.*published.*archived|ProductStatus/s);
  assert.match(repository, /DELETE FROM enquiries WHERE expires_at/);
  assert.match(csv, /row:/);
  assert.match(csv, /validateProduct/);
  assert.match(images, /mediaBucket/);
  assert.match(images, /saveDatabaseMedia/);
  assert.match(images, /768 \* 1024/);
  assert.match(repository, /migratePortfolioContent/);
  assert.match(repository, /e\.id \|\| ' '/);
  assert.match(repository, /RUNTIME_SCHEMA_MARKER/);
  assert.ok(repository.indexOf("SELECT key FROM content_migrations WHERE key = ?") < repository.indexOf("await db.batch(schemaStatements"));
});

test("public catalog indexing excludes protected admin, API, account, and quote routes", async () => {
  const [robots, sitemap, detail] = await Promise.all(["../app/robots.ts", "../app/sitemap.ts", "../app/products/[slug]/page.tsx"].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  assert.match(robots, /"\/admin"/);
  assert.match(robots, /"\/api"/);
  assert.match(robots, /"\/quote"/);
  assert.match(robots, /"\/account"/);
  assert.match(sitemap, /product\.status === "published"/);
  assert.match(detail, /const eligible = product\.status === "published"/);
});

test("retains native navigation, responsive density, keyboard focus, and reduced motion safeguards", async () => {
  const [safeLink, styles, worker, header] = await Promise.all(["../app/components/SafeLink.tsx", "../app/globals.css", "../worker/index.ts", "../app/components/SiteHeader.tsx"].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  assert.match(safeLink, /release=\$\{RELEASE\}/);
  assert.match(worker, /Cache-Control.*no-store/);
  assert.match(worker, /Content-Security-Policy/);
  assert.match(worker, /Permissions-Policy/);
  assert.match(worker, /Referrer-Policy/);
  assert.match(worker, /X-Content-Type-Options/);
  assert.match(worker, /X-Frame-Options/);
  assert.match(worker, /Strict-Transport-Security/);
  assert.match(header, /aria-expanded=\{appearanceOpen\}/);
  assert.doesNotMatch(header, /<details className="theme-menu"/);
  assert.match(styles, /button:focus-visible[\s\S]*outline:\s*3px solid/i);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /min-width:\s*760px[\s\S]*product-grid-catalog/);
  assert.match(styles, /@media \(max-width:\s*600px\)/);
});

test("admin product editor keeps focus while typing and supports image selection before save", async () => {
  const products = await readFile(new URL("../app/admin/products/AdminProducts.tsx", import.meta.url), "utf8");
  assert.match(products, /\[editorOpen, imageManagerOpen\]/);
  assert.doesNotMatch(products, /\[editing, imageProduct\]/);
  assert.match(products, /Product image/);
  assert.match(products, /setPendingImage/);
  assert.match(products, /uploadProductImage\(productId, pendingImage/);
  assert.match(products, /image:\s*undefined/);
});

test("Plan 4 exposes email and Google-ready sign-in and protects member APIs", async () => {
  const home = await (await request("/")).text();
  assert.match(home, /aria-label="Sign in"/i);
  assert.match(home, /href="\/sign-in\?release=7"/i);
  const signIn = await (await request("/sign-in")).text();
  assert.match(signIn, /Welcome back/i);
  assert.match(signIn, /Email address/i);
  assert.doesNotMatch(signIn, /Continue with ChatGPT/i);
  assert.match(signIn, /noindex, nofollow/i);
  for (const route of ["/api/account", "/api/account/quotes", "/api/account/enquiries"]) {
    const response = await request(route, { accept: "application/json" });
    assert.equal(response.status, 401, route);
  }
});

test("Plan 4 uses provider-independent members, authenticated enquiries, and member-safe data", async () => {
  const [schema, auth, memberAuth, repository, enquiryApi, header] = await Promise.all([
    "../db/schema.ts",
    "../app/lib/auth.ts",
    "../app/lib/member-auth.ts",
    "../app/lib/repository.ts",
    "../app/api/enquiries/route.ts",
    "../app/components/SiteHeader.tsx",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  for (const table of ["members", "member_identities", "quote_drafts"]) assert.match(schema, new RegExp('"' + table + '"'));
  assert.match(schema, /memberId: text\("member_id"\)/);
  assert.match(auth, /AuthPrincipal/);
  assert.match(auth, /providerSubject/);
  assert.match(memberAuth, /ensureMemberAccount/);
  assert.match(repository, /WHERE id = \? AND member_id = \?/);
  assert.match(repository, /SELECT id, member_id, business_name[\s\S]*FROM enquiries WHERE id = \? AND member_id = \?/);
  assert.doesNotMatch(repository.match(/export async function getMemberEnquiry[\s\S]*?return \{ \.\.\.enquiry, items: items\.results \};/)?.[0] || "", /internal_notes/);
  assert.match(enquiryApi, /authorizeMember/);
  assert.match(enquiryApi, /auth\.session!\.member\.id/);
  assert.match(memberAuth, /AUTH_REQUIRED/);
  assert.match(header, /session\.role \? "Dashboard" : "Account"/);
});

test("Plan 4 adds production identity, guest gating, richer details, and synced themes", async () => {
  const [pkg, auth, quote, details, provider, css, schema, migration, authUpgrade, worker, localAuth] = await Promise.all([
    "../package.json", "../app/lib/better-auth.ts", "../app/components/QuoteBuilder.tsx", "../app/components/ProductInformation.tsx", "../app/components/SiteProvider.tsx", "../app/globals.css", "../db/schema.ts", "../drizzle/0003_true_slipstream.sql", "../drizzle/0004_greedy_iron_fist.sql", "../worker/index.ts", "../app/lib/local-auth-bootstrap.ts",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  assert.match(pkg, /"better-auth"/);
  assert.match(auth, /minPasswordLength: 12/);
  assert.match(auth, /BREVO_API_KEY/);
  assert.match(auth, /socialProviders/);
  assert.match(auth, /prompt: "select_account"/);
  assert.match(quote, /Sign in before sending this quote/);
  assert.match(quote, /Continue editing/);
  assert.match(details, /Safety & storage/);
  assert.match(details, /Commonly reported effects/);
  assert.match(provider, /"system"/);
  assert.match(provider, /reducedMotion/);
  assert.match(provider, /sparks_motion_v1/);
  assert.match(provider, /modeState === "system"[\s\S]*: modeState/);
  assert.match(css, /select option \{ background: var\(--surface\); color: var\(--ink\); \}/);
  for (const table of ["authUsers", "authSessions", "authAccounts", "authVerifications"]) assert.match(schema, new RegExp(table));
  assert.match(schema, /issuer: text\("issuer"\)\.notNull\(\)/);
  assert.match(schema, /idx_auth_account_issuer/);
  assert.match(migration, /CREATE TABLE `user`/);
  assert.match(authUpgrade, /ALTER TABLE `account` ADD `issuer` text NOT NULL/);
  assert.match(authUpgrade, /CREATE UNIQUE INDEX `idx_auth_account_issuer`/);
  assert.match(auth, /requireEmailVerification: !local/);
  assert.match(worker, /localAuthSecret.*crypto\.randomUUID/);
  assert.match(localAuth, /CREATE TABLE IF NOT EXISTS "user"/);
  assert.match(localAuth, /idx_auth_account_issuer/);
  assert.doesNotMatch(auth, /chatgpt/i);
});

test("member account pages and quote saving stay outside indexing", async () => {
  const [robots, quote, workspace] = await Promise.all([
    "../app/robots.ts",
    "../app/components/QuoteBuilder.tsx",
    "../app/account/AccountWorkspace.tsx",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  assert.match(robots, /"\/account"/);
  assert.match(robots, /"\/sign-in"/);
  assert.match(quote, /\/api\/account\/quotes/);
  assert.match(quote, /Sign in to save/);
  assert.match(workspace, /Guest enquiries are intentionally not matched by email/);
  assert.match(workspace, /Type DELETE to confirm/);
});
