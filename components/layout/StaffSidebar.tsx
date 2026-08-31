"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Rocket, ShoppingCart, Users, Sparkles, LogOut, X, Menu } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface StaffSidebarProps {
  newOrdersCount?: number;
}

export function StaffSidebar({ newOrdersCount = 0 }: StaffSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    { href: "/staff/orders", label: "Orders", icon: <ShoppingCart size={18} />, badge: newOrdersCount },
    { href: "/staff/clients", label: "Clients", icon: <Users size={18} /> },
    { href: "/staff/import", label: "AI Import", icon: <Sparkles size={18} /> },
  ];

  const handleLogout = async () => {
    await fetch("/api/staff/logout", { method: "POST" });
    router.push("/staff/login");
  };

  const isActive = (href: string) => pathname.startsWith(href);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <Link href="/staff" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <Rocket size={16} color="var(--accent-fg)" />
          </div>
          <div>
            <span className="font-black text-sm tracking-wide block" style={{ color: "var(--text)" }}>ROCKET DISTRO</span>
            <span className="text-xs" style={{ color: "var(--text-dim)" }}>Staff Portal</span>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-muted)" }}
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg lg:hidden"
            style={{ color: "var(--text-muted)" }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              isActive(item.href)
                ? "text-white nav-active"
                : "hover:bg-[var(--muted)]"
            )}
            style={isActive(item.href)
              ? { background: "var(--accent)", color: "var(--accent-fg)" }
              : { color: "var(--text-muted)" }
            }
          >
            <span className="flex items-center gap-2.5">
              {item.icon}
              {item.label}
            </span>
            {item.badge != null && item.badge > 0 && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                style={{
                  background: isActive(item.href) ? "rgba(255,255,255,0.25)" : "var(--danger)",
                  color: "white"
                }}>
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--muted)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg shadow-md"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
      >
        <SidebarContent />
      </div>

      <div
        className="hidden lg:flex flex-col w-60 flex-shrink-0 h-screen sticky top-0"
        style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
      >
        <SidebarContent />
      </div>
    </>
  );
}
