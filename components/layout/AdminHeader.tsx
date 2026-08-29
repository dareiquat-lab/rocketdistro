"use client";

import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon } from "lucide-react";

interface AdminHeaderProps {
  title: string;
  breadcrumb?: string;
  actions?: React.ReactNode;
}

export function AdminHeader({ title, breadcrumb, actions }: AdminHeaderProps) {
  const { theme, toggle } = useTheme();

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="pl-10 lg:pl-0">
        {breadcrumb && (
          <p className="text-xs mb-0.5" style={{ color: "var(--text-dim)" }}>{breadcrumb}</p>
        )}
        <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <button
          onClick={toggle}
          className="p-2 rounded-lg transition-colors"
          style={{ color: "var(--text-muted)" }}
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
