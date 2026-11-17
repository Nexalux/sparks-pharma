"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "./SafeLink";
import type { MemberAccount, Product } from "../lib/data";
import { useSite } from "./SiteProvider";

const INDIA_STATES = ["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

type BuyerForm = {
  businessName: string;
  contactName: string;
  buyerType: string;
  phone: string;
  email: string;
  state: string;
  city: string;
  pincode: string;
  note: string;
  acknowledged: boolean;
  consentStorage: boolean;
};

type Submission = { reference: string; expiresAt: string };

const initialForm: BuyerForm = {
  businessName: "",
  contactName: "",
  buyerType: "",
  phone: "",
  email: "",
  state: "Gujarat",
  city: "",
  pincode: "",
  note: "",
  acknowledged: false,
  consentStorage: false,
};

export function QuoteBuilder({ products, member, signInHref }: { products: Product[]; member?: MemberAccount; signInHref: string }) {
  const { basket, updateItem, removeItem, clearBasket } = useSite();
  const [form, setForm] = useState<BuyerForm>(() => member ? {
    ...initialForm,
    businessName: member.businessName,
    contactName: member.displayName,
    buyerType: member.buyerType,
    phone: member.phone,
    email: member.email,
    state: member.state || "Gujarat",
    city: member.city,
    pincode: member.pincode,
  } : initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [draftName, setDraftName] = useState("Procurement draft");
  const [draftNotice, setDraftNotice] = useState("");
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [quoteStep, setQuoteStep] = useState<"items" | "details">("items");
  const lines = useMemo(
    () => basket.map((item) => ({ item, product: products.find((product) => product.slug === item.productSlug) })).filter((line) => line.product),
    [basket, products],
  );

  function updateForm<K extends keyof BuyerForm>(key: K, value: BuyerForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setSubmitError("");
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!form.businessName.trim()) next.businessName = "Enter the business name.";
    if (!form.contactName.trim()) next.contactName = "Enter a contact name.";
    if (!form.buyerType) next.buyerType = "Choose a buyer type.";
    if (!/^[6-9]\d{9}$/.test(form.phone)) next.phone = "Enter a valid 10-digit Indian mobile number.";
    if (!form.state) next.state = "Choose a state or union territory.";
    if (!form.city.trim()) next.city = "Enter a city or town.";
    if (!/^\d{6}$/.test(form.pincode)) next.pincode = "Enter a six-digit Indian PIN code.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email or leave it blank.";
    if (!form.acknowledged) next.acknowledged = "Please confirm the trade enquiry notice.";
    if (!form.consentStorage) next.consentStorage = "Consent is required to submit an on-site enquiry.";
    return next;
  }

  function buildMessage() {
    const productLines = lines.map(({ item, product }, index) => {
      const price = product!.priceDisplay === "indicative"
        ? " | Indicative: " + (product!.priceValue || product!.retailReference.display) + " " + (product!.priceUnit || product!.retailReference.unit)
        : " | Price on request";
      return String(index + 1) + ". " + product!.genericName + " — " + product!.strength + ", " + product!.packSize + " | Qty: " + item.quantity + price + (item.note ? " | Note: " + item.note : "");
    });
    return [
      "SPARKS PHARMA — INDIA B2B TRADE ENQUIRY",
      "",
      "Business: " + form.businessName.trim(),
      "Contact: " + form.contactName.trim(),
      "Buyer type: " + form.buyerType,
      "Mobile: +91 " + form.phone,
      "Location: " + form.city.trim() + ", " + form.state + " — " + form.pincode,
      form.email ? "Email: " + form.email.trim() : "",
      "",
      "PRODUCTS",
      ...productLines,
      form.note ? "\nGeneral note: " + form.note.trim() : "",
      "",
      "This is a B2B trade enquiry, not a confirmed order. Supply remains subject to business, documentation, pricing, stock, and serviceability review.",
      "No prescription or patient information is included.",
    ].filter(Boolean).join("\n");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!member) {
      setForm((current) => ({ ...current, acknowledged: false, consentStorage: false }));
      setAuthPromptOpen(true);
      return;
    }
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setQuoteStep("details");
      document.getElementById("buyer-details")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const nextMessage = buildMessage();
    setMessage(nextMessage);
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessName: form.businessName.trim(),
          contactName: form.contactName.trim(),
          buyerType: form.buyerType,
          phone: form.phone,
          email: form.email.trim() || undefined,
          state: form.state,
          city: form.city.trim(),
          pincode: form.pincode,
          note: form.note.trim() || undefined,
          consentedAt: new Date().toISOString(),
            items: lines.map(({ item }) => ({
              productSlug: item.productSlug,
              quantity: item.quantity,
              note: item.note,
            })),
        }),
      });
      const result = await response.json() as { id?: string; reference?: string; expiresAt?: string; error?: string; code?: string; signInUrl?: string };
      if (response.status === 401 && result.code === "AUTH_REQUIRED") {
        setForm((current) => ({ ...current, acknowledged: false, consentStorage: false }));
        setAuthPromptOpen(true);
        return;
      }
      if (!response.ok || !result.id || !result.expiresAt) throw new Error(result.error || "The enquiry could not be submitted.");
      setSubmission({ reference: result.reference || "SP-" + result.id.slice(0, 8).toUpperCase(), expiresAt: result.expiresAt });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "The enquiry could not be submitted. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function saveDraft() {
    setDraftNotice("Saving…");
    const response = await fetch("/api/account/quotes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: draftName.trim() || "Procurement draft", items: basket }),
    });
    const result = await response.json() as { error?: string };
    setDraftNotice(response.ok ? "Saved to your workspace." : result.error || "Unable to save this draft.");
  }

  function startAnother() {
    clearBasket();
    setForm(initialForm);
    setSubmission(null);
    setMessage("");
    setQuoteStep("items");
  }

  function moveToDetails() {
    setQuoteStep("details");
    window.setTimeout(() => document.getElementById("buyer-details")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function moveToItems() {
    setQuoteStep("items");
    window.setTimeout(() => document.getElementById("quote-items")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  if (submission) {
    return <section className="enquiry-confirmation" aria-live="polite">
      <div className="confirmation-mark" aria-hidden="true">✓</div>
      <span className="kicker">ENQUIRY SUBMITTED</span>
      <h2>Your procurement request is in the review queue.</h2>
      <p>Keep this reference for follow-up. The enquiry record will be retained until {new Date(submission.expiresAt).toLocaleDateString("en-IN")} and then deleted automatically.</p>
      <div className="confirmation-reference"><span>Tracking reference</span><strong>{submission.reference}</strong></div>
      <div className="confirmation-steps"><div><b>01</b><span>Request received</span></div><div><b>02</b><span>Buyer and item review</span></div><div><b>03</b><span>Pricing follow-up</span></div></div>
      <div className="confirmation-actions">{member ? <Link className="primary-action" href="/account#enquiries">Track in workspace <span>→</span></Link> : <Link className="primary-action" href="/products">Continue browsing <span>→</span></Link>}<button className="secondary-action" type="button" onClick={copyMessage}>{copied ? "Copied ✓" : "Copy enquiry summary"}</button><button className="text-button" type="button" onClick={startAnother}>Start another enquiry</button></div>
    </section>;
  }

  if (!lines.length) return <section className="empty-basket"><div className="empty-state"><span aria-hidden="true">＋</span><h2>Your quote basket is empty</h2><p>Add catalog products and quantities before preparing a trade enquiry.</p><Link className="primary-action" href="/products">Browse catalog <span>→</span></Link></div></section>;

  return <>
  <form className="quote-layout" onSubmit={handleSubmit} noValidate>
    <div className="quote-progress" aria-label="Enquiry preparation steps">
      <div className={quoteStep === "items" ? "is-active" : "is-complete"}><b>{quoteStep === "details" ? "✓" : "01"}</b><span><strong>Review basket</strong><small>{lines.length} {lines.length === 1 ? "catalog item" : "catalog items"}</small></span></div>
      <i aria-hidden="true" />
      <div className={quoteStep === "details" ? "is-active" : ""}><b>02</b><span><strong>Business details</strong><small>Buyer and contact information</small></span></div>
      <i aria-hidden="true" />
      <div><b>03</b><span><strong>Submit enquiry</strong><small>Consent and human review</small></span></div>
    </div>
    <div className={`quote-items ${quoteStep === "details" ? "is-mobile-hidden" : ""}`} id="quote-items">
      <div className="quote-section-head"><div><span className="kicker">01 / ITEMS</span><h2>Review your basket</h2><p>Confirm quantities and add trade-specific notes before continuing.</p></div><button className="text-button danger-text" type="button" onClick={clearBasket}>Clear basket</button></div>
      <div className="quote-save-bar">
        {member ? <><label><span>Draft name</span><input value={draftName} maxLength={80} onChange={(event) => setDraftName(event.target.value)} /></label><button className="secondary-action" type="button" onClick={saveDraft}>Save quote</button><small role="status">{draftNotice}</small></> : <><div><strong>Want to keep this quote?</strong><span>Sign in to save it and resume on another visit.</span></div><Link className="secondary-action" href={signInHref}>Sign in to save</Link></>}
      </div>
      {lines.map(({ item, product }, index) => <article className="quote-line" key={item.productSlug}>
        <div className="quote-line-visual">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product!.image.src} alt="" width="160" height="160" loading="lazy" decoding="async" />
          <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        </div>
        <div className="quote-line-copy"><span>{product!.category} · catalog record</span><Link href={"/products/" + product!.slug}>{product!.genericName}</Link><p>{product!.strength} · {product!.packSize}</p><label><span>Item note</span><input value={item.note || ""} onChange={(event) => updateItem(item.productSlug, item.quantity, event.target.value)} placeholder="Optional trade note — no patient details" /></label></div>
        <div className="line-quantity"><span>Quantity</span><div><button type="button" onClick={() => updateItem(item.productSlug, Math.max(1, item.quantity - 1), item.note)} aria-label={"Decrease " + product!.genericName + " quantity"}>−</button><input aria-label={product!.genericName + " quantity"} type="number" min="1" max="999" value={item.quantity} onChange={(event) => updateItem(item.productSlug, Number(event.target.value) || 1, item.note)} /><button type="button" onClick={() => updateItem(item.productSlug, item.quantity + 1, item.note)} aria-label={"Increase " + product!.genericName + " quantity"}>+</button></div><button className="remove-button" type="button" onClick={() => removeItem(item.productSlug)}>Remove</button></div>
      </article>)}
      <button className="primary-action action-full quote-mobile-continue" type="button" onClick={moveToDetails}>Continue to business details <span>→</span></button>
    </div>
    <div className={`buyer-card ${quoteStep === "items" ? "is-mobile-hidden" : ""}`} id="buyer-details">
      <button className="text-button quote-mobile-back" type="button" onClick={moveToItems}>← Back to basket</button>
      <div className="quote-section-head"><div><span className="kicker">02 / BUYER</span><h2>Business details</h2><p>Fields marked by context are required for a structured response.</p></div><span className="required-chip">Trade enquiry</span></div>
      <div className="privacy-chip"><span aria-hidden="true">◉</span> Enquiries are stored securely for up to 90 days with your consent.</div>
      <div className="form-grid">
        <Field label="Business name" error={errors.businessName} wide><input value={form.businessName} onChange={(e) => updateForm("businessName", e.target.value)} autoComplete="organization" /></Field>
        <Field label="Contact name" error={errors.contactName}><input value={form.contactName} onChange={(e) => updateForm("contactName", e.target.value)} autoComplete="name" /></Field>
        <Field label="Buyer type" error={errors.buyerType}><select value={form.buyerType} onChange={(e) => updateForm("buyerType", e.target.value)}><option value="">Select one</option><option>Pharmacy</option><option>Stockist</option><option>Clinic</option><option>Hospital</option><option>Other licensed trade buyer</option></select></Field>
        <Field label="Mobile number" error={errors.phone}><div className="phone-field"><span>+91</span><input inputMode="numeric" maxLength={10} value={form.phone} onChange={(e) => updateForm("phone", e.target.value.replace(/\D/g, ""))} autoComplete="tel" /></div></Field>
        <Field label="Email" optional error={errors.email}><input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} autoComplete="email" /></Field>
        <Field label="State or union territory" error={errors.state}><select value={form.state} onChange={(e) => updateForm("state", e.target.value)}>{INDIA_STATES.map((state) => <option value={state} key={state}>{state}</option>)}</select></Field>
        <Field label="City or town" error={errors.city}><input value={form.city} onChange={(e) => updateForm("city", e.target.value)} autoComplete="address-level2" /></Field>
        <Field label="PIN code" error={errors.pincode}><input inputMode="numeric" maxLength={6} value={form.pincode} onChange={(e) => updateForm("pincode", e.target.value.replace(/\D/g, ""))} autoComplete="postal-code" /></Field>
        <Field label="General enquiry note" optional wide><textarea rows={4} value={form.note} onChange={(e) => updateForm("note", e.target.value)} placeholder="Trade questions only. Do not include prescription or patient information." /></Field>
      </div>
      <label className={"acknowledgement " + (errors.acknowledged ? "has-error" : "")}><input type="checkbox" checked={form.acknowledged} onChange={(e) => updateForm("acknowledged", e.target.checked)} /><span>I understand this is an India B2B trade enquiry, not a confirmed order. Final supply remains subject to business, documentation, pricing, stock, and serviceability verification.</span></label>
      {errors.acknowledged ? <span className="field-error">{errors.acknowledged}</span> : null}
      <label className={"acknowledgement consent-box " + (errors.consentStorage ? "has-error" : "")}><input type="checkbox" checked={form.consentStorage} onChange={(e) => updateForm("consentStorage", e.target.checked)} /><span>I consent to Sparks Pharma storing these business enquiry details for follow-up for up to 90 days.</span></label>
      {errors.consentStorage ? <span className="field-error">{errors.consentStorage}</span> : null}
      <button className="primary-action action-full" type="submit" disabled={submitting}>{submitting ? "Submitting enquiry…" : "Submit trade enquiry"} <span>→</span></button>
      {submitError ? <p className="submission-error" role="alert">{submitError}</p> : null}
    </div>
  </form>
  {authPromptOpen ? <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthPromptOpen(false); }}>
    <section className="auth-gate-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-gate-title">
      <button className="modal-close" type="button" aria-label="Continue editing quote" onClick={() => setAuthPromptOpen(false)}>×</button>
      <div className="auth-gate-icon" aria-hidden="true">↗</div>
      <span className="kicker">KEEP YOUR ENQUIRY SECURE</span>
      <h2 id="auth-gate-title">Sign in before sending this quote.</h2>
      <p>Your products and quantities are already saved on this device. After signing in or creating an account, you will return here to review consent and submit.</p>
      <div className="auth-gate-actions"><Link className="primary-action" href={signInHref}>Sign in <span>→</span></Link><Link className="secondary-action" href={signInHref + "&mode=create"}>Create account</Link></div>
      <button className="text-button" type="button" onClick={() => setAuthPromptOpen(false)}>Continue editing</button>
    </section>
  </div> : null}
  </>;
}

function Field({ label, optional, error, wide, children }: { label: string; optional?: boolean; error?: string; wide?: boolean; children: ReactNode }) {
  return <label className={"field " + (wide ? "field-wide " : "") + (error ? "has-error" : "")}><span>{label} {optional ? <small>Optional</small> : null}</span>{children}{error ? <span className="field-error">{error}</span> : null}</label>;
}
