import { StaffSidebar } from "@/components/layout/StaffSidebar";
import { getDashboardStats } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function StaffDashboardLayout({ children }: { children: React.ReactNode }) {
  const stats = await getDashboardStats().catch(() => ({ newOrdersCount: 0, lowStockCount: 0 }));

  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      <StaffSidebar newOrdersCount={stats.newOrdersCount} />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
