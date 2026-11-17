import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "./lib/seo";

const PRIVATE_ROUTES = ["/admin", "/admin-denied", "/api", "/quote", "/account", "/sign-in", "/reset-password"];

export default async function robots(): Promise<MetadataRoute.Robots> {
  return {
    rules: { userAgent: "*", allow: "/", disallow: PRIVATE_ROUTES },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
