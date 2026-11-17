# Sparks Pharma

Sparks Pharma is a portfolio demonstration of an India-wide B2B pharmaceutical catalog, with Gujarat as the primary service region. The site supports catalog search, quote baskets, signed-in enquiries, and an admin workspace for products and enquiries. Listings use demonstration data and go through manual trade review.

[Live demonstration](https://sparks-pharma.tanishqchaudhary886.workers.dev/)

## Local development

Use Node.js 22.13 or newer and the committed npm lockfile.

```bash
npm ci
npm run dev
```

Open the loopback address printed by the dev server. Optional local authentication settings belong in an ignored `.dev.vars` file. See `.env.example` for variable names. A new database may use `SPARKS_OWNER_EMAIL` to provision its first owner after that email signs in. Existing owners and editors are stored in D1.

```bash
npm run typecheck
npm run lint
npm test
```

## Cloudflare Workers

The homepage and Products route use pre-rendered HTML. The browser reads current published listings from `/api/catalog`. D1 stores products, authentication records, and enquiries. Product uploads use D1 storage or the optional R2 binding.

Set the account and binding configuration in the ignored `.env.workers.local` file or the shell.

```dotenv
SPARKS_WORKERS_SUBDOMAIN=your-account-subdomain
SPARKS_WORKERS_ACCOUNT_ID=your-cloudflare-account-id
SPARKS_WORKERS_D1_ID=your-production-database-id
# SPARKS_WORKERS_R2_BUCKET=your-media-bucket-name
```

Set `BETTER_AUTH_SECRET`, optional Google OAuth credentials, and Brevo settings as Worker secrets. For a first deployment, supply those settings through an ignored file with `--secrets-file .env.workers-secrets.local`. The build sets `BETTER_AUTH_URL` to the Workers origin.

Register the Workers origin followed by `/api/auth/callback/google` with the existing OAuth client when Google sign-in is enabled.

```bash
npx wrangler login
npm run deploy:workers
```

After deployment, check the homepage, catalog, product details, sign-in, authenticated admin actions, and a read-only check of the enquiry flow. The legacy Pages hostname redirects to the Workers site. The Pages build scripts remain available for maintenance of the legacy project.

## Repository layout

- `app/` contains the storefront, authenticated workspaces, and API routes.
- `worker/` contains Cloudflare request handling and the public catalog endpoint.
- `db/schema.ts` and `drizzle/` contain the database definitions and migrations.
- `public/` contains images and attribution data used by the catalog.
- `scripts/` contains build preparation and catalog image maintenance tools.
- `tests/` contains rendered route and request handling checks.

Keep local credentials, backups, and database exports outside the tracked source and public assets.
