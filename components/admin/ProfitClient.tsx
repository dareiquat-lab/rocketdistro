"use client";

import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, Package, ShoppingCart, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ProfitStats {
  revenue: number;
  profit: number;
  units_sold: number;
  order_count: number;
}

interface AllTime {
  revenue: number;
  profit: number;
}

interface InventoryRow {
  id: number;
  product_name: string;
  category: string;
  sku: string;
  quantity: number;
  price: number;
  cost: number;
  stock_value: number;
  potential_profit: number;
  margin_pct: number;
}

interface CategoryRow {
  category: string;
  icon: string;
  products: number;
  stock_value: number;
  potential_profit: number;
  avg_margin: number;
}

interface ProfitData {
  stats: ProfitStats;
  allTime: AllTime;
  inventory: InventoryRow[];
  categories: CategoryRow[];
  sales: unknown[];
}

export function ProfitClient() {
  const [data, setData] = useState<ProfitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const res = await fetch(`/api/admin/profit?${params}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const totalStockValue = data?.inventory?.reduce((s, p) => s + Number(p.stock_value), 0) ?? 0;
  const totalPotentialProfit = data?.inventory?.reduce((s, p) => s + Number(p.potential_profit), 0) ?? 0;
  const avgMargin = data?.inventory && data.inventory.length > 0
    ? data.inventory.reduce((s, p) => s + Number(p.margin_pct), 0) / data.inventory.length
    : 0;
  const productsWithCost = data?.inventory?.filter(p => Number(p.cost) > 0).length ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">Start Date</label>
          <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="label">End Date</label>
          <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={fetchData} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Loading…" : "Refresh"}
        </button>
        <a href="/api/export?format=csv" className="btn-secondary">Export CSV</a>
      </div>

      {/* Sales Stats */}
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-muted)" }}>
          {startDate && endDate ? `${startDate} → ${endDate}` : "All Time Sales"}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Actual Profit", value: `$${Number(data?.stats?.profit ?? 0).toFixed(2)}`, icon: <TrendingUp size={18} />, color: "var(--success)" },
            { label: "Total Revenue", value: `$${Number(data?.stats?.revenue ?? 0).toFixed(2)}`, icon: <DollarSign size={18} />, color: "var(--accent)" },
            { label: "Units Sold", value: Number(data?.stats?.units_sold ?? 0).toLocaleString(), icon: <Package size={18} />, color: "var(--text-muted)" },
            { label: "Orders", value: Number(data?.stats?.order_count ?? 0).toLocaleString(), icon: <ShoppingCart size={18} />, color: "var(--text-muted)" },
          ].map(card => (
            <div key={card.label} className="card">
              <div className="flex items-center gap-2 mb-2" style={{ color: card.color }}>{card.icon}</div>
              <p className="text-2xl font-black" style={{ color: "var(--text)" }}>{card.value}</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{card.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* All-time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>All-Time Profit</p>
          <p className="text-xl font-bold" style={{ color: "var(--success)" }}>${Number(data?.allTime?.profit ?? 0).toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>All-Time Revenue</p>
          <p className="text-xl font-bold" style={{ color: "var(--accent)" }}>${Number(data?.allTime?.revenue ?? 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Inventory Potential */}
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-muted)" }}>Inventory Potential</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Stock Value", value: `$${totalStockValue.toFixed(2)}` },
            { label: "Potential Profit", value: `$${totalPotentialProfit.toFixed(2)}` },
            { label: "Avg Margin %", value: `${avgMargin.toFixed(1)}%` },
            { label: "Products w/ Cost", value: `${productsWithCost} / ${data?.inventory?.length ?? 0}` },
          ].map(c => (
            <div key={c.label} className="card">
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{c.label}</p>
              <p className="text-xl font-bold" style={{ color: "var(--text)" }}>{c.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Category chart */}
      {data?.categories && data.categories.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-sm mb-4" style={{ color: "var(--text)" }}>Potential Profit by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.categories} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <Tooltip
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}
                formatter={(v) => [`$${Number(v).toFixed(2)}`, "Potential Profit"]}
              />
              <Bar dataKey="potential_profit" radius={[4, 4, 0, 0]}>
                {data.categories.map((_, i) => (
                  <Cell key={i} fill="var(--accent)" fillOpacity={0.7 + (i % 3) * 0.1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category table */}
      {data?.categories && data.categories.length > 0 && (
        <div className="table-container">
          <table className="table-base">
            <thead>
              <tr>
                <th>Category</th>
                <th>Products</th>
                <th>Stock Value</th>
                <th>Potential Profit</th>
                <th>Avg Margin %</th>
              </tr>
            </thead>
            <tbody>
              {data.categories.map(cat => (
                <tr key={cat.category}>
                  <td><span className="mr-2">{cat.icon}</span><span style={{ color: "var(--text)" }}>{cat.category}</span></td>
                  <td style={{ color: "var(--text-muted)" }}>{cat.products}</td>
                  <td className="font-mono text-sm">${Number(cat.stock_value).toFixed(2)}</td>
                  <td className="font-mono text-sm" style={{ color: "var(--success)" }}>${Number(cat.potential_profit).toFixed(2)}</td>
                  <td><span className="font-mono text-sm">{Number(cat.avg_margin).toFixed(1)}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product table */}
      {data?.inventory && data.inventory.length > 0 && (
        <div className="table-container">
          <table className="table-base">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Cost</th>
                <th>Margin $</th>
                <th>Margin %</th>
                <th>Potential Profit</th>
                <th>Stock Value</th>
              </tr>
            </thead>
            <tbody>
              {data.inventory.map(p => (
                <tr key={p.id}>
                  <td className="font-medium" style={{ color: "var(--text)" }}>{p.product_name}</td>
                  <td style={{ color: "var(--text-muted)" }}>{p.category}</td>
                  <td className="font-mono text-xs" style={{ color: "var(--text-dim)" }}>{p.sku}</td>
                  <td className="font-mono text-sm">{p.quantity}</td>
                  <td className="font-mono text-sm">${Number(p.price).toFixed(2)}</td>
                  <td className="font-mono text-sm">${Number(p.cost).toFixed(2)}</td>
                  <td className="font-mono text-sm">${(Number(p.price) - Number(p.cost)).toFixed(2)}</td>
                  <td>
                    <span className="font-mono text-sm" style={{ color: Number(p.margin_pct) > 20 ? "var(--success)" : Number(p.margin_pct) > 0 ? "var(--warning)" : "var(--danger)" }}>
                      {Number(p.margin_pct).toFixed(1)}%
                    </span>
                  </td>
                  <td className="font-mono text-sm" style={{ color: "var(--success)" }}>${Number(p.potential_profit).toFixed(2)}</td>
                  <td className="font-mono text-sm">${Number(p.stock_value).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
