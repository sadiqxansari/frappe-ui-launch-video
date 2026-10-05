import {Rocket} from 'lucide-react';
import React from 'react';
import {useCurrentFrame} from '../lib/player';
import {Bg, Headline} from '../components/Common';
import {BEAT, EIGHTH, inOut, prog, spr} from '../lib/anim';
import {BRAND, FONT, ink, code, label, T, themeVars, v} from '../theme';

// A frappe-ui Button (variant subtle, size md) drawn at K× so the exploded
// 3D view stays sharp (Chrome rasterises 3D layers at their base size).
const K = 5.5;
const BW = 108 * K;
const BH = 32 * K;
const RAD = 8 * K;

const CX = 1150; // stage centre on screen
const CY = 650;

type Layer = {token: string; role: string; z: number};
const LAYERS: Layer[] = [
	{token: 'shadow-sm', role: 'elevation', z: 0},
	{token: 'surface-gray-2', role: 'surface', z: 1},
	{token: 'ink-gray-8', role: 'ink', z: 2},
	{token: 'outline-gray-3', role: 'focus ring', z: 3},
];

/** Orthographic projection of CSS `rotateX(a) rotateZ(c) translateZ(z)` for a point (x, y) on a layer. */
const project = (x: number, y: number, z: number, a: number, c: number) => {
	const ra = (a * Math.PI) / 180;
	const rc = (c * Math.PI) / 180;
	const x1 = x * Math.cos(rc) - y * Math.sin(rc);
	const y1 = x * Math.sin(rc) + y * Math.cos(rc);
	return {x: CX + x1, y: CY + y1 * Math.cos(ra) - z * Math.sin(ra)};
};

/**
 * 02 — Tokens. One Button, exploded into the tokens it is made of: an
 * elevation, a surface, an ink, a focus outline. Then it snaps back together.
 */
export const S3Layers: React.FC = () => {
	const frame = useCurrentFrame();
	const appear = spr(frame, 0, 28, 0.2);
	const e = prog(frame, 26, 70, inOut) * (1 - prog(frame, BEAT * 6.4, 40, inOut));
	const a = 56 * e;
	const c = -38 * e;
	const gapZ = 130 * e;

	const plate = (z: number, content: React.ReactNode, extra?: React.CSSProperties) => (
		<div
			style={{
				position: 'absolute',
				left: -BW / 2,
				top: -BH / 2,
				width: BW,
				height: BH,
				borderRadius: RAD,
				transform: `translateZ(${z}px)`,
				...extra,
			}}
		>
			{content}
			{/* construction outline of the plane while exploded */}
			<div
				style={{
					position: 'absolute',
					inset: -14,
					borderRadius: RAD + 14,
					border: `2px dashed ${BRAND}`,
					opacity: 0.55 * Math.min(1, e * 2),
				}}
			/>
		</div>
	);

	return (
		<Bg color="white" mode="light">
			<div style={{position: 'absolute', left: CX, top: CY, transformStyle: 'preserve-3d', scale: String(0.85 + 0.15 * appear), opacity: Math.min(1, appear * 2)}}>
				<div style={{position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d', transform: `rotateX(${a}deg) rotateZ(${c}deg)`}}>
					{plate(0, null, {boxShadow: scaleShadow(T.shadows.sm, K * (1 + e * 2))})}
					{plate(gapZ, null, {background: v('surface-gray-2'), ...themeVars('light')})}
					{plate(
						gapZ * 2,
						<div
							style={{
								position: 'absolute',
								inset: 0,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 6 * K,
								color: T.semantic.light.ink['gray-8'],
								fontFamily: FONT,
								fontSize: 14 * K,
								fontWeight: 500,
								letterSpacing: '0.015em',
							}}
						>
							<Rocket size={16 * K} strokeWidth={1.5} />
							Deploy
						</div>,
					)}
					{plate(gapZ * 3, null, {
						boxShadow: `0 0 0 ${2 * K}px ${T.semantic.light.outline['gray-3']}`,
						opacity: prog(frame, 20, 20),
					})}
				</div>
			</div>

			{/* token labels, leader lines to each plane's right corner */}
			{LAYERS.map((l, i) => {
				const p = prog(frame, 70 + i * EIGHTH, 20);
				const pt = project(BW / 2 + 14, 0, gapZ * l.z, a, c);
				const lx = 1560;
				const ly = pt.y;
				return (
					<div key={l.token} style={{opacity: p * Math.min(1, e * 1.5)}}>
						<div
							style={{
								position: 'absolute',
								left: pt.x,
								top: ly,
								width: Math.max(0, (lx - pt.x - 16) * p),
								height: 1.5,
								background: BRAND,
							}}
						/>
						<div style={{position: 'absolute', left: pt.x - 5, top: ly - 5, width: 11, height: 11, borderRadius: 9, background: BRAND}} />
						<div style={{position: 'absolute', left: lx, top: ly - 26}}>
							<div style={{...code(26, ink)}}>{l.token}</div>
							<div style={{...label(18, 'rgba(0,0,0,0.5)'), marginTop: 6}}>{l.role}</div>
						</div>
					</div>
				);
			})}

			<div style={{position: 'absolute', left: CX, top: CY + 190, translate: '-50% 0', ...code(22, 'rgba(0,0,0,0.5)'), opacity: 1 - Math.min(1, e * 4)}}>
				{'<Button variant="subtle" size="md" />'}
			</div>

			<Headline lines={['384 semantic tokens.']} at={BEAT * 3} size={84} color={ink} style={{left: 64, top: 170}} />
			<Headline
				lines={['Every surface, ink and', 'outline has a name.']}
				at={BEAT * 3.5}
				size={44}
				weight={500}
				color={T.ramps.gray['600']}
				style={{left: 64, top: 290}}
			/>
		</Bg>
	);
};

/** Scale every px length in a box-shadow string. */
const scaleShadow = (s: string, k: number) => s.replace(/(-?[\d.]+)px/g, (_, n) => `${(Number(n) * k).toFixed(2)}px`);

