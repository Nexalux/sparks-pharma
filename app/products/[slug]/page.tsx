import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "../../components/SafeLink";
import { ProductActions } from "../../components/ProductActions";
import { ProductGallery } from "../../components/ProductGallery";
import { ProductInformation } from "../../components/ProductInformation";
import { ProductCard } from "../../components/ProductCard";
import { getPublicProduct, getSettings, listPublicProductImages, listPublicProducts } from "../../lib/repository";
import { SITE_NAME } from "../../lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getPublicProduct(slug), getSettings()]);
  if (!product) return { title: "Product not found", robots: { index: false, follow: false } };
  const description = product.genericName + " " + product.strength + " — B2B catalog record for India-wide trade enquiries.";
  const eligible = product.status === "published";
  const imageUrl = product.image.src;
  const canonicalPath = "/products/" + product.slug;
  return {
    title: product.genericName,
    description,
    robots: {
      index: eligible,
      follow: eligible,
      googleBot: eligible
        ? { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 }
        : { index: false, follow: false },
    },
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "website",
      siteName: settings.brandName || SITE_NAME,
      locale: "en_IN",
      url: canonicalPath,
      title: product.genericName + " | " + settings.brandName,
      description,
      images: [{ url: imageUrl, alt: product.image.alt }],
    },
    twitter: { card: "summary_large_image", title: product.genericName + " | " + settings.brandName, description, images: [imageUrl] },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, catalog] = await Promise.all([getPublicProduct(slug), listPublicProducts()]);
  if (!product) notFound();
  const images = await listPublicProductImages(product.id || product.slug);
  const priceVisible = product.priceDisplay && product.priceDisplay !== "hidden";
  const related = catalog.filter((item) => item.slug !== product.slug && (item.category === product.category || item.manufacturer === product.manufacturer || item.composition.includes(product.genericName))).slice(0, 4);
  return <main className="product-detail">
    <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href="/products">Products</Link><span>/</span><b>{product.genericName}</b></div>
    <section className="product-detail-grid">
      <div className="product-title-block"><span className="eyebrow"><i /> Published trade listing</span><div className="listing-meta"><span>{product.category}</span><span>{product.dosageForm}</span><span>Enquiry catalog</span></div><h1>{product.genericName}</h1><p className="composition"><span>Active composition</span>{product.composition}</p></div>
      <ProductGallery images={images.length ? images : [product.image]} productName={product.genericName} category={product.category} />
      <div className="product-detail-copy"><div className="detail-facts"><div><span>Strength</span><strong>{product.strength}</strong></div><div><span>Dosage form</span><strong>{product.dosageForm}</strong></div><div><span>Pack format</span><strong>{product.packSize}</strong></div><div><span>Manufacturer</span><strong>{product.manufacturer}</strong></div><div><span>Availability</span><strong>{String(product.availability || "on request").replace("_", " ")}</strong></div><div><span>Minimum quantity</span><strong>{product.minimumQuantity || 1}</strong></div></div>
        <div className="classification-notice"><span aria-hidden="true">!</span><div><small>BUYER VERIFICATION</small><strong>{product.regulatoryClassification}</strong><p>{product.tradeNotes}</p><p>This page provides no medical advice, confirmed wholesale quote, or stock reservation.</p></div></div>
        {priceVisible ? <div className="price-reference-panel"><span className="kicker">{product.priceDisplay === "on_request" ? "TRADE PRICING" : "INDICATIVE PRICE REFERENCE"}</span><h2>{product.priceDisplay === "on_request" ? "Price on request" : product.priceValue || product.retailReference.display} <small>{product.priceUnit || product.retailReference.unit}</small></h2><p>Final trade price and stock require manual confirmation. This is not an online offer or confirmed order.</p></div> : null}
        <details className="image-attribution"><summary><span><small>IMAGE CONTEXT</small><strong>Photography notes and credits</strong></span><b aria-hidden="true">＋</b></summary><div><p>{images[0]?.referenceNote || product.image.referenceNote}</p>{images.map((image, index) => image.sourceUrl ? <p key={image.id || image.src + index}>Photo {index + 1}: {image.credit} · <a href={image.sourceUrl} target="_blank" rel="noreferrer">{image.sourceLabel}</a>{image.licenseUrl ? <> · <a href={image.licenseUrl} target="_blank" rel="noreferrer">{image.licenseLabel}</a></> : null}</p> : null)}</div></details>
        {product.enquiryEligible === false || product.availability === "unavailable" ? <p className="admin-flash">This record is not currently eligible for enquiries.</p> : <ProductActions productSlug={product.slug} productName={product.genericName} />}
      </div>
    </section>
    {product.detailContent ? <ProductInformation product={product} content={product.detailContent} /> : null}
    {related.length ? <section className="related-products"><div className="detail-section-heading"><span className="kicker">RELATED CATALOG RECORDS</span><h2>Continue comparing.</h2></div><div className="product-grid">{related.map((item) => <ProductCard product={item} key={item.slug} />)}</div></section> : null}
    <section className="detail-bottom"><div><span className="kicker">INFORMATIONAL NOTICE</span><h2>Trade catalog, not prescribing guidance.</h2></div><p>Product information is general and source-linked. See the <Link href="/about">About page</Link> for portfolio context and always rely on approved product information and qualified professional advice.</p></section>
  </main>;
}
