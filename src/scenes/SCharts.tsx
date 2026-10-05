import React from 'react';
import {Sequence, useCurrentFrame} from '../lib/player';
import {Bg} from '../components/Common';
import {Cursor} from '../components/Cursor';
import {Stage} from '../components/Stage';
import {Typed} from '../components/Typed';
import {BAR, BEAT, inOut, kf, prog} from '../lib/anim';
import {T} from '../theme';

// Part boundaries (scene frames)
const DASH = BAR * 1.25; // the dashboard, after the typed import
const Z = 1.25; // the page is laid out 1536 wide and scaled to the frame
const VIEW = 864; // page px the frame shows
const PAGE_H = 1920; // the whole page, taller than its content

// Dashboard beats (frames from DASH). A chart draws in within half a
// second (its own echarts intro); the cursor only reads a chart once it is in.
const GO = 0; // Revenue by plan draws in on the cut, camera close
const READ = 44; // the cursor reads three months
const PULL = BEAT * 4; // camera pulls back; every other chart draws in
const PULLED = PULL + 60;
const OFF = BEAT * 8; // donut legend: Organic search off
const ON = BEAT * 9.5; // and back on
const S1 = BEAT * 11.5; // scroll to the middle row
const S2 = BEAT * 15.5; // scroll to the bottom
const SCROLL1 = 410; // the middle row whole on screen
const SCROLL2 = 1040; // the bottom of the page

// Where the cards sit on the 1536-wide page, unscrolled (page px, measured
// once from the page). Everything the camera and cursor do is computed from
// these, never from a measurement taken at render time, so it cannot lag.
type Box = {x: number; y: number; w: number; h: number};
const CARDS: Record<string, Box> = {
	rev: {x: 32, y: 244.5, w: 976, h: 320},
	channels: {x: 1024, y: 244.5, w: 480, h: 320},
	funnel: {x: 528, y: 916.5, w: 480, h: 320},
};
const ORGANIC = {x: 1156, y: 512.5}; // Traffic by channel's "Organic search" legend item

/**
 * Charts. The import, typed. Then the charts docs' own dashboard, a real
 * page built from frappe-ui/charts: close on Revenue by plan as its bars
 * draw in, read with the real tooltip. The camera pulls back and every other
 * chart draws itself in; the donut is read, and a channel switched off and
 * on from its legend. The page scrolls, and each chart below draws in as it
 * arrives. The scene ends as the last scroll settles.
 */
export const SCharts: React.FC = () => {
	const frame = useCurrentFrame();
	const d = frame - DASH;
	const scroll = kf(d, [S1, S1 + 60, S2, S2 + 60], [0, SCROLL1, SCROLL1, SCROLL2], inOut);

	// Camera: close on Revenue by plan, then the whole page.
	const rev = {x: CARDS.rev.x * Z, y: CARDS.rev.y * Z, w: CARDS.rev.w * Z, h: CARDS.rev.h * Z};
	const SC = 1680 / rev.w;
	const close = 1 - prog(d, PULL, PULLED - PULL, inOut);
	const S = 1 + (SC - 1) * close;
	const tx = (960 - SC * (rev.x + rev.w / 2)) * close;
	const ty = (540 - SC * (rev.y + rev.h / 2)) * close;

	// page px (unscrolled) → screen px, at this frame's camera and scroll
	const screen = (p: {x: number; y: number}) => ({x: tx + S * Z * p.x, y: ty + S * Z * (p.y - scroll)});
	const at = (k: string, fx: number, fy: number) => {
		const b = CARDS[k];
		return screen({x: b.x + b.w * fx, y: b.y + b.h * fy});
	};
	const legend = () => screen(ORGANIC);

	// Cursor, in screen px. Keys are rebuilt each frame from where the
	// cards are now, so it stays on its chart through the camera move.
	const keys = [
		{f: 16, ...at('rev', 0.62, 1.25)},
		{f: READ, ...at('rev', 0.6, 0.5)},
		{f: READ + 40, ...at('rev', 0.68, 0.5)},
		{f: READ + 80, ...at('rev', 0.76, 0.5)},
		{f: PULLED + 20, ...at('channels', 0.36, 0.52)},
		{f: PULLED + 40, ...at('channels', 0.44, 0.3)}, // round the ring, not across the hole
		{f: PULLED + 58, ...at('channels', 0.65, 0.47)},
		{f: OFF - 4, ...legend()},
		{f: ON + 6, ...legend()},
		{f: ON + 36, ...at('channels', 0.62, 0.36)},
		{f: S1 - 8, ...at('channels', 0.66, 0.5)},
		{f: S1 + 80, ...at('funnel', 0.3, 0.62)},
		{f: S2 - 16, ...at('funnel', 0.62, 0.62)},
	].map((k) => ({...k, f: k.f + DASH}));
	const cur = {
		x: kf(frame, keys.map((k) => k.f), keys.map((k) => k.x), inOut),
		y: kf(frame, keys.map((k) => k.f), keys.map((k) => k.y), inOut),
	};
	// hover while reading a chart; not on the way to the legend or mid-scroll
	const reading =
		(d >= READ && d < PULL - 8) ||
		(d >= PULLED + 20 && d < OFF - 24) ||
		(d >= ON + 36 && d < S1) ||
		(d >= S1 + 80 && d < S2);
	// the same point on the page (the iframe holds the whole page)
	const hover = reading ? {x: (cur.x - tx) / S / Z, y: (cur.y - ty) / S / Z + scroll} : null;

	return (
		<Bg color={T.ramps.gray['100']}>
			{d < 0 ? (
				<Sequence layout="none">
					<Typed text={'import { BarChart } from "frappe-ui/charts"'} accent="frappe-ui/charts" rate={2.8} code />
				</Sequence>
			) : null}

			{/* mounted from the start so the page is loaded by its cut */}
			<div style={{position: 'absolute', inset: 0, opacity: d >= 0 ? 1 : 0, overflow: 'hidden', background: 'white'}}>
				<div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty - S * Z * scroll}px) scale(${S})`}}>
					<Stage
						piece="charts"
						zoom={Z}
						width={1920}
						height={PAGE_H * Z}
						p={{
							first: 'rev',
							go: d >= GO,
							reveal: d >= PULL,
							scroll,
							view: VIEW,
							off: d >= OFF && d < ON ? ['Organic search'] : [],
							hover,
						}}
					/>
				</div>
				{d >= 0 ? <Cursor keys={keys} clicks={[OFF + DASH, ON + DASH]} appear={DASH + 40} hide={DASH + S2} scale={1.3} /> : null}
			</div>
		</Bg>
	);
};
