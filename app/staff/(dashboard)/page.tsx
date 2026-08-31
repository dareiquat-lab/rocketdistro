import { AdminHeader } from "@/components/layout/AdminHeader";
import { ShoppingCart, Users, Sparkles } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function StaffHomePage() {
  const cards = [
    { href: "/staff/orders", icon: <ShoppingCart size={28} />, label: "Orders", desc: "View and manage customer orders" },
    { href: "/staff/clients", icon: <Users size={28} />, label: "Clients", desc: "Add and look up client accounts" },
    { href: "/staff/import", icon: <Sparkles size={28} />, label: "AI Import", desc: "Upload screenshots to import orders" },
  ];

  return (
    <>
      <AdminHeader title="Staff Portal" breadcrumb="Staff" />
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
          {cards.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="card flex flex-col gap-3 no-underline transition-all hover:scale-[1.02]"
              style={{ color: "var(--text)" }}
            >
              <span style={{ color: "var(--accent)" }}>{c.icon}</span>
              <div>
                <p className="font-semibold">{c.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{c.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
