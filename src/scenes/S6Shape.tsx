import React from 'react';
import {useCurrentFrame} from '../lib/player';
import {Bg, Headline} from '../components/Common';
import {BEAT, cutIndex, inOut, prog, spr} from '../lib/anim';
import {BRAND, code, disp, ink, paper, T} from '../theme';

const RADII = Object.entries(T.radius).filter(([k]) => /^\d$/.test(k)) as [string, string][];
const ELEV = ['sm', 'base', 'md', 'lg', 'xl', '2xl'];

/**
 * 05 — Shape. A macro corner stepping through the radius scale on sixteenth
 * notes, then one card rising through the six elevations.
 */
export const S6Shape: React.FC = () => {
	const frame = useCurrentFrame();

	if (frame < BEAT * 3) {
		// corner steps 0 → 8 on sixteenths, lands on rounded-9 (100px) last
		const steps = RADII.slice(0, 9).map((_, i) => 8 + i * 9);
		const i = cutIndex(frame, steps);
		const [k, val] = RADII[i];
		const px = parseFloat(val);
		const Z = 22; // macro zoom
		const r = px * Z;
		const x0 = 330;
		const y0 = 470;
		return (
			<Bg color={paper}>
				<div
					style={{
						position: 'absolute',
						left: x0,
						top: y0,
						width: 3000,
						height: 3000,
						background: 'white',
						borderTopLeftRadius: r,
						boxShadow: '0 0 0 3px ' + ink,
					}}
				/>
				{/* radius construction */}
				{r > 0 ? (
					<>
						<div
							style={{
								position: 'absolute',
								left: x0,
								top: y0,
								width: r * 2,
								height: r * 2,
								borderRadius: 9999,
								border: `2px dashed ${BRAND}`,
								boxSizing: 'border-box',
								opacity: 0.8,
							}}
						/>
						<div style={{position: 'absolute', left: x0 + r, top: y0 + r, width: r, height: 2, background: BRAND, rotate: '-135deg', transformOrigin: '0 0'}} />
						<div style={{position: 'absolute', left: x0 + r - 7, top: y0 + r - 7, width: 14, height: 14, borderRadius: 9, background: BRAND}} />
					</>
				) : null}
				<div style={{position: 'absolute', right: 64, top: 150, textAlign: 'right'}}>
					<div style={{...disp(300, 600), color: ink, fontVariantNumeric: 'tabular-nums'}}>{px}px</div>
					<div style={{...code(34, BRAND), marginTop: 16}}>{`rounded-${k}`}</div>
				</div>
			</Bg>
		);
	}

	return <Elevation frame={frame - BEAT * 3} />;
};

// The card, drawn large so it stays sharp once the 3D view rasterises it.
const CW = 560;
const CH = 340;
const LIFT = [22, 48, 84, 128, 176, 236]; // height of each step above the floor
const STEP = 18; // eighth notes
const FIRST = 26;

/**
 * Six elevations, seen from the side: one card on a floor, tilted into an
 * isometric view, rising a step on each eighth note while its shadow on the
 * floor spreads and softens. Then the view flattens and the card sits there
 * with the real shadow-2xl.
 */
const Elevation: React.FC<{frame: number}> = ({frame}) => {
	const tilt = prog(frame, 0, 40, inOut) * (1 - prog(frame, 140, 34, inOut));
	const a = 56 * tilt;
	const c = -38 * tilt;
	const i = Math.max(0, cutIndex(frame, ELEV.map((_, k) => FIRST + k * STEP)));
	const started = frame >= FIRST;
	// spring from the previous step to this one
	const from = i === 0 ? 0 : LIFT[i - 1];
	const to = started ? LIFT[i] : 0;
	const z = (from + (to - from) * spr(frame, FIRST + i * STEP, 16, 0.25)) * tilt;
	const h = to / LIFT[5]; // 0 → 1
	const flat = prog(frame, 150, 24);
	return (
		<Bg color={paper}>
			<div style={{position: 'absolute', left: 1080, top: 600, transformStyle: 'preserve-3d'}}>
				<div style={{position: 'absolute', transformStyle: 'preserve-3d', transform: `rotateX(${a}deg) rotateZ(${c}deg)`}}>
					{/* floor */}
					<div
						style={{
							position: 'absolute',
							left: -620,
							top: -460,
							width: 1240,
							height: 920,
							borderRadius: 48,
							border: `2px dashed ${BRAND}`,
							opacity: 0.45 * tilt,
						}}
					/>
					{/* ghost of each step passed */}
					{LIFT.map((l, k) =>
						started && k < i ? (
							<div
								key={k}
								style={{
									position: 'absolute',
									left: -CW / 2,
									top: -CH / 2,
									width: CW,
									height: CH,
									borderRadius: 40,
									border: `2px dashed ${BRAND}`,
									opacity: 0.35 * tilt,
									transform: `translateZ(${l * tilt}px)`,
								}}
							/>
						) : null,
					)}
					{/* the shadow it casts */}
					<div
						style={{
							position: 'absolute',
							left: -CW / 2 + 10 + 20 * h,
							top: -CH / 2 + 14 + 40 * h,
							width: CW - 20 - 40 * h,
							height: CH - 20 - 30 * h,
							borderRadius: 40,
							background: `rgba(0,0,0,${0.3 - 0.14 * h})`,
							filter: `blur(${6 + 40 * h}px)`,
							opacity: tilt,
						}}
					/>
					{/* the card */}
					<div
						style={{
							position: 'absolute',
							left: -CW / 2,
							top: -CH / 2,
							width: CW,
							height: CH,
							borderRadius: 40,
							background: 'white',
							boxShadow: `0 0 0 1.5px rgba(0,0,0,0.08), ${scale(T.shadows['2xl'], 3.4 * flat)}`,
							transform: `translateZ(${z}px)`,
						}}
					/>
				</div>
			</div>
			<Headline lines={['Six elevations.']} at={4} size={84} color={ink} style={{left: 64, top: 150}} />
			<div style={{position: 'absolute', left: 64, top: 330, display: 'flex', flexDirection: 'column', gap: 16}}>
				{ELEV.map((e, k) => (

					<div key={e} style={{...code(28, started && k === i ? BRAND : 'rgba(0,0,0,0.3)'), opacity: prog(frame, 10 + k * 3, 16)}}>
						{`shadow-${e}`}
					</div>
				))}
			</div>
		</Bg>
	);
};

const scale = (s: string, k: number) => s.replace(/(-?[\d.]+)px/g, (_, n) => `${(Number(n) * k).toFixed(2)}px`);
