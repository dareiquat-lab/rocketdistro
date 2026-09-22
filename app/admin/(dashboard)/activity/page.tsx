import { AdminHeader } from "@/components/layout/AdminHeader";
import { ActivityClient } from "@/components/admin/ActivityClient";

export const dynamic = "force-dynamic";

export default function ActivityPage() {
  return (
    <>
      <AdminHeader title="Activity" breadcrumb="Admin / Activity" />
      <ActivityClient />
    </>
  );
}
