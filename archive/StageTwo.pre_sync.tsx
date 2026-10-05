import React from 'react';
import {useCurrentFrame} from '../lib/player';
import {Stage} from '../components/Stage';
import {cutIndex, inn, prog, spr} from '../lib/anim';
import {BRAND, code} from '../theme';
import G from '../../stage/src/wall/geometry.json';
import {Key, track} from './motion';
import {camera as stageOneCamera, Shot, STAGE_ONE_END} from './StageOne';
import {PAGE_H, PAGE_W} from './pageSize';
import {PAPER} from './tokens';

// ─── The page, laid on the canvas ────────────────────────────────────────
// The wall page (piece `wall`) pins the card's top left at CARD_AT; the
// canvas keeps it where stage one left it, at (60, 60).
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
const HOME_P = pageRect(0);
const CARD_W = 440;
const CARD_H = 243; // the finished card, measured
const CARD_AT = {x: HOME_P.x + (HOME_P.w - CARD_W) / 2, y: HOME_P.y + 62}; // as Wall.vue places it
export const PAGE = {x: CARD_AT.x - 60, y: CARD_AT.y - 60};
export {PAGE_H, PAGE_W};
/** A tile's box on the canvas. */
export const tileRect = (id: number): Rect => {
	const r = pageRect(id);
	return {...r, x: r.x - PAGE.x, y: r.y - PAGE.y};
};
const DC = {x: 60 + CARD_W / 2, y: 60 + CARD_H / 2}; // the card's centre, on the canvas

// ─── Timeline (scene frames) ─────────────────────────────────────────────
const ISO = 40; // tilted to the side, it rises through the six elevations
const FIRST = ISO + 40;
const STEP = 18;
const ISO_OUT = FIRST + STEP * 6 + 12; // back down, flat, at its own shadow-sm
const CARD = ISO_OUT + 62; // its tile draws in around it
const LEVEL = 36;
const COUNTS = [1, 2, 4, 8, 16, G.tiles.length];
const LEVEL_AT = COUNTS.map((_, l) => CARD + l * LEVEL);
export const STAGE_TWO_END = LEVEL_AT[LEVEL_AT.length - 1] + 108;

const ELEV = ['sm', 'base', 'md', 'lg', 'xl', '2xl'];
const RISE = [18, 40, 70, 106, 146, 196]; // height above the floor, canvas px

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
const FRONT: Shot = START; // where stage one leaves the card: no push in before the tilt
const levelShot = (l: number): Shot => {
	const b = bbox(ORDER.slice(0, COUNTS[l]));
	return {fx: b.x + b.w / 2, fy: b.y + b.h / 2, k: Math.min(1.6, 1760 / b.w, 960 / b.h), ax: 960, ay: 540};
};
const SHOTS: [number, Shot][] = [
	[0, START],
	[6, FRONT],
	[ISO, {...FRONT, k: 1.2, fy: DC.y - 60, ax: 1080}],
	[ISO_OUT, FRONT],
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
			// a short way out from the card, the way the grid grows
			const vx = r.x + r.w / 2 - DC.x;
			const vy = r.y + r.h / 2 - DC.y;
			const len = Math.hypot(vx, vy) || 1;
			return {id, dx: (-vx / len) * 40 * (1 - p), dy: (-vy / len) * 40 * (1 - p), o: frame < at ? 0 : Math.min(1, (frame - at) / 8), s: 0.97 + 0.03 * p};
		});

/**
 * Stage two. The card from stage one, the same camera. Tilted to the side,
 * it rises through the six elevations and comes back down at its own,
 * shadow-sm. Then it is one tile of a bento of real components, each at its
 * own size.
 */
export const StageTwo: React.FC = () => {
	const frame = useCurrentFrame();
	const cam = camera(frame);

	// elevation, seen from the side
	const tilt = spr(frame, ISO, 40, 0) * (1 - spr(frame, ISO_OUT, 40, 0));
	const step = frame < FIRST ? -1 : cutIndex(frame, ELEV.map((_, k) => FIRST + k * STEP));
	const from = step <= 0 ? 0 : RISE[step - 1];
	const to = step < 0 ? 0 : RISE[step];
	const z = (from + (to - from) * spr(frame, FIRST + Math.max(0, step) * STEP, 16, 0)) * tilt;
	const h = to / RISE[5];
	const listIn = prog(frame, ISO + 10, 16) * (1 - prog(frame, ISO_OUT + 30, 14, inn));
	const current = frame >= ISO_OUT ? 0 : step;

	const tiles = wallTiles(frame);
	const card = spr(frame, CARD, 26, 0);
	const a = 56 * tilt;
	const c = -38 * tilt;

	return (
		<div style={{position: 'absolute', inset: 0, background: PAPER.light, overflow: 'hidden'}}>
			{/* stage one's page (surface-base, white) gives way to the paper as the tiles come */}
			<div style={{position: 'absolute', inset: 0, background: '#fff', opacity: 1 - card}} />
			<div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${cam.ax - cam.fx * cam.k}px, ${cam.ay - cam.fy * cam.k}px) scale(${cam.k})`}}>
				<div style={{position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d', transformOrigin: `${DC.x}px ${DC.y}px`, transform: `rotateX(${a}deg) rotateZ(${c}deg)`}}>
					{tilt > 0.001 ? (
						<>
							{/* the floor, and the shadow the card casts on it */}
							<div style={{position: 'absolute', left: DC.x - 320, top: DC.y - 220, width: 640, height: 440, borderRadius: 40, border: `2px dashed ${BRAND}`, opacity: 0.4 * tilt}} />
							<div
								style={{
									position: 'absolute',
									left: DC.x - CARD_W / 2 + 10 + 20 * h,
									top: DC.y - CARD_H / 2 + 14 + 40 * h,
									width: CARD_W - 20 - 40 * h,
									height: CARD_H - 20 - 30 * h,
									borderRadius: 16,
									background: `rgba(0,0,0,${0.26 - 0.13 * h})`,
									filter: `blur(${6 + 40 * h}px)`,
									opacity: tilt * (step >= 0 ? 1 : 0),
								}}
							/>
						</>
					) : null}
					<div style={{position: 'absolute', left: -PAGE.x, top: -PAGE.y, transform: `translateZ(${z}px)`}}>
						<Stage piece="wall" width={PAGE_W} height={PAGE_H} p={{card, tiles}} />
					</div>
				</div>
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
