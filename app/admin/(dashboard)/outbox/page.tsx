"use client";

import { useState, useEffect } from "react";
import { Mail, CheckCircle, XCircle, Inbox } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { AdminHeader } from "@/components/layout/AdminHeader";

interface EmailEntry {
  id: number;
  order_id: number | null;
  order_number: string | null;
  type: string;
  to_email: string;
  subject: string;
  status: "sent" | "failed";
  error: string | null;
  sent_at: string;
}

const TYPE_LABEL: Record<string, string> = {
  order_notification: "Order Alert",
  invoice: "Invoice",
};

export default function OutboxPage() {
  const [log, setLog] = useState<EmailEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/outbox")
      .then(r => r.json())
      .then(data => setLog(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const sent = log.filter(e => e.status === "sent").length;
  const failed = log.filter(e => e.status === "failed").length;

  return (
    <>
      <AdminHeader title="Outbox" breadcrumb="Admin / Outbox" />
      <div className="p-6 space-y-4">

        {/* Stats */}
        <div className="flex gap-4">
          <div className="card flex items-center gap-3 py-3 px-4">
            <CheckCircle size={18} style={{ color: "var(--success)" }} />
            <div>
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>Sent</p>
              <p className="font-bold text-lg" style={{ color: "var(--text)" }}>{sent}</p>
            </div>
          </div>
          {failed > 0 && (
            <div className="card flex items-center gap-3 py-3 px-4">
              <XCircle size={18} style={{ color: "var(--danger)" }} />
              <div>
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>Failed</p>
                <p className="font-bold text-lg" style={{ color: "var(--danger)" }}>{failed}</p>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="table-base">
            <thead>
              <tr>
                <th>Type</th>
                <th>To</th>
                <th>Subject</th>
                <th>Order</th>
                <th>Status</th>
                <th>Sent</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center" style={{ color: "var(--text-dim)" }}>Loading…</td></tr>
              ) : log.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Inbox size={40} className="mx-auto mb-3" style={{ color: "var(--text-dim)" }} />
                    <p style={{ color: "var(--text-muted)" }}>No emails sent yet</p>
                  </td>
                </tr>
              ) : log.map(entry => (
                <tr key={entry.id}>
                  <td>
                    <span className="flex items-center gap-1.5 text-sm">
                      <Mail size={13} style={{ color: "var(--accent)" }} />
                      {TYPE_LABEL[entry.type] ?? entry.type}
                    </span>
                  </td>
                  <td className="text-sm" style={{ color: "var(--text-muted)" }}>{entry.to_email}</td>
                  <td className="text-sm max-w-xs truncate" style={{ color: "var(--text)" }}>{entry.subject}</td>
                  <td>
                    {entry.order_number ? (
                      <span className="font-mono text-xs" style={{ color: "var(--accent)" }}>{entry.order_number}</span>
                    ) : <span style={{ color: "var(--text-dim)" }}>—</span>}
                  </td>
                  <td>
                    {entry.status === "sent" ? (
                      <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--success)" }}>
                        <CheckCircle size={12} /> Sent
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--danger)" }} title={entry.error ?? ""}>
                        <XCircle size={12} /> Failed
                      </span>
                    )}
                  </td>
                  <td className="text-sm" style={{ color: "var(--text-muted)" }}>
                    <span title={format(new Date(entry.sent_at), "MMM d, yyyy h:mm a")}>
                      {formatDistanceToNow(new Date(entry.sent_at), { addSuffix: true })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
