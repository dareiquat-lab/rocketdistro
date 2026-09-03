"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket } from "lucide-react";

export default function GatewayPage() {
  const [passkey, setPasskey]   = useState("");
  const [error, setError]       = useState(false);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passkey.trim() || loading) return;
    setLoading(true);
    setError(false);

    const res = await fetch("/api/gateway", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passkey }),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => { router.replace("/"); router.refresh(); }, 400);
    } else {
      setError(true);
      setPasskey("");
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .gw-body {
          min-height: 100vh;
          background: radial-gradient(ellipse 90% 70% at 50% 35%, rgba(0,144,212,0.14) 0%, #06080f 65%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
        }

        /* Static star field */
        .gw-body::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(1px 1px at 15% 12%, rgba(212,236,255,0.5) 0%, transparent 0%),
            radial-gradient(1px 1px at 82% 7%,  rgba(212,236,255,0.4) 0%, transparent 0%),
            radial-gradient(1.5px 1.5px at 45% 23%, rgba(0,144,212,0.6) 0%, transparent 0%),
            radial-gradient(1px 1px at 70% 38%, rgba(212,236,255,0.3) 0%, transparent 0%),
            radial-gradient(1px 1px at 28% 55%, rgba(212,236,255,0.4) 0%, transparent 0%),
            radial-gradient(1.5px 1.5px at 60% 68%, rgba(212,236,255,0.3) 0%, transparent 0%),
            radial-gradient(1px 1px at 10% 80%, rgba(0,144,212,0.5) 0%, transparent 0%),
            radial-gradient(1px 1px at 90% 72%, rgba(212,236,255,0.4) 0%, transparent 0%),
            radial-gradient(1px 1px at 35% 90%, rgba(212,236,255,0.3) 0%, transparent 0%),
            radial-gradient(1.5px 1.5px at 75% 90%, rgba(0,144,212,0.4) 0%, transparent 0%),
            radial-gradient(1px 1px at 52% 4%,  rgba(212,236,255,0.5) 0%, transparent 0%),
            radial-gradient(1px 1px at 5% 42%,  rgba(212,236,255,0.3) 0%, transparent 0%),
            radial-gradient(1px 1px at 95% 50%, rgba(212,236,255,0.4) 0%, transparent 0%);
          pointer-events: none;
        }

        @keyframes gw-float {
          0%, 100% { transform: translateY(0)    rotate(-15deg); }
          50%       { transform: translateY(-10px) rotate(-15deg); }
        }
        @keyframes gw-ring-pulse {
          0%   { transform: scale(1);   opacity: 0.5; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        @keyframes gw-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gw-shake {
          0%, 100% { transform: translateX(0); }
          25%       { transform: translateX(-6px); }
          75%       { transform: translateX(6px); }
        }
        @keyframes gw-launch {
          0%   { transform: translateY(0) rotate(-15deg) scale(1); opacity: 1; }
          100% { transform: translateY(-60px) rotate(-15deg) scale(0.5); opacity: 0; }
        }

        .gw-card {
          position: relative;
          z-index: 1;
          background: rgba(11, 17, 32, 0.88);
          border: 1px solid rgba(0, 144, 212, 0.22);
          border-radius: 1.5rem;
          padding: 2.75rem 2.25rem;
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.75rem;
          box-shadow: 0 0 0 1px rgba(0,144,212,0.06), 0 8px 60px rgba(0,0,0,0.8), 0 0 80px rgba(0,144,212,0.06);
          backdrop-filter: blur(24px);
          animation: gw-fade-up 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .gw-logo-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 96px;
          height: 96px;
        }
        .gw-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1.5px solid rgba(0, 144, 212, 0.4);
          animation: gw-ring-pulse 2.2s ease-out infinite;
        }
        .gw-ring-2 {
          animation-delay: 1.1s;
        }
        .gw-logo-bg {
          width: 72px;
          height: 72px;
          border-radius: 1.25rem;
          background: linear-gradient(145deg, #0096c8 0%, #0058a0 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 32px rgba(0, 144, 212, 0.45), inset 0 1px 0 rgba(255,255,255,0.15);
          position: relative;
          z-index: 1;
        }
        .gw-rocket { animation: gw-float 3s ease-in-out infinite; }
        .gw-rocket.launching { animation: gw-launch 0.5s ease-in forwards; }

        .gw-title {
          text-align: center;
          animation: gw-fade-up 0.55s 0.1s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .gw-title h1 {
          color: #d4ecff;
          font-weight: 900;
          font-size: 1.375rem;
          letter-spacing: 0.12em;
          margin: 0;
          font-family: var(--font-inter), Inter, system-ui, sans-serif;
          text-shadow: 0 0 24px rgba(0,144,212,0.3);
        }
        .gw-title p {
          color: #4c7aa4;
          font-size: 0.72rem;
          letter-spacing: 0.14em;
          margin: 0.45rem 0 0;
          font-family: var(--font-jetbrains), monospace;
        }

        .gw-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
          animation: gw-fade-up 0.55s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .gw-input-wrap { position: relative; }
        .gw-input {
          width: 100%;
          padding: 0.8rem 1rem;
          border-radius: 0.875rem;
          background: rgba(6, 8, 15, 0.7);
          border: 1px solid rgba(0, 144, 212, 0.22);
          color: #d4ecff;
          font-size: 1rem;
          letter-spacing: 0.2em;
          outline: none;
          text-align: center;
          font-family: var(--font-jetbrains), monospace;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .gw-input::placeholder { color: #263d58; letter-spacing: 0.05em; }
        .gw-input:focus {
          border-color: rgba(0, 144, 212, 0.55);
          box-shadow: 0 0 0 3px rgba(0, 144, 212, 0.1);
        }
        .gw-input.error {
          border-color: rgba(255, 45, 120, 0.55);
          box-shadow: 0 0 0 3px rgba(255, 45, 120, 0.08);
          animation: gw-shake 0.3s ease;
        }

        .gw-error {
          color: #ff2d78;
          font-size: 0.72rem;
          text-align: center;
          letter-spacing: 0.04em;
          font-family: var(--font-jetbrains), monospace;
        }

        .gw-btn {
          width: 100%;
          padding: 0.8rem;
          border-radius: 0.875rem;
          background: linear-gradient(135deg, #0096c8 0%, #0060a0 100%);
          color: white;
          border: none;
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: box-shadow 0.2s, opacity 0.2s, transform 0.1s;
          box-shadow: 0 0 20px rgba(0, 144, 212, 0.25);
          font-family: var(--font-inter), Inter, system-ui, sans-serif;
        }
        .gw-btn:hover:not(:disabled) {
          box-shadow: 0 0 32px rgba(0, 144, 212, 0.5);
        }
        .gw-btn:active:not(:disabled) { transform: scale(0.97); }
        .gw-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .gw-footer {
          color: #192d48;
          font-size: 0.68rem;
          letter-spacing: 0.06em;
          text-align: center;
          font-family: var(--font-jetbrains), monospace;
          animation: gw-fade-up 0.55s 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      <div className="gw-body">
        <div className="gw-card">
          {/* Logo */}
          <div className="gw-logo-wrap">
            <div className="gw-ring" />
            <div className="gw-ring gw-ring-2" />
            <div className="gw-logo-bg">
              <div className={`gw-rocket${success ? " launching" : ""}`}>
                <Rocket size={30} color="white" />
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="gw-title">
            <h1>ROCKET DISTRO</h1>
            <p>WHOLESALE ACCESS PORTAL</p>
          </div>

          {/* Form */}
          <form className="gw-form" onSubmit={handleSubmit}>
            <div className="gw-input-wrap">
              <input
                className={`gw-input${error ? " error" : ""}`}
                type="password"
                value={passkey}
                onChange={e => { setPasskey(e.target.value); setError(false); }}
                placeholder="enter passkey"
                autoFocus
                autoComplete="off"
              />
            </div>
            {error && <p className="gw-error">Invalid passkey — try again</p>}
            <button
              className="gw-btn"
              type="submit"
              disabled={loading || success || !passkey.trim()}
            >
              {success ? "LAUNCHING..." : loading ? "VERIFYING..." : "ENTER →"}
            </button>
          </form>

          <p className="gw-footer">Authorized personnel only · Rocket Distro</p>
        </div>
      </div>
    </>
  );
}
