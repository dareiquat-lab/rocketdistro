"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, ImageIcon } from "lucide-react";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        onChange(data.url);
      } else {
        setError("Upload failed. Check Blob token.");
      }
    } catch {
      setError("Network error during upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <label className="label">Product Image</label>
      {value ? (
        <div className="relative w-40 h-40 rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
          <Image src={value} alt="Product" fill className="object-cover" sizes="160px" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white"
            style={{ background: "var(--danger)" }}
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div
          className="w-40 h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
          style={{ borderColor: "var(--border)", background: "var(--muted)" }}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          {uploading ? (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Uploading…</p>
          ) : (
            <>
              <ImageIcon size={24} style={{ color: "var(--text-dim)" }} />
              <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>Click or drop</p>
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>PNG, JPG, WebP</p>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      {error && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}
