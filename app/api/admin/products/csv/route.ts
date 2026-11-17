import { authorizeAdmin } from "../../../../lib/admin-auth";
import { listAdminProducts, saveProduct, type ProductInput } from "../../../../lib/repository";
import { csvCell, parseCsv, validateProduct } from "../../../../lib/validation";

const columns = ["slug", "genericName", "brandName", "composition", "category", "dosageForm", "strength", "packSize", "manufacturer", "regulatoryClassification", "tradeNotes", "overview", "commonUses", "howItWorks", "commonSideEffects", "safetyCautions", "storage", "lastReviewedAt", "status", "demonstration", "priceDisplay", "priceValue", "priceUnit", "availability", "minimumQuantity", "enquiryEligible", "seoEnabled"] as const;

export async function GET() {
  const auth = await authorizeAdmin();
  if (auth.response) return auth.response;
  const products = await listAdminProducts();
  const csv = [columns.join(","), ...products.map((product) => { const values: Record<string, unknown> = { ...product, overview: product.detailContent?.overview, commonUses: product.detailContent?.commonUses.join(" | "), howItWorks: product.detailContent?.howItWorks, commonSideEffects: product.detailContent?.safety.commonSideEffects.join(" | "), safetyCautions: product.detailContent?.safety.cautions.join(" | "), storage: product.detailContent?.safety.storage, lastReviewedAt: product.detailContent?.lastReviewedAt }; return columns.map((column) => csvCell(values[column])).join(","); })].join("\r\n");
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=sparks-products.csv" } });
}

export async function POST(request: Request) {
  const auth = await authorizeAdmin();
  if (auth.response) return auth.response;
  const rows = parseCsv(await request.text());
  if (rows.length < 2) return Response.json({ error: "The CSV must contain a header and at least one product row." }, { status: 400 });
  const headers = rows[0].map((value) => value.trim());
  const missing = columns.filter((column) => !headers.includes(column));
  if (missing.length) return Response.json({ error: "Missing columns: " + missing.join(", ") }, { status: 400 });
  const errors: Array<{ row: number; errors: Record<string, string> | { row: string } }> = [];
  let imported = 0;
  for (let index = 1; index < rows.length; index += 1) {
    const values = Object.fromEntries(headers.map((header, cell) => [header, rows[index][cell] || ""])) as Record<string, string>;
    const input = {
      ...values,
      detailContent: { overview: values.overview, commonUses: values.commonUses.split("|").map((value) => value.trim()).filter(Boolean), howItWorks: values.howItWorks, safety: { commonSideEffects: values.commonSideEffects.split("|").map((value) => value.trim()).filter(Boolean), cautions: values.safetyCautions.split("|").map((value) => value.trim()).filter(Boolean), storage: values.storage }, sources: [], faqs: [], lastReviewedAt: values.lastReviewedAt },
      demonstration: values.demonstration.toLowerCase() === "true",
      publicApproved: false,
      minimumQuantity: Number(values.minimumQuantity || 1),
      enquiryEligible: values.enquiryEligible.toLowerCase() !== "false",
      seoEnabled: values.seoEnabled.toLowerCase() === "true",
    } as unknown as ProductInput;
    const validation = validateProduct(input);
    if (!validation.valid) { errors.push({ row: index + 1, errors: validation.errors }); continue; }
    try { await saveProduct({ ...input, slug: validation.slug }); imported += 1; }
    catch (error) { errors.push({ row: index + 1, errors: { row: error instanceof Error ? error.message : "Import failed" } }); }
  }
  return Response.json({ imported, errors });
}
