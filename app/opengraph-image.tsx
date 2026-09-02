import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 12,
              backgroundColor: "#6366f1",
              color: "#fafafa",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            A
          </div>
          <div style={{ fontSize: 32, fontWeight: 600 }}>AgentRank</div>
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.15, maxWidth: 950 }}>
          Does ChatGPT recommend your company — or your competitor&apos;s?
        </div>
        <div style={{ fontSize: 28, color: "#a1a1aa", marginTop: 32, maxWidth: 900 }}>
          Track your AI search visibility across ChatGPT, Claude, Gemini &amp; Perplexity.
        </div>
      </div>
    ),
    { ...size }
  );
}
