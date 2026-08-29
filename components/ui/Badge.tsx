import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple";
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: "bg-slate-100 text-slate-700",
  success: "text-white",
  warning: "text-white",
  danger: "text-white",
  info: "text-white",
  purple: "text-white",
};

const variantInlineStyles: Record<string, React.CSSProperties> = {
  default: { backgroundColor: "var(--muted)", color: "var(--text-muted)" },
  success: { backgroundColor: "var(--success)" },
  warning: { backgroundColor: "var(--warning)" },
  danger: { backgroundColor: "var(--danger)" },
  info: { backgroundColor: "var(--accent)" },
  purple: { backgroundColor: "#7c3aed" },
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn("badge", variantStyles[variant], className)}
      style={variantInlineStyles[variant]}
    >
      {children}
    </span>
  );
}
