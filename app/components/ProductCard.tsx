"use client";

import Link from "./SafeLink";
import { useState } from "react";
import type { CatalogListing } from "../lib/catalog-listing";
import { useSite } from "./SiteProvider";

export function ProductCard({ product, index = 0 }: { product: CatalogListing; index?: number }) {
  const { addItem } = useSite();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product.slug, 1, undefined, product.genericName);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2400);
  }

  return (
    <article className="product-card">
      <Link
        href={`/products/${product.slug}`}
        className="product-image-link"
        aria-label={`View ${product.genericName} details`}
      >
        {/* vinext serves these already-compressed local catalog assets directly. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image.src} alt={product.image.alt} width="720" height="480" loading="lazy" decoding="async" />
        <span>PRODUCT IMAGE</span>
      </Link>
      <div className="product-card-head">
        <div className="product-index">{String(index + 1).padStart(2, "0")}</div>
        <span className="sample-tag">{String(product.availability || "on request").replace("_", " ").toUpperCase()}</span>
      </div>
      <Link href={`/products/${product.slug}`} className="product-main-link">
        <span className="product-category">{product.category}</span>
        <h3>{product.genericName}</h3>
        <p>{product.strength} · {product.dosageForm}</p>
      </Link>
      <div className="product-footer">
        <span>
          Pack <b>{product.packSize}</b>
          {product.priceDisplay === "hidden" ? null : <small className="price-reference">{product.priceDisplay === "on_request" ? <b>Price on request</b> : <>Indicative reference <b>{product.priceValue || product.retailReference.display}</b> {product.priceUnit || product.retailReference.unit}</>}</small>}
          {added ? <Link className="product-basket-link" href="/quote">Review basket →</Link> : null}
        </span>
        <button
          className={added ? "is-added" : ""}
          type="button"
          onClick={handleAdd}
          disabled={product.enquiryEligible === false || product.availability === "unavailable"}
          aria-label={`Add ${product.genericName} to quote`}
        >
          <span>{product.enquiryEligible === false || product.availability === "unavailable" ? "Unavailable" : added ? "Added" : "Add"}</span><b aria-hidden="true">{product.enquiryEligible === false || product.availability === "unavailable" ? "—" : added ? "✓" : "+"}</b>
        </button>
      </div>
    </article>
  );
}
