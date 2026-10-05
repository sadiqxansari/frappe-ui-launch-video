import React from 'react';
import {spr} from '../lib/anim';
import {BRAND, MONO} from '../theme';
import {Edit, editTimes, lineAt} from './motion';

export const CODE_SIZE = 36;
export const CH = CODE_SIZE * 0.6; // JetBrains Mono advance
export const LH = CODE_SIZE * 1.5;

export type Line = {
	id: string;
	edits: Edit[];
	indent?: number;
	/** wrapper lines (the tag itself) never light up */
	frame?: boolean;
	/** colour a substring (e.g. "dark") in the brand colour */
	accent?: string;
	/** fixed text either side of the edited part (the caret sits after the edit) */
	prefix?: string;
	suffix?: string;
};

/** When a line was last touched: the start of its latest edit at or before `frame`. */
const touched = (frame: number, l: Line) => {
	let t = -Infinity;
	for (const e of l.edits) if (e.at <= frame) t = e.at;
	return t;
};

/** How open a line is (0 = no height), springing open on its first edit and shut once emptied. */
export const openness = (frame: number, l: Line) => {
	if (!l.edits.length) return 0;
	const times = editTimes(l.edits);
	let v = spr(frame, l.edits[0].at, 20, 0);
	const last = l.edits[l.edits.length - 1];
	if (last.to === '' && l.edits.length > 1) v *= 1 - spr(frame, times[times.length - 1].end, 20, 0);
	return v;
};

/**
 * A block of code, left aligned, that edits itself: lines type, backspace,
 * open and close with a spring, and the block re-centres as it grows. The
 * line being edited is in ink; the rest dim back.
 */
export const Code: React.FC<{
	frame: number;
	lines: Line[];
	x: number;
	cy: number;
	dark?: boolean;
	/** frame from which every token line reads at full strength */
	allBright?: number;
	/** where the block's y positions are reported, for the film to aim at */
	onLayout?: (ys: Record<string, number>) => void;
	/** the closing tag rides at the end of the first line until this frame */
	split?: {line: string; after: string; at: number};
	style?: React.CSSProperties;
}> = ({frame, lines, x, cy, dark, allBright = Infinity, split, style}) => {
	const ink = dark ? 'rgba(255,255,255,0.92)' : '#171717';
	const dim = dark ? 'rgba(255,255,255,0.34)' : 'rgba(0,0,0,0.3)';
	const layout = codeLayout(frame, lines, cy, split);
	// the line the caret is on: the one touched most recently
	let cur = '';
	let best = -Infinity;
	for (const l of lines) {
		const t = touched(frame, l);
		if (!l.frame && t > best && l.edits.length) {
			best = t;
			cur = l.id;
		}
	}
	return (
		<div style={{position: 'absolute', left: 0, top: 0, ...style}}>
			{lines.map((l) => {
				const {text} = lineAt(frame, l.edits);
				const o = layout.open[l.id];
				if (o <= 0.001 && !text) return null;
				const isCur = l.id === cur;
				const bright = !l.frame && (isCur || frame >= allBright);
				const pos = layout.pos[l.id];
				const a = l.accent ? text.indexOf(l.accent) : -1;
				return (
					<div
						key={l.id}
						style={{
							position: 'absolute',
							left: x + pos.x + (l.indent ?? 0) * CH,
							top: pos.y,
							height: LH,
							lineHeight: `${LH}px`,
							fontFamily: MONO,
							fontSize: CODE_SIZE,
							letterSpacing: 0,
							whiteSpace: 'pre',
							color: bright ? ink : dim,
							opacity: Math.min(1, o * 1.4),
						}}
					>
						{l.prefix}
						{a >= 0 ? (
							<>
								{text.slice(0, a)}
								<span style={{color: BRAND}}>{text.slice(a, a + l.accent!.length)}</span>
								{text.slice(a + l.accent!.length)}
							</>
						) : (
							text
						)}
						{isCur ? <Caret frame={frame} idle={frame > lastEnd(l) + 6} /> : null}
						{l.suffix}
					</div>
				);
			})}
		</div>
	);
};

const lastEnd = (l: Line) => {
	const t = editTimes(l.edits);
	return t.length ? t[t.length - 1].end : -Infinity;
};

const Caret: React.FC<{frame: number; idle: boolean}> = ({frame, idle}) => (
	<span
		style={{
			display: 'inline-block',
			width: 4,
			height: CODE_SIZE * 1.05,
			marginLeft: 3,
			verticalAlign: -CODE_SIZE * 0.2,
			background: !idle || Math.floor(frame / 18) % 2 === 0 ? BRAND : 'transparent',
		}}
	/>
);

/** Where each line sits this frame. */
export const codeLayout = (frame: number, lines: Line[], cy: number, split?: {line: string; after: string; at: number}) => {
	const open: Record<string, number> = {};
	let total = 0;
	const s = split ? spr(frame, split.at, 24, 0) : 1;
	for (const l of lines) {
		open[l.id] = l.id === split?.line ? s * openness(frame, l) : openness(frame, l);
		total += open[l.id] * LH;
	}
	// the joined line still takes one line of height before it splits
	let y = cy - total / 2;
	const pos: Record<string, {x: number; y: number}> = {};
	let firstY = y;
	for (const l of lines) {
		if (l.id === lines.find((q) => q.frame)?.id) firstY = y;
		pos[l.id] = {x: 0, y};
		y += open[l.id] * LH;
	}
	if (split) {
		// before the split, the closing tag rides at the end of the opening one
		const joinedX = split.after.length * CH;
		const p = pos[split.line];
		pos[split.line] = {x: joinedX * (1 - s), y: firstY + (p.y - firstY) * s};
		open[split.line] = Math.max(open[split.line], 1);
	}
	return {open, pos, total};
};
