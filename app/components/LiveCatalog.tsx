"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { CatalogListing } from "../lib/catalog-listing";

export function LiveCatalog({ children }: { children: (products: CatalogListing[]) => ReactNode }) {
  const [products, setProducts] = useState<CatalogListing[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/catalog", { signal: controller.signal, cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Catalog unavailable");
        return response.json() as Promise<CatalogListing[]>;
      })
      .then((records) => {
        if (!controller.signal.aborted) setProducts(records);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [attempt]);

  if (failed) return (
    <div className="content-section" role="status">
      <p>The catalog could not load.</p>
      <button className="primary-action" type="button" onClick={() => { setFailed(false); setAttempt(attempt + 1); }}>Retry</button>
    </div>
  );
  if (!products) return <p className="content-section" role="status">Loading published products…</p>;
  return children(products);
}
