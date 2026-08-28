// The link preview card, generated at build time by next/og.
//
// This is the one file in the repo besides app/globals.css and app/icon.svg
// that is allowed a literal hex value. ImageResponse renders through Satori,
// which has no stylesheet and no Tailwind, so the four colors below are copied
// by hand out of the @theme block in app/globals.css. If a token changes there,
// change it here too.

import { ImageResponse } from "next/og";

export const alt = "Stele: capital follows the reason";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#080b11";
const INK = "#e8edf6";
const ACC = "#5eead4";
const MUT = "#8794aa";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: BG,
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: ACC,
            }}
          >
            WEEX AI Wars II, AI Team
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 116,
              fontWeight: 700,
              letterSpacing: -3,
              color: INK,
            }}
          >
            Stele
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontSize: 44,
              lineHeight: 1.25,
              color: INK,
              maxWidth: 900,
            }}
          >
            Capital follows the reason, not the agent.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 28, color: MUT, maxWidth: 1000 }}>
            Every order carries a named thesis. A thesis that loses money loses its funding.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 26,
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                borderRadius: 10,
                border: `2px solid ${ACC}`,
                padding: "12px 22px",
                fontSize: 26,
                color: ACC,
              }}
            >
              POST /capi/v3/order/uploadAiLog
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
