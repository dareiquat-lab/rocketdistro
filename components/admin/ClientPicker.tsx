"use client";

import { useState, useRef, useEffect } from "react";
import { Search, User } from "lucide-react";
import type { Client } from "@/types";

interface ClientPickerProps {
  onSelect: (client: Client) => void;
}

export function ClientPicker({ onSelect }: ClientPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/clients?search=${encodeURIComponent(query)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.clients ?? []);
          setOpen(true);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div ref={ref} className="relative">
      <label className="label">Search Existing Client</label>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-dim)" }} />
        <input
          type="text"
          className="input-field pl-8"
          placeholder="Search by name or phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
      </div>
      {open && results.length > 0 && (
        <div
          className="absolute z-50 w-full mt-1 rounded-lg shadow-lg overflow-hidden"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => { onSelect(c); setQuery(c.business_name); setOpen(false); }}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-left text-sm hover:bg-[var(--muted)] transition-colors"
            >
              <User size={16} style={{ color: "var(--text-dim)" }} />
              <div>
                <p className="font-medium" style={{ color: "var(--text)" }}>{c.business_name}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{c.contact_name} · {c.phone}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {loading && (
        <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>Searching…</p>
      )}
    </div>
  );
}
