import { authorizeMember } from "../../../../lib/member-auth";
import { getMemberEnquiry } from "../../../../lib/repository";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorizeMember();
  if (auth.response) return auth.response;
  const { id } = await context.params;
  const enquiry = await getMemberEnquiry(auth.session!.member.id, id);
  return enquiry ? Response.json({ enquiry }) : Response.json({ error: "Enquiry not found." }, { status: 404 });
}
