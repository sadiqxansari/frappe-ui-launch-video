import React from 'react';
import {useCurrentFrame} from '../src/lib/player';
import {Stage} from '../components/Stage';
import {cutIndex, inn, prog, spr} from '../lib/anim';
import {BRAND, code, T} from '../theme';
import G from '../../stage/src/wall/geometry.json';
import {Key, track} from './motion';
import {camera as stageOneCamera, Shot, STAGE_ONE_END, stackAtoms, StageOneCode} from './StageOne';
import {CREATE_W, PAGE, RIGHT, SAVE_W, STACK_IDS} from './dialog';
import {PAGE_H, PAGE_W} from './pageSize';
import {inkT, inter, PAPER, surface} from './tokens';

// ─── The page, laid on the canvas (see dialog.ts) ────────────────────────
type Rect = {x: number; y: number; w: number; h: number};
const pageRect = (id: number): Rect => {
	const t = G.tiles[id];
	return {
		x: G.margin + t.c * (G.unitW + G.gap),
		y: G.margin + t.r * (G.unitH + G.gap),
		w: t.w * G.unitW + (t.w - 1) * G.gap,
		h: t.h * G.unitH + (t.h - 1) * G.gap,
	};
};
export {PAGE, PAGE_H, PAGE_W};
const HOME_P = pageRect(0);
const DC_P = {x: HOME_P.x + HOME_P.w / 2, y: HOME_P.y + HOME_P.h / 2};
/** A tile's box on the canvas. */
export const tileRect = (id: number): Rect => {
	const r = pageRect(id);
	return {...r, x: r.x - PAGE.x, y: r.y - PAGE.y};
};
const DC = {x: DC_P.x - PAGE.x, y: DC_P.y - PAGE.y}; // the dialog's centre, on the canvas

// ─── Timeline (scene frames) ─────────────────────────────────────────────
const ATOMS_AT = 10; // one piece at a time, each put in with the lightest spring
const ATOM_STEP = 13;
const ROLL = 136; // Save → Create
const SHELL = 186; // the dialog's surface opens from the Create button's corner
const ISO = 232; // tilted to the side, it rises through the six elevations
const HANDOVER = ISO; // the film's Button gives way to the page's own
const FIRST = ISO + 40;
const STEP = 18;
const ISO_OUT = FIRST + STEP * 6 + 12; // back down, flat, at shadow-xl (the Dialog's own)
const CARD = ISO_OUT + 62; // it goes back into the grid
const LEVEL = 36;
const COUNTS = [1, 2, 4, 8, 16, G.tiles.length];
const LEVEL_AT = COUNTS.map((_, l) => CARD + l * LEVEL);
export const STAGE_TWO_END = LEVEL_AT[LEVEL_AT.length - 1] + 108;

const ELEV = ['sm', 'base', 'md', 'lg', 'xl', '2xl'];
const RISE = [18, 40, 70, 106, 146, 196]; // height above the floor, canvas px

// The pieces, in the order they are put in. The three from stage one lead,
// moving from under the Button to their places; the camera follows them out.
// The top one goes first, so none crosses another; the rest fill in around
// them from the bottom up, the title last.
const ATOMS = ['org', 'status', 'close', 'probability', 'owner', 'employees', 'revenue', 'website', 'switch', 'title', 'x'];

// Tiles arrive nearest first; level l shows the first COUNTS[l].
const dist = (id: number) => {
	const r = tileRect(id);
	return Math.hypot(r.x + r.w / 2 - DC.x, (r.y + r.h / 2 - DC.y) * 1.4);
};
const ORDER = G.tiles.map((_, id) => id).sort((a, b) => dist(a) - dist(b));
const levelOf = (id: number) => COUNTS.findIndex((n) => ORDER.indexOf(id) < n);

const bbox = (ids: number[]) => {
	const rs = ids.map(tileRect);
	const x0 = Math.min(...rs.map((r) => r.x));
	const y0 = Math.min(...rs.map((r) => r.y));
	const x1 = Math.max(...rs.map((r) => r.x + r.w));
	const y1 = Math.max(...rs.map((r) => r.y + r.h));
	return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
};

// ─── Camera ──────────────────────────────────────────────────────────────
const START = stageOneCamera(STAGE_ONE_END);
const DIALOG: Shot = {fx: DC.x, fy: DC.y, k: 1.72, ax: 960, ay: 540};
const levelShot = (l: number): Shot => {
	const b = bbox(ORDER.slice(0, COUNTS[l]));
	return {fx: b.x + b.w / 2, fy: b.y + b.h / 2, k: Math.min(1.6, 1760 / b.w, 960 / b.h), ax: 960, ay: 540};
};
const SHOTS: [number, Shot][] = [
	[0, START],
	[ATOMS_AT + 6, DIALOG], // it follows the three pieces out
	[ISO, {...DIALOG, k: 1.05, fy: DC.y - 60, ax: 1080}],
	[ISO_OUT, DIALOG],
	...LEVEL_AT.map((f, l): [number, Shot] => [f, levelShot(l)]),
];
export const camera = (frame: number): Shot => {
	const keys = (get: (s: Shot) => number): Key[] => SHOTS.map(([f, s]) => [f, get(s)]);
	const dur = 44;
	return {
		fx: track(frame, keys((s) => s.fx), dur),
		fy: track(frame, keys((s) => s.fy), dur),
		k: Math.exp(track(frame, keys((s) => Math.log(s.k)), dur)),
		ax: track(frame, keys((s) => s.ax), dur),
		ay: track(frame, keys((s) => s.ay), dur),
	};
};

/** A multi-part box-shadow with every length and alpha scaled by `k`. */
const scaleShadow = (s: string, k: number) =>
	s
		.replace(/(-?[\d.]+)px/g, (_, n) => `${(Number(n) * k).toFixed(2)}px`)
		.replace(/#([0-9a-f]{6})([0-9a-f]{2})/gi, (_, rgb, a) => `#${rgb}${Math.round(parseInt(a, 16) * Math.min(1, k)).toString(16).padStart(2, '0')}`);

// ─── The film's Button, now the Create button ────────────────────────────
const LabelButton: React.FC<{frame: number}> = ({frame}) => {
	const p = spr(frame, ROLL, 22, 0);
	const w = SAVE_W + (CREATE_W - SAVE_W) * p;
	const word = (text: string, y: number) => (
		<span style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', ...inter(14), translate: `0 ${y}%`}}>{text}</span>
	);
	return (
		<div
			style={{
				position: 'absolute',
				left: RIGHT - w,
				top: -14,
				width: w,
				height: 28,
				borderRadius: 8,
				overflow: 'hidden',
				background: surface('light', 'gray-10'),
				color: inkT('light', 'base'),
			}}
		>
			{p < 0.999 ? word('Save', -p * 100) : null}
			{p > 0.001 ? word('Create', (1 - p) * 100) : null}
		</div>
	);
};

/** Every tile on screen at this frame. */
export const wallTiles = (frame: number) =>
	G.tiles
		.map((_, id) => id)
		.filter((id) => frame >= LEVEL_AT[levelOf(id)])
		.map((id) => {
			if (id === 0) return {id, dx: 0, dy: 0, o: 1, s: 1};
			const l = levelOf(id);
			const at = LEVEL_AT[l] + (ORDER.indexOf(id) - COUNTS[l - 1]) * 3;
			const p = spr(frame, at, 24, 0);
			const r = tileRect(id);
			// a short way out from the dialog, the way the grid grows
			const vx = r.x + r.w / 2 - DC.x;
			const vy = r.y + r.h / 2 - DC.y;
			const len = Math.hypot(vx, vy) || 1;
			return {id, dx: (-vx / len) * 40 * (1 - p), dy: (-vy / len) * 40 * (1 - p), o: frame < at ? 0 : Math.min(1, (frame - at) / 8), s: 0.97 + 0.03 * p};
		});

/**
 * Stage two. The same Button, the same camera. Real frappe-ui pieces drift
 * in and settle into CRM's Create Deal dialog around it; the Button becomes
 * its Create. Tilted to the side, the dialog rises through the six
 * elevations and comes back down at the Dialog's own. Then it is one tile of
 * a bento of real components, each at its own size.
 */
export const StageTwo: React.FC = () => {
	const frame = useCurrentFrame();
	const cam = camera(frame);

	// the dialog
	const atoms = stackAtoms(STAGE_ONE_END + frame);
	ATOMS.forEach((id, i) => {
		const at = ATOMS_AT + i * ATOM_STEP;
		const p = spr(frame, at, 30, 0.12);
		if (STACK_IDS.includes(id)) {
			// an arc: out to the side first, then up, clear of the Button
			const s0 = atoms[id];
			const px = spr(frame, at, 40, 0.12);
			const py = spr(frame, at + 10, 40, 0.12);
			atoms[id] = {x: s0.x * (1 - px), y: s0.y * (1 - py), o: 1};
		} else atoms[id] = {x: 0, y: 12 * (1 - p), o: frame < at ? 0 : Math.min(1, (frame - at) / 8)};
	});
	const shell = spr(frame, SHELL, 26, 0);

	// elevation, seen from the side
	const tilt = spr(frame, ISO, 40, 0) * (1 - spr(frame, ISO_OUT, 40, 0));
	const step = frame < FIRST ? -1 : cutIndex(frame, ELEV.map((_, k) => FIRST + k * STEP));
	const from = step <= 0 ? 0 : RISE[step - 1];
	const to = step < 0 ? 0 : RISE[step];
	const z = (from + (to - from) * spr(frame, FIRST + Math.max(0, step) * STEP, 16, 0)) * tilt;
	const h = to / RISE[5];
	// as it flattens, the shadow on the floor hands over to the Dialog's own
	// shadow-xl, frame for frame, so it is never without one (settled, it is
	// the Dialog's own token, --elevation-xl, which T.shadows.xl copies)
	// …until its tile draws in around it, where a border takes over
	const lift = (frame >= ISO_OUT ? 1 - tilt : 0) * (1 - spr(frame, CARD, 26, 0));
	const border = spr(frame, CARD, 26, 0);
	const listIn = prog(frame, ISO + 10, 16) * (1 - prog(frame, ISO_OUT + 30, 14, inn));
	const current = frame >= ISO_OUT ? 4 : step;

	const tiles = wallTiles(frame);
	const card = spr(frame, CARD, 26, 0);
	const codeOut = prog(frame, 0, 18, inn);
	const a = 56 * tilt;
	const c = -38 * tilt;

	return (
		<div style={{position: 'absolute', inset: 0, background: PAPER.light, overflow: 'hidden'}}>
			<div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${cam.ax - cam.fx * cam.k}px, ${cam.ay - cam.fy * cam.k}px) scale(${cam.k})`}}>
				<div style={{position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d', transformOrigin: `${DC.x}px ${DC.y}px`, transform: `rotateX(${a}deg) rotateZ(${c}deg)`}}>
					{tilt > 0.001 ? (
						<>
							{/* the floor, and the shadow the dialog casts on it */}
							<div style={{position: 'absolute', left: DC.x - 380, top: DC.y - 330, width: 760, height: 660, borderRadius: 40, border: `2px dashed ${BRAND}`, opacity: 0.4 * tilt}} />
							<div
								style={{
									position: 'absolute',
									left: DC.x - 256 + 10 + 20 * h,
									top: DC.y - 230 + 14 + 40 * h,
									width: 512 - 20 - 40 * h,
									height: 460 - 20 - 30 * h,
									borderRadius: 16,
									background: `rgba(0,0,0,${0.26 - 0.13 * h})`,
									filter: `blur(${6 + 40 * h}px)`,
									opacity: tilt * (step >= 0 ? 1 : 0),
								}}
							/>
						</>
					) : null}
					<div style={{position: 'absolute', left: -PAGE.x, top: -PAGE.y, transform: `translateZ(${z}px)`}}>
						<Stage
							piece="wall"
							width={PAGE_W}
							height={PAGE_H}
							p={{
								dialog: {atoms, shell, shadow: lift >= 0.999 ? 'var(--elevation-xl)' : lift > 0.001 ? scaleShadow(T.shadows.xl, lift) : 'none', border, createReal: frame >= HANDOVER},
								card,
								tiles,
							}}
						/>
					</div>
				</div>
				{frame < HANDOVER ? <LabelButton frame={frame} /> : null}
			</div>
			<div style={{position: 'absolute', inset: 0, opacity: 1 - codeOut, translate: `${-80 * codeOut}px 0`}}>
				<StageOneCode frame={STAGE_ONE_END} />
			</div>
			{/* the six elevations, the one in use lit */}
			{listIn > 0.001 ? (
				<div style={{position: 'absolute', left: 120, top: 380, display: 'flex', flexDirection: 'column', gap: 18, opacity: listIn}}>
					{ELEV.map((e, k) => (
						<div key={e} style={{...code(34, k === current ? BRAND : 'rgba(0,0,0,0.28)')}}>{`shadow-${e}`}</div>
					))}
				</div>
			) : null}
		</div>
	);
};
