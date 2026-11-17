import { createEnquiry, getEnquiryProducts } from "../../lib/repository";
import { authorizeMember } from "../../lib/member-auth";
import { readQuoteItems } from "../../lib/validation";

export async function POST(request: Request) {
  const auth = await authorizeMember();
  if (auth.response) return auth.response;
  const input = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (typeof input?.consentedAt !== "string" || !Number.isFinite(Date.parse(input.consentedAt))) {
    return Response.json({ error: "Consent is required before enquiry details can be stored." }, { status: 400 });
  }
  const readText = (key: string) => typeof input[key] === "string" ? input[key].trim() : "";
  const businessName = readText("businessName");
  const contactName = readText("contactName");
  const buyerType = readText("buyerType");
  const phone = readText("phone");
  const email = readText("email");
  const pincode = readText("pincode");
  const state = readText("state");
  const city = readText("city");
  const note = readText("note");
  const items = readQuoteItems(input.items);
  if (!businessName || !contactName || !buyerType || !state || !city || !items ||
      [businessName, contactName, buyerType, state, city].some((value) => value.length > 200) ||
      !/^[6-9]\d{9}$/.test(phone) || !/^\d{6}$/.test(pincode) || note.length > 2000 ||
      (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))) {
    return Response.json({ error: "Complete the required business and product details." }, { status: 400 });
  }
  try {
    const products = await getEnquiryProducts(items.map((item) => item.productSlug));
    if (products.size !== items.length) {
      return Response.json({ error: "One or more products are no longer available for enquiries." }, { status: 409 });
    }
    const enquiry = await createEnquiry({
      businessName, contactName, buyerType, phone, email, pincode, state, city, note,
      consentedAt: new Date().toISOString(),
      items: items.map(({ productSlug, quantity, note }) => ({
        ...products.get(productSlug)!, productSlug, quantity, note,
      })),
    }, auth.session!.member.id);
    return Response.json({ ...enquiry, reference: "SP-" + enquiry.id.slice(0, 8).toUpperCase() }, { status: 201 });
  }
  catch { return Response.json({ error: "Unable to store enquiry." }, { status: 503 }); }
}
