"use client";

import { type KeyboardEvent, useRef, useState } from "react";
import type { Product, ProductDetailContent } from "../lib/data";

type InformationTab = "overview" | "trade" | "safety" | "sources";

const tabs: { id: InformationTab; label: string; eyebrow: string }[] = [
  { id: "overview", label: "Overview", eyebrow: "Purpose & use" },
  { id: "trade", label: "Trade details", eyebrow: "Pack & supply" },
  { id: "safety", label: "Safety & storage", eyebrow: "Important context" },
  { id: "sources", label: "Sources", eyebrow: "Review trail" },
];

function sourceHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Reference link";
  }
}

function InfoList({ items, tone = "standard" }: { items: string[]; tone?: "standard" | "caution" }) {
  return <ul className={`info-list info-list-${tone}`}>{items.map((item, index) => <li key={item}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><p>{item}</p></li>)}</ul>;
}

export function ProductInformation({ product, content }: { product: Product; content: ProductDetailContent }) {
  const [tab, setTab] = useState<InformationTab>("overview");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const reviewedDate = new Date(content.lastReviewedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const availability = String(product.availability || "on request").replaceAll("_", " ");

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    setTab(tabs[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }

  return <section className="product-information" aria-labelledby="product-information-title">
    <div className="detail-section-heading">
      <span className="kicker">PRODUCT INFORMATION</span>
      <h2 id="product-information-title">A clearer view of {product.genericName}.</h2>
      <p>Educational context and procurement facts are kept separate, making the record easier to scan without turning it into prescribing guidance.</p>
      <div className="detail-heading-meta" aria-label="Product information summary"><span>{product.category}</span><span>{product.dosageForm}</span><span>Reviewed {reviewedDate}</span></div>
    </div>

    <div className="product-tabs-shell">
      <div className="product-tabs" role="tablist" aria-label="Product information sections">{tabs.map((item, index) => <button ref={(node) => { tabRefs.current[index] = node; }} key={item.id} type="button" role="tab" tabIndex={tab === item.id ? 0 : -1} aria-selected={tab === item.id} aria-controls={`panel-${item.id}`} onKeyDown={(event) => moveTab(event, index)} onClick={() => setTab(item.id)}><small>{item.eyebrow}</small><span>{item.label}</span></button>)}</div>
    </div>

    <div className="product-tab-panel" id={`panel-${tab}`} role="tabpanel" aria-live="polite">
      {tab === "overview" ? <div className="overview-layout">
        <div className="information-story">
          <article className="editorial-block"><span className="section-number">01 / CATALOG SCOPE</span><h3>What this record covers</h3><p>{content.overview}</p></article>
          <article className="editorial-block"><span className="section-number">02 / GENERAL USES</span><h3>Where this ingredient is commonly used</h3><InfoList items={content.commonUses} /></article>
        </div>
        <aside className="mechanism-card"><span className="section-number">03 / INGREDIENT SUMMARY</span><h3>How the active ingredient works</h3><p>{content.howItWorks}</p><div className="information-callout"><span aria-hidden="true">i</span><div><strong>Read this as general information</strong><p>This summary is not a diagnosis, prescription, dosage instruction, or recommendation to use a medicine.</p></div></div></aside>
      </div> : null}

      {tab === "trade" ? <div className="trade-information">
        <div className="trade-summary"><div><span className="availability-dot" aria-hidden="true" /><span>Current catalog status</span><strong>{availability}</strong></div><div><span>Minimum enquiry quantity</span><strong>{product.minimumQuantity || 1}</strong><small>units per enquiry</small></div></div>
        <div className="specification-table"><div><span>Composition</span><strong>{product.composition}</strong></div><div><span>Dosage form</span><strong>{product.dosageForm}</strong></div><div><span>Strength</span><strong>{product.strength}</strong></div><div><span>Pack format</span><strong>{product.packSize}</strong></div><div><span>Manufacturer</span><strong>{product.manufacturer}</strong></div><div><span>Classification</span><strong>{product.regulatoryClassification}</strong></div></div>
        <div className="trade-guidance"><div><span className="section-number">TRADE HANDLING</span><h3>Confirmation happens during enquiry review</h3></div><p>{product.tradeNotes || "Current stock, batch, expiry, documentation, pricing, and delivery terms are confirmed by the trade desk before any supply discussion proceeds."}</p></div>
      </div> : null}

      {tab === "safety" ? <div className="safety-information">
        <div className="safety-intro"><span aria-hidden="true">!</span><div><strong>Safety information needs professional context.</strong><p>Effects and cautions vary by composition, dose, other medicines, and individual health history. This catalog does not replace approved product information.</p></div></div>
        <div className="safety-card-grid"><article><span className="section-number">01 / REPORTED EFFECTS</span><h3>Commonly reported effects</h3><InfoList items={content.safety.commonSideEffects} /></article><article className="caution-card"><span className="section-number">02 / CAUTIONS</span><h3>Points to check</h3><InfoList items={content.safety.cautions} tone="caution" /></article></div>
        <div className="storage-band"><span className="storage-mark" aria-hidden="true">°</span><div><span className="section-number">03 / STORAGE</span><h3>Keep the product in suitable conditions</h3><p>{content.safety.storage}</p></div></div>
      </div> : null}

      {tab === "sources" ? <div className="source-information">
        <div className="source-review-bar"><div><span className="section-number">REVIEW STATUS</span><strong>General information reviewed</strong></div><time dateTime={content.lastReviewedAt}>{reviewedDate}</time></div>
        <p className="source-intro">These references support the educational sections above. Product-specific packs and approved documentation remain the source of truth for trade verification.</p>
        <div className="source-list">{content.sources.map((source, index) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}><span className="source-index">{String(index + 1).padStart(2, "0")}</span><span><strong>{source.label}</strong><small>{sourceHost(source.url)}</small></span><b>Open reference <span aria-hidden="true">↗</span></b></a>)}</div>
      </div> : null}
    </div>

    <div className="product-faq"><div className="faq-heading"><span className="kicker">COMMON QUESTIONS</span><h2>Before you send an enquiry.</h2></div>{content.faqs.map((faq, index) => <details key={faq.question}><summary><span className="faq-number">{String(index + 1).padStart(2, "0")}</span><span>{faq.question}</span><b aria-hidden="true">＋</b></summary><p>{faq.answer}</p></details>)}</div>
  </section>;
}
