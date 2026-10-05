import {Easing, interpolate} from './player';

export const FPS = 60;
export const BEAT = 36; // 100 bpm at 60 fps
export const BAR = BEAT * 4; // 144 frames = 2.4 s
export const EIGHTH = BEAT / 2;

// House curves
export const out = Easing.bezier(0.16, 1, 0.3, 1); // expo settle
export const inOut = Easing.bezier(0.76, 0, 0.24, 1); // snappy move
export const inn = Easing.bezier(0.6, 0, 0.9, 0.4); // accelerate away

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 0→1 progress between start and start+dur. */
export const prog = (frame: number, start: number, dur: number, easing: (t: number) => number = out) =>
	interpolate(frame, [start, start + dur], [0, 1], {...clamp, easing});

export const mix = (p: number, a: number, b: number) => a + (b - a) * p;

/** Keyframed value, one easing for every segment. */
export const kf = (frame: number, frames: number[], values: number[], easing: (t: number) => number = inOut) =>
	interpolate(frame, frames, values, {...clamp, easing});

/** Damped spring, settled in about `dur` frames. */
export const spr = (frame: number, start: number, dur = 30, bounce = 0.25) => {
	const t = Math.max(0, frame - start) / dur;
	if (t >= 1.6) return 1;
	const zeta = 1 - bounce;
	const w = 6.5;
	if (zeta >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
	const wd = w * Math.sqrt(1 - zeta * zeta);
	return 1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + ((zeta * w) / wd) * Math.sin(wd * t));
};

/** Index of the active cut, given the frames the cuts land on. */
export const cutIndex = (frame: number, cuts: number[]) => {
	let i = 0;
	for (let k = 0; k < cuts.length; k++) if (frame >= cuts[k]) i = k;
	return i;
};

/** Characters of `text` visible when typing starts at `at`, `rate` frames per char. */
export const typed = (frame: number, text: string, at: number, rate = 2.2) =>
	text.slice(0, Math.max(0, Math.min(text.length, Math.floor((frame - at) / rate))));
