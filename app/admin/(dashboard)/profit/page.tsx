import { AdminHeader } from "@/components/layout/AdminHeader";
import { ProfitClient } from "@/components/admin/ProfitClient";

export const dynamic = "force-dynamic";

export default function ProfitPage() {
  return (
    <>
      <AdminHeader title="Profit Analytics" breadcrumb="Admin / Profit" />
      <ProfitClient />
    </>
  );
}
