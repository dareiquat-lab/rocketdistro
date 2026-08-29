import { AdminHeader } from "@/components/layout/AdminHeader";
import { ScanClient } from "@/components/admin/ScanClient";

export const dynamic = "force-dynamic";

export default function ScanPage() {
  return (
    <>
      <AdminHeader title="Barcode Scanner" breadcrumb="Admin / Scan" />
      <ScanClient />
    </>
  );
}
