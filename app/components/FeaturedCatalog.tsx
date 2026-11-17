"use client";

import { LiveCatalog } from "./LiveCatalog";
import { ProductCard } from "./ProductCard";
import Link from "./SafeLink";

export function FeaturedCatalog() {
  return <LiveCatalog>{(products) => {
    const featured = products.slice(0, 16);
    return <>
      <div className="product-grid">
        {featured.map((product, index) => <ProductCard product={product} index={index} key={product.slug} />)}
      </div>
      <div className="catalog-continuation">
        <span className="catalog-count">{featured.length} / {products.length}</span>
        <div><strong>Continue through the complete trade catalog.</strong><p>Explore every published record with composition, category, form, strength, manufacturer, and pack filters.</p></div>
        <Link className="primary-action" href="/products">Explore full catalog <span>→</span></Link>
      </div>
    </>;
  }}</LiveCatalog>;
}
