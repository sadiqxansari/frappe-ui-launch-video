import {spr} from '../lib/anim';

// Motion for the v2 film. Everything is a pure function of the frame.
//
// Springs, the Apple way: critically damped unless something was thrown or
// placed (then a little bounce). A new target always starts from wherever
// the value is now, so a move can interrupt the last one without a jump.

export type Key = [frame: number, value: number];

/** A value that springs to each key's value from the key's frame on. */
export const track = (frame: number, keys: Key[], dur = 30, bounce = 0) => {
	let from = keys[0][1];
	let cur = keys[0][1];
	for (let i = 1; i < keys.length; i++) {
		const [f, v] = keys[i];
		if (frame < f) break;
		// where the previous segment had got to when this one started
		from = i === 1 ? keys[0][1] : segAt(keys, i - 1, f, dur, bounce);
		cur = from + (v - from) * spr(frame, f, dur, bounce);
	}
	return cur;
};

const segAt = (keys: Key[], i: number, frame: number, dur: number, bounce: number): number => {
	const from = i === 0 ? keys[0][1] : i === 1 ? keys[0][1] : segAt(keys, i - 1, keys[i][0], dur, bounce);
	return from + (keys[i][1] - from) * spr(frame, keys[i][0], dur, bounce);
};

/** Colours: the same idea, mixed in OKLab, never overshooting. */
export const colorTrack = (frame: number, keys: [number, string][], dur = 24) => {
	let out = keys[0][1];
	for (let i = 1; i < keys.length; i++) {
		const [f, c] = keys[i];
		if (frame < f) break;
		const p = Math.min(1, spr(frame, f, dur, 0));
		out = p >= 1 ? c : `color-mix(in oklab, ${c} ${(p * 100).toFixed(2)}%, ${keys[i - 1][1]})`;
	}
	return out;
};

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// ─── Typing ──────────────────────────────────────────────────────────────
// A line of code is a list of edits. Each edit backspaces to what the old
// and new text share, then types the rest.

export type Edit = {at: number; to: string; rate?: number; del?: number};
const RATE = 2.0; // frames per character typed
const DEL = 1.2; // frames per character deleted

const common = (a: string, b: string) => {
	let i = 0;
	while (i < a.length && i < b.length && a[i] === b[i]) i++;
	return i;
};

/** When each edit starts deleting, starts typing and finishes. */
export const editTimes = (edits: Edit[]) => {
	let text = '';
	return edits.map((e) => {
		const c = common(text, e.to);
		const del = (text.length - c) * (e.del ?? DEL);
		const typeStart = e.at + del;
		const end = typeStart + (e.to.length - c) * (e.rate ?? RATE);
		const r = {from: text, c, start: e.at, typeStart, end};
		text = e.to;
		return r;
	});
};

/** The line's text at this frame, and whether the caret is on it. */
export const lineAt = (frame: number, edits: Edit[]) => {
	const times = editTimes(edits);
	let text = '';
	let active = false;
	for (let i = 0; i < edits.length; i++) {
		const e = edits[i];
		const t = times[i];
		if (frame < t.start) break;
		if (frame < t.typeStart) {
			const n = Math.floor((frame - t.start) / (e.del ?? DEL));
			text = t.from.slice(0, t.from.length - n);
			active = true;
		} else {
			const r = e.rate ?? RATE;
			const n = r === 0 ? Infinity : Math.floor((frame - t.typeStart) / r);
			text = e.to.slice(0, Math.min(e.to.length, t.c + n));
			active = frame < t.end + 30;
		}
	}
	return {text, active};
};

/** The frame at which a line's edit `i` has typed the whole of `prefix`. */
export const typedAt = (edits: Edit[], i: number, prefix: string) => {
	const t = editTimes(edits)[i];
	const e = edits[i];
	return t.typeStart + Math.max(0, prefix.length - t.c) * (e.rate ?? RATE);
};

/** Frames it takes to type `s`. */
export const typeLen = (s: string, rate = RATE) => s.length * rate;
