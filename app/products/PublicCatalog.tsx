"use client";

import { CatalogExplorer } from "../components/CatalogExplorer";
import { LiveCatalog } from "../components/LiveCatalog";

export function PublicCatalog() {
  return <LiveCatalog>{(products) => <CatalogExplorer products={products} />}</LiveCatalog>;
}
