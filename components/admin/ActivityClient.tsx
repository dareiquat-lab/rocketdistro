"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Package, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import type { ActivityItem } from "@/types";

const EVENT_META: Record<ActivityItem["event_type"], {
  icon: React.ReactNode;
  color: string;
  verb: (item: ActivityItem) => string;
  sub: (item: ActivityItem) => string;
  href: (item: ActivityItem) => string;
}> = {
  order: {
    icon: <ShoppingCart size={15} />,
    color: "#2563eb",
    verb: () => "Order placed",
    sub: (i) => `${i.ref} · status: ${i.meta}`,
    href: () => "/admin/orders",
  },
  product: {
    icon: <Package size={15} />,
    color: "#16a34a",
    verb: (i) => {
      const diff = new Date(i.ts).getTime() - new Date(i.created_at).getTime();
      return diff < 5000 ? "Product added" : "Product updated";
    },
    sub: (i) => `SKU: ${i.ref} · qty ${i.meta}`,
    href: (i) => `/admin/products/${i.id}`,
  },
  invoice: {
    icon: <FileText size={15} />,
    color: "#7c3aed",
    verb: () => "Invoice imported",
    sub: (i) => [i.ref && `#${i.ref}`, i.meta && `$${Number(i.meta).toFixed(2)}`].filter(Boolean).join(" · "),
    href: () => "/admin/invoices",
  },
};

export function ActivityClient() {
  const router = useRouter();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/activity?page=${page}&limit=25`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
        setPages(data.pages ?? 1);
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <p className="text-xs" style={{ color: "var(--text-dim)" }}>{total.toLocaleString()} event{total !== 1 ? "s" : ""} total</p>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="py-16 text-center text-sm" style={{ color: "var(--text-dim)" }}>Loading…</div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: "var(--text-dim)" }}>No activity yet.</div>
        ) : (
          items.map((item, idx) => {
            const meta = EVENT_META[item.event_type];
            return (
              <div
                key={`${item.event_type}-${item.id}-${idx}`}
                className="flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-[var(--muted)]"
                style={{ borderTop: idx > 0 ? "1px solid var(--border)" : undefined }}
                onClick={() => router.push(meta.href(item))}
              >
                {/* Icon */}
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
                  style={{ background: `${meta.color}18`, color: meta.color }}
                >
                  {meta.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {meta.verb(item)}
                      <span className="font-normal mx-1.5" style={{ color: "var(--text-muted)" }}>—</span>
                      {item.label}
                    </p>
                    <span
                      className="text-xs flex-shrink-0 font-mono"
                      style={{ color: "var(--text-dim)" }}
                      title={format(new Date(item.ts), "PPpp")}
                    >
                      {formatDistanceToNow(new Date(item.ts), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-xs truncate" style={{ color: "var(--text-dim)" }}>
                      {meta.sub(item)}
                    </p>
                    <span
                      className="text-xs flex-shrink-0 hidden sm:block"
                      style={{ color: "var(--text-dim)" }}
                    >
                      {format(new Date(item.ts), "MMM d, yyyy · h:mm a")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            className="btn-secondary py-1.5 px-3"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
            const p = page <= 4 ? i + 1 : page + i - 3;
            if (p < 1 || p > pages) return null;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="w-8 h-8 rounded text-sm font-medium"
                style={{
                  background: p === page ? "var(--accent)" : "var(--surface)",
                  color: p === page ? "white" : "var(--text)",
                  border: "1px solid var(--border)",
                }}
              >
                {p}
              </button>
            );
          })}
          <button
            className="btn-secondary py-1.5 px-3"
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages || loading}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
