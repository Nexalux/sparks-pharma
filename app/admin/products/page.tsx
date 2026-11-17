import { requireAdminPage } from "../../lib/admin-auth";
import { listAdminProducts } from "../../lib/repository";
import { AdminProducts } from "./AdminProducts";

export const dynamic = "force-dynamic";
export default async function AdminProductsPage() {
  await requireAdminPage("/admin/products");
  return <AdminProducts initialProducts={await listAdminProducts()} />;
}
