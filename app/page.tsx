import Link from "./components/SafeLink";
import { FeaturedCatalog } from "./components/FeaturedCatalog";
import { DEFAULT_SITE_SETTINGS } from "./lib/data";
import { publicPageMetadata } from "./lib/seo";

export const metadata = {
  ...publicPageMetadata(
    "Sparks Pharma | India B2B Medicine Catalog",
    "Search generic medicines, compare pack formats, and submit structured B2B procurement enquiries across India.",
    "/",
  ),
  title: { absolute: "Sparks Pharma | India B2B Medicine Catalog" },
};

const categories = [
  { name: "Anti-infective", code: "AI", description: "Oral solid trade listings" },
  { name: "Gastrointestinal", code: "GI", description: "Composition-led procurement" },
  { name: "Metabolic care", code: "MC", description: "Pack and strength discovery" },
  { name: "Pain relief", code: "PR", description: "Everyday trade essentials" },
];

export default function Home() {
  const settings = DEFAULT_SITE_SETTINGS;

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><i /> India-wide enquiries · {settings.serviceRegion.primaryState} primary region</span>
          <h1>{settings.homepageHeadline.replace(/\.$/, "")}<em>.</em></h1>
          <p>
            {settings.homepageIntro}
          </p>
          <div className="hero-actions">
            <Link className="primary-action" href="/products">Explore catalog <span>→</span></Link>
            <Link className="text-action" href="/quality">Our quality approach</Link>
          </div>
          <div className="hero-meta">
            <span><b>IN</b> India-wide enquiries</span>
            <span><b>01</b> One consolidated enquiry</span>
            <span><b>00</b> No patient data</span>
          </div>
        </div>
        <div className="hero-panel" aria-label="Sparks Pharma trade catalog">
          <div className="panel-top"><span>TRADE CATALOG / PROCUREMENT DESK</span><span>INDIA</span></div>
          <div className="panel-orbit" aria-hidden="true"><span className="orbit-one"/><span className="orbit-two"/><span className="orbit-three"/><b>✦</b></div>
          <div className="panel-signal" aria-hidden="true"><span><b>01</b>RECORD</span><i /><span><b>02</b>BASKET</span><i /><span><b>03</b>ENQUIRY</span></div>
          <div className="panel-bottom">
            <div><small>FOCUS</small><strong>Generic medicines</strong></div>
            <div><small>JOURNEY</small><strong>Browse → Basket → Submit</strong></div>
          </div>
        </div>
      </section>

      <section className="principles-strip" aria-label="Procurement principles">
        <div><span>01</span><p><b>Trade only</b>For eligible Indian businesses</p></div>
        <div><span>02</span><p><b>Human verified</b>No automated acceptance</p></div>
        <div><span>03</span><p><b>Consent-led</b>Enquiries stored only when approved</p></div>
      </section>

      <section className="content-section categories-section">
        <div className="section-heading">
          <div><span className="kicker">BROWSE BY CATEGORY</span><h2>A catalog organised for procurement.</h2></div>
          <p>Browse frequently requested trade categories, then refine by composition, form, strength, manufacturer, and pack size.</p>
        </div>
        <div className="category-grid">
          {categories.map((category, index) => (
            <Link href={`/products?category=${encodeURIComponent(category.name)}`} className="category-card" key={category.name}>
              <span className="category-number">0{index + 1}</span>
              <span className="category-code">{category.code}</span>
              <h3>{category.name}</h3>
              <p>{category.description}</p>
              <b aria-hidden="true">→</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="content-section catalog-preview">
        <div className="section-heading">
          <div><span className="kicker">FEATURED CATALOG</span><h2>Procurement-ready product records.</h2></div>
          <Link className="text-action" href="/products">View the complete catalog →</Link>
        </div>
        <FeaturedCatalog />
      </section>

      <section className="process-section">
        <div className="process-intro">
          <span className="kicker">ONE CLEAR WORKFLOW</span>
          <h2>From discovery to a human conversation.</h2>
          <p>Keep procurement structured from first search to a reviewable business enquiry.</p>
        </div>
        <ol className="process-list">
          <li><span>01</span><div><h3>Explore factual records</h3><p>Search by composition, category, form, strength, manufacturer, and pack.</p></div></li>
          <li><span>02</span><div><h3>Build one quote basket</h3><p>Combine quantities and item-level notes into a single trade request.</p></div></li>
          <li><span>03</span><div><h3>Submit for review</h3><p>Send the complete request to the procurement desk and receive a tracking reference.</p></div></li>
        </ol>
      </section>

      <section className="service-banner">
        <div>
          <span className="eyebrow eyebrow-light"><i /> CURRENT SERVICE AREA</span>
          <h2>India-wide enquiries, with {settings.serviceRegion.primaryState} at the centre.</h2>
          <p>{settings.serviceRegion.message}</p>
        </div>
        <div className="service-banner-action">
          <div className="service-journey" aria-label="Enquiry journey"><span><b>01</b>Discover</span><i /><span><b>02</b>Build</span><i /><span><b>03</b>Enquire</span></div>
          <Link className="light-action" href="/quote">Prepare an enquiry <span>→</span></Link>
        </div>
      </section>
    </main>
  );
}
