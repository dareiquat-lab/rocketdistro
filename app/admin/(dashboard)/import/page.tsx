import { AdminHeader } from "@/components/layout/AdminHeader";
import { ImportClient } from "@/components/admin/ImportClient";

export const dynamic = "force-dynamic";

export default function ImportPage() {
  return (
    <>
      <AdminHeader title="AI Import" breadcrumb="Admin / AI Import" />
      <ImportClient />
    </>
  );
}
