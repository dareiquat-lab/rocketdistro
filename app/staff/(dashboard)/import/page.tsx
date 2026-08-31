import { AdminHeader } from "@/components/layout/AdminHeader";
import { ImportClient } from "@/components/admin/ImportClient";

export const dynamic = "force-dynamic";

export default function StaffImportPage() {
  return (
    <>
      <AdminHeader title="AI Import" breadcrumb="Staff / AI Import" />
      <ImportClient />
    </>
  );
}
