import React, {useState} from 'react';
import {useCurrentFrame} from '../lib/player';
import {inn, inOut, prog, spr} from '../lib/anim';
import {Mark} from '../components/Hud';
import {BRAND, disp, ink, label, Mode} from '../theme';
import {Stage, Targets} from '../components/Stage';
import {Code, Line} from './Code';
import {Key, track, typedAt} from './motion';
import {PAPER, RADII, surface} from './tokens';

// ─── Timeline (scene frames, 60 fps) ─────────────────────────────────────
// A card, grown from its two texts outward: the CRM's email activity. The
// title and the paragraph come up in plain Inter, and their typography is
// closed first: the type tokens (letter spacing), the paragraph's leading,
// the ink. Then the box around them, on the page's own surface: its border,
// its padding; then in on its corner, sharp for a beat, for the radius. Then
// the rest of the card, a piece (a whole line of code) at a time, the divider
// among them; the Reply button's icon and variant, the Badge's colour. Then dark: the card lifts
// through the elevations, and settles on elevation-2.
// The code shows only the styling.
const INTRO = 54;
const TITLE_IN = 44; // where the mark was
const BODY_IN = 54; // and the paragraph under it
const T_CODE = 100; // <h3 class="">, <p class="">
const T_TYPE = 116; // text-lg-semibold: the title's size, weight, letter spacing
const B_TYPE = 170; // text-base: the paragraph's
const P_AT = 250; // text-p-base: the same size, room between the lines
const T_INK = 330; // text-ink-gray-8
const P_INK = 356; // text-ink-gray-6
const BOX = 420; // the box, around the two
const BG_AT = 440; // bg-surface-base: the page's own surface
const BORDER_AT = 490; // border border-outline-gray-1, seen whole: tight on the text
const W_AT = 580; // w-[440px] p-4: the padding pushes it out
const CORNER = 650; // into the corner: a beat on the sharp corner, then the radius
const RAD_STEPS = [730, 754, 770, 786, 802, 818]; // rounded-1 … rounded-6
const RAD_OUT = 852;
const SH_AT = RAD_OUT + 40; // shadow-sm, seen on the whole box
const REST = 940; // the rest of the card, a whole line at a time
const AV_AT = 950;
const NAME_AT = 980;
const TIME_AT = 1010;
const TO_AT = 1040;
const HR_AT = 1070; // the divider, between the recipient and the paragraph
const BADGE_AT = 1102;
const BTN_AT = 1134; // <Button variant="subtle" label="Reply" />
const BTN_CAM = 1170; // onto the button
const ICONS: [number, string][] = [[1200, 'lucide-mail'], [1230, 'lucide-send'], [1260, 'lucide-reply']];
const BTN_VARS: [number, string][] = [[1300, 'solid'], [1335, 'ghost']];
const BTN_OUT = 1365; // back to the whole card (going straight across would drag it over the code)
const BADGE_CAM = 1410; // onto the Badge
const THEMES: [number, string][] = [[1435, 'green'], [1465, 'violet'], [1495, 'amber']];
const CARD_OUT = 1530;
const DARK_AT = 1560; // <html data-theme="dark">: the whole page goes dark
const EDGE_AT = 1620; // in on the card's corner, still on base; the code leaves
const Z_CODE = 1680; // above the card: bg-surface-base, typed
const SURFS: [number, string][] = [[1740, 'elevation-1'], [1830, 'elevation-2'], [1890, 'elevation-3']]; // it lifts off the page, a breath on each
const DOWN_AT = 1880 + 70; // and settles back to elevation-2
const EDGE_OUT = DOWN_AT + 65;
const LIGHT_AT = EDGE_OUT + 110; // and, once the dark card has been seen whole, back to light
export const STAGE_ONE_END = LIGHT_AT + 80;

// ─── The code (only the styling) ─────────────────────────────────────────
const tag = (id: string, open: string, at: number): Line => ({id, frame: true, edits: [{at, to: open, rate: 0}]});
/** A whole line (or a value in it) at once, no typing. */
const now = (at: number, to: string) => ({at, to, rate: 0, del: 0});
// The two texts' classes…
const LINES_T: Line[] = [
	tag('t0', '<h3 class="', T_CODE),
	{id: 't1', indent: 2, edits: [{at: T_TYPE, to: 'text-lg-semibold'}]},
	{id: 't2', indent: 2, edits: [{at: T_INK, to: 'text-ink-gray-8'}]},
	tag('t9', '">', T_CODE),
	tag('p0', '<p class="', T_CODE),
	{id: 'p1', indent: 2, edits: [{at: B_TYPE, to: 'text-base'}, {at: P_AT, to: 'text-p-base'}]},
	{id: 'p2', indent: 2, edits: [{at: P_INK, to: 'text-ink-gray-6'}]},
	tag('p9', '">', T_CODE),
];
// …the box's…
const LINES_B: Line[] = [
	tag('open', '<div class="', BOX + 8),
	{id: 'a2', indent: 2, edits: [{at: BG_AT, to: 'bg-surface-base'}]},
	{id: 'a3', indent: 2, edits: [{at: BORDER_AT, to: 'border border-outline-gray-1'}]},
	{id: 'a1', indent: 2, edits: [{at: W_AT, to: 'w-[440px] p-4'}]},
	{id: 'a4', indent: 2, edits: RAD_STEPS.map((at, i) => ({at, to: `rounded-${i + 1}`, ...(i === 0 ? {rate: 1.4} : {})}))},
	{id: 'a5', indent: 2, edits: [{at: SH_AT, to: 'shadow-sm'}]},
	tag('close', '">', BOX + 8),
];
// …then each piece that goes in after, whole lines, and the page's theme
const SURF = '<div class="… bg-surface-';
const LINES_C: Line[] = [
	{id: 'html', accent: 'dark', edits: [now(DARK_AT, '<html data-theme="dark">')]},
	{id: 'c0', edits: [now(REST + 8, `${SURF}base">`)]},
	{id: 'av', indent: 2, edits: [now(AV_AT, '<Avatar :image="alice" />')]},
	{id: 'name', indent: 2, edits: [now(NAME_AT, '<span class="text-base-medium text-ink-gray-8">')]},
	{id: 'time', indent: 2, edits: [now(TIME_AT, '<span class="text-sm text-ink-gray-5">')]},
	{id: 'to', indent: 2, edits: [now(TO_AT, '<p class="text-sm text-ink-gray-5">')]},
	{id: 'hr', indent: 2, edits: [now(HR_AT, '<hr class="my-3 border-outline-gray-1">')]},
	{id: 'bd', indent: 2, prefix: '<Badge theme="', suffix: '" />', edits: [now(BADGE_AT, 'gray'), ...THEMES.map(([at, to]) => now(at, to))]},
	{id: 'b0', indent: 2, edits: [now(BTN_AT, '<Button')]},
	{id: 'bv', indent: 4, prefix: 'variant="', suffix: '"', edits: [now(BTN_AT, 'subtle'), ...BTN_VARS.map(([at, to]) => now(at, to))]},
	{id: 'bi', indent: 4, prefix: 'icon-left="', suffix: '"', edits: ICONS.map(([at, to]) => now(at, to))},
	{id: 'bl', indent: 4, edits: [now(BTN_AT, 'label="Reply"')]},
	{id: 'b9', indent: 2, edits: [now(BTN_AT, '/>')]},
	{id: 'c9', frame: true, edits: [{at: REST + 8, to: '</div>', rate: 0}]},
];

// …and, in dark, close on the card, its surface: typed above it
const Z_LINE: Line = {
	id: 'z',
	edits: [
		{at: Z_CODE, to: 'bg-surface-base'},
		...SURFS.map(([at, v]) => ({at, to: `bg-surface-${v}`})),
		{at: DOWN_AT, to: 'bg-surface-elevation-2'},
	],
};

const ALL = [...LINES_T, ...LINES_B, ...LINES_C, Z_LINE];
const ed = (id: string) => ALL.find((l) => l.id === id)!.edits;
const done = (id: string, i: number) => typedAt(ed(id), i, ed(id)[i].to) + 2;

// Token effects land the moment their token is typed (or the line appears).
const TITLE_DONE = done('t1', 0);
const BODY_DONE = done('p1', 0);
const P_DONE = done('p1', 1);
const PAD_DONE = done('a1', 0);
const BG_DONE = done('a2', 0);
const BORDER_DONE = done('a3', 0);
const RAD_DONE = RAD_STEPS.map((_, i) => done('a4', i));
const INK_DONE = [NAME_AT, TIME_AT, done('t2', 0), TO_AT, done('p2', 0)]; // name, time, title, to, body
const SURF_DONE: [number, string][] = [...SURFS.map(([, v], i): [number, string] => [done('z', i + 1), v]), [done('z', SURFS.length + 1), 'elevation-2']];
const SH_DONE = done('a5', 0);
const WIPE = DARK_AT + 6;

/** The card, at this frame: how far each piece is in, and each token landed (see BuildCard.vue). */
const buildAt = (frame: number) => {
	const at = (f: number, d = 20) => spr(frame, f, d, 0);
	const pick = (keys: [number, string][], first: string) => keys.reduce((v, [f, s]) => (frame >= f ? s : v), first);
	return {
		show: {
			title: at(TITLE_IN, 24),
			body: at(BODY_IN, 24),
			header: at(AV_AT, 26),
			name: at(NAME_AT, 18),
			time: at(TIME_AT, 18),
			to: at(TO_AT, 22),
			hr: at(HR_AT, 22),
			footer: at(BADGE_AT, 26),
		},
		pad: at(PAD_DONE, 22),
		bg: at(BG_DONE),
		surf: pick(SURF_DONE, 'base'),
		ring: at(BORDER_DONE, 16),
		r: track(frame, [[0, 0], ...RAD_DONE.map((f, i): Key => [f, RADII[i + 1].r])], 14, 0),
		sh: at(SH_DONE, 24),
		title: at(TITLE_DONE, 30),
		hr: 1, // it arrives styled: the whole line at once
		body: at(BODY_DONE, 30),
		para: at(P_DONE, 30),
		name: 1,
		time: 1,
		to: 1,
		ink: INK_DONE.map((f, i) => (i === 2 || i === 4 ? at(f, 24) : 1)),
		avatar: spr(frame, AV_AT + 2, 26, 0.15),
		badge: spr(frame, BADGE_AT + 2, 26, 0.15),
		buttons: spr(frame, BTN_AT + 2, 26, 0.15),
		theme: pick(THEMES, 'gray'),
		btn: pick(BTN_VARS, 'subtle'),
		icon: pick(ICONS, ''),
	};
};

// ─── The canvas ──────────────────────────────────────────────────────────
// Canvas units are the stage page's own pixels; the card's top left is at
// (60, 60) and it grows right and down from there.
export const CODE_X = 120;
const PAGE_W = 1200;
const PAGE_H = 800;
const CARD_X = 60;
const CARD_Y = 60;

export type Shot = {fx: number; fy: number; k: number; ax: number; ay: number};
const CARD: Shot = {fx: CARD_X + 220, fy: CARD_Y + 140, k: 1.75, ax: 1490, ay: 540};
// the footer's centre line, and the Reply button's centre (canvas px)
const FOOT_Y = CARD_Y + 214;
const BTN_X = CARD_X + 16 + 408 - 38;
const SHOTS: [number, Shot][] = [
	[0, {fx: CARD_X + 155, fy: CARD_Y + 40, k: 2.3, ax: 960, ay: 540}], // the two texts, where the mark was
	[T_CODE - 6, {fx: CARD_X + 155, fy: CARD_Y + 40, k: 2.3, ax: 1400, ay: 540}], // aside for their code
	[BOX, {...CARD, fy: CARD_Y + 70}],
	[CORNER, {fx: CARD_X + 12, fy: CARD_Y + 8, k: 12, ax: 1300, ay: 560}], // the corner: the border, then the radius
	[RAD_OUT, {...CARD, fy: CARD_Y + 80}],
	[REST, {...CARD, fy: CARD_Y + 110}],
	[BADGE_AT, {...CARD, fy: CARD_Y + 130}],
	[BTN_CAM, {fx: BTN_X, fy: FOOT_Y, k: 4.5, ax: 1650, ay: 560}], // the Reply button, right of the code
	[BTN_OUT, {...CARD, fy: CARD_Y + 140}],
	[BADGE_CAM, {fx: CARD_X + 50, fy: FOOT_Y, k: 5, ax: 1400, ay: 560}], // the Badge
	[CARD_OUT, {...CARD, fy: CARD_Y + 140}],
	[EDGE_AT, {fx: CARD_X, fy: CARD_Y, k: 5.4, ax: 476, ay: 250}], // the corner, in dark, room above it for the code
	[EDGE_OUT, {...CARD, fy: CARD_Y + 131, ax: 960}], // the card alone, centred: no code to make room for
];

export const camera = (frame: number): Shot => {
	const keys = (get: (s: Shot) => number): Key[] => SHOTS.map(([f, s]) => [f, get(s)]);
	const dur = 56;
	return {
		fx: track(frame, keys((s) => s.fx), dur),
		fy: track(frame, keys((s) => s.fy), dur),
		k: Math.exp(track(frame, keys((s) => Math.log(s.k)), dur)),
		ax: track(frame, keys((s) => s.ax), dur),
		ay: track(frame, keys((s) => s.ay), dur),
	};
};
const toScreen = (c: Shot, x: number, y: number) => ({x: (x - c.fx) * c.k + c.ax, y: (y - c.fy) * c.k + c.ay});

// ─── Annotations (screen space, so type stays one size) ──────────────────
const PURPLE = BRAND;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const fmt = (n: number) => String(Math.round(n * 100) / 100);

/** Padding, the corner, the two texts' letter spacing and the paragraph's leading. */
const Guides: React.FC<{frame: number; cam: Shot; t: Targets}> = ({frame, cam, t}) => {
	const S = (x: number, y: number) => toScreen(cam, x, y);
	const b = buildAt(frame);
	const tl = S(CARD_X, CARD_Y);
	const br = t.card1 ? S(t.card1.x, t.card1.y) : tl;
	// p-4: the padding, shaded on all four sides
	const pIn = spr(frame, PAD_DONE + 2, 20, 0) * (1 - spr(frame, CORNER - 6, 12, 0));
	const pad = 16 * b.pad * cam.k;
	// the corner
	const rIn = spr(frame, RAD_DONE[0], 16, 0) * (1 - spr(frame, RAD_OUT - 6, 12, 0));
	const step = RAD_DONE.reduce((k, f, i) => (frame >= f ? i : k), 0);
	const c = S(CARD_X + b.r, CARD_Y + b.r);
	const rr = b.r * cam.k;
	// first the letter spacing, beside each text as its token lands…
	const trIn = (from: number) => spr(frame, from, 20, 0) * (1 - spr(frame, P_AT - 16, 12, 0));
	const tracking = (k: 'title' | 'body', size: number, tr: number, p: number) => {
		const a = t[`${k}0`];
		if (!a || p <= 0.01) return null;
		const l = S(a.x - 8, 0).x;
		return (
			<div style={{position: 'absolute', right: 1920 - (l - 20), top: S(0, a.y + size * 0.68).y, translate: '0 -50%', ...label(32, PURPLE), opacity: p, whiteSpace: 'nowrap'}}>
				{`${fmt(tr)}em`}
			</div>
		);
	};
	// …then the paragraph's line boxes, and one line's height
	const lIn = spr(frame, P_AT - 14, 20, 0) * (1 - spr(frame, T_INK - 4, 12, 0));
	const leading = (size: number, lh: number, p: number) => {
		const a = t.body0;
		const z = t.body1;
		if (!a || !z || p <= 0.01) return null;
		const h = size * lh;
		const n = Math.max(1, Math.round((z.y - a.y) / h));
		const l = S(a.x - 8, 0).x;
		const r = S(z.x + 8, 0).x;
		return (
			<>
				{Array.from({length: n + 1}, (_, i) => (
					<div key={i} style={{position: 'absolute', left: l, width: r - l, top: S(0, a.y + i * h).y, borderTop: `2px dashed ${PURPLE}`, opacity: 0.7 * p}} />
				))}
				<VDim x={l - 20} y1={S(0, a.y).y} y2={S(0, a.y + h).y} text={fmt(lh)} p={p} left />
			</>
		);
	};
	return (
		<div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
			{pIn > 0.01 ? (
				<>
					{[
						{left: tl.x, top: tl.y, width: br.x - tl.x, height: pad},
						{left: tl.x, top: br.y - pad, width: br.x - tl.x, height: pad},
						{left: tl.x, top: tl.y + pad, width: pad, height: br.y - tl.y - pad * 2},
						{left: br.x - pad, top: tl.y + pad, width: pad, height: br.y - tl.y - pad * 2},
					].map((r, i) => (
						<div key={i} style={{position: 'absolute', ...r, background: PURPLE, opacity: 0.16 * pIn}} />
					))}
					<HDim x1={tl.x} x2={tl.x + 16 * cam.k} y={br.y + 36} text="16" p={pIn} />
				</>
			) : null}
			{rIn > 0.01 ? (
				<>
					<div style={{position: 'absolute', left: c.x - rr, top: c.y - rr, width: rr * 2, height: rr * 2, borderRadius: 9999, border: `2px dashed ${PURPLE}`, opacity: 0.85 * rIn}} />
					<div style={{position: 'absolute', left: c.x, top: c.y, width: rr, height: 2, background: PURPLE, rotate: '-135deg', transformOrigin: '0 50%', opacity: rIn}} />
					<div style={{position: 'absolute', left: c.x - 7, top: c.y - 7, width: 14, height: 14, borderRadius: 9, background: PURPLE, opacity: rIn}} />
					<div style={{position: 'absolute', left: c.x - rr * 0.72 - 24, top: c.y - rr * 0.72 - 24, translate: '-100% -100%', ...label(40, PURPLE), opacity: rIn}}>{RADII[step + 1].r}px</div>
				</>
			) : null}
			{tracking('title', 16, 0.02 * b.title, trIn(T_TYPE))}
			{tracking('body', lerp(16, 14, b.body), 0.02 * b.body, trIn(B_TYPE))}
			{leading(14, lerp(1.35, 1.5, b.para), lIn)}
		</div>
	);
};

const VDim: React.FC<{x: number; y1: number; y2: number; text: string; p: number; left?: boolean}> = ({x, y1, y2, text, p, left}) => {
	const L = (y2 - y1) * p;
	return (
		<div style={{position: 'absolute', left: x, top: y1, opacity: Math.min(1, p * 2)}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: 2, height: L, background: PURPLE}} />
			{[0, L].map((o, i) => (
				<div key={i} style={{position: 'absolute', left: -8, top: o - 1, width: 18, height: 2, background: PURPLE}} />
			))}
			<div style={{position: 'absolute', top: (y2 - y1) / 2, ...(left ? {right: 24} : {left: 24}), translate: '0 -50%', ...label(32, PURPLE), whiteSpace: 'nowrap'}}>{text}</div>
		</div>
	);
};

const HDim: React.FC<{x1: number; x2: number; y: number; text: string; p: number}> = ({x1, x2, y, text, p}) => {
	const L = (x2 - x1) * p;
	return (
		<div style={{position: 'absolute', left: x1, top: y, opacity: Math.min(1, p * 2)}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: L, height: 2, background: PURPLE}} />
			{[0, L].map((o, i) => (
				<div key={i} style={{position: 'absolute', left: o - 1, top: -8, width: 2, height: 18, background: PURPLE}} />
			))}
			<div style={{position: 'absolute', left: (x2 - x1) / 2, top: 18, translate: '-50% 0', ...label(32, PURPLE)}}>{text}</div>
		</div>
	);
};

// ─── The scene ───────────────────────────────────────────────────────────
const World: React.FC<{frame: number; mode: Mode}> = ({frame, mode}) => {
	const cam = camera(frame);
	// the code leaves as the camera goes onto the card's top edge, for good
	const codeIn = spr(frame, T_CODE, 22, 0) * (1 - spr(frame, EDGE_AT, 20, 0));
	const [t, setT] = useState<Targets>({});
	// on the button, the rest of the card runs left under the code: let it
	// fade out before it gets there
	const m = spr(frame, BTN_CAM - 4, 14, 0) * (1 - spr(frame, BTN_OUT + 44, 20, 0));
	const mask = m > 0.001 ? `linear-gradient(to right, rgba(0,0,0,${1 - m}) 1030px, #000 1100px)` : undefined;
	return (
		<div style={{position: 'absolute', inset: 0, background: surface(mode, 'base'), overflow: 'hidden'}}>
			<div style={{position: 'absolute', inset: 0, maskImage: mask, WebkitMaskImage: mask}}>
			<div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${cam.ax - cam.fx * cam.k}px, ${cam.ay - cam.fy * cam.k}px) scale(${cam.k})`}}>
				<Stage piece="card" theme={mode} width={PAGE_W} height={PAGE_H} p={{s: buildAt(frame)}} onTargets={mode === 'light' ? setT : undefined} />
			</div>
			</div>
			{mode === 'light' ? <Guides frame={frame} cam={cam} t={t} /> : null}
			<div style={{position: 'absolute', inset: 0, opacity: codeIn, translate: `${(1 - codeIn) * -24}px 0`}}>
				<StageOneCode frame={frame} dark={mode === 'dark'} />
			</div>
			{/* close on the card, in dark: its surface, typed above it */}
			{mode === 'dark' && frame >= Z_CODE && frame < EDGE_OUT + 30 ? (
				<div style={{position: 'absolute', inset: 0, opacity: 1 - spr(frame, EDGE_OUT - 8, 16, 0)}}>
					<Code frame={frame} lines={[Z_LINE]} x={562} cy={176} dark style={{scale: '1.5', transformOrigin: '562px 176px'}} />
				</div>
			) : null}
		</div>
	);
};

/**
 * The code, only the styling: the title's classes; the paragraph's; the
 * box's; then each piece that goes in after, and the page's theme.
 */
export const StageOneCode: React.FC<{frame: number; dark?: boolean}> = ({frame, dark}) => {
	const phase = (from: number, to: number) => ({out: prog(frame, to, 16, inn), in: spr(frame, from, 22, 0)});
	const slide = (p: {in: number; out: number}) => ({opacity: p.in * (1 - p.out), translate: `0 ${24 * (1 - p.in) - 40 * p.out}px`});
	const small = {scale: '0.85', transformOrigin: `${CODE_X}px 540px`};
	const blocks: [Line[], number, number, boolean][] = [
		[LINES_T, T_CODE, BOX, false],
		[LINES_B, BOX + 8, REST, false],
		[LINES_C, REST + 8, 100000, true],
	];
	return (
		<>
			{blocks.map(([lines, from, to, sm], i) => {
				const p = phase(from, to);
				if (frame < from || p.out >= 1) return null;
				return <Code key={i} frame={frame} lines={lines} x={CODE_X} cy={540} dark={dark} style={{...(sm ? small : {}), ...slide(p)}} />;
			})}
		</>
	);
};

/**
 * Stage one. A title and a paragraph in plain Inter; their letter spacing,
 * the paragraph's leading, their ink; the box around them, one class at a
 * time, the border and radius seen close on the corner; then the rest of the
 * card a line at a time, the Reply button's icon and variant, the Badge's
 * colour. Then dark: the card lifts through the elevations and settles on elevation-2.
 */
export const StageOne: React.FC = () => {
	const frame = useCurrentFrame();
	// dark sweeps across the whole page, and later light sweeps back
	const inX = 1920 * prog(frame, WIPE, 40, inOut);
	const outX = 1920 * prog(frame, LIGHT_AT, 36, inOut);
	return (
		<div style={{position: 'absolute', inset: 0}}>
			<World frame={frame} mode="light" />
			{frame < INTRO ? <Outro frame={frame} /> : null}
			{/* mounted well before it shows, so its page is loaded by the sweep */}
			{frame >= DARK_AT - 120 && frame < LIGHT_AT + 40 ? (
				<div style={{position: 'absolute', inset: 0, opacity: inX > 0 ? 1 : 0, clipPath: `inset(0 ${Math.min(1920, 1920 - inX + outX)}px 0 0)`}}>
					<World frame={frame} mode="dark" />
				</div>
			) : null}
		</div>
	);
};

/**
 * Where the logo reveal left off: the lockup. "Frappe UI 1.0", as one, slides
 * into the mark and is gone at its edge, as the mark glides to the centre;
 * then the mark, alone, shrinks away as the title comes up in its place.
 */
const TEXT_W = 868; // "Frappe UI 1.0" in the lockup, with its padding (measured)
const Outro: React.FC<{frame: number}> = ({frame}) => {
	const p = prog(frame, 0, 30, inOut);
	const shrink = prog(frame, 24, 28, inOut);
	return (
		<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
			<div style={{position: 'absolute', inset: 0, background: PAPER.light, opacity: 1 - prog(frame, 28, 24)}} />
			<div style={{display: 'flex', alignItems: 'center', translate: `${(TEXT_W * p) / 2}px 0`}}>
				<div style={{position: 'relative', zIndex: 1, scale: String(1 - 0.55 * shrink), opacity: 1 - prog(frame, 34, 16), flexShrink: 0}}>
					<Mark size={150} />
				</div>
				{/* clipped at the mark's edge: the text goes in behind it */}
				<div style={{display: 'flex', flexShrink: 0, clipPath: `inset(-40px 0 -40px ${p * 100}%)`, translate: `${-p * 100}% 0`, opacity: p >= 0.999 ? 0 : 1}}>
					<div style={{...disp(150, 650), color: ink, whiteSpace: 'nowrap', paddingLeft: 40}}>Frappe UI</div>
					<div style={{...disp(150, 650), color: BRAND, whiteSpace: 'nowrap', paddingLeft: 36, paddingRight: 20}}>1.0</div>
				</div>
			</div>
		</div>
	);
};
