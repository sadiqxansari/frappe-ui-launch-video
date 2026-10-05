import React from 'react';
import {useCurrentFrame} from '../lib/player';
import {prog} from '../lib/anim';
import {label} from '../theme';

export const CHAPTERS = ['Mark', 'Color', 'Tokens', 'Dark mode', 'Type', 'Shape', 'Components', 'Recipes', 'Playground', 'Docs'];

/**
 * Spec-sheet chrome that frames every chapter: chapter number and name top
 * left, release top right, a chapter index along the bottom. Draws itself in
 * over the first few frames of a scene.
 */
export const Hud: React.FC<{chapter: number; dark?: boolean; hide?: boolean; blend?: boolean}> = ({chapter, dark, hide, blend}) => {
	const frame = useCurrentFrame();
	if (hide) return null;
	const c = dark || blend ? 'rgba(255,255,255,0.62)' : 'rgba(0,0,0,0.55)';
	const faint = dark || blend ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)';
	const p = prog(frame, 0, 16);
	const num = String(chapter).padStart(2, '0');
	return (
		<div style={{position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40, opacity: p, mixBlendMode: blend ? 'difference' : undefined}}>
			<div style={{position: 'absolute', left: 64, top: 52, display: 'flex', gap: 22, ...label(20, c)}}>
				<span>{num}</span>
				<span>{CHAPTERS[chapter]}</span>
			</div>
			<div style={{position: 'absolute', right: 64, top: 52, ...label(20, c)}}>Frappe UI 1.0</div>
			<div style={{position: 'absolute', left: 64, right: 64, bottom: 52, display: 'flex', alignItems: 'center', gap: 10}}>
				{CHAPTERS.map((name, i) => (
					<div
						key={name}
						style={{
							flex: 1,
							height: 2,
							background: i === chapter ? c : faint,
						}}
					/>
				))}
			</div>
		</div>
	);
};

export const Mark: React.FC<{size: number; fill?: string; glyph?: string; style?: React.CSSProperties}> = ({
	size,
	fill = '#B352FF',
	glyph = 'white',
	style,
}) => (
	<svg width={size} height={size} viewBox="0 0 44 44" style={style}>
		<path d={SQUIRCLE} fill={fill} />
		<path d={HASH} fill={glyph} />
	</svg>
);

// From docs/content/public/logo.svg
export const SQUIRCLE =
	'M31.4286 0H12.5714C5.62842 0 0 5.62842 0 12.5714V31.4286C0 38.3716 5.62842 44 12.5714 44H31.4286C38.3716 44 44 38.3716 44 31.4286V12.5714C44 5.62842 38.3716 0 31.4286 0Z';
export const HASH =
	'M34.5716 16.4998V13.3569H30.643V9.42834H27.5001V13.3569H16.5001V9.42834H13.3573V13.3569H9.42871V16.4998H13.3573H16.5001H16.8459H27.5001V27.4998H16.5001V20.5854H13.3573V27.4998H9.42871V30.6426H13.3573V34.5712H16.5001V30.6426H27.5001V34.5712H30.643V30.6426H34.5716V27.4998H30.643V16.4998H34.5716Z';
