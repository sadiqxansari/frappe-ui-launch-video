import React from 'react';
import {useCurrentFrame} from '../lib/player';
import {BRAND, disp, MONO, night, paper} from '../theme';

const CH = 0.6; // JetBrains Mono advance, in em

/**
 * A line typed out, left aligned, the way the dark-mode chapter types its
 * attribute: no camera move, just the line and a caret. Used as a beat of
 * suspense before a chapter. Prose is set in Inter; only code (`code`) is mono.
 */
export const Typed: React.FC<{
	text: string;
	dark?: boolean;
	size?: number; // defaults to the largest that fits the frame, up to 96
	at?: number;
	rate?: number; // frames per character
	accent?: string; // substring painted in the brand colour
	code?: boolean; // a code line: mono
}> = ({text, dark, size: sizeProp, at = 14, rate = 3, accent, code}) => {
	const frame = useCurrentFrame();
	const size = sizeProp ?? (code ? Math.min(96, 1620 / (text.length * CH)) : 96);
	const n = Math.max(0, Math.min(text.length, Math.floor((frame - at) / rate)));
	const done = n === text.length;
	const blink = done ? Math.floor(frame / 18) % 2 === 0 : true;
	// code reads as code, dimmed; prose is set in ink
	const dim = code ? (dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)') : dark ? 'white' : '#171717';
	const a = accent ? text.indexOf(accent) : -1;
	const visible = text.slice(0, n);
	return (
		<div style={{position: 'absolute', inset: 0, background: dark ? night : paper}}>
			<div
				style={{
					position: 'absolute',
					left: 150,
					top: 540 - size * 0.7,
					...(code ? {fontFamily: MONO, fontSize: size, letterSpacing: '-0.02em'} : {...disp(size, 500), lineHeight: 1.2}),
					whiteSpace: 'pre',
				}}
			>
				{a >= 0 ? (
					<>
						<span style={{color: dim}}>{visible.slice(0, a)}</span>
						<span style={{color: BRAND}}>{visible.slice(a, a + accent!.length)}</span>
						<span style={{color: dim}}>{visible.slice(a + accent!.length)}</span>
					</>
				) : (
					<span style={{color: dim}}>{visible}</span>
				)}
				<span
					style={{
						display: 'inline-block',
						width: 8,
						height: size * 0.94,
						background: blink ? BRAND : 'transparent',
						verticalAlign: -size * 0.15,
						marginLeft: 6,
					}}
				/>
			</div>
		</div>
	);
};

/** A whole scene that is just a typed line. */
export const typedScene = (text: string, opts: {dark?: boolean; accent?: string; size?: number; code?: boolean} = {}) => {
	const Scene: React.FC = () => <Typed text={text} {...opts} />;
	Scene.displayName = `Typed(${text})`;
	return Scene;
};
