import { AdminHeader } from "@/components/layout/AdminHeader";
import { BrandsAdminClient } from "@/components/admin/BrandsAdminClient";

export const dynamic = "force-dynamic";

export default function StaffBrandsPage() {
  return (
    <>
      <AdminHeader title="Brands" breadcrumb="Staff / Brands" />
      <BrandsAdminClient staffMode />
    </>
  );
}
