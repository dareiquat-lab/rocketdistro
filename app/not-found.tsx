import Link from "next/link";
import { Rocket } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: "linear-gradient(var(--text) 1px, transparent 1px), linear-gradient(90deg, var(--text) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      {/* Background rocket */}
      <div className="bg-rocket absolute -top-12 -left-12 rotate-12">
        <Rocket size={360} strokeWidth={0.5} />
      </div>

      <div className="text-center relative z-10 space-y-4">
        <div className="hero-rocket inline-block mb-2">
          <Rocket size={72} strokeWidth={1} />
        </div>

        <div className="text-7xl font-black tracking-tight" style={{ color: "var(--accent)" }}>404</div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Lost in orbit</h1>
        <p className="max-w-xs mx-auto" style={{ color: "var(--text-muted)" }}>
          This page drifted off into deep space. Let's get you back on course.
        </p>

        <div className="flex gap-3 justify-center pt-2">
          <Link href="/" className="btn-primary">← Home</Link>
          <Link href="/admin" className="btn-secondary">Admin Portal</Link>
        </div>
      </div>
    </div>
  );
}
