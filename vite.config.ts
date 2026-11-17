import { sites } from "@openai/sites-vite-plugin";
import vinext from "vinext";
import { defineConfig, loadEnv } from "vite";
import hostingConfig from "./.openai/hosting.json";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

function workersDeployment() {
  const env = loadEnv("workers", process.cwd(), "SPARKS_WORKERS_");
  const subdomain = env.SPARKS_WORKERS_SUBDOMAIN;
  const databaseId = env.SPARKS_WORKERS_D1_ID;
  if (!subdomain || !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(subdomain)) {
    throw new Error("Set SPARKS_WORKERS_SUBDOMAIN to the Cloudflare account's workers.dev subdomain label.");
  }
  if (!databaseId || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(databaseId) ||
      databaseId === SITE_CREATOR_PLACEHOLDER_DATABASE_ID) {
    throw new Error("Set SPARKS_WORKERS_D1_ID to the ID of the existing production D1 database.");
  }

  const name = "sparks-pharma";
  const siteOrigin = `https://${name}.${subdomain}.workers.dev`;
  const bucketName = env.SPARKS_WORKERS_R2_BUCKET;
  return {
    siteOrigin,
    config: {
      ...localBindingConfig,
      name,
      account_id: env.SPARKS_WORKERS_ACCOUNT_ID,
      compatibility_date: "2026-08-31",
      workers_dev: true,
      keep_vars: true,
      assets: { binding: "ASSETS", run_worker_first: ["/_sparks-pages/*"] },
      vars: { BETTER_AUTH_URL: siteOrigin },
      d1_databases: [{ binding: d1, database_id: databaseId }],
      r2_buckets: bucketName ? [{ binding: r2, bucket_name: bucketName }] : [],
    },
  };
}

export default defineConfig(async ({ mode }) => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");
  const deployment = mode === "workers" ? workersDeployment() : undefined;

  return {
    define: { "process.env.SPARKS_SITE_ORIGIN": JSON.stringify(deployment?.siteOrigin ?? "") },
    server: {
      host: "localhost",
      fs: {
        deny: [
          ".env", ".env.*", ".dev.vars*", "*.env", ".npmrc",
          "*.{crt,pem,key,p12,pfx,jks,db,sqlite,sqlite3,dump}",
          "client_secret*.json", "credentials.json", "service-account*.json",
          "**/.git/**", "**/.wrangler/**", "**/project-archives/**", "**/work/**", "**/outputs/**",
        ],
      },
      ...(isCodexSeatbeltSandbox ? { watch: { useFsEvents: false, usePolling: true } } : {}),
    },
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: deployment?.config ?? localBindingConfig,
      }),
    ],
  };
});
