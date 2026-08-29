import { getOrderByNumber } from "@/lib/db";
import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const order = await getOrderByNumber(decodeURIComponent(orderNumber)).catch(() => null);

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(22,163,74,0.1)" }}>
        <CheckCircle size={40} style={{ color: "var(--success)" }} />
      </div>

      <h1 className="text-3xl font-black mb-2" style={{ color: "var(--text)" }}>Order Received!</h1>
      <p className="mb-4" style={{ color: "var(--text-muted)" }}>Thank you for your order request.</p>

      {order && (
        <>
          <div className="card mb-6">
            <div className="inline-block px-4 py-2 rounded-lg mb-4" style={{ background: "var(--muted)" }}>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Order Number</p>
              <p className="text-xl font-black font-mono" style={{ color: "var(--accent)" }}>{order.order_number}</p>
            </div>

            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              We'll contact you at <strong>{order.customer_phone}</strong> or <strong>{order.customer_email}</strong> to confirm your order.
            </p>

            {(order.items ?? []).length > 0 && (
              <div className="text-left space-y-2">
                <p className="text-xs font-semibold" style={{ color: "var(--text-dim)" }}>ORDER SUMMARY</p>
                {(order.items ?? []).map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span style={{ color: "var(--text)" }}>{item.product_name} ×{item.quantity}</span>
                    <span className="font-mono" style={{ color: "var(--text-muted)" }}>${(Number(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-semibold" style={{ borderColor: "var(--border)" }}>
                  <span style={{ color: "var(--text)" }}>Total</span>
                  <span className="font-mono" style={{ color: "var(--accent)" }}>
                    ${(order.items ?? []).reduce((s, i) => s + Number(i.price) * i.quantity, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <Link href="/products" className="btn-primary inline-flex">
        Continue Shopping <ArrowRight size={16} />
      </Link>
    </div>
  );
}
