import type { MetadataRoute } from "next";
import { listPublicProducts } from "./lib/repository";
import { SITE_ORIGIN } from "./lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await listPublicProducts();
  const pages = ["", "/products", "/about", "/quality", "/contact", "/privacy", "/disclaimer"];
  return [
    ...pages.map((path) => ({ url: SITE_ORIGIN + path, changeFrequency: path === "/products" ? "weekly" as const : "monthly" as const, priority: path === "" ? 1 : 0.7 })),
    ...products.filter((product) => product.status === "published").map((product) => ({
      url: SITE_ORIGIN + "/products/" + product.slug,
      ...(product.updatedAt ? { lastModified: new Date(product.updatedAt) } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
