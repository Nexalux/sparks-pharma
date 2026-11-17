import type { ProductInput } from "./repository";
import type { QuoteDraftItem } from "./data";

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}

export function validateProduct(input: Partial<ProductInput>) {
  const errors: Record<string, string> = {};
  const required = ["genericName", "composition", "category", "dosageForm", "strength", "packSize", "manufacturer"] as const;
  for (const field of required) if (!String(input[field] || "").trim()) errors[field] = "Required";
  const slug = slugify(String(input.slug || input.genericName || ""));
  if (!slug) errors.slug = "Enter a valid product slug.";
  if (!['draft', 'review', 'published', 'archived'].includes(String(input.status || 'draft'))) errors.status = "Invalid publication state.";
  if (!['hidden', 'indicative', 'on_request'].includes(String(input.priceDisplay || 'hidden'))) errors.priceDisplay = "Invalid price display.";
  if (!['available', 'limited', 'on_request', 'unavailable'].includes(String(input.availability || 'on_request'))) errors.availability = "Invalid availability.";
  if (Number(input.minimumQuantity || 1) < 1) errors.minimumQuantity = "Minimum quantity must be at least 1.";
  return { errors, slug, valid: Object.keys(errors).length === 0 };
}

export function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const next = csv[i + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell); cell = ""; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell); cell = "";
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
    } else cell += char;
  }
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

export function csvCell(value: unknown) {
  const text = String(value ?? "");
  const formula = typeof value === "string" &&
    (/^[=+@\-＝＋＠－]/u.test(text.trimStart()) || /^[\t\r\n]/.test(text));
  const safe = formula ? "'" + text : text;
  return formula || /[";,\r\n]/.test(safe) ? '"' + safe.replace(/"/g, '""') + '"' : safe;
}

export function readQuoteItems(value: unknown): QuoteDraftItem[] | null {
  if (!Array.isArray(value) || !value.length || value.length > 50) return null;
  const items: QuoteDraftItem[] = [];
  const slugs = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const { productSlug, quantity, note } = item;
    if (typeof productSlug !== "string" || !/^[a-z0-9-]{1,160}$/.test(productSlug) ||
        slugs.has(productSlug) || typeof quantity !== "number" ||
        !Number.isInteger(quantity) || quantity < 1 || quantity > 999 ||
        (note !== undefined && (typeof note !== "string" || note.length > 1000))) return null;
    slugs.add(productSlug);
    items.push({ productSlug, quantity, note });
  }
  return items;
}
