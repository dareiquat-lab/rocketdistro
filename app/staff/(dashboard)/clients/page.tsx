import { AdminHeader } from "@/components/layout/AdminHeader";
import { ClientsClient } from "@/components/admin/ClientsClient";

export const dynamic = "force-dynamic";

export default function StaffClientsPage() {
  return (
    <>
      <AdminHeader title="Clients" breadcrumb="Staff / Clients" />
      <ClientsClient staffMode />
    </>
  );
}
