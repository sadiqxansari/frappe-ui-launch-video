import React from "react";
import { useCurrentFrame } from "../lib/player";
import { Cursor } from "../components/Cursor";
import { Stage } from "../components/Stage";
import { inn, inOut, kf, prog, spr, typed } from "../lib/anim";
import { BRAND, MONO, T } from "../theme";
import { Key, track } from "./motion";
import { Shot } from "./StageOne";
import {
  camera as wallCamera,
  PAGE,
  PAGE_H,
  PAGE_W,
  STAGE_TWO_END,
  tileRect,
  wallTiles,
} from "./StageTwo";
import { inkT, inter, outline, PAPER, surface } from "./tokens";

// ─── The page ────────────────────────────────────────────────────────────
// Frappe CRM rebuilt from frappe-ui (stage piece `crm`), 1600 × 900 page px.
// Positions below were measured once from the built page.
const W = 1600;
const H = 900;
const FULL: Shot = { fx: W / 2, fy: H / 2, k: 1.2, ax: 960, ay: 540 };

// ─── Timeline (scene frames) ─────────────────────────────────────────────
// The wall clears, last in first out. On the empty canvas an agent is asked
// for the page, and builds it from the same components, a region at a time:
// each region's rows come up together in one quick cascade.
const PROMPT = "Build a CRM deal page with frappe-ui";
const ASK = 44; // the prompt box
const TYPE_ASK = ASK + 20;
const SEND = TYPE_ASK + Math.ceil(PROMPT.length * 1.8) + 22;
const DOCK = SEND + 8; // it moves out of the way, and the agent works
const B = DOCK + 10;
const b = (f: number) => B + f;
const SIDEBAR = b(14);
const HEADER = b(44);
const TABS = b(66);
const FEED = b(88);
const SIDE = b(130);
const BUILT = SIDE + 36;
// then a last touch, as an agent would make it: the people get their faces,
// one person at a time
const FACES = BUILT + 24;
// (and the company its logo, first)
export const PEOPLE = [
  "Acme Corp",
  "Sarah Connor",
  "Alice Johnson",
  "Emily Chen",
  "John Parker",
];
const DONE = FACES + PEOPLE.length * 10 + 30;
const PULL = DONE + 16;
const FLAT = PULL + 20; // the page, whole, as the cursor will use it
const PAD = 300; // room above the page in the stage piece (the piece is laid out for it)
const RADIUS = 12;
const CURSOR_IN = FLAT + 44;
const CLICK = CURSOR_IN + 40; // Dashboard: an empty page
// the second ask, in the same box, docked from the start
const PROMPT2 = "Add a dashboard with frappe-ui/charts";
const ASK2 = CLICK + 16; // the camera goes in on the box, so the ask can be read
const TYPE_ASK2 = ASK2 + 34;
const SEND2 = TYPE_ASK2 + Math.ceil(PROMPT2.length * 1.6) + 14;
const ASK2_OUT = SEND2 + 10; // and back out for the page
const DASH = ASK2_OUT + 30; // and the page fills, chart by chart
const d = (f: number) => DASH + f;
const HOVER_BARS = d(70);
const SCROLL = d(146); // once, to the bottom
const DONE2 = SCROLL + 72;
// the same page in dark, behind a slider the cursor drags across
const SLIDER = SCROLL + 100;
const GRAB = SLIDER + 26;
// into the middle on a spring: past it, back, and straight on from there
const SPRING = 52;
const BOUNCE = 0.45;
// the spring's turn back: its second extreme, where it is still for an instant
const TURN =
  GRAB +
  4 +
  Math.round((SPRING * 2 * Math.PI) / (6.5 * Math.sqrt(1 - (1 - BOUNCE) ** 2)));
const ALL_DARK = TURN + 50;
const DEALS = ALL_DARK + 34; // back to the deal, in dark
export const STAGE_THREE_END = DEALS + 56;
// from off the right edge (the cursor goes out and brings it in)
const OFF = 1960; // the slider, parked just past the frame
const SLIDE_TURN = OFF - (OFF - 960) * spr(TURN, GRAB + 4, SPRING, BOUNCE);
const SLIDE_X = (frame: number) =>
  frame < TURN
    ? OFF - (OFF - 960) * spr(frame, GRAB + 4, SPRING, BOUNCE)
    : kf(frame, [TURN, ALL_DARK], [SLIDE_TURN, 0], inOut);

// what the agent reaches for, as it reaches for it
const USES: [string, number][] = [
  ["Sidebar", SIDEBAR],
  ["Breadcrumbs", HEADER],
  ["Avatar", HEADER + 8],
  ["Button", HEADER + 15], // Save, solid: the page's primary action
  ["Tabs", TABS],
  ["Badge", FEED + 8],
  ["TextInput", SIDE],
  ["Select", SIDE + 14],
  ["Avatar", FACES - 6],
];

// the dashboard, filling in: [block, frame it is put down]
const DASH_BLOCKS: [string, number][] = [
  ["k0", DASH],
  ["k1", DASH + 6],
  ["k2", DASH + 12],
  ["k3", DASH + 18],
  ["k4", DASH + 24],
  ["trend", DASH + 36],
  ["forecast", DASH + 46],
  ["funnel", SCROLL + 16],
  ["stage", SCROLL + 24],
  ["source", SCROLL + 40],
  ["territory", SCROLL + 48],
  ["lost", SCROLL + 56],
];
const USES2: [string, number][] = [
  ["NumberCard", DASH],
  ["LineChart", DASH + 36],
  ["BarChart", DASH + 46],
  ["FunnelChart", SCROLL + 16],
  ["DonutChart", SCROLL + 24],
  ["BarChart", SCROLL + 48],
];

// One framing while it builds, the page a little smaller, clear of the
// prompt box. The camera holds still for the build.
const BUILD: Shot = { fx: W / 2, fy: H / 2, k: 1.02, ax: 960, ay: 512 };
const SHOTS: [number, Shot][] = [
  [0, BUILD],
  [FLAT, FULL],
];
const camera = (frame: number): Shot => {
  const keys = (get: (s: Shot) => number): Key[] =>
    SHOTS.map(([f, s]) => [f, get(s)]);
  const dur = frame >= PULL ? 50 : 44;
  return {
    fx: track(
      frame,
      keys((s) => s.fx),
      dur,
    ),
    fy: track(
      frame,
      keys((s) => s.fy),
      dur,
    ),
    k: Math.exp(
      track(
        frame,
        keys((s) => Math.log(s.k)),
        dur,
      ),
    ),
    ax: track(
      frame,
      keys((s) => s.ax),
      dur,
    ),
    ay: track(
      frame,
      keys((s) => s.ay),
      dur,
    ),
  };
};
const screenOf = (c: Shot, x: number, y: number) => ({
  x: (x - c.fx) * c.k + c.ax,
  y: (y - c.fy) * c.k + c.ay,
});

/** Put down by hand: appears in the air at `at`, sets down a beat later. */
const place = (frame: number, at: number, hold = 10) => {
  if (frame < at) return { o: 0 };
  const air = 1 - spr(frame, at + hold, 22, 0);
  return {
    o: Math.min(1, (frame - at) / 6),
    s: 1 + 0.02 * air,
    y: -4 * air,
    sh: 0.45 * air,
  };
};
const appear = (frame: number, at: number) => ({
  o: frame < at ? 0 : Math.min(1, (frame - at) / 10),
});
/** The calm way in: fades up a few pixels. */
const rise = (frame: number, at: number) => {
  if (frame < at) return { o: 0, sh: 0 };
  const p = spr(frame, at, 18, 0);
  return { o: Math.min(1, (frame - at) / 8), y: 4 * (1 - p), sh: 0 };
};

const pageAt = (frame: number): Record<string, object> => {
  // a region at a time; inside one, its rows two frames apart
  const at: Record<string, object> = {
    sidebar: appear(frame, SIDEBAR),
    // the rail, then the section's panel beside it
    brand: rise(frame, SIDEBAR),
    foot: rise(frame, SIDEBAR + 18),
    p0: rise(frame, SIDEBAR + 8),
    p1: rise(frame, SIDEBAR + 10),
    p2: rise(frame, SIDEBAR + 12),
    header: appear(frame, HEADER),
    crumbs: rise(frame, HEADER),
    avatars: rise(frame, HEADER + 2),
    status: rise(frame, HEADER + 4),
    tabs: rise(frame, TABS),
    feedTitle: rise(frame, FEED),
    composer: rise(frame, FEED + 18),
    side: appear(frame, SIDE),
    s0: rise(frame, SIDE),
    org: frame < SIDE ? { o: 0, sh: 0 } : { sh: 0 }, // the card the org's pieces sit in
    orgAvatar: rise(frame, SIDE + 2),
    orgName: rise(frame, SIDE + 2),
    orgActions: rise(frame, SIDE + 4),
    s2: rise(frame, SIDE + 6),
    detailsTitle: rise(frame, SIDE + 8),
    new: rise(frame, HEADER + 6), // Save, in the header's corner
  };
  for (let i = 0; i < 7; i++) at[`n${i}`] = rise(frame, SIDEBAR + 2 + i * 2);
  for (let i = 0; i < 7; i++) at[`f${i}`] = rise(frame, FEED + 2 + i * 2);
  for (let i = 0; i < 9; i++) at[`d${i}`] = rise(frame, SIDE + 10 + i * 2);
  return at;
};

// Dashboard positions (page px), measured from the built page
const NAV_DASH = { x: 24.5, y: 72 }; // the rail's icons
const NAV_DEALS = { x: 24.5, y: 152 };
const CARD = { forecast: { x: 945, y: 270, w: 635, h: 320 } };
export const S2 = 760; // the bottom

/**
 * Stage three. The wall clears; asked for a page, an agent puts Frappe CRM's
 * deal together from the same components, block by block, in one framing,
 * Save solid from the start, its primary action. Then Dashboard: asked
 * again, in the same box (the camera goes in on it to read it), the empty
 * page fills with frappe-ui/charts.
 */
export const StageThree: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = camera(frame);
  const prev = camera(frame - 1);

  // motion blur on the whips, along the direction of travel
  const vx = Math.abs(cam.ax - cam.fx * cam.k - (prev.ax - prev.fx * prev.k));
  const vy = Math.abs(cam.ay - cam.fy * cam.k - (prev.ay - prev.fy * prev.k));
  const blurX = frame < PULL ? Math.min(2.5, vx / 30) : 0;
  const blurY = frame < PULL ? Math.min(2.5, vy / 30) : 0;

  const view = frame >= CLICK + 4 && frame < DEALS + 4 ? "dashboard" : "deal";
  const scroll = kf(frame, [SCROLL, SCROLL + 80], [0, S2], inOut);
  const live = DASH_BLOCKS.filter(([, f]) => frame >= f).map(([k]) => k);
  // the ones that come in during the scroll just fade up: nothing in the air while the page moves
  const dashAt: Record<string, object> = Object.fromEntries(
    DASH_BLOCKS.map(([k, f]) => [
      k,
      f >= SCROLL ? rise(frame, f) : place(frame, f, 8),
    ]),
  );

  // cursor, screen px (the page is at FULL by then)
  const S = (x: number, y: number) =>
    screenOf(FULL, x, y - (y > 42 ? scroll : 0));
  const keys = [
    { f: CURSOR_IN, x: 700, y: 760 },
    { f: CLICK - 6, ...S(NAV_DASH.x, NAV_DASH.y) },
    { f: CLICK + 10, ...S(NAV_DASH.x, NAV_DASH.y) },
    { f: DASH + 20, ...S(NAV_DASH.x, NAV_DASH.y) },
    {
      f: HOVER_BARS,
      ...S(CARD.forecast.x + CARD.forecast.w * 0.3, CARD.forecast.y + 190),
    },
    {
      f: HOVER_BARS + 60,
      ...S(CARD.forecast.x + CARD.forecast.w * 0.72, CARD.forecast.y + 190),
    },
    { f: SCROLL + 10, x: 1560, y: 900 }, // out of the way for the scroll
    { f: SLIDER + 6, x: 1560, y: 900 },
    { f: GRAB, x: OFF + 16, y: 540 }, // out past the edge, to the slider's knob; then with it, frame by frame
    ...Array.from({ length: TURN - GRAB - 4 }, (_, i) => ({
      f: GRAB + 4 + i,
      x: SLIDE_X(GRAB + 4 + i),
      y: 540,
    })),
    { f: TURN, x: SLIDE_TURN, y: 540 },
    { f: ALL_DARK, x: 40, y: 540 },
    { f: DEALS - 6, ...screenOf(FULL, NAV_DEALS.x, NAV_DEALS.y) }, // the sidebar doesn't scroll
    { f: DEALS + 20, ...screenOf(FULL, NAV_DEALS.x + 60, NAV_DEALS.y + 120) },
  ];
  const cur = {
    x: kf(
      frame,
      keys.map((k) => k.f),
      keys.map((k) => k.x),
    ),
    y: kf(
      frame,
      keys.map((k) => k.f),
      keys.map((k) => k.y),
    ),
  };
  const reading = frame >= HOVER_BARS && frame < HOVER_BARS + 70;
  const hover = reading
    ? {
        x: (cur.x - FULL.ax) / FULL.k + FULL.fx,
        y: (cur.y - FULL.ay) / FULL.k + FULL.fy + PAD,
      }
    : null;

  const p = {
    view,
    bg: spr(frame, SIDEBAR - 8, 30, 0),
    nav: view === "dashboard" ? "dashboard" : "deals",
    at: view === "dashboard" ? dashAt : pageAt(frame),
    faces: PEOPLE.filter((_, i) => frame >= FACES + i * 10),
    live,
    count: frame >= DASH,
    scroll,
    off: [],
    hover,
  };

  // the wall clears: the farthest tile first, the dialog last
  const wallCam = wallCamera(STAGE_TWO_END);
  const wall = wallTiles(STAGE_TWO_END);
  const far = wall
    .map((t) => {
      const r = tileRect(t.id);
      return Math.hypot(
        r.x + r.w / 2 - wallCam.fx,
        (r.y + r.h / 2 - wallCam.fy) * 1.4,
      );
    })
    .map((len, i, all) => all.filter((l) => l > len).length);
  const tiles =
    frame < ASK + 10
      ? wall.map((t, i) => {
          const q = spr(frame, far[i] * 1.3, 20, 0);
          return { ...t, dy: 10 * q, s: 1 - 0.04 * q, o: 1 - q };
        })
      : [];

  // in on the docked prompt box while the second ask is typed, whole frame
  const zm =
    prog(frame, ASK2 - 2, 34, inOut) * (1 - prog(frame, ASK2_OUT, 36, inOut));
  const zs = 1 + 0.7 * zm;
  const box = { x: 960, y: 1080 - 20 - 34 }; // where the box docks
  const zoom =
    zm > 0.0001
      ? `translate(${960 * (1 - zs)}px, ${box.y + (640 - box.y) * zm - box.y * zs}px) scale(${zs})`
      : undefined;

  const slideX = SLIDE_X(frame);
  const page = (theme: "light" | "dark") => (
    <div
      style={{
        position: "absolute",
        inset: 0,
        filter: blurX + blurY > 0.3 ? "url(#whip)" : undefined,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transformOrigin: "0 0",
          transform: `translate(${cam.ax - cam.fx * cam.k}px, ${cam.ay - cam.fy * cam.k}px) scale(${cam.k})`,
        }}
      >
        <div style={{ position: "relative", marginTop: -PAD }}>
          {/* the page's edge on the canvas: a window, so the sidebar doesn't melt into the paper */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: PAD,
              width: W,
              height: H,
              borderRadius: RADIUS,
              boxShadow: `0 0 0 1px ${outline(theme, "gray-2")}, ${T.shadows.xl}`,
              opacity: p.bg,
            }}
          />
          <Stage
            piece="crm"
            theme={theme}
            width={W}
            height={H + PAD}
            style={{ position: "relative" }}
            p={{ ...p, pad: PAD, radius: RADIUS, open: false }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: PAPER.light,
        overflow: "hidden",
      }}
    >
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="whip">
          <feGaussianBlur
            stdDeviation={`${blurX.toFixed(2)} ${blurY.toFixed(2)}`}
          />
        </filter>
      </svg>

      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "0 0",
          transform: zoom,
        }}
      >
        {/* mounted throughout, so its page never reloads */}
        {page("light")}

        {/* the same page in dark, uncovered by the slider (mounted early, hidden) */}
        {frame >= CLICK ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: `inset(0 0 0 ${frame >= SLIDER ? slideX : 1920}px)`,
            }}
          >
            {page("dark")}
          </div>
        ) : null}
        {frame >= SLIDER ? <Slider frame={frame} x={slideX} /> : null}

        {/* the wall, on top, until it has flown apart */}
        {tiles.length ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transformOrigin: "0 0",
              transform: `translate(${wallCam.ax - wallCam.fx * wallCam.k}px, ${wallCam.ay - wallCam.fy * wallCam.k}px) scale(${wallCam.k})`,
            }}
          >
            <div style={{ position: "absolute", left: -PAGE.x, top: -PAGE.y }}>
              <Stage
                piece="wall"
                width={PAGE_W}
                height={PAGE_H}
                p={{ card: 1, tiles, fo: STAGE_TWO_END }}
              />
            </div>
          </div>
        ) : null}

        {frame >= ASK && frame < PULL + 30 ? (
          <Ask frame={frame} {...ASK_ONE} />
        ) : null}
        {frame >= ASK2 && frame < DONE2 + 30 ? (
          <Ask frame={frame} {...ASK_TWO} />
        ) : null}

        {frame >= CURSOR_IN ? (
          <Cursor
            keys={keys}
            clicks={[CLICK, GRAB, DEALS]}
            appear={CURSOR_IN}
            hide={STAGE_THREE_END - 16}
            scale={1.3}
          />
        ) : null}
      </div>
    </div>
  );
};

// ─── The prompt ──────────────────────────────────────────────────────────
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const scalePx = (shadow: string, k: number) =>
  shadow.replace(/(-?[\d.]+)px/g, (_, n) => `${(Number(n) * k).toFixed(2)}px`);
const ACCENT = (prompt: string) => prompt.indexOf("with frappe-ui");
const Arrow: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);

/**
 * The ask, typed into an agent's prompt box on the empty canvas. Sent, the
 * box drops to the bottom of the frame and shows, as it works, the component
 * it is using.
 */
type AskSpec = {
  text: string;
  at: number;
  type: number;
  rate: number;
  send: number;
  dock: number;
  done: number;
  out: number;
  uses: [string, number][];
};
const ASK_ONE: AskSpec = {
  text: PROMPT,
  at: ASK,
  type: TYPE_ASK,
  rate: 1.8,
  send: SEND,
  dock: DOCK,
  done: DONE,
  out: PULL,
  uses: USES,
};
// the second one is asked in the box where it already sits
const ASK_TWO: AskSpec = {
  text: PROMPT2,
  at: ASK2,
  type: TYPE_ASK2,
  rate: 1.6,
  send: SEND2,
  dock: -Infinity,
  done: DONE2,
  out: DONE2 + 6,
  uses: USES2,
};

const Ask: React.FC<{ frame: number } & AskSpec> = ({
  frame,
  text: PROMPT,
  at: ASK,
  type: TYPE_ASK,
  rate,
  send: SEND,
  dock: DOCK,
  done: DONE,
  out: PULL,
  uses: USES,
}) => {
  const inP = spr(frame, ASK, 30, 0.1);
  const dk = DOCK === -Infinity ? 1 : spr(frame, DOCK, 34, 0);
  const out = prog(frame, PULL, 22, inn);
  const text = typed(frame, PROMPT, TYPE_ASK, rate);
  const working = frame >= SEND && frame < DONE;
  const typing = frame < SEND;

  // the box, centred, then docked
  const w = lerp(940, 820, dk);
  const h = lerp(176, 68, dk);
  const cy =
    lerp(540, 1080 - 20 - 34, dk) +
    (1 - inP) * (DOCK === -Infinity ? 80 : 24) +
    out * 140;
  const pad = lerp(30, 22, dk);
  const size = lerp(36, 22, dk);
  const btn = lerp(56, 40, dk);
  const btnTop = lerp(h - btn - 20, (h - btn) / 2, dk);
  const press = frame >= SEND && frame < SEND + 6 ? 0.9 : 1;
  const ready = text.length > 0;
  // drawn as the CRM's composer is, at the prompt's size: frappe-ui's text-base is 14px
  const u = size / 14;

  // the component in use, rolling from one to the next
  let i = -1;
  USES.forEach(([, f], k) => {
    if (frame >= f) i = k;
  });
  const roll = i >= 0 ? spr(frame, USES[i][1], 16, 0) : 0;
  const chipIn = spr(frame, USES[0][1], 20, 0) * (1 - spr(frame, DONE, 20, 0));
  const word = (k: number) => (k >= 0 ? USES[k][0] : "");
  const chipW = (k: number) => word(k).length * 12 + 28;
  const cw = Math.max(...USES.map((_, k) => chipW(k))); // one width, the longest name's: only the text rolls

  return (
    <div
      style={{
        position: "absolute",
        left: 960 - w / 2,
        top: cy - h / 2,
        width: w,
        height: h,
        borderRadius: 16 * u, // rounded-[16px]
        background: surface("light", "elevation-1"),
        boxShadow: scalePx(T.shadows.md, u), // shadow-md, no border
        opacity: Math.min(1, inP * 1.5) * (1 - out),
      }}
    >
      <div
        style={{
          position: "absolute",
          left: pad + 2,
          top: lerp(pad, (h - size * 1.35) / 2, dk),
          ...inter(size),
          lineHeight: 1.35,
          color: inkT("light", dk > 0.5 ? "gray-6" : "gray-8"),
          whiteSpace: "nowrap",
        }}
      >
        {/* "with frappe-ui…" in the brand colour, as it is typed */}
        {text.slice(0, ACCENT(PROMPT))}
        <span style={{ color: BRAND }}>{text.slice(ACCENT(PROMPT))}</span>
        {typing ? (
          <span
            style={{
              display: "inline-block",
              width: 3,
              height: size * 1.2,
              marginLeft: 2,
              verticalAlign: -size * 0.22,
              background:
                Math.floor(frame / 18) % 2 === 0 || text.length < PROMPT.length
                  ? inkT("light", "gray-8")
                  : "transparent",
            }}
          />
        ) : null}
      </div>

      {/* the component the agent is using */}
      {chipIn > 0.001 ? (
        <div
          style={{
            position: "absolute",
            right: pad + btn + 12,
            top: (h - 36) / 2,
            width: cw,
            height: 36,
            borderRadius: 8 * u * 0.9, // rounded-4
            overflow: "hidden",
            background: surface("light", "gray-2"),
            opacity: chipIn,
          }}
        >
          {[i - 1, i].map((k, n) =>
            k < 0 || (n === 0 && roll >= 0.999) ? null : (
              <span
                key={`${k}-${n}`}
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: MONO,
                  fontSize: 20,
                  color: inkT("light", "gray-7"),
                  translate: `0 ${n === 0 ? -roll * 100 : (1 - roll) * 100}%`,
                }}
              >
                {word(k)}
              </span>
            ),
          )}
        </div>
      ) : null}

      {/* send; while it works, stop */}
      <div
        style={{
          position: "absolute",
          right: pad - 4,
          top: btnTop,
          width: btn,
          height: btn,
          borderRadius: (btn * 8) / 28, // a solid icon Button: rounded-4 on its h-7
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: ready
            ? surface("light", "gray-9")
            : surface("light", "gray-3"),
          scale: String(press),
        }}
      >
        {working ? (
          <div
            style={{
              width: btn * 0.3,
              height: btn * 0.3,
              borderRadius: 3,
              background: inkT("light", "base"),
            }}
          />
        ) : (
          <Arrow
            size={btn * 0.5}
            color={ready ? inkT("light", "base") : inkT("light", "gray-5")}
          />
        )}
      </div>
    </div>
  );
};

// ─── The dark slider ─────────────────────────────────────────────────────
const Chevron: React.FC<{ flip?: boolean }> = ({ flip }) => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 24 24"
    fill="none"
    stroke={inkT("light", "gray-7")}
    strokeWidth={2.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ rotate: flip ? "180deg" : undefined }}
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

/** A before/after handle: light to its left, dark to its right. */
const Slider: React.FC<{ frame: number; x: number }> = ({ frame, x }) => {
  const o = 1 - prog(frame, ALL_DARK + 6, 14); // no fade in: it is dragged on from off screen
  const grab = frame >= GRAB && frame < ALL_DARK ? 1.08 : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: 0,
        bottom: 0,
        opacity: o,
        pointerEvents: "none",
      }}
    >
      {/* neutral, so it doesn't pull the eye: a white hairline and a white knob */}
      <div
        style={{
          position: "absolute",
          left: -1,
          top: 0,
          bottom: 0,
          width: 2,
          background: "white",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 0 12px rgba(0,0,0,0.12)",
        }}
      />
      <div
        style={{
          position: "absolute",
          borderRadius: 999,
          width: 52,
          height: 52,
          left: -26,
          top: 540 - 26,
          background: "white",
          boxShadow:
            "0 0 0 1px rgba(0,0,0,0.08), 0 6px 16px -4px rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          scale: String(grab),
        }}
      >
        <Chevron />
        <Chevron flip />
      </div>
    </div>
  );
};
