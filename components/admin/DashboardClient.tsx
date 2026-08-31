"use client";

import { useState } from "react";
import { Package, Layers, AlertTriangle, ShoppingCart, DollarSign, TrendingUp, RefreshCw, Users, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { DashboardStats } from "@/types";
import { ORDER_STATUSES } from "@/types";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";

interface DashboardClientProps {
  initialStats: DashboardStats;
}

const CHART_COLORS = ["#2563eb", "#7c3aed", "#0d9488", "#d97706", "#ec4899", "#16a34a", "#dc2626", "#4f46e5"];

const STATUS_META: Record<string, { label: string; color: string }> = {
  new:       { label: "New",       color: "#2563eb" },
  contacted: { label: "Contacted", color: "#7c3aed" },
  ready:     { label: "Ready",     color: "#d97706" },
  completed: { label: "Completed", color: "#16a34a" },
  cancelled: { label: "Cancelled", color: "#dc2626" },
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, color: "#64748b" };
  return (
    <span
      className="badge"
      style={{ background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}30` }}
    >
      {meta.label}
    </span>
  );
}

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
      label: "Products",
      value: stats.totalProducts.toLocaleString(),
      icon: <Package size={18} />,
      color: "#2563eb",
      sub: `${stats.totalCategories} categories`,
    },
    {
      label: "Total Units",
      value: stats.totalUnits.toLocaleString(),
      icon: <Layers size={18} />,
      color: "#7c3aed",
      sub: "in inventory",
    },
    {
      label: "Low Stock",
      value: stats.lowStockCount.toLocaleString(),
      icon: <AlertTriangle size={18} />,
      color: stats.lowStockCount > 0 ? "#d97706" : "#16a34a",
      href: "/admin/low-stock",
      sub: stats.lowStockCount > 0 ? "needs attention" : "all good",
    },
    {
      label: "New Orders",
      value: stats.newOrdersCount.toLocaleString(),
      icon: <ShoppingCart size={18} />,
      color: "#ec4899",
      href: "/admin/orders",
      sub: "awaiting action",
    },
    {
      label: "Clients",
      value: stats.totalClients.toLocaleString(),
      icon: <Users size={18} />,
      color: "#0d9488",
      href: "/admin/clients",
      sub: "registered",
    },
    {
      label: "Monthly Revenue",
      value: `$${stats.monthlyRevenue.toFixed(2)}`,
      icon: <DollarSign size={18} />,
      color: "#16a34a",
      sub: "this month",
    },
    {
      label: "Monthly Profit",
      value: `$${stats.monthlyProfit.toFixed(2)}`,
      icon: <TrendingUp size={18} />,
      color: "#4f46e5",
      sub: "from completed",
    },
  ];

  const pieData = stats.orderStatusBreakdown.map(row => ({
    name: STATUS_META[row.status]?.label ?? row.status,
    value: row.count,
    color: STATUS_META[row.status]?.color ?? "#64748b",
  }));

  const barData = stats.categoryBreakdown.filter(c => c.count > 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Welcome back — here's your business overview</p>
        </div>
        <button onClick={refresh} className="btn-secondary" disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {statCards.map((card) => (
          <a
            key={card.label}
            href={card.href}
            className="card group"
            style={{ textDecoration: "none", borderLeft: `3px solid ${card.color}`, cursor: card.href ? "pointer" : "default" }}
          >
            <div
              className="inline-flex p-2 rounded-lg mb-3"
              style={{ background: `${card.color}15`, color: card.color }}
            >
              {card.icon}
            </div>
            <p className="text-xl font-black leading-none" style={{ color: "var(--text)" }}>{card.value}</p>
            <p className="text-xs font-semibold mt-1" style={{ color: "var(--text-muted)" }}>{card.label}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>{card.sub}</p>
          </a>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category bar chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm" style={{ color: "var(--text)" }}>Products by Category</h3>
            <a href="/admin/inventory" className="text-xs flex items-center gap-1" style={{ color: "var(--accent)", textDecoration: "none" }}>
              View all <ArrowRight size={12} />
            </a>
          </div>
          {barData.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm" style={{ color: "var(--text-dim)" }}>No products yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  cursor={{ fill: "var(--muted)" }}
                  formatter={(v) => [v, "Products"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {barData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order status pie */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm" style={{ color: "var(--text)" }}>Order Status Breakdown</h3>
            <a href="/admin/orders" className="text-xs flex items-center gap-1" style={{ color: "var(--accent)", textDecoration: "none" }}>
              View all <ArrowRight size={12} />
            </a>
          </div>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm" style={{ color: "var(--text-dim)" }}>No orders yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v, name) => [v, name]}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, color: "var(--text-muted)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="card" style={{ padding: 0 }}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="font-bold text-sm" style={{ color: "var(--text)" }}>Recent Orders</h3>
            <a href="/admin/orders" className="text-xs flex items-center gap-1" style={{ color: "var(--accent)", textDecoration: "none" }}>
              View all <ArrowRight size={12} />
            </a>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm px-5 pb-5" style={{ color: "var(--text-dim)" }}>No orders yet.</p>
          ) : (
            <div className="table-container" style={{ border: "none", borderRadius: "0 0 0.875rem 0.875rem" }}>
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map(order => (
                    <tr key={order.id}>
                      <td className="font-mono text-xs whitespace-nowrap" style={{ color: "var(--text-dim)" }}>{order.order_number}</td>
                      <td className="whitespace-nowrap" style={{ color: "var(--text)" }}>{order.customer_name}</td>
                      <td><StatusBadge status={order.status} /></td>
                      <td className="text-right font-mono font-bold whitespace-nowrap" style={{ color: "var(--text)" }}>${Number(order.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recently updated products */}
        <div className="card" style={{ padding: 0 }}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="font-bold text-sm" style={{ color: "var(--text)" }}>Recently Updated Products</h3>
            <a href="/admin/inventory" className="text-xs flex items-center gap-1" style={{ color: "var(--accent)", textDecoration: "none" }}>
              View all <ArrowRight size={12} />
            </a>
          </div>
          {stats.recentlyUpdated.length === 0 ? (
            <p className="text-sm px-5 pb-5" style={{ color: "var(--text-dim)" }}>No products yet.</p>
          ) : (
            <div className="table-container" style={{ border: "none", borderRadius: "0 0 0.875rem 0.875rem" }}>
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>SKU</th>
                    <th className="text-right">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentlyUpdated.map((p) => (
                    <tr key={p.id}>
                      <td className="whitespace-nowrap" style={{ color: "var(--text)" }}>
                        <a href={`/admin/products/${p.id}`} style={{ color: "inherit", textDecoration: "none" }}>{p.product_name}</a>
                      </td>
                      <td className="whitespace-nowrap" style={{ color: "var(--text-muted)" }}>{p.category}</td>
                      <td className="font-mono text-xs whitespace-nowrap" style={{ color: "var(--text-dim)" }}>{p.sku}</td>
                      <td className="text-right font-mono font-bold" style={{ color: "var(--text)" }}>{p.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
