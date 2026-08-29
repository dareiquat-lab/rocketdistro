import { AdminHeader } from "@/components/layout/AdminHeader";
import { ClientsClient } from "@/components/admin/ClientsClient";

export const dynamic = "force-dynamic";

export default function ClientsPage() {
  return (
    <>
      <AdminHeader title="Clients" breadcrumb="Admin / Clients" />
      <ClientsClient />
    </>
  );
}
