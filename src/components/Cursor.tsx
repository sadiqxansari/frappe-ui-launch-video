import React from 'react';
import {useCurrentFrame} from '../lib/player';
import {inOut, kf, prog} from '../lib/anim';

export type CursorKey = {f: number; x: number; y: number};

type Props = {
	keys: CursorKey[]; // position keyframes
	clicks?: number[]; // frames at which a click happens
	appear?: number;
	hide?: number;
	scale?: number;
};

/** macOS-style pointer that glides between keyframes and dips on click. */
export const Cursor: React.FC<Props> = ({keys, clicks = [], appear = 0, hide, scale = 1}) => {
	const frame = useCurrentFrame();
	const fs = keys.map((k) => k.f);
	const x = kf(frame, fs, keys.map((k) => k.x), inOut);
	const y = kf(frame, fs, keys.map((k) => k.y), inOut);
	const press = clicks.reduce((m, cf) => {
		const d = frame - cf;
		if (d < -4 || d > 10) return m;
		return Math.max(m, d < 0 ? (d + 4) / 4 : 1 - d / 10);
	}, 0);
	const vis = prog(frame, appear, 10) * (hide === undefined ? 1 : 1 - prog(frame, hide, 10));
	return (
		<div style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 50}}>
			{clicks.map((cf) => {
				const r = prog(frame, cf, 26);
				if (frame < cf || r >= 1) return null;
				const cx = kf(cf, fs, keys.map((k) => k.x), inOut);
				const cy = kf(cf, fs, keys.map((k) => k.y), inOut);
				return (
					<div
						key={cf}
						style={{
							position: 'absolute',
							left: cx - 28 * scale,
							top: cy - 28 * scale,
							width: 56 * scale,
							height: 56 * scale,
							borderRadius: 999,
							border: `${2 * scale}px solid rgba(0,186,244,${0.6 * (1 - r)})`,
							scale: String(0.4 + r * 0.9),
						}}
					/>
				);
			})}
			<svg
				width={30 * scale}
				height={30 * scale}
				viewBox="0 0 24 24"
				style={{
					position: 'absolute',
					left: x - 5 * scale,
					top: y - 3 * scale,
					opacity: vis,
					scale: String(1 - press * 0.14),
					transformOrigin: '20% 15%',
					filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))',
				}}
			>
				<path
					d="M5.5 3.2v16.1c0 .5.6.7.9.3l3.9-4.3 2.6 5.9c.1.3.5.4.8.3l2-.9c.3-.1.4-.5.3-.8l-2.6-5.8h5.8c.5 0 .7-.6.4-.9L6.4 2.8c-.4-.3-.9-.1-.9.4z"
					fill="#111"
					stroke="#fff"
					strokeWidth="1.4"
				/>
			</svg>
		</div>
	);
};
