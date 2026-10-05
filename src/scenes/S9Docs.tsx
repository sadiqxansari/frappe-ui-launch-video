import React from "react";
import { useCurrentFrame } from "../lib/player";
import { Sequence } from "../lib/player";
import { Bg, Headline } from "../components/Common";
import { Typed } from "../components/Typed";
import { Stage } from "../components/Stage";
import { BAR, BEAT, prog, spr, typed } from "../lib/anim";
import { BRAND, ink, label, MONO, Mode, paper } from "../theme";


// Part boundaries (scene frames)
const AGENT = 0; // the question
const BUILD = AGENT + BAR * 1.5; // one prompt
const REVEAL = BUILD + BEAT * 6; // the app


/**
 * Agent. The question, typed; one prompt to an agent, which loads the skill
 * and reads the docs; and the whole app it makes. The recipes follow in the
 * same frame.
 */
export const S9Docs: React.FC = () => {
  const frame = useCurrentFrame();

  // C — the question, typed
  if (frame < BUILD) {
    return (
      <Sequence from={AGENT} layout="none">
        <Typed text="What if you just asked?" accent="asked" />
      </Sequence>
    );
  }

  // D — one prompt; E — the app it makes
  const f = frame - BUILD;
  const g = frame - REVEAL;
  const prompt = typed(
    f,
    "Build a helpdesk for my team. Use frappe-ui.",
    6,
    1.1,
  );
  const steps: [number, string, string][] = [
    [62, "✓", "Using skill frappe-ui"],
    [74, "✓", "Read ui.frappe.io/llms.txt"],
    [86, "✓", "Read docs: List, Badge, Avatar, TabButtons, Sidebar"],
    [104, "+", "src/pages/Tickets.vue"],
    [114, "+", "src/pages/Ticket.vue"],
    [124, "+", "src/components/TicketRow.vue"],
    [134, "+", "src/components/Sidebar.vue"],
    [144, "+", "src/router.ts"],
    [164, "✓", "Done."],
  ];
  const reveal = spr(g, 0, 34, 0.12);
  const mode: Mode = "light";
  const app = (
    <>
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 250,
          borderRadius: 14,
          overflow: "hidden",
          boxShadow:
            "0 0 0 1px rgba(128,128,128,0.25), 0 40px 80px -30px rgba(0,0,0,0.4)",
          translate: `0 ${(1 - reveal) * 80}px`,
        }}
      >
        <Stage
          piece="recipe"
          theme={mode}
          zoom={0.84}
          width={1440 * 0.84}
          height={900 * 0.84}
          p={{ name: "tickets" }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 1400,
          top: 230,
          padding: 10,
          borderRadius: 50,
          background: "#0b0b0b",
          boxShadow:
            "0 0 0 1.5px rgba(128,128,128,0.3), 0 30px 60px -24px rgba(0,0,0,0.4)",
          translate: `0 ${(1 - spr(g, 8, 34, 0.12)) * 120}px`,
        }}
      >
        <div style={{ borderRadius: 40, overflow: "hidden" }}>
          <Stage
            piece="recipe"
            theme={mode}
            zoom={0.8}
            width={390 * 0.8}
            height={844 * 0.8}
            p={{ name: "tickets", mobile: true }}
          />
        </div>
      </div>
    </>
  );
  return (
    <Bg color={paper}>
      {/* D */}
      <div style={{ position: "absolute", inset: 0, opacity: g < 0 ? 1 : 0 }}>
        <Card
          at={f}
          delay={0}
          style={{ left: 160, top: 120, width: 1600, height: 840 }}
          title="agent"
        >
          <div
            style={{
              padding: "30px 36px",
              fontFamily: MONO,
              fontSize: 30,
              lineHeight: "50px",
              color: "white",
              whiteSpace: "pre",
            }}
          >
            <div>
              <span style={{ color: BRAND }}>{"> "}</span>
              {prompt}
              {f < 62 ? (
                <span
                  style={{
                    display: "inline-block",
                    width: 14,
                    height: 34,
                    background: BRAND,
                    verticalAlign: -5,
                    marginLeft: 4,
                  }}
                />
              ) : null}
            </div>
            <div style={{ height: 18 }} />
            {steps.map(([at, mark, text]) =>
              f >= at ? (
                <div
                  key={text}
                  style={{
                    color:
                      mark === "+"
                        ? "rgba(255,255,255,0.85)"
                        : "rgba(255,255,255,0.6)",
                    translate: `${(1 - prog(f, at, 10)) * 20}px 0`,
                    opacity: prog(f, at, 8),
                  }}
                >
                  <span
                    style={{ color: mark === "+" ? BRAND : "#4ade80" }}
                  >{`${mark} `}</span>
                  {text}
                </div>
              ) : null,
            )}
          </div>
        </Card>
      </div>

      {/* E — mounted from the start of D so the pages are ready */}
      <div style={{ position: "absolute", inset: 0, opacity: g >= 0 ? 1 : 0 }}>
        {app}
        <Headline
          lines={["One prompt. A whole app."]}
          at={REVEAL + 10}
          size={72}
          color={ink}
          style={{ left: 110, top: 118, whiteSpace: "nowrap" }}
        />
      </div>
    </Bg>
  );
};

const Card: React.FC<{
  at: number;
  delay: number;
  style: React.CSSProperties;
  title: string;
  children: React.ReactNode;
}> = ({ at, delay, style, title, children }) => {
  const p = spr(at, delay, 26, 0.15);
  return (
    <div
      style={{
        position: "absolute",
        borderRadius: 16,
        background: "oklch(0.205 0 0)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.1)",
        overflow: "hidden",
        opacity: Math.min(1, p * 2),
        translate: `0 ${(1 - p) * 40}px`,
        ...style,
      }}
    >
      <div
        style={{
          height: 44,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 18px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div
            key={c}
            style={{
              width: 12,
              height: 12,
              borderRadius: 9,
              background: c,
              opacity: 0.85,
            }}
          />
        ))}
        <span style={{ ...label(17, "rgba(255,255,255,0.5)"), marginLeft: 12 }}>
          {title}
        </span>
      </div>
      <div
        style={{
          position: "relative",
          height: "calc(100% - 44px)",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
};
