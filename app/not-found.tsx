import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <div className="text-center space-y-4">
        <div className="text-8xl font-black" style={{ color: "var(--accent)" }}>404</div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Page not found</h1>
        <p style={{ color: "var(--text-muted)" }}>The page you're looking for doesn't exist.</p>
        <div className="flex gap-3 justify-center pt-2">
          <Link href="/" className="btn-primary">Go Home</Link>
          <Link href="/admin" className="btn-secondary">Admin Portal</Link>
        </div>
      </div>
    </div>
  );
}
