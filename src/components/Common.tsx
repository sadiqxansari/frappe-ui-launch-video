import React from 'react';
import {useCurrentFrame} from '../lib/player';
import {inn, out, prog} from '../lib/anim';
import {disp, label, Mode, night, paper, themeVars} from '../theme';

/**
 * Headline set flush-left, one line per entry. Each line slides up out of its
 * own mask on an eighth note; no blur, no fade — it should feel cut, not
 * dissolved.
 */
export const Headline: React.FC<{
	lines: string[];
	at: number;
	leave?: number;
	size?: number;
	color?: string;
	step?: number;
	style?: React.CSSProperties;
	weight?: number;
}> = ({lines, at, leave, size = 76, color, step = 8, style, weight = 600}) => {
	const frame = useCurrentFrame();
	return (
		<div style={{position: 'absolute', ...style}}>
			{lines.map((l, i) => {
				const p = prog(frame, at + i * step, 22, out);
				const q = leave === undefined ? 0 : prog(frame, leave, 14, inn);
				return (
					<div key={i} style={{overflow: 'hidden', paddingBottom: size * 0.14, marginBottom: -size * 0.06}}>
						<div style={{...disp(size, weight), color, translate: `0 ${(1 - p) * 110 - q * 110}%`}}>{l}</div>
					</div>
				);
			})}
		</div>
	);
};

/** Small mono caption that types on. */
export const Caption: React.FC<{text: string; at: number; color?: string; size?: number; style?: React.CSSProperties}> = ({
	text,
	at,
	color,
	size = 22,
	style,
}) => {
	const frame = useCurrentFrame();
	const n = Math.max(0, Math.min(text.length, Math.floor((frame - at) / 1.2)));
	return <div style={{position: 'absolute', ...label(size, color), ...style}}>{text.slice(0, n)}</div>;
};

/** Paints the same content in both themes and shows light left of `x`, dark right of it. */
export const Split: React.FC<{x: number; width?: number; children: (mode: Mode) => React.ReactNode; bg?: boolean}> = ({
	x,
	width = 1920,
	children,
	bg = true,
}) => (
	<>
		{(['light', 'dark'] as Mode[]).map((m) => (
			<div
				key={m}
				style={{
					position: 'absolute',
					inset: 0,
					...themeVars(m),
					background: bg ? (m === 'light' ? paper : night) : undefined,
					clipPath: m === 'light' ? `inset(0 ${width - x}px 0 0)` : `inset(0 0 0 ${x}px)`,
				}}
			>
				{children(m)}
			</div>
		))}
	</>
);

/** Thin hairline dimension marker with end ticks and a centred mono label. */
export const Dim: React.FC<{
	x: number;
	y: number;
	len: number;
	vertical?: boolean;
	text: string;
	p?: number;
	color?: string;
}> = ({x, y, len, vertical, text, p = 1, color = '#B352FF'}) => {
	const L = len * p;
	return (
		<div style={{position: 'absolute', left: x, top: y, opacity: Math.min(1, p * 3)}}>
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 0,
					width: vertical ? 1.5 : L,
					height: vertical ? L : 1.5,
					background: color,
				}}
			/>
			{[0, L].map((o, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: vertical ? -7 : o - 0.75,
						top: vertical ? o - 0.75 : -7,
						width: vertical ? 16 : 1.5,
						height: vertical ? 1.5 : 16,
						background: color,
					}}
				/>
			))}
			<div
				style={{
					position: 'absolute',
					...(vertical ? {left: 14, top: L / 2 - 12} : {left: L / 2, top: -34, translate: '-50% 0'}),
					...label(20, color),
					whiteSpace: 'nowrap',
					opacity: p > 0.6 ? 1 : 0,
				}}
			>
				{text}
			</div>
		</div>
	);
};

export const Bg: React.FC<{color: string; children?: React.ReactNode; mode?: Mode}> = ({color, children, mode}) => (
	<div style={{position: 'absolute', inset: 0, background: color, overflow: 'hidden', ...(mode ? themeVars(mode) : {})}}>
		{children}
	</div>
);
