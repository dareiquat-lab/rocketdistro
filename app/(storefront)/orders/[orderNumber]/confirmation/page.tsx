import { getOrderByNumber } from "@/lib/db";
import Link from "next/link";
import { Rocket, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const order = await getOrderByNumber(decodeURIComponent(orderNumber)).catch(() => null);

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center relative">
      {/* Rocket */}
      <div className="success-rocket inline-block mb-6">
        <Rocket size={64} strokeWidth={1} />
      </div>

      <h1 className="text-3xl font-black mb-2" style={{ color: "var(--text)" }}>Order Launched!</h1>
      <p className="mb-6" style={{ color: "var(--text-muted)" }}>
        Your request is in orbit — we'll contact you shortly to confirm.
      </p>

      {order && (
        <div className="card mb-6 text-left">
          <div className="text-center mb-5">
            <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: "var(--text-muted)" }}>Order Number</p>
            <p className="text-2xl font-black font-mono" style={{ color: "var(--accent)" }}>{order.order_number}</p>
          </div>

          <p className="text-sm text-center mb-5" style={{ color: "var(--text-muted)" }}>
            We'll reach you at <strong style={{ color: "var(--text)" }}>{order.customer_phone}</strong>
            {order.customer_email && <> or <strong style={{ color: "var(--text)" }}>{order.customer_email}</strong></>} to confirm.
          </p>

          {(order.items ?? []).length > 0 && (
            <div className="space-y-2 border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-dim)" }}>Order Summary</p>
              {(order.items ?? []).map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span style={{ color: "var(--text)" }}>{item.product_name} ×{item.quantity}</span>
                  <span className="font-mono" style={{ color: "var(--text-muted)" }}>${(Number(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <span style={{ color: "var(--text)" }}>Total</span>
                <span className="font-mono" style={{ color: "var(--accent)" }}>
                  ${(order.items ?? []).reduce((s, i) => s + Number(i.price) * i.quantity, 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <Link href="/products" className="btn-primary inline-flex">
        Continue Shopping <ArrowRight size={16} />
      </Link>
    </div>
  );
}
