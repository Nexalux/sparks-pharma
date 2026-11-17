"use client";

/* Managed admin uploads do not have stable URLs suitable for build-time image optimization. */
/* eslint-disable @next/next/no-img-element */

/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { Product } from "../../lib/data";

const blankProduct: Product = {
  slug: "", genericName: "", composition: "", category: "", dosageForm: "Tablet", strength: "", packSize: "", manufacturer: "", regulatoryClassification: "Trade classification pending review", tradeNotes: "Trade details require manual confirmation.", detailContent: { overview: "", commonUses: [], howItWorks: "", safety: { commonSideEffects: [], cautions: [], storage: "" }, sources: [], faqs: [], lastReviewedAt: new Date().toISOString().slice(0, 10) }, retailReference: { display: "", unit: "", checkedOn: "", sources: [] }, image: { src: "/product-images/paracetamol.jpg", alt: "Product image", referenceNote: "Business-supplied product image.", sourceLabel: "Business-supplied image", sourceUrl: "", credit: "", licenseLabel: "Business supplied", licenseUrl: "" }, demonstration: false, publicApproved: false, status: "draft", priceDisplay: "hidden", availability: "on_request", minimumQuantity: 1, enquiryEligible: true, seoEnabled: false,
};

type ImageRow = { id: string; src: string; alt: string; reference_note: string; sort_order: number; object_key?: string };

const maximumSourceImageBytes = 8 * 1024 * 1024;
const maximumStoredImageBytes = 700 * 1024;
const maximumImageDimension = 1600;

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
}

async function optimizeProductImage(file: File) {
  if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type) || file.size > maximumSourceImageBytes) {
    throw new Error("Choose a JPEG, PNG, or WebP image up to 8 MB.");
  }
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 40_000_000) throw new Error("Choose an image smaller than 40 megapixels.");
    const baseScale = Math.min(1, maximumImageDimension / Math.max(bitmap.width, bitmap.height));
    let latest: Blob | null = null;
    for (let attempt = 0; attempt < 7; attempt += 1) {
      const scale = baseScale * Math.pow(0.86, attempt);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("This browser could not prepare the image.");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      latest = await canvasBlob(canvas, Math.max(0.55, 0.84 - attempt * 0.045));
      if (latest && latest.size <= maximumStoredImageBytes) {
        return new File([latest], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
      }
    }
    throw new Error("This image could not be reduced below 700 KB. Choose a simpler or smaller image.");
  } finally {
    bitmap.close();
  }
}

export function AdminProducts({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [editing, setEditing] = useState<Product | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [imageProduct, setImageProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ImageRow[]>([]);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const editorCloseRef = useRef<HTMLButtonElement>(null);
  const imageCloseRef = useRef<HTMLButtonElement>(null);
  const filtered = useMemo(() => products.filter((product) => (product.genericName + " " + product.composition + " " + product.category).toLowerCase().includes(search.toLowerCase())), [products, search]);
  const editorOpen = editing !== null;
  const imageManagerOpen = imageProduct !== null;

  useEffect(() => {
    if (!editorOpen && !imageManagerOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") { setEditing(null); setImageProduct(null); } };
    document.addEventListener("keydown", close);
    queueMicrotask(() => (editorOpen ? editorCloseRef.current : imageCloseRef.current)?.focus());
    return () => document.removeEventListener("keydown", close);
  }, [editorOpen, imageManagerOpen]);

  function openEditor(product: Product) {
    setPendingImage(null);
    setEditing({ ...product });
  }

  function closeEditor() {
    setPendingImage(null);
    setEditing(null);
  }

  async function refresh() {
    const response = await fetch("/api/admin/products");
    const data = await response.json() as { products?: Product[]; error?: string };
    if (!response.ok) throw new Error(data.error || "Unable to refresh products.");
    setProducts(data.products || []);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setMessage("Saving…");
    const productPayload = pendingImage && !editing.id ? { ...editing, image: undefined } : editing;
    const response = await fetch(editing.id ? "/api/admin/products/" + editing.id : "/api/admin/products", { method: editing.id ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(productPayload) });
    const data = await response.json() as { id?: string; error?: string; errors?: Record<string, string> };
    if (!response.ok) { setMessage(data.error || Object.entries(data.errors || {}).map(([key, value]) => key + ": " + value).join(" · ")); return; }
    const productId = editing.id || data.id;
    if (pendingImage && productId) {
      setMessage("Product saved. Uploading image…");
      const upload = await uploadProductImage(productId, pendingImage, editing.genericName + " product image");
      if (!upload.ok) {
        await refresh(); closeEditor(); setMessage("Product saved, but the image could not be uploaded. Open Images to try again. " + (upload.error || "")); return;
      }
    }
    await refresh(); closeEditor(); setMessage(pendingImage ? "Product and image saved." : "Product saved.");
  }

  async function action(product: Product, kind: "duplicate" | "delete" | "archive") {
    if (!product.id) return;
    if (kind === "delete" && !window.confirm("Delete " + product.genericName + "? This cannot be undone.")) return;
    setMessage(kind.charAt(0).toUpperCase() + kind.slice(1) + " in progress…");
    if (kind === "duplicate") await fetch("/api/admin/products/" + product.id + "?action=duplicate", { method: "POST" });
    else if (kind === "delete") await fetch("/api/admin/products/" + product.id, { method: "DELETE" });
    else await fetch("/api/admin/products/" + product.id, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...product, status: "archived", seoEnabled: false }) });
    await refresh(); setMessage("Catalog updated.");
  }

  async function importCsv(file: File) {
    setMessage("Importing CSV…");
    const response = await fetch("/api/admin/products/csv", { method: "POST", headers: { "content-type": "text/csv" }, body: await file.text() });
    const result = await response.json() as { imported?: number; errors?: Array<{ row: number }>; error?: string };
    setMessage(result.error || String(result.imported || 0) + " rows imported; " + String(result.errors?.length || 0) + " rows need correction.");
    await refresh();
  }

  async function uploadProductImage(productId: string, file: File, alt: string) {
    try {
      setMessage("Optimizing image…");
      const optimized = await optimizeProductImage(file);
      const form = new FormData(); form.set("file", optimized); form.set("alt", alt);
      const response = await fetch("/api/admin/products/" + productId + "/images", { method: "POST", body: form });
      const result = await response.json() as { error?: string };
      return { ok: response.ok, error: result.error };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Image optimization failed." };
    }
  }

  async function uploadImage(product: Product, file: File) {
    if (!product.id) return;
    const result = await uploadProductImage(product.id, file, product.image.alt || product.genericName + " product image");
    setMessage(result.ok ? "Image uploaded." : result.error || "Image upload failed.");
    if (result.ok) { await refresh(); await openImages(product); }
  }

  async function openImages(product: Product) {
    if (!product.id) return;
    const response = await fetch("/api/admin/products/" + product.id + "/images");
    const data = await response.json() as { images?: ImageRow[]; error?: string };
    if (!response.ok) { setMessage(data.error || "Unable to load images."); return; }
    setImageProduct(product); setImages(data.images || []);
  }

  async function saveImage(image: ImageRow) {
    if (!imageProduct?.id) return;
    const response = await fetch("/api/admin/products/" + imageProduct.id + "/images", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ imageId: image.id, alt: image.alt, referenceNote: image.reference_note, sortOrder: image.sort_order }) });
    const data = await response.json() as { images?: ImageRow[]; error?: string };
    if (data.images) setImages(data.images); setMessage(response.ok ? "Image details saved." : data.error || "Unable to save image.");
    if (response.ok) await refresh();
  }

  async function removeImage(image: ImageRow) {
    if (!imageProduct?.id || !window.confirm("Remove this image from the product?")) return;
    const response = await fetch("/api/admin/products/" + imageProduct.id + "/images?imageId=" + encodeURIComponent(image.id), { method: "DELETE" });
    const data = await response.json() as { images?: ImageRow[]; error?: string };
    if (data.images) setImages(data.images); setMessage(response.ok ? "Image removed." : data.error || "Unable to remove image.");
    if (response.ok) await refresh();
  }

  return (
    <>
      <header className="admin-page-head"><div><span>CATALOG MANAGEMENT</span><h1>Products</h1><p>Create, review, publish, archive, import, and export catalog records.</p></div><button className="primary-action" type="button" onClick={() => openEditor(blankProduct)}>New product <span>＋</span></button></header>
      <section className="admin-toolbar"><label><span className="sr-only">Search products</span><input type="search" placeholder="Search catalog…" value={search} onChange={(event) => setSearch(event.target.value)} /></label><a className="secondary-action" href="/api/admin/products/csv">Export CSV</a><label className="secondary-action file-action">Import CSV<input type="file" accept=".csv,text/csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importCsv(file); }} /></label></section>
      {message ? <p className="admin-flash" role="status">{message}</p> : null}
      <section className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Status</th><th>Price</th><th>Availability</th><th>Search visibility</th><th>Actions</th></tr></thead><tbody>{filtered.map((product) => <tr key={product.id || product.slug}><td><strong>{product.genericName}</strong><small>{product.strength} · {product.packSize}<br />{product.category}</small></td><td><span className={"status-pill status-" + product.status}>{product.status}</span></td><td>{product.priceDisplay === "hidden" ? "Hidden" : product.priceValue || "On request"}</td><td>{String(product.availability).replace("_", " ")}</td><td><small>{product.demonstration ? "Protected" : "Eligible"} · {product.seoEnabled ? "SEO on" : "SEO off"}</small></td><td><div className="table-actions"><button onClick={() => openEditor(product)}>Edit</button><button onClick={() => void openImages(product)}>Images</button><a href={"/products/" + product.slug} target="_blank" rel="noreferrer">Preview</a><button onClick={() => void action(product, "duplicate")}>Duplicate</button><button onClick={() => void action(product, "archive")}>Archive</button><button className="danger-text" onClick={() => void action(product, "delete")}>Delete</button></div></td></tr>)}</tbody></table></section>
      {editing ? <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="product-editor-title"><form className="admin-editor" onSubmit={save}><div className="admin-editor-head"><div><span>PRODUCT RECORD</span><h2 id="product-editor-title">{editing.id ? "Edit " + editing.genericName : "Add product"}</h2></div><button ref={editorCloseRef} type="button" onClick={() => setEditing(null)} aria-label="Close editor">×</button></div><div className="admin-form-grid">
        <label><span>Generic name</span><input required value={editing.genericName} onChange={(e) => setEditing({ ...editing, genericName: e.target.value })} /></label>
        <label><span>Brand name <small>Optional</small></span><input value={editing.brandName || ""} onChange={(e) => setEditing({ ...editing, brandName: e.target.value })} /></label>
        <label className="wide"><span>Slug</span><input value={editing.slug} placeholder="Generated from name if blank" onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></label>
        <label className="wide"><span>Composition</span><input required value={editing.composition} onChange={(e) => setEditing({ ...editing, composition: e.target.value })} /></label>
        <label><span>Category</span><input required value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></label>
        <label><span>Dosage form</span><input required value={editing.dosageForm} onChange={(e) => setEditing({ ...editing, dosageForm: e.target.value })} /></label>
        <label><span>Strength</span><input required value={editing.strength} onChange={(e) => setEditing({ ...editing, strength: e.target.value })} /></label>
        <label><span>Pack size</span><input required value={editing.packSize} onChange={(e) => setEditing({ ...editing, packSize: e.target.value })} /></label>
        <label><span>Manufacturer</span><input required value={editing.manufacturer} onChange={(e) => setEditing({ ...editing, manufacturer: e.target.value })} /></label>
        <label><span>Status</span><select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as Product["status"] })}><option value="draft">Draft</option><option value="review">Review</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
        <label><span>Price display</span><select value={editing.priceDisplay} onChange={(e) => setEditing({ ...editing, priceDisplay: e.target.value as Product["priceDisplay"] })}><option value="hidden">Hidden</option><option value="indicative">Indicative</option><option value="on_request">On request</option></select></label>
        <label><span>Price</span><input value={editing.priceValue || ""} onChange={(e) => setEditing({ ...editing, priceValue: e.target.value, retailReference: { ...editing.retailReference, display: e.target.value } })} /></label>
        <label><span>Price unit</span><input value={editing.priceUnit || ""} onChange={(e) => setEditing({ ...editing, priceUnit: e.target.value, retailReference: { ...editing.retailReference, unit: e.target.value } })} /></label>
        <label><span>Availability</span><select value={editing.availability} onChange={(e) => setEditing({ ...editing, availability: e.target.value as Product["availability"] })}><option value="available">Available</option><option value="limited">Limited</option><option value="on_request">On request</option><option value="unavailable">Unavailable</option></select></label>
        <label><span>Minimum quantity</span><input type="number" min="1" value={editing.minimumQuantity} onChange={(e) => setEditing({ ...editing, minimumQuantity: Number(e.target.value) })} /></label>
        <label className="wide product-image-picker"><span>Product image <small>JPEG, PNG or WebP · source up to 8 MB</small></span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPendingImage(event.target.files?.[0] || null)} />{pendingImage ? <span className="selected-image"><strong>{pendingImage.name}</strong><button type="button" onClick={() => setPendingImage(null)}>Remove</button></span> : <small>{editing.id ? "Choose a file to add another image when you save. It will be optimized automatically." : "Choose the product image now; it will be optimized and uploaded when the product is saved."}</small>}</label>
        <label className="wide"><span>Regulatory classification</span><input value={editing.regulatoryClassification} onChange={(e) => setEditing({ ...editing, regulatoryClassification: e.target.value })} /></label>
        <label className="wide"><span>Trade notes</span><textarea rows={3} value={editing.tradeNotes} onChange={(e) => setEditing({ ...editing, tradeNotes: e.target.value })} /></label>
        <div className="wide admin-content-divider"><span>RICH PRODUCT INFORMATION</span><p>Use general, source-reviewed education only. Do not enter personalized dosing or unsupported claims.</p></div>
        <label className="wide"><span>Overview</span><textarea rows={4} value={editing.detailContent?.overview || ""} onChange={(e) => setEditing({ ...editing, detailContent: { ...(editing.detailContent || blankProduct.detailContent!), overview: e.target.value } })} /></label>
        <label className="wide"><span>General uses <small>One per line</small></span><textarea rows={3} value={(editing.detailContent?.commonUses || []).join("\n")} onChange={(e) => setEditing({ ...editing, detailContent: { ...(editing.detailContent || blankProduct.detailContent!), commonUses: e.target.value.split("\n").map((value) => value.trim()).filter(Boolean) } })} /></label>
        <label className="wide"><span>How it works</span><textarea rows={3} value={editing.detailContent?.howItWorks || ""} onChange={(e) => setEditing({ ...editing, detailContent: { ...(editing.detailContent || blankProduct.detailContent!), howItWorks: e.target.value } })} /></label>
        <label className="wide"><span>Common side effects <small>One per line</small></span><textarea rows={3} value={(editing.detailContent?.safety.commonSideEffects || []).join("\n")} onChange={(e) => setEditing({ ...editing, detailContent: { ...(editing.detailContent || blankProduct.detailContent!), safety: { ...(editing.detailContent?.safety || blankProduct.detailContent!.safety), commonSideEffects: e.target.value.split("\n").map((value) => value.trim()).filter(Boolean) } } })} /></label>
        <label className="wide"><span>Safety cautions <small>One per line</small></span><textarea rows={3} value={(editing.detailContent?.safety.cautions || []).join("\n")} onChange={(e) => setEditing({ ...editing, detailContent: { ...(editing.detailContent || blankProduct.detailContent!), safety: { ...(editing.detailContent?.safety || blankProduct.detailContent!.safety), cautions: e.target.value.split("\n").map((value) => value.trim()).filter(Boolean) } } })} /></label>
        <label className="wide"><span>Storage guidance</span><textarea rows={2} value={editing.detailContent?.safety.storage || ""} onChange={(e) => setEditing({ ...editing, detailContent: { ...(editing.detailContent || blankProduct.detailContent!), safety: { ...(editing.detailContent?.safety || blankProduct.detailContent!.safety), storage: e.target.value } } })} /></label>
        <label><span>Last reviewed</span><input type="date" value={editing.detailContent?.lastReviewedAt || ""} onChange={(e) => setEditing({ ...editing, detailContent: { ...(editing.detailContent || blankProduct.detailContent!), lastReviewedAt: e.target.value } })} /></label>
        <label className="check-field"><input type="checkbox" checked={editing.demonstration} onChange={(e) => setEditing({ ...editing, demonstration: e.target.checked, seoEnabled: e.target.checked ? false : editing.seoEnabled })} /><span>Exclude from search index</span></label>
        <label className="check-field"><input type="checkbox" checked={editing.enquiryEligible} onChange={(e) => setEditing({ ...editing, enquiryEligible: e.target.checked })} /><span>Enquiry eligible</span></label>
        <label className="check-field"><input type="checkbox" checked={editing.seoEnabled} disabled={editing.demonstration} onChange={(e) => setEditing({ ...editing, seoEnabled: e.target.checked })} /><span>SEO eligible</span></label>
      </div><div className="admin-editor-actions"><button type="button" className="secondary-action" onClick={closeEditor}>Cancel</button><button className="primary-action" type="submit">Save product</button></div></form></div> : null}
      {imageProduct ? <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="image-manager-title"><section className="admin-editor"><div className="admin-editor-head"><div><span>PRODUCT MEDIA</span><h2 id="image-manager-title">Images for {imageProduct.genericName}</h2><p>Uploads are resized and converted to WebP to keep this portfolio lightweight.</p></div><button ref={imageCloseRef} type="button" onClick={() => setImageProduct(null)} aria-label="Close image manager">×</button></div><label className="secondary-action file-action image-add">Upload another image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(imageProduct, file); }} /></label><div className="image-admin-list">{images.map((image) => <article key={image.id}><img src={image.src} alt="" /><div><label><span>Alt text</span><input value={image.alt} onChange={(event) => setImages((items) => items.map((item) => item.id === image.id ? { ...item, alt: event.target.value } : item))} /></label><label><span>Image context</span><textarea rows={2} value={image.reference_note} onChange={(event) => setImages((items) => items.map((item) => item.id === image.id ? { ...item, reference_note: event.target.value } : item))} /></label><label><span>Order</span><input type="number" min="0" value={image.sort_order} onChange={(event) => setImages((items) => items.map((item) => item.id === image.id ? { ...item, sort_order: Number(event.target.value) } : item))} /></label><div><button className="secondary-action" type="button" onClick={() => void saveImage(image)}>Save image</button><button className="text-button danger-text" type="button" onClick={() => void removeImage(image)}>Remove</button></div></div></article>)}</div></section></div> : null}
    </>
  );
}
