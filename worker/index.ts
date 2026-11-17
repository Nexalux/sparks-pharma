/** Cloudflare Worker entry point for the vinext-starter template. */
import handler from "vinext/server/app-router-entry";
import { productMediaResponse } from "../app/lib/product-media";
import { withRuntimeBindings } from "../app/lib/runtime";
import { SITE_ORIGIN } from "../app/lib/seo";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  MEDIA?: R2Bucket;
  SPARKS_OWNER_EMAIL?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  BREVO_API_KEY?: string;
  BREVO_SENDER_EMAIL?: string;
  BREVO_SENDER_NAME?: string;
  IMAGES?: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

const LEGACY_SITE_HOST = "sparks-pharma-gujarat.tanishqchaudhary886.chatgpt.site";
const PUBLIC_PAGE_ASSET_PREFIX = "/_sparks-pages/";
const MAX_API_BODY_BYTES = 1024 * 1024;
const PUBLIC_PAGE_ASSETS: Record<string, string> = {
  "/": "home.snapshot",
  "/products": "products.snapshot",
};
let localAuthSecret: string | undefined;

function secureResponse(request: Request, response: Response, noStore = false) {
  const headers = new Headers(response.headers);
  headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  if (new URL(request.url).protocol === "https:") {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  if (noStore) {
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    headers.set("Pragma", "no-cache");
    headers.set("Expires", "0");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function rejectUnsupportedRequest(request: Request, url: URL) {
  // This app uses API route handlers for writes. Disallow the unused RSC
  // mutation protocol before the framework attempts to decode a request.
  if (request.headers.has("next-action") || request.headers.has("x-rsc-action") ||
      (request.method === "POST" && !url.pathname.startsWith("/api/"))) {
    return new Response("Method not allowed", { status: 405 });
  }
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method) &&
      !url.pathname.startsWith("/api/auth/")) {
    const origin = request.headers.get("origin");
    const site = request.headers.get("sec-fetch-site");
    if (origin === null ? site === "cross-site" || site === "same-site" : origin !== url.origin) {
      return Response.json({ error: "Cross-origin requests are forbidden." }, { status: 403 });
    }
  }
}

async function limitApiBody(request: Request) {
  const body = request.body;
  if (!body) return request;
  const tooLarge = () => Response.json({ error: "Request body exceeds 1 MB." }, { status: 413 });
  if (Number(request.headers.get("content-length")) > MAX_API_BODY_BYTES) return tooLarge();
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_API_BODY_BYTES) {
        await reader.cancel().catch(() => {});
        return tooLarge();
      }
      chunks.push(value);
    }
  } catch {
    return Response.json({ error: "Unable to read request body." }, { status: 400 });
  } finally {
    reader.releaseLock();
  }
  const payload = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    payload.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new Request(request.url, {
    method: request.method,
    headers: request.headers,
    redirect: request.redirect,
    signal: request.signal,
    body: payload,
  });
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.hostname === LEGACY_SITE_HOST) {
      const destination = new URL(SITE_ORIGIN);
      destination.pathname = url.pathname;
      destination.search = url.search;
      return Response.redirect(destination, 308);
    }
    const rejected = rejectUnsupportedRequest(request, url);
    if (rejected) return secureResponse(request, rejected, true);
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (url.pathname.startsWith(PUBLIC_PAGE_ASSET_PREFIX)) {
      return secureResponse(request, new Response("Not found", { status: 404 }));
    }

    if (url.pathname === "/api/catalog" && request.method === "GET") {
      try {
        const { publicCatalogResponse } = await import("./public-catalog");
        return secureResponse(request, await publicCatalogResponse(env.DB), true);
      } catch (error) {
        console.error("Unable to load published catalog", error);
        return secureResponse(request, Response.json({ error: "Unable to load published catalog." }, { status: 503 }), true);
      }
    }

    const mediaPath = /^\/api\/media\/([^/]+)$/.exec(url.pathname);
    if (mediaPath && (request.method === "GET" || request.method === "HEAD")) {
      let key: string;
      try {
        key = decodeURIComponent(mediaPath[1]);
      } catch {
        return secureResponse(request, new Response("Not found", { status: 404 }));
      }
      try {
        return secureResponse(request, await productMediaResponse(request, key, env.DB, env.MEDIA));
      } catch (error) {
        console.error("Unable to load product media", error);
        return secureResponse(request, new Response("Media unavailable", { status: 503 }), true);
      }
    }

    const pageAsset = PUBLIC_PAGE_ASSETS[url.pathname];
    if (pageAsset && (request.method === "GET" || request.method === "HEAD") &&
        !request.headers.has("RSC") && !url.searchParams.has("_rsc") && !local) {
      const assetUrl = new URL(PUBLIC_PAGE_ASSET_PREFIX + pageAsset, url);
      const asset = await env.ASSETS.fetch(new Request(assetUrl, { method: request.method }));
      if (asset.ok) {
        const headers = new Headers(asset.headers);
        headers.set("Content-Type", "text/html; charset=utf-8");
        return secureResponse(request, new Response(asset.body, { headers }), true);
      }
    }

    if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/product-images/") || url.pathname === "/og.png") {
      return secureResponse(request, await env.ASSETS.fetch(request));
    }

    if (url.pathname === "/_vinext/image") {
      const { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } = await import("vinext/server/image-optimization");
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      const imageBinding = env.IMAGES;
      const response = await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: imageBinding ? async (body, { width, format, quality }) => {
          const result = await imageBinding.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        } : undefined,
      }, allowedWidths);
      return secureResponse(request, response);
    }

    const accepted = url.pathname.startsWith("/api/") && request.body ? await limitApiBody(request) : request;
    if (accepted instanceof Response) return secureResponse(request, accepted, true);
    if (local) {
      const { ensureLocalAuthSchema } = await import("../app/lib/local-auth-bootstrap");
      await ensureLocalAuthSchema(env.DB);
    }
    const response = await withRuntimeBindings({
      DB: env.DB,
      MEDIA: env.MEDIA,
      SPARKS_OWNER_EMAIL: env.SPARKS_OWNER_EMAIL,
      BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET || (local ? (localAuthSecret ??= crypto.randomUUID() + crypto.randomUUID()) : undefined),
      BETTER_AUTH_URL: env.BETTER_AUTH_URL || (local ? url.origin : undefined),
      GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
      BREVO_API_KEY: env.BREVO_API_KEY,
      BREVO_SENDER_EMAIL: env.BREVO_SENDER_EMAIL,
      BREVO_SENDER_NAME: env.BREVO_SENDER_NAME,
    }, () => handler.fetch(accepted, env, ctx));
    return secureResponse(request, response, true);
  },
};

export default worker;
