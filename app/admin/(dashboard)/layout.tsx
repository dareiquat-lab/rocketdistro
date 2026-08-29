import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { getDashboardStats } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const stats = await getDashboardStats().catch(() => ({
    newOrdersCount: 0,
    lowStockCount: 0,
  }));

  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      <AdminSidebar
        newOrdersCount={stats.newOrdersCount}
        lowStockCount={stats.lowStockCount}
        userEmail={process.env.ADMIN_EMAIL ?? "admin@rocketdistro.com"}
      />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
