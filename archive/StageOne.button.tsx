import React from 'react';
import {useCurrentFrame} from '../src/lib/player';
import {inn, inOut, prog, spr} from '../lib/anim';
import {Mark} from '../components/Hud';
import {BRAND, disp, ink, label, Mode, T} from '../theme';
import {Stage} from '../components/Stage';
import {Code, Line} from './Code';
import {CONTROL_Y, PAGE, RIGHT, SAVE_W, STACK_IDS, stackBox, stackOffset} from './dialog';
import {PAGE_H, PAGE_W} from './pageSize';
import {colorTrack, editTimes, Key, track, typedAt} from './motion';
import {HUES, inkT, inter, outline, PAPER, RADII, SHADOWS, STEPS, SURFACES, surface, TYPE_STEPS} from './tokens';

// ─── Timeline (scene frames, 60 fps) ─────────────────────────────────────
// The camera stays on the Button. It moves in once, to the corner for the
// radius, and out once, at the end, to every scale the Button was built from.
// The logo's lockup closes back into the mark, and the mark gives way to a
// single word: the button everything is built from.
const INTRO = 54;
const CODE_IN = 84; // <button class="">Save</button>
const L1_AT = 106; // h-7 px-2
const BORDER_AT = 132; // border border-outline-gray-2: now there is a box
const RAD_AT = 178; // into the corner
const RAD_STEPS = [190, 214, 230, 246]; // rounded-1, 2, 3, 4
const RAD_OUT = 280;
const TXT_AT = 300; // text-base
const INK_AT = 384; // text-ink-gray-8
const BG_AT = 428; // bg-surface-base
const COMPONENT = 508; // the classes fold into the component they make
const SUB_AT = COMPONENT + 52; // variant="subtle"
const SOLID_AT = COMPONENT + 110; // variant="solid"
export const WB = COMPONENT + 180; // the same system, other components: the camera eases back a little
const ATOM_AT = [WB + 30, WB + 50, WB + 70]; // three of the dialog's inputs arrive under the Button
const TOKENS: [string, number, string][] = [
	['h-7', WB + 100, 'e1'],
	['rounded-4', WB + 150, 'e1b'],
];
// then, all of it at once, in dark, and back: the last thing before the dialog
const DARK_AT = WB + 204;
const DARK_OFF = DARK_AT + 112;
export const STAGE_ONE_END = DARK_OFF + 64;

export const LINES: Line[] = [
	{id: 'open', frame: true, edits: [{at: CODE_IN, to: '<button class="', rate: 0}]},
	{id: 'l1', indent: 2, edits: [{at: L1_AT, to: 'h-7 px-2'}]},
	{id: 'l2', indent: 2, edits: [{at: BORDER_AT, to: 'border border-outline-gray-2', rate: 1.3}]},
	{
		id: 'l3',
		indent: 2,
		edits: [
			{at: RAD_STEPS[0], to: 'rounded-1', rate: 1.4},
			{at: RAD_STEPS[1], to: 'rounded-2'},
			{at: RAD_STEPS[2], to: 'rounded-3'},
			{at: RAD_STEPS[3], to: 'rounded-4'},
		],
	},
	{
		id: 'l4',
		indent: 2,
		edits: [
			{at: TXT_AT, to: 'text-base'},
			{at: INK_AT, to: 'text-base text-ink-gray-8'},
		],
	},
	{id: 'l5', indent: 2, edits: [{at: BG_AT, to: 'bg-surface-base'}]},
	{id: 'close', frame: true, edits: [{at: CODE_IN, to: '">Save</button>', rate: 0}]},
];
export const SPLIT = {line: 'close', after: '<button class="', at: L1_AT};
// …which, once it is an outline Button, is just that
export const LINES2: Line[] = [
	{id: 'html', accent: 'dark', edits: [{at: DARK_AT, to: '<html data-theme="dark">', rate: 1.8}, {at: DARK_OFF, to: '', del: 0.7}]},
	{
		id: 'comp',
		prefix: '<Button variant="',
		suffix: '">Save</Button>',
		edits: [
			{at: COMPONENT + 8, to: 'outline', rate: 0},
			{at: SUB_AT, to: 'subtle'},
			{at: SOLID_AT, to: 'solid'},
		],
	},
];
// …with the classes it stands for, rewritten as the variant changes
const VARIANT_DONE = (i: number, w: string) => typedAt(LINES2[1].edits, i, w) + 2;
LINES2.push(
	{id: 'e1', indent: 2, frame: true, edits: [{at: COMPONENT + 8, to: 'h-7 px-2', rate: 0}]},
	{id: 'e1b', indent: 2, frame: true, edits: [{at: COMPONENT + 8, to: 'rounded-4', rate: 0}]},
	{id: 'e1c', indent: 2, frame: true, edits: [{at: COMPONENT + 8, to: 'text-base', rate: 0}]},
	{
		id: 'e2',
		indent: 2,
		frame: true,
		edits: [
			{at: COMPONENT + 8, to: 'text-ink-gray-8 bg-surface-base', rate: 0},
			{at: VARIANT_DONE(1, 'subtle'), to: 'text-ink-gray-8 bg-surface-gray-2', rate: 1.2, del: 0.8},
			{at: VARIANT_DONE(2, 'solid'), to: 'text-ink-base bg-surface-gray-10', rate: 1.2, del: 0.8},
		],
	},
	{
		id: 'e3',
		indent: 2,
		frame: true,
		edits: [
			{at: COMPONENT + 8, to: 'border border-outline-gray-2', rate: 0},
			{at: VARIANT_DONE(1, 'subtle'), to: '', del: 0.4},
		],
	},
);
const ed = (id: string) => [...LINES, ...LINES2].find((l) => l.id === id)!.edits;

// Token effects land the moment their token is typed.
const H7 = typedAt(ed('l1'), 0, 'h-7') + 2;
const PX2 = typedAt(ed('l1'), 0, 'h-7 px-2') + 2;
const BORDER_C = typedAt(ed('l2'), 0, 'border border-outline-gray-2') + 2;
const RAD_DONE = RAD_STEPS.map((_, i) => typedAt(ed('l3'), i, `rounded-${i + 1}`) + 2);
const SWAP = typedAt(ed('l4'), 0, 'text-base') + 2;
const INK_DONE = typedAt(ed('l4'), 1, 'text-base text-ink-gray-8') + 2;
const BG_DONE = typedAt(ed('l5'), 0, 'bg-surface-base') + 2;
const SUB_DONE = typedAt(ed('comp'), 1, 'subtle') + 2;
const SOLID_DONE = typedAt(ed('comp'), 2, 'solid') + 2;
const WIPE = editTimes(ed('html'))[0].end + 4;
const WIPE_BACK = DARK_OFF + 6; // once "dark" is backspaced
const RING_AT = WB + 52;

// ─── The canvas ──────────────────────────────────────────────────────────
// Canvas units are the Button's own pixels; it sits at (0, 0). Every scale
// the Button is built from lies around it, off frame until the camera goes
// to it.
export const CODE_X = 120;
const RAD_Y = -120;
const RAD_X = -40;
const RAD_PITCH = 46;
const TYPE_X = 130;
const TYPE_Y = 8; // baseline
const INK_X = 130;
const INK_Y = 96;
const PAL_X = -40;
const PAL_Y = 160;
const PAL_PITCH = 25;
export const SH_X = 300;
export const SH_Y = 196;

export type Shot = {fx: number; fy: number; k: number; ax: number; ay: number};
const BTN: Shot = {fx: 0, fy: 0, k: 6, ax: 1290, ay: 540};
const OPEN: Shot = {...BTN, ax: 960};
const CORNER: Shot = {fx: -18.5, fy: -8, k: 16, ax: 1300, ay: 560};
const SHOTS: [number, Shot][] = [
	[0, OPEN],
	[CODE_IN - 4, BTN],
	[RAD_AT, CORNER],
	[RAD_OUT, BTN],
	[WB, {fx: 0, fy: -92, k: 2.6, ax: 1150, ay: 540}], // the Button, and the inputs above it
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

// Glyph widths of "Save" (1× px): the browser's Arial 13.33px, and Inter
// 14px at 420 plus text-base's 0.02em tracking.
const ARIAL = [8.891, 7.413, 6.665, 7.413];
const INTER = [8.944, 7.92, 7.82, 8.136].map((w) => w + 0.28);
const WORD = 'Save';

/** The Button, at this frame, in this theme. */
export const buttonAt = (frame: number, mode: Mode) => {
	const h = track(frame, [[0, 21.5], [H7, 28]], 22, 0.08);
	const padX = track(frame, [[0, 6], [PX2, 8]], 22, 0.08);
	const r = track(frame, [[0, 0], ...RAD_DONE.map((f, i): Key => [f, RADII[i + 1].r])], 14, 0);
	const letters = WORD.split('').map((_, i) => spr(frame, SWAP + i * 3, 18, 0));
	const widths = letters.map((p, i) => ARIAL[i] + (INTER[i] - ARIAL[i]) * Math.min(1, p));
	const textW = widths.reduce((a, b) => a + b, 0);
	// at first just the word: no fill, no border
	const bg = colorTrack(frame, [
		[0, PAPER[mode]],
		[BG_DONE, surface(mode, 'base')],
		[SUB_DONE, surface(mode, 'gray-2')],
		[SOLID_DONE, surface(mode, 'gray-10')],
	]);
	const fg = colorTrack(frame, [
		[0, '#000000'],
		[INK_DONE, inkT(mode, 'gray-8')],
		[SOLID_DONE, inkT(mode, 'base')],
	]);
	const bc = outline(mode, 'gray-2');
	const bw = spr(frame, BORDER_C, 16, 0) * (1 - spr(frame, SUB_DONE, 20, 0));
	const w = textW + padX * 2;
	return {h, padX, r, letters, widths, textW, bg, fg, bc, bw, w};
};

const TokenButton: React.FC<{frame: number; mode: Mode}> = ({frame, mode}) => {
	const b = buttonAt(frame, mode);
	let x = -b.textW / 2;
	return (
		<div
			style={{
				position: 'absolute',
				left: -b.w / 2,
				top: -b.h / 2,
				width: b.w,
				height: b.h,
				borderRadius: b.r,
				background: b.bg,
				boxShadow: b.bw > 0.01 ? `inset 0 0 0 ${b.bw}px ${b.bc}` : undefined,
			}}
		>
			{WORD.split('').map((ch, i) => {
				const p = b.letters[i];
				const left = x + b.w / 2;
				x += b.widths[i];
				return (
					<div key={i} style={{position: 'absolute', left, top: 0, width: b.widths[i], height: b.h, overflow: 'hidden', color: b.fg}}>
						{p < 0.999 ? (
							<span style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial', fontSize: 13.333, translate: `0 ${-p * 100}%`}}>
								{ch}
							</span>
						) : null}
						{p > 0.001 ? (
							<span
								style={{
									position: 'absolute',
									inset: 0,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									...inter(14),
									letterSpacing: 0,
									translate: `0 ${(1 - p) * 100}%`,
								}}
							>
								{ch}
							</span>
						) : null}
					</div>
				);
			})}
		</div>
	);
};

// ─── Scales ──────────────────────────────────────────────────────────────
/** Pops in, on a stagger, once the camera arrives. */
const pop = (frame: number, at: number, i: number, step = 3) => spr(frame, at + i * step, 22, 0.2);

const Ring: React.FC<{frame: number; at: number; x: number; y: number; w: number; h: number; r: number}> = ({frame, at, x, y, w, h, r}) => {
	const p = spr(frame, at, 20, 0.3);
	if (p <= 0) return null;
	const s = 1.25 - 0.25 * p;
	return (
		<div
			style={{
				position: 'absolute',
				left: x - 4,
				top: y - 4,
				width: w + 8,
				height: h + 8,
				borderRadius: r + 4,
				boxShadow: `0 0 0 1.5px ${BRAND}`,
				opacity: Math.min(1, p * 1.5),
				scale: String(s),
			}}
		/>
	);
};

export const Scales: React.FC<{frame: number; mode: Mode; fade?: number; shadowPick?: number; shadowFade?: number}> = ({frame, mode, fade = 1, shadowPick, shadowFade = 1}) => {
	const dimAfter = (_at: number) => 1;
	const radIn = WB + 10;
	const typeIn = WB + 16;
	const inkIn = WB + 22;
	const palIn = WB + 12;
	const shIn = WB + 28;
	const RAD_PICK = RING_AT;
	const TXT_PICK = RING_AT + 5;
	const INK_PICK = RING_AT + 10;
	const BG_PICK = RING_AT + 15;
	return (
		<>
			<div style={{opacity: fade}}>
			{/* radius */}
			{RADII.map((rd, i) => {
				const p = pop(frame, radIn, i);
				const picked = i === 4;
				return (
					<div
						key={rd.k}
						style={{
							position: 'absolute',
							left: RAD_X + i * RAD_PITCH,
							top: RAD_Y - 15,
							width: 30,
							height: 30,
							borderRadius: Math.min(rd.r, 15),
							background: surface(mode, 'base'),
							boxShadow: `inset 0 0 0 1px ${outline(mode, 'gray-3')}`,
							opacity: Math.min(1, p * 1.5) * (picked ? 1 : dimAfter(RAD_PICK)),
							scale: String(0.6 + 0.4 * p),
						}}
					/>
				);
			})}
			<Ring frame={frame} at={RAD_PICK} x={RAD_X + 4 * RAD_PITCH} y={RAD_Y - 15} w={30} h={30} r={8} />

			{/* type */}
			{(() => {
				let x = TYPE_X;
				return TYPE_STEPS.map((t, i) => {
					const w = t.size * 1.32;
					const left = x;
					x += w + 16;
					const p = pop(frame, typeIn, i);
					const picked = t.k === 'base';
					return (
						<React.Fragment key={t.k}>
							<div
								style={{
									position: 'absolute',
									left,
									top: TYPE_Y - t.size,
									width: w,
									height: t.size * 1.35,
									...inter(t.size, 420, t.tracking),
									lineHeight: 1,
									color: inkT(mode, 'gray-8'),
									opacity: Math.min(1, p * 1.5) * (picked ? 1 : dimAfter(TXT_PICK)),
									translate: `0 ${(1 - p) * 6}px`,
								}}
							>
								Aa
							</div>
							{picked ? <Ring frame={frame} at={TXT_PICK} x={left - 2} y={TYPE_Y - t.size - 2} w={w + 4} h={t.size + 4} r={4} /> : null}
						</React.Fragment>
					);
				});
			})()}

			{/* ink */}
			{Array.from({length: 9}, (_, i) => {
				const p = pop(frame, inkIn, i, 2);
				const picked = i === 7;
				return (
					<React.Fragment key={i}>
						<div
							style={{
								position: 'absolute',
								left: INK_X + i * 34,
								top: INK_Y - 12,
								width: 28,
								height: 24,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								...inter(18, 500, 0),
								color: inkT(mode, `gray-${i + 1}`),
								opacity: Math.min(1, p * 1.5) * (picked ? 1 : dimAfter(INK_PICK)),
								translate: `0 ${(1 - p) * 6}px`,
							}}
						>
							Aa
						</div>
						{picked ? <Ring frame={frame} at={INK_PICK} x={INK_X + i * 34} y={INK_Y - 12} w={28} h={24} r={4} /> : null}
					</React.Fragment>
				);
			})}

			{/* the palette; its gray row is the surfaces a page is painted with */}
			{HUES.map((hue, row) =>
				STEPS.map((st, col) => {
					const p = pop(frame, palIn, row + col * 0.35, 1.5);
					const gray = hue === 'gray';
					const c = gray ? surface(mode, SURFACES[col]) : (mode === 'light' ? T.ramps : T.rampsDark)[hue][st];
					const dim = 1;
					return (
						<div
							key={`${hue}-${st}`}
							style={{
								position: 'absolute',
								left: PAL_X + col * PAL_PITCH,
								top: PAL_Y + row * PAL_PITCH,
								width: 20,
								height: 20,
								borderRadius: 5,
								background: c,
								boxShadow: gray && col < 3 ? `inset 0 0 0 1px ${outline(mode, 'gray-2')}` : undefined,
								opacity: Math.min(1, p * 1.5) * dim * 1,
								scale: String(0.5 + 0.5 * p),
							}}
						/>
					);
				}),
			)}
			<Ring frame={frame} at={BG_PICK} x={PAL_X} y={PAL_Y} w={20} h={20} r={5} />

			</div>
			{/* elevation: shown on the workbench, used in the dialog */}
			<div style={{opacity: shadowFade}}>
			{SHADOWS.map((s, i) => {
				const p = pop(frame, shIn, i, 4);
				return (
					<div
						key={s}
						style={{
							position: 'absolute',
							left: SH_X + (i % 3) * 62,
							top: SH_Y + Math.floor(i / 3) * 56,
							width: 42,
							height: 30,
							borderRadius: 6,
							background: surface(mode, 'base'),
							boxShadow: T.shadows[s],
							opacity: Math.min(1, p * 1.5) * (shadowPick === undefined || s === 'xl' ? 1 : 1 - 0.6 * spr(frame, shadowPick, 20, 0)),
							scale: String(0.7 + 0.3 * p),
						}}
					/>
				);
			})}
			{shadowPick !== undefined ? <Ring frame={frame} at={shadowPick} x={SH_X + 62} y={SH_Y + 56} w={42} h={30} r={6} /> : null}
			</div>
		</>
	);
};

// ─── Annotations (screen space, so type stays one size) ──────────────────
const PURPLE = BRAND;

const Guides: React.FC<{frame: number; cam: Shot}> = ({frame, cam}) => {
	const b = buttonAt(frame, 'light');
	const S = (x: number, y: number) => toScreen(cam, x, y);
	const tl = S(-b.w / 2, -b.h / 2);
	const br = S(b.w / 2, b.h / 2);
	const hIn = spr(frame, H7 + 4, 20, 0) * (1 - spr(frame, RAD_AT - 6, 12, 0));
	const pIn = spr(frame, PX2 + 4, 20, 0) * (1 - spr(frame, RAD_AT - 6, 12, 0));
	// radius construction on the corner close-up
	const rIn = spr(frame, RAD_DONE[0], 16, 0) * (1 - spr(frame, RAD_OUT - 6, 12, 0));
	const step = RAD_DONE.reduce((k, f, i) => (frame >= f ? i : k), 0);
	const c = S(-b.w / 2 + b.r, -b.h / 2 + b.r);
	const rr = b.r * cam.k;
	// type measured
	const mIn = spr(frame, SWAP + 20, 20, 0) * (1 - spr(frame, INK_AT - 4, 12, 0));
	const lineTop = S(0, -14 * 0.675);
	const lineBot = S(0, 14 * 0.675);
	const emTop = S(0, -7);
	const emBot = S(0, 7);
	const textL = S(-b.textW / 2, 0).x;
	const textR = S(b.textW / 2, 0).x;
	return (
		<div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
			{hIn > 0.01 ? <VDim x={br.x + 40} y1={tl.y} y2={br.y} text="28" p={hIn} /> : null}
			{pIn > 0.01 ? (
				<>
					{[tl.x, br.x - 8 * cam.k].map((x, i) => (
						<div key={i} style={{position: 'absolute', left: x, top: tl.y, width: 8 * cam.k, height: br.y - tl.y, background: PURPLE, opacity: 0.18 * pIn}} />
					))}
					<HDim x1={tl.x} x2={tl.x + 8 * cam.k} y={br.y + 40} text="8" p={pIn} />
				</>
			) : null}
			{rIn > 0.01 ? (
				<>
					<div
						style={{
							position: 'absolute',
							left: c.x - rr,
							top: c.y - rr,
							width: rr * 2,
							height: rr * 2,
							borderRadius: 9999,
							border: `2px dashed ${PURPLE}`,
							opacity: 0.85 * rIn,
						}}
					/>
					<div style={{position: 'absolute', left: c.x, top: c.y, width: rr, height: 2, background: PURPLE, rotate: '-135deg', transformOrigin: '0 50%', opacity: rIn}} />
					<div style={{position: 'absolute', left: c.x - 7, top: c.y - 7, width: 14, height: 14, borderRadius: 9, background: PURPLE, opacity: rIn}} />
					<div style={{position: 'absolute', left: c.x - rr * 0.72 - 24, top: c.y - rr * 0.72 - 24, translate: '-100% -100%', ...label(40, PURPLE), opacity: rIn}}>{RADII[step + 1].r}px</div>
				</>
			) : null}
			{mIn > 0.01 ? (
				<>
					{[lineTop.y, lineBot.y].map((y, i) => (
						<div key={i} style={{position: 'absolute', left: textL - 60, width: textR - textL + 120, top: y, borderTop: `2px dashed ${PURPLE}`, opacity: 0.8 * mIn}} />
					))}
					<div style={{position: 'absolute', left: br.x + 36, top: (lineTop.y + lineBot.y) / 2 - 22, ...label(32, PURPLE), opacity: mIn}}>1.35</div>
					<VDim x={tl.x - 40} y1={emTop.y} y2={emBot.y} text="14" p={mIn} left />
					{/* the space each letter gets after it */}
					{(() => {
						let x = -b.textW / 2;
						return b.widths.slice(0, 3).map((w, i) => {
							x += w;
							const s = S(x - 0.28, 0);
							return <div key={i} style={{position: 'absolute', left: s.x, top: emTop.y + 10, width: Math.max(2, 0.28 * cam.k), height: emBot.y - emTop.y - 20, background: PURPLE, opacity: 0.9 * mIn}} />;
						});
					})()}
					<div style={{position: 'absolute', left: (textL + textR) / 2, top: tl.y - 64, translate: '-50% 0', ...label(32, PURPLE), opacity: mIn}}>0.02em</div>
				</>
			) : null}
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
	const codeIn = spr(frame, CODE_IN, 22, 0);
	return (
		<div style={{position: 'absolute', inset: 0, background: PAPER[mode], overflow: 'hidden'}}>
			<div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${cam.ax - cam.fx * cam.k}px, ${cam.ay - cam.fy * cam.k}px) scale(${cam.k})`}}>
				{frame >= WB - 90 ? <SystemAtoms frame={frame} mode={mode} /> : null}
				<TokenButton frame={frame} mode={mode} />
			</div>
			{mode === 'light' ? <Guides frame={frame} cam={cam} /> : null}
			{mode === 'light' && frame >= TOKENS[0][1] ? <SystemGuides frame={frame} cam={cam} /> : null}
			<div style={{position: 'absolute', inset: 0, opacity: codeIn, translate: `${(1 - codeIn) * -24}px 0`}}>
				<StageOneCode frame={frame} dark={mode === 'dark'} />
			</div>
		</div>
	);
};

/**
 * The code: the class list, token by token; then, once those classes make
 * frappe-ui's outline Button, the list folds away and the component takes
 * its place, a single prop to change.
 */
export const StageOneCode: React.FC<{frame: number; dark?: boolean}> = ({frame, dark}) => {
	const out = prog(frame, COMPONENT, 16, inn);
	const inP = spr(frame, COMPONENT + 8, 22, 0);
	return (
		<>
			{out < 1 ? (
				<Code frame={frame} lines={LINES} x={CODE_X} cy={540} dark={dark} split={SPLIT} style={{opacity: 1 - out, translate: `0 ${-40 * out}px`}} />
			) : null}
			{frame >= COMPONENT + 8 ? <Code frame={frame} lines={withToken(frame)} x={CODE_X} cy={540} dark={dark} allBright={WB} style={{opacity: inP, translate: `0 ${24 * (1 - inP)}px`}} /> : null}
		</>
	);
};

// ─── The same system, other components ───────────────────────────────────
/** Which shared token is being pointed at, if any. */
const tokenAt = (frame: number) => {
	for (const [t, f, line] of TOKENS) if (frame >= f && frame < f + 46) return {t, f, line};
	return null;
};
const withToken = (frame: number): Line[] => {
	const tk = tokenAt(frame);
	return tk ? LINES2.map((l) => (l.id === tk.line ? {...l, accent: tk.t} : l)) : LINES2;
};

/** The stack's pieces: offsets and opacity, as the wall piece takes them. */
export const stackAtoms = (frame: number) => {
	const atoms: Record<string, {x: number; y: number; o: number; s?: number}> = {};
	for (const id of ['title', 'x', 'switch', 'website', 'revenue', 'employees', 'owner', 'probability']) atoms[id] = {x: 0, y: 0, o: 0};
	STACK_IDS.forEach((id, i) => {
		// nearest the Button first, building up; each settles down from just above
		const at = ATOM_AT[STACK_IDS.length - 1 - i];
		const p = spr(frame, at, 30, 0.12);
		const off = stackOffset(id);
		atoms[id] = {x: off.x, y: off.y - 14 * (1 - p), o: frame < at ? 0 : Math.min(1, (frame - at) / 8)};
	});
	return atoms;
};

/** Three of the dialog's own inputs, above the Button (the real ones, from the stage). */
const SystemAtoms: React.FC<{frame: number; mode: Mode}> = ({frame, mode}) => (
	<div style={{position: 'absolute', left: -PAGE.x, top: -PAGE.y}}>
		<Stage piece="wall" theme={mode} width={PAGE_W} height={PAGE_H} p={{dialog: {atoms: stackAtoms(frame), shell: 0, shadow: 'none', createReal: false}, card: 0, tiles: []}} />
	</div>
);

/**
 * The token in the code, lit, and what it does on every component at once:
 * the height of each, its corner, its type.
 */
const SystemGuides: React.FC<{frame: number; cam: Shot}> = ({frame, cam}) => {
	const tk = tokenAt(frame);
	if (!tk) return null;
	const p = spr(frame, tk.f, 18, 0) * (1 - prog(frame, tk.f + 36, 10, inn));
	const S = (x: number, y: number) => toScreen(cam, x, y);
	// every control: the Button, then the three inputs
	const ctl = [{x: -RIGHT, y: -14, w: SAVE_W, h: 28}, ...STACK_IDS.map((_, i) => ({...stackBox(i), y: stackBox(i).y + CONTROL_Y, h: 28}))];
	const markers = ctl.map((c, i) => {
		const tl = S(c.x, c.y);
		const br = S(c.x + c.w, c.y + c.h);
		if (tk.t === 'h-7')
			return (
				<div key={i} style={{position: 'absolute', left: br.x + 16, top: tl.y, width: 3, height: (br.y - tl.y) * p, background: BRAND}}>
					<div style={{position: 'absolute', left: -7, top: -1.5, width: 17, height: 3, background: BRAND}} />
					<div style={{position: 'absolute', left: -7, bottom: -1.5, width: 17, height: 3, background: BRAND}} />
				</div>
			);
		if (tk.t === 'rounded-4') {
			// the corner itself: the arc sits on the control's edge, radius 8
			const r = 8 * cam.k;
			return <div key={i} style={{position: 'absolute', left: tl.x, top: tl.y, width: r + 16, height: r + 16, borderTopLeftRadius: r, borderTop: `3px solid ${BRAND}`, borderLeft: `3px solid ${BRAND}`, opacity: p}} />;
		}
		return <div key={i} style={{position: 'absolute', left: tl.x + 8 * cam.k, top: (tl.y + br.y) / 2 + 7 * cam.k * 0.78, width: (c.w > 100 ? 86 : c.w - 16) * cam.k * p, height: 3, background: BRAND}} />;
	});
	// the value, once, beside the Button
	const btn = S(ctl[0].x + ctl[0].w, ctl[0].y + ctl[0].h / 2);
	const lbl = tk.t === 'h-7' ? '28' : tk.t === 'rounded-4' ? '8px' : '14 / 1.35';
	return (
		<div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
			{markers}
			<div style={{position: 'absolute', left: btn.x + 64, top: btn.y, translate: '0 -50%', ...label(30, BRAND), opacity: p, whiteSpace: 'nowrap'}}>{lbl}</div>
		</div>
	);
};

/**
 * Stage one. The browser's own button, pressed. Then one class at a time
 * until it is frappe-ui's outline Button; the classes fold into the
 * component, and one prop makes it subtle, then solid; one attribute makes
 * it dark without touching anything else. The camera pulls back to every
 * scale it was built from.
 */
export const StageOne: React.FC = () => {
	const frame = useCurrentFrame();
	// dark sweeps in from the left; once "dark" is deleted, it goes back the
	// way it came, light returning from the right
	const inX = 1920 * prog(frame, WIPE, 40, inOut);
	const outX = 1920 * prog(frame, WIPE_BACK, 36, inOut);
	return (
		<div style={{position: 'absolute', inset: 0}}>
			<World frame={frame} mode="light" />
			{frame < INTRO ? <Outro frame={frame} /> : null}
			{/* mounted a while before it shows, so its inputs are loaded by the sweep */}
			{frame >= WB - 90 && frame < WIPE_BACK + 40 ? (
				// hidden outright until the sweep (not just clipped): a loading iframe can paint a frame before its clip applies
				<div style={{position: 'absolute', inset: 0, opacity: inX > 0 ? 1 : 0, clipPath: `inset(0 ${Math.min(1920, 1920 - inX + outX)}px 0 0)`}}>
					<World frame={frame} mode="dark" />
				</div>
			) : null}
		</div>
	);
};

/**
 * Where the logo reveal left off: the lockup. "1.0" and the name close back
 * into the mark (the opening, in reverse), and the mark, alone and centred,
 * shrinks away as the word "Save" comes up in its place.
 */
const Outro: React.FC<{frame: number}> = ({frame}) => {
	const name = 1 - prog(frame, 4, 26, inOut);
	const ver = 1 - prog(frame, 0, 22, inOut);
	const shrink = prog(frame, 20, 30, inOut);
	return (
		<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: PAPER.light}}>
			<div style={{scale: String(1 - 0.55 * shrink), opacity: 1 - prog(frame, 32, 18), flexShrink: 0}}>
				<Mark size={150} />
			</div>
			<div style={{maxWidth: 820 * name, overflow: 'hidden', paddingBottom: 30, marginBottom: -30, flexShrink: 0}}>
				<div style={{...disp(150, 650), color: ink, whiteSpace: 'nowrap', paddingLeft: 40, translate: `${(1 - name) * -120}px 0`, opacity: Math.min(1, name * 1.5)}}>Frappe UI</div>
			</div>
			<div style={{maxWidth: 320 * ver, overflow: 'hidden', paddingBottom: 30, marginBottom: -30, flexShrink: 0}}>
				<div style={{...disp(150, 650), color: BRAND, whiteSpace: 'nowrap', paddingLeft: 36, translate: `${(1 - ver) * 140}px 0`, opacity: Math.min(1, ver * 1.5)}}>1.0</div>
			</div>
		</div>
	);
};
