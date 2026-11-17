import { authorizeAdmin } from "../../../lib/admin-auth";
import { deleteEnquiry, listEnquiries, updateEnquiry } from "../../../lib/repository";
import type { EnquiryStatus } from "../../../lib/data";
import { csvCell } from "../../../lib/validation";

export async function GET(request: Request) {
  const auth = await authorizeAdmin();
  if (auth.response) return auth.response;
  const url = new URL(request.url);
  const enquiries = await listEnquiries(url.searchParams.get("search") || "", url.searchParams.get("status") || "");
  if (url.searchParams.get("format") === "csv") {
    const columns = ["reference", "business_name", "contact_name", "buyer_type", "phone", "email", "state", "city", "pincode", "status", "requested_products", "total_quantity", "internal_notes", "created_at", "expires_at"];
    const csvRows = enquiries.map((row) => ({ ...row, reference: `SP-${String(row.id).slice(0, 8).toUpperCase()}`, requested_products: (row.items as Array<Record<string, unknown>>).map((item) => `${item.product_name} (Qty ${item.quantity}${item.note ? `; ${item.note}` : ""})`).join(" | ") }));
    const csv = [columns.join(","), ...csvRows.map((row) => columns.map((column) => csvCell((row as Record<string, unknown>)[column])).join(","))].join("\r\n");
    return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=sparks-enquiries.csv" } });
  }
  return Response.json({ enquiries });
}

export async function PATCH(request: Request) {
  const auth = await authorizeAdmin();
  if (auth.response) return auth.response;
  const { id, status, internalNotes, publicUpdate } = (await request.json()) as { id: string; status: EnquiryStatus; internalNotes: string; publicUpdate?: string };
  if (!id || !["new", "contacted", "qualified", "closed"].includes(status)) return Response.json({ error: "Invalid enquiry update." }, { status: 400 });
  if ((publicUpdate || "").length > 500) return Response.json({ error: "Buyer update must be 500 characters or fewer." }, { status: 400 });
  await updateEnquiry(id, status, internalNotes || "", publicUpdate || "");
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await authorizeAdmin();
  if (auth.response) return auth.response;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Enquiry id is required." }, { status: 400 });
  await deleteEnquiry(id);
  return Response.json({ ok: true });
}
