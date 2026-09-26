"use client";

import { useEffect } from "react";
import { format } from "date-fns";
import type { Order } from "@/types";

interface InvoicePrintClientProps {
  order: Order;
}

const C = {
  black:    "#111827",
  dark:     "#1e293b",
  mid:      "#475569",
  muted:    "#64748b",
  faint:    "#94a3b8",
  light:    "#f8fafc",
  border:   "#e2e8f0",
  borderLt: "#f1f5f9",
  blue:     "#2563eb",
};

export function InvoicePrintClient({ order }: InvoicePrintClientProps) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, []);

  const items = order.items ?? [];
  const subtotal = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);

  return (
    <div style={{ maxWidth: "672px", margin: "0 auto", padding: "32px", minHeight: "100vh", background: "#ffffff", color: C.black, colorScheme: "light" as const, fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`
        @media print {
          .invoice-no-print { display: none !important; }
          html, body { background: white !important; color: #111827 !important; }
          body::before, body::after { display: none !important; }
          .shooting-star, .shooting-star-2, .star-layer { display: none !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Print button */}
      <div className="invoice-no-print" style={{ marginBottom: "24px", display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => window.print()}
          style={{ background: C.blue, color: "white", padding: "8px 16px", borderRadius: "8px", fontSize: "14px", fontWeight: 500, border: "none", cursor: "pointer" }}
        >
          Print Invoice
        </button>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 900, color: C.blue, margin: 0 }}>🚀 ROCKET DISTRO</h1>
          <p style={{ color: C.muted, fontSize: "14px", margin: "4px 0 0" }}>Wholesale Distribution</p>
          <p style={{ color: C.muted, fontSize: "14px", margin: "2px 0 0" }}>orders@rocketdistro.com</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: C.dark, margin: 0 }}>INVOICE</h2>
          <p style={{ fontSize: "14px", color: C.muted, margin: "4px 0 0" }}>#{order.order_number}</p>
          <p style={{ fontSize: "14px", color: C.muted, margin: "2px 0 0" }}>{format(new Date(order.created_at), "MMMM d, yyyy")}</p>
        </div>
      </div>

      {/* Bill To / Order Info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "32px" }}>
        <div>
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.faint, margin: "0 0 8px" }}>Bill To</p>
          <p style={{ fontWeight: 600, color: C.black, margin: "0 0 2px" }}>{order.customer_name}</p>
          <p style={{ fontSize: "14px", color: C.mid, margin: "0 0 2px" }}>{order.customer_phone}</p>
          {order.customer_email && <p style={{ fontSize: "14px", color: C.mid, margin: 0 }}>{order.customer_email}</p>}
        </div>
        <div>
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.faint, margin: "0 0 8px" }}>Order Info</p>
          <p style={{ fontSize: "14px", color: C.black, margin: "0 0 2px" }}>
            <span style={{ color: C.faint }}>Status: </span>
            <span style={{ fontWeight: 500, textTransform: "capitalize" }}>{order.status}</span>
          </p>
          <p style={{ fontSize: "14px", color: C.black, margin: 0 }}>
            <span style={{ color: C.faint }}>Date: </span>
            {format(new Date(order.created_at), "MMM d, yyyy")}
          </p>
        </div>
      </div>

      {/* Items */}
      <table style={{ width: "100%", marginBottom: "32px", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${C.border}` }}>
            {["Product", "Brand", "Qty", "Unit Price", "Total"].map((h, i) => (
              <th key={h} style={{ padding: "8px 0", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: C.faint, textAlign: i >= 2 ? (i === 2 ? "center" : "right") : "left" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} style={{ borderBottom: `1px solid ${C.borderLt}` }}>
              <td style={{ padding: "10px 0", fontSize: "14px", color: C.black }}>{item.product_name}</td>
              <td style={{ padding: "10px 0", fontSize: "12px", color: C.muted }}>{item.product_brand ?? "—"}</td>
              <td style={{ padding: "10px 0", fontSize: "14px", textAlign: "center", color: C.black }}>{item.quantity}</td>
              <td style={{ padding: "10px 0", fontSize: "14px", textAlign: "right", fontFamily: "monospace", color: C.black }}>${Number(item.price).toFixed(2)}</td>
              <td style={{ padding: "10px 0", fontSize: "14px", textAlign: "right", fontFamily: "monospace", fontWeight: 500, color: C.black }}>${(Number(item.price) * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: `2px solid ${C.border}` }}>
            <td colSpan={4} style={{ padding: "12px 0", textAlign: "right", fontWeight: 600, color: C.dark }}>Total</td>
            <td style={{ padding: "12px 0", textAlign: "right", fontWeight: 700, fontSize: "18px", fontFamily: "monospace", color: C.black }}>${subtotal.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      {order.notes && (
        <div style={{ marginBottom: "32px", padding: "16px", borderRadius: "8px", background: C.light }}>
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.faint, margin: "0 0 4px" }}>Notes</p>
          <p style={{ fontSize: "14px", color: C.dark, margin: 0 }}>{order.notes}</p>
        </div>
      )}

      <div style={{ textAlign: "center", paddingTop: "32px", borderTop: `1px solid ${C.border}` }}>
        <p style={{ fontSize: "14px", color: C.muted, margin: "0 0 4px" }}>Thank you for your business!</p>
        <p style={{ fontSize: "12px", color: C.faint, margin: 0 }}>Questions? Contact orders@rocketdistro.com</p>
      </div>
    </div>
  );
}
