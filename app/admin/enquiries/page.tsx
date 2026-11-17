import { requireAdminPage } from "../../lib/admin-auth";
import { listEnquiries } from "../../lib/repository";
import { AdminEnquiries } from "./AdminEnquiries";

export const dynamic = "force-dynamic";
export default async function AdminEnquiriesPage() {
  await requireAdminPage("/admin/enquiries");
  return <AdminEnquiries initialEnquiries={await listEnquiries()} />;
}
