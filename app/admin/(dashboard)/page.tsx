import { getDashboardStats } from "@/lib/db";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { DashboardClient } from "@/components/admin/DashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const stats = await getDashboardStats().catch(() => ({
    totalProducts: 0, totalUnits: 0, lowStockCount: 0,
    recentlyUpdated: [], categoryBreakdown: [], totalCategories: 0,
    newOrdersCount: 0, monthlyProfit: 0, monthlyRevenue: 0,
  }));

  return (
    <>
      <AdminHeader title="Dashboard" breadcrumb="Home" />
      <DashboardClient initialStats={stats} />
    </>
  );
}
