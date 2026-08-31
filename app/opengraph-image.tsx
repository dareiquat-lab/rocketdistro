import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Rocket Distro — Wholesale Distribution";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0f",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Accent glow */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,144,212,0.15) 0%, transparent 70%)",
            top: -100,
            right: -100,
          }}
        />

        {/* Logo icon */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            background: "#0090d4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
            fontSize: 52,
          }}
        >
          🚀
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-2px",
            marginBottom: 16,
          }}
        >
          ROCKET DISTRO
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "#94a3b8",
            letterSpacing: "4px",
            textTransform: "uppercase",
            marginBottom: 48,
          }}
        >
          Wholesale Distribution
        </div>

        {/* Tag */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(0,144,212,0.15)",
            border: "1px solid rgba(0,144,212,0.3)",
            borderRadius: 999,
            padding: "10px 24px",
            color: "#0090d4",
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#22c55e",
            }}
          />
          Official Wholesale Distributor
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            color: "#475569",
            fontSize: 18,
            letterSpacing: "1px",
          }}
        >
          rocketdistro.site
        </div>
      </div>
    ),
    size
  );
}
