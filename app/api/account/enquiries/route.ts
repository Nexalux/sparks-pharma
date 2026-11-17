import { authorizeMember } from "../../../lib/member-auth";
import { listMemberEnquiries } from "../../../lib/repository";

export async function GET() {
  const auth = await authorizeMember();
  if (auth.response) return auth.response;
  return Response.json({ enquiries: await listMemberEnquiries(auth.session!.member.id) });
}
