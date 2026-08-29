interface CategoryIconProps {
  icon: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "text-base w-7 h-7",
  md: "text-xl w-9 h-9",
  lg: "text-2xl w-12 h-12",
};

export function CategoryIcon({ icon, size = "md" }: CategoryIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg ${sizeClasses[size]}`}
      style={{ background: "var(--muted)" }}
    >
      {icon}
    </span>
  );
}
