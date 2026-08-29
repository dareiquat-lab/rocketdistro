"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Mail } from "lucide-react";
import type { Order } from "@/types";

interface EmailInvoiceModalProps {
  order: Order;
  onClose: () => void;
}

export function EmailInvoiceModal({ order, onClose }: EmailInvoiceModalProps) {
  const [email, setEmail] = useState(order.customer_email);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email }),
      });
      if (res.ok) {
        setSent(true);
        setTimeout(onClose, 1500);
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to send");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Email Invoice" size="sm">
      {sent ? (
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(22,163,74,0.1)" }}>
            <Mail size={24} style={{ color: "var(--success)" }} />
          </div>
          <p className="font-semibold" style={{ color: "var(--success)" }}>Invoice sent!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Send invoice for <strong>{order.order_number}</strong>
          </p>
          <div>
            <label className="label">Recipient Email</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="customer@example.com"
            />
          </div>
          {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleSend} disabled={sending || !email}>
              <Mail size={14} /> {sending ? "Sending…" : "Send Invoice"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
