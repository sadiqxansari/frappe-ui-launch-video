import React from 'react';
import {useCurrentFrame} from '../lib/player';
import {Bg} from '../components/Common';
import {HASH, Mark, SQUIRCLE} from '../components/Hud';
import {BEAT, inOut, kf, out, prog} from '../lib/anim';
import {BRAND, disp, ink, label, paper} from '../theme';

// Construction coordinates of the # glyph, in the logo's 44-unit SVG space.
// The mark is drawn at 28px: 1px = 44/28 units (bg 28, mark 16, stroke 2,
// padding 6, thread cut 2.6, radius 8).
const GUIDES = [9.43, 13.357, 16.5, 20.585, 27.5, 30.643, 34.572];

/**
 * 01 — The mark. Opens close on the #, pulls out through its construction
 * grid to the whole mark (its size, and the #'s), then fills. Then the
 * lockup, "1.0" last.
 */
// every beat of it this much earlier than it was, when it opened on a macro
// of the notch
const EARLY = 94;
export const MARK_LEN = BEAT * 12 - EARLY;
export const S1Mark: React.FC = () => {
	const frame = useCurrentFrame();

	const f = frame + EARLY; // the old beats
	// viewBox keyframes: close on the # → the whole mark
	const keys = [0, BEAT * 5 - EARLY];
	const cx = kf(frame, keys, [19, 22]);
	const cy = kf(frame, keys, [20, 22]);
	const h = Math.exp(kf(frame, keys, [Math.log(22), Math.log(96)]));
	const w = (h * 16) / 9;
	const vb = `${cx - w / 2} ${cy - h / 2} ${w} ${h}`;
	const px = 1080 / h; // screen px per logo unit

	const guides = prog(frame, 4, 40);
	const outline = prog(frame, 2, 18);
	// the # stays an outline; the square fills with the brand colour around it,
	// and the # is white inside it the way the mark is (done just before the
	// cut to the lockup)
	const fillSq = prog(f, BEAT * 5.5, 32, inOut);
	const annot = 1 - prog(f, BEAT * 5.6, 10);

	// screen position of a logo point
	const sx = (x: number) => (x - (cx - w / 2)) * px;
	const sy = (y: number) => (y - (cy - h / 2)) * px;

	// Once filled, the mark leaves the construction view and becomes the
	// lockup in one move: it shrinks and slides left as "Frappe UI" opens out
	// beside it, then "1.0" follows from the right.
	if (f >= BEAT * 6 + 16) {
		const size = kf(f, [BEAT * 7, BEAT * 8.6], [495, 150], inOut);
		const name = prog(f, BEAT * 8, 44, inOut);
		const ver = prog(f, BEAT * 9.3, 40, inOut);
		return (
			<Bg color={paper}>
				<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
					<Mark size={size} style={{flexShrink: 0}} />
					<div style={{maxWidth: 820 * name, overflow: 'hidden', paddingBottom: 30, marginBottom: -30, flexShrink: 0}}>
						<div style={{...disp(150, 650), color: ink, whiteSpace: 'nowrap', paddingLeft: 40, translate: `${(1 - name) * -120}px 0`, opacity: Math.min(1, name * 1.5)}}>
							Frappe UI
						</div>
					</div>
					<div style={{maxWidth: 360 * ver, overflow: 'hidden', paddingBottom: 30, marginBottom: -30, flexShrink: 0}}>
						<div style={{...disp(150, 650), color: BRAND, whiteSpace: 'nowrap', paddingLeft: 36, paddingRight: 20, translate: `${(1 - ver) * 140}px 0`, opacity: Math.min(1, ver * 1.5)}}>
							1.0
						</div>
					</div>
				</div>
			</Bg>
		);
	}

	return (
		<Bg color={paper}>
			<svg width={1920} height={1080} viewBox={vb} style={{position: 'absolute', inset: 0}}>
				{/* construction grid */}
				{GUIDES.map((g, i) => (
					<g key={i} opacity={guides * annot * 0.9}>
						<line x1={g} x2={g} y1={-100} y2={144} stroke="#B352FF" strokeOpacity={0.35} vectorEffect="non-scaling-stroke" strokeWidth={1} />
						<line y1={g} y2={g} x1={-150} x2={194} stroke="#B352FF" strokeOpacity={0.35} vectorEffect="non-scaling-stroke" strokeWidth={1} />
					</g>
				))}
				<path
					d={SQUIRCLE}
					fill={BRAND}
					fillOpacity={fillSq}
					stroke={ink}
					strokeOpacity={0.5 * (1 - fillSq)}
					strokeWidth={1.5 / px}
					pathLength={1}
					strokeDasharray={1}
					strokeDashoffset={1 - prog(frame, 6, BEAT * 5.5 - EARLY - 6, inOut)}
				/>
				<path d={HASH} fill="#ffffff" fillOpacity={fillSq} stroke={ink} strokeWidth={2 / px} strokeOpacity={outline * (1 - fillSq)} />
			</svg>

			{/* annotations in screen space so type stays a fixed size */}
			<div style={{opacity: annot}}>
				<Measure x1={sx(0)} y1={sy(-3)} x2={sx(44)} y2={sy(-3)} text="28px" p={prog(frame, 48, 24)} side="above" />
				<Measure x1={sx(47)} y1={sy(9.43)} x2={sx(47)} y2={sy(34.57)} text="mark · 16px" p={prog(frame, 60, 24)} side="right" />
			</div>
		</Bg>
	);
};

const Measure: React.FC<{x1: number; y1: number; x2: number; y2: number; text: string; p: number; side: 'left' | 'right' | 'above' | 'below'}> = ({
	x1,
	y1,
	x2,
	y2,
	text,
	p,
	side,
}) => {
	const c = '#B352FF';
	const vertical = x1 === x2;
	const len = vertical ? y2 - y1 : x2 - x1;
	const e = out(p);
	const ox = side === 'left' ? -40 : side === 'right' ? 0 : 0;
	return (
		<div style={{position: 'absolute', left: x1 + ox, top: y1, opacity: Math.min(1, p * 3)}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: vertical ? 1.5 : len * e, height: vertical ? len * e : 1.5, background: c}} />
			{[0, len * e].map((o, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: vertical ? -8 : o,
						top: vertical ? o : -8,
						width: vertical ? 17 : 1.5,
						height: vertical ? 1.5 : 17,
						background: c,
					}}
				/>
			))}
			<div
				style={{
					position: 'absolute',
					whiteSpace: 'nowrap',
					...label(22, c),
					opacity: e > 0.7 ? 1 : 0,
					...(vertical
						? {top: len / 2, left: side === 'left' ? -18 : 18, translate: side === 'left' ? '-100% -50%' : '0 -50%'}
						: {left: len / 2, top: side === 'above' ? -16 : 16, translate: side === 'above' ? '-50% -100%' : '-50% 0'}),
				}}
			>
				{text}
			</div>
		</div>
	);
};
