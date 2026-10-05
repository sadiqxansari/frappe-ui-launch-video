import React from 'react';
import {useCurrentFrame} from '../lib/player';
import {Bg, Headline} from '../components/Common';
import {BAR, BEAT, cutIndex, inOut, kf, out, prog} from '../lib/anim';
import {disp, ink, code, label, paper, RAMP_NAMES, STEPS, T} from '../theme';

const parse = (c: string) => c.match(/oklch\(([\d.]+) ([\d.]+) ([\d.]+)/)!.slice(1).map(Number);

const FIELDS: [string, string][] = [
	['blue', '600'],
	['green', '500'],
	['orange', '500'],
	['violet', '600'],
];

// Palette grid geometry
const GX = 250;
const GY = 168;
const CW = 132;
const CH = 52;
const GAP = 6;
const STRIPE_RAMP = 'purple';

/**
 * 01 — Color. Four full-bleed fields cut on the beat, each reading out its
 * real OKLCH value; then one ramp as full-bleed stripes; then the stripes
 * fold into the whole 12 × 11 palette.
 */
export const S2Color: React.FC = () => {
	const frame = useCurrentFrame();

	if (frame < BAR) {
		const cuts = FIELDS.map((_, i) => i * BEAT);
		const i = cutIndex(frame, cuts);
		const [ramp, step] = FIELDS[i];
		const color = T.ramps[ramp][step];
		const [L, C, H] = parse(color);
		const prev = parse(T.ramps[FIELDS[Math.max(0, i - 1)][0]][FIELDS[Math.max(0, i - 1)][1]]);
		const p = i === 0 ? prog(frame, 0, 20) : prog(frame, cuts[i], 12);
		const roll = (a: number, b: number) => a + (b - a) * p;
		const fg = 'white';
		const rows: [string, string][] = [
			['Lightness', roll(prev[0], L).toFixed(3)],
			['Chroma', roll(prev[1], C).toFixed(3)],
			['Hue', roll(prev[2], H).toFixed(1)],
		];
		return (
			<Bg color={color}>
				<div style={{position: 'absolute', left: 64, top: 150, display: 'flex', flexDirection: 'column', gap: 6}}>
					{rows.map(([k, val], r) => (
						<div key={k} style={{display: 'flex', alignItems: 'baseline', gap: 40}}>
							<span style={{...label(40, 'rgba(255,255,255,0.75)'), width: 200}}>{k}</span>
							<span style={{...disp(230, 560), color: fg, fontVariantNumeric: 'tabular-nums', translate: `0 ${(1 - prog(frame, cuts[i] + r * 3, 14)) * 30}px`}}>
								{val}
							</span>
						</div>
					))}
				</div>
				{/* crosshair */}
				<div style={{position: 'absolute', right: 300, top: 520, width: 120, height: 1.5, background: 'rgba(255,255,255,0.7)', translate: '-50% 0'}} />
				<div style={{position: 'absolute', right: 360, top: 460, width: 1.5, height: 120, background: 'rgba(255,255,255,0.7)'}} />
				<div style={{position: 'absolute', right: 64, bottom: 110, textAlign: 'right'}}>
					<div style={{...disp(64, 600), color: fg}}>
						{ramp} {step}
					</div>
					<div style={{...code(24, 'rgba(255,255,255,0.8)'), marginTop: 14}}>{color}</div>
				</div>
			</Bg>
		);
	}

	const f = frame - BAR;
	const fold = prog(f, BAR - 20, 44, inOut); // stripes → grid
	const W = 1920 / 11;

	return (
		<Bg color={paper}>
			{RAMP_NAMES.map((ramp, ri) => {
				const isStripe = ramp === STRIPE_RAMP;
				const rowIn = prog(f, BAR + 4 + Math.abs(ri - 9) * 3, 26);
				return STEPS.map((step, si) => {
					const gx = GX + si * (CW + GAP);
					const gy = GY + ri * (CH + GAP);
					let x = gx;
					let y = gy;
					let w = CW;
					let h = CH;
					let op = rowIn;
					let rad = 6;
					if (isStripe) {
						const drop = prog(f, si * 3, 30, out);
						x = kf(fold, [0, 1], [si * W, gx], (t) => t);
						y = kf(fold, [0, 1], [-1080 * (1 - drop), gy], (t) => t);
						w = kf(fold, [0, 1], [W + 1, CW], (t) => t);
						h = kf(fold, [0, 1], [1080, CH], (t) => t);
						rad = fold * 6;
						op = 1;
					} else {
						x = gx + (1 - rowIn) * 120;
					}
					const L = parse(T.ramps[ramp][step])[0];
					return (
						<div
							key={`${ramp}-${step}`}
							style={{
								position: 'absolute',
								left: x,
								top: y,
								width: w,
								height: h,
								background: T.ramps[ramp][step],
								borderRadius: rad,
								opacity: op,
								zIndex: isStripe ? 2 : 1,
							}}
						>
							{isStripe ? (
								<div
									style={{
										position: 'absolute',
										left: 18,
										bottom: 120,
										...label(22, L > 0.7 ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.85)'),
										opacity: 1 - fold * 3,
									}}
								>
									{step}
								</div>
							) : null}
						</div>
					);
				});
			})}
			{/* axis labels for the grid */}
			<div style={{opacity: prog(f, BAR + 10, 20)}}>
				{RAMP_NAMES.map((ramp, ri) => (
					<div
						key={ramp}
						style={{position: 'absolute', left: 64, top: GY + ri * (CH + GAP) + CH / 2 - 12, ...label(20, 'rgba(0,0,0,0.55)')}}
					>
						{ramp}
					</div>
				))}
				{STEPS.map((s, si) => (
					<div key={s} style={{position: 'absolute', left: GX + si * (CW + GAP), top: GY - 34, ...label(18, 'rgba(0,0,0,0.45)')}}>
						{s}
					</div>
				))}
			</div>
			<div
				style={{
					position: 'absolute',
					left: 64,
					top: 150,
					...disp(120, 600),
					color: ink,
					zIndex: 3,
					opacity: 1 - prog(f, BAR - 24, 14),
					mixBlendMode: 'normal',
				}}
			>
				{STRIPE_RAMP}
			</div>
			<Headline lines={['12 ramps. 11 steps. Tuned in OKLCH.']} at={BAR + 30} size={58} color={ink} style={{left: 64, top: 900}} />
		</Bg>
	);
};
