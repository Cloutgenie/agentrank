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
              backgroundColor: "#8163F8",
              position: "relative",
            }}
          >
            <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: "#ffffff", display: "flex" }} />
            <div
              style={{
                position: "absolute",
                top: 9,
                right: 9,
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: "#25D0A8",
                display: "flex",
              }}
            />
          </div>
          <div style={{ fontSize: 32, fontWeight: 600 }}>AgentRank Radar</div>
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.15, maxWidth: 950 }}>
          The 24/7 Radar for Your AI Answer Visibility
        </div>
        <div style={{ fontSize: 28, color: "#a1a1aa", marginTop: 32, maxWidth: 900 }}>
          Continuously scanning ChatGPT, Claude, Gemini &amp; Perplexity for how often they recommend you.
        </div>
      </div>
    ),
    { ...size }
  );
}
