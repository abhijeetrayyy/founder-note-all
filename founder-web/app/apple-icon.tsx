import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const dynamic = "force-static";

/** iOS home-screen icon. iOS ignores SVG icons, so this one is rendered to PNG at build. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, background: "#1C2024", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 120, height: 86, background: "#FFFFFF", borderRadius: 6, display: "flex", flexDirection: "column" }}>
          <div style={{ height: 20 }} />
          <div style={{ height: 3, background: "#D5443B" }} />
          <div style={{ height: 15 }} />
          <div style={{ height: 2, background: "#BFD1EA", margin: "0 10px" }} />
          <div style={{ height: 15 }} />
          <div style={{ height: 2, background: "#BFD1EA", margin: "0 10px" }} />
        </div>
      </div>
    ),
    size,
  );
}
