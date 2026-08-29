"use client";

import { useState } from "react";
import { Package, Layers, AlertTriangle, ShoppingCart, DollarSign, TrendingUp, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { DashboardStats } from "@/types";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

interface DashboardClientProps {
  initialStats: DashboardStats;
}

const SITE_NAME = "Rocket Distro";

export function DashboardClient({ initialStats }: DashboardClientProps) {
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) setStats(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: "Total Products",
      value: stats.totalProducts.toLocaleString(),
      icon: <Package size={20} />,
      color: "var(--accent)",
    },
    {
      label: "Total Units",
      value: stats.totalUnits.toLocaleString(),
      icon: <Layers size={20} />,
      color: "var(--accent)",
    },
    {
      label: "Low Stock",
      value: stats.lowStockCount.toLocaleString(),
      icon: <AlertTriangle size={20} />,
      color: stats.lowStockCount > 0 ? "var(--warning)" : "var(--success)",
      href: "/admin/low-stock",
    },
    {
      label: "New Orders",
      value: stats.newOrdersCount.toLocaleString(),
      icon: <ShoppingCart size={20} />,
      color: "var(--accent)",
      href: "/admin/orders",
    },
    {
      label: "Monthly Revenue",
      value: `$${stats.monthlyRevenue.toFixed(2)}`,
      icon: <DollarSign size={20} />,
      color: "var(--success)",
    },
    {
      label: "Monthly Profit",
      value: `$${stats.monthlyProfit.toFixed(2)}`,
      icon: <TrendingUp size={20} />,
      color: "var(--success)",
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>{SITE_NAME} Dashboard</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Overview of your business</p>
        </div>
        <button onClick={refresh} className="btn-secondary" disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <a
            key={card.label}
            href={card.href}
            className={`card ${card.href ? "cursor-pointer hover:shadow-md transition-shadow" : "cursor-default"}`}
            style={{ textDecoration: "none" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg" style={{ background: `${card.color}20`, color: card.color }}>
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-black" style={{ color: "var(--text)" }}>{card.value}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{card.label}</p>
          </a>
        ))}
      </div>

      {/* Two column section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recently Updated */}
        <div className="card">
          <h3 className="font-semibold text-sm mb-4" style={{ color: "var(--text)" }}>Recently Updated Products</h3>
          {stats.recentlyUpdated.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>No products yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentlyUpdated.map((p) => (
                <a
                  key={p.id}
                  href={`/admin/products/${p.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
                  style={{ textDecoration: "none" }}
                >
                  <CategoryIcon icon={stats.categoryBreakdown.find(c => c.category === p.category)?.icon ?? "📦"} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{p.product_name}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{p.category} · {p.sku}</p>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                    {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}
                  </p>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <h3 className="font-semibold text-sm mb-4" style={{ color: "var(--text)" }}>Category Breakdown</h3>
          {stats.categoryBreakdown.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>No categories yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.categoryBreakdown.slice(0, 8).map((cat) => {
                const max = Math.max(...stats.categoryBreakdown.map(c => c.count));
                const pct = max > 0 ? (cat.count / max) * 100 : 0;
                return (
                  <div key={cat.category} className="flex items-center gap-3">
                    <span className="text-base w-6">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>{cat.category}</span>
                        <span className="text-xs font-mono ml-2" style={{ color: "var(--text-muted)" }}>{cat.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "var(--muted)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--accent)" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
