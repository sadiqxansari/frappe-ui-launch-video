import React, {createContext, useContext} from 'react';

// Our own frame runtime: the handful of pieces the film's scenes use, written
// from scratch. The film asks "what frame is it?" and HyperFrames (hf-seek)
// answers; nothing here keeps time by itself.

export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// ─── The frame ───────────────────────────────────────────────────────────
const FrameContext = createContext(0);
export const FrameProvider = FrameContext.Provider;
export const useCurrentFrame = () => useContext(FrameContext);
export const useVideoConfig = () => ({fps: FPS, width: WIDTH, height: HEIGHT, durationInFrames: 0});

// ─── Holding a capture until async work lands ────────────────────────────
// A piece that needs time (an iframe, a font, an image) takes a handle; the
// frame is only captured once every handle is released.
const pending = new Map<number, string>();
let nextHandle = 1;
let waiters: (() => void)[] = [];
export const delayRender = (label = '') => {
	const h = nextHandle++;
	pending.set(h, label);
	return h;
};
export const continueRender = (h: number) => {
	pending.delete(h);
	if (pending.size === 0) {
		const w = waiters;
		waiters = [];
		w.forEach((f) => f());
	}
};
/** Resolves once nothing is holding the frame. */
export const settled = () => (pending.size === 0 ? Promise.resolve() : new Promise<void>((r) => waiters.push(r)));
export const pendingLabels = () => [...pending.values()];

// ─── Files in public/ ────────────────────────────────────────────────────
export const staticFile = (path: string) => `./${path.replace(/^\/+/, '')}`;

// ─── Layout ──────────────────────────────────────────────────────────────
export const AbsoluteFill: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({style, ...rest}) => (
	<div {...rest} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', ...style}} />
);

/**
 * Children see time from `from`; outside [from, from + durationInFrames)
 * they are gone, except for `premountFor` frames ahead, when they are
 * mounted (so iframes can load) but see-through (opacity, since a child
 * may set its own visibility), held at their first frame.
 */
export const Sequence: React.FC<{
	from?: number;
	durationInFrames?: number;
	premountFor?: number;
	name?: string;
	/** 'none': no wrapper of its own (then nothing to hide while premounting). */
	layout?: 'absolute-fill' | 'none';
	children: React.ReactNode;
}> = ({from = 0, durationInFrames = Infinity, premountFor = 0, layout = 'absolute-fill', children}) => {
	const frame = useCurrentFrame();
	if (frame < from - premountFor || frame >= from + durationInFrames) return null;
	const premounting = frame < from;
	return (
		<FrameProvider value={Math.max(0, frame - from)}>
			{layout === 'none' ? children : <AbsoluteFill style={premounting ? {opacity: 0, pointerEvents: 'none'} : undefined}>{children}</AbsoluteFill>}
		</FrameProvider>
	);
};

export const Img: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = (props) => {
	const [h] = React.useState(() => delayRender(`img ${props.src}`));
	return <img {...props} onLoad={() => continueRender(h)} onError={() => continueRender(h)} />;
};

// ─── Easing and interpolation ────────────────────────────────────────────
/** A CSS cubic-bezier(x1, y1, x2, y2) as a function of t. */
const bezier = (x1: number, y1: number, x2: number, y2: number) => {
	const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
	const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
	const X = (t: number) => ((ax * t + bx) * t + cx) * t;
	const Y = (t: number) => ((ay * t + by) * t + cy) * t;
	const dX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
	return (x: number) => {
		if (x <= 0) return 0;
		if (x >= 1) return 1;
		// Newton first, then bisection if the slope is too flat to trust
		let t = x;
		for (let i = 0; i < 8; i++) {
			const e = X(t) - x;
			if (Math.abs(e) < 1e-7) return Y(t);
			const d = dX(t);
			if (Math.abs(d) < 1e-6) break;
			t -= e / d;
		}
		let lo = 0, hi = 1;
		t = x;
		for (let i = 0; i < 40; i++) {
			const v = X(t);
			if (Math.abs(v - x) < 1e-7) break;
			if (v < x) lo = t;
			else hi = t;
			t = (lo + hi) / 2;
		}
		return Y(t);
	};
};
export const Easing = {bezier, linear: (t: number) => t};

type Extrapolate = 'clamp' | 'extend' | 'identity';
/** Piecewise interpolation of `x` over `input` → `output`, easing each segment. */
export const interpolate = (
	x: number,
	input: readonly number[],
	output: readonly number[],
	opts: {easing?: (t: number) => number; extrapolateLeft?: Extrapolate; extrapolateRight?: Extrapolate} = {},
) => {
	const easing = opts.easing ?? ((t: number) => t);
	const n = input.length;
	if (x < input[0]) {
		if (opts.extrapolateLeft === 'clamp') return output[0];
		if (opts.extrapolateLeft === 'identity') return x;
	}
	if (x > input[n - 1]) {
		if (opts.extrapolateRight === 'clamp') return output[n - 1];
		if (opts.extrapolateRight === 'identity') return x;
	}
	let i = 1;
	while (i < n - 1 && x > input[i]) i++;
	const [a, b] = [input[i - 1], input[i]];
	const t = b === a ? 0 : (x - a) / (b - a);
	const inside = t >= 0 && t <= 1;
	return output[i - 1] + (output[i] - output[i - 1]) * (inside ? easing(t) : t);
};

/** A colour between stops, mixed the way sRGB channels mix. */
export const interpolateColors = (x: number, input: readonly number[], colors: readonly string[]) => {
	let i = 1;
	while (i < input.length - 1 && x > input[i]) i++;
	const t = Math.max(0, Math.min(1, (x - input[i - 1]) / (input[i] - input[i - 1])));
	if (t <= 0) return colors[i - 1];
	if (t >= 1) return colors[i];
	return `color-mix(in srgb, ${colors[i]} ${(t * 100).toFixed(3)}%, ${colors[i - 1]})`;
};
