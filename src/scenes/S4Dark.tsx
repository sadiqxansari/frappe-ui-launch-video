import React from 'react';
import {useCurrentFrame} from '../lib/player';
import {Bg, Split} from '../components/Common';
import {Cursor} from '../components/Cursor';
import {Stage} from '../components/Stage';
import {BAR, BEAT, cutIndex, EIGHTH, inOut, kf, prog, spr, typed} from '../lib/anim';
import {BRAND, code, label, MONO, Mode, night, paper, T} from '../theme';

const CODE_A = '<html data-theme="';
const CODE_B = 'dark';
const CODE_C = '">';

// Part boundaries (scene frames)
const SPLIT = BAR + EIGHTH; // the collage with the light/dark divider
const MONTAGE = BEAT * 8; // close-ups, each flipping half way
const SHOT = BEAT * 2;

const SHOTS: [(mode: Mode) => Record<string, unknown>, number][] = [
	[(mode) => ({kind: 'switch', on: mode === 'dark'}), 9],
	[() => ({kind: 'badges'}), 5],
	[() => ({kind: 'form', value: 'Quarterly review'}), 4],
];


/**
 * 03 — Dark mode. Type one attribute; on the downbeat the whole frame flips.
 * Then a light/dark split dragged across real components, and close-ups that
 * flip half way through each shot.
 *
 * One persistent tree: each part's iframes stay mounted (hidden) before their
 * turn, so a cut never waits on a page load.
 */
export const S4Dark: React.FC = () => {
	const frame = useCurrentFrame();
	// Opacity, not visibility: a child that sets visibility: visible would
	// escape a hidden parent. Hidden parts stay mounted so they are loaded.
	const show = (a: number, b: number): React.CSSProperties => ({opacity: frame >= a && frame < b ? 1 : 0});

	// A — the attribute, typed in light; flips to dark on the bar line
	const dark = frame >= BAR;
	const full = CODE_A + CODE_B + CODE_C;
	const shown = typed(frame, full, 14, 2.3);
	const blink = shown.length === full.length ? Math.floor(frame / 18) % 2 === 0 : true;
	const pulse = dark ? spr(frame, BAR, 22, 0.35) : 0;
	const dim = dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)';

	// C — the split, dragged by hand
	const f = frame - SPLIT;
	const x = f < 24 ? 1920 - 960 * prog(f, 0, 24, inOut) : kf(f, [24, 52, 84, 112], [960, 440, 1500, 1180]);
	const t = prog(f, 50, 20);

	// D — montage
	const g = frame - MONTAGE;
	const shot = cutIndex(Math.max(0, g), [0, SHOT, SHOT * 2]);
	const shotMode: Mode = g - shot * SHOT >= SHOT / 2 ? 'dark' : 'light';

	return (
		<Bg color={night}>
			{/* A */}
			<div style={{position: 'absolute', inset: 0, background: dark ? night : paper, ...show(0, SPLIT)}}>
				<div
					style={{
						position: 'absolute',
						left: 150,
						top: 470,
						fontFamily: MONO,
						fontSize: 96,
						letterSpacing: '-0.02em',
						whiteSpace: 'pre',
						scale: String(dark ? 1.04 - 0.04 * pulse : 1),
						transformOrigin: 'left center',
					}}
				>
					<span style={{color: dim}}>{shown.slice(0, CODE_A.length)}</span>
					<span style={{color: BRAND}}>{shown.slice(CODE_A.length, CODE_A.length + CODE_B.length)}</span>
					<span style={{color: dim}}>{shown.slice(CODE_A.length + CODE_B.length)}</span>
					<span style={{display: 'inline-block', width: 8, height: 90, background: blink ? BRAND : 'transparent', verticalAlign: -14, marginLeft: 6}} />
				</div>
				<div style={{position: 'absolute', left: 150, top: 400, ...code(24, dim)}}>index.html</div>
			</div>

			{/* C */}
			<div style={{position: 'absolute', inset: 0, ...show(SPLIT, MONTAGE)}}>
				<Split x={x}>
					{(mode) => <Stage piece="mosaic" theme={mode} zoom={1.5} width={1920} height={1080} p={{digest: t > 0.5, density: Math.round(35 + 30 * t)}} />}
				</Split>
				<div style={{position: 'absolute', left: x - 1, top: 0, bottom: 0, width: 2, background: BRAND}} />
				<div
					style={{
						position: 'absolute',
						left: x - 26,
						top: 522,
						width: 52,
						height: 52,
						borderRadius: 99,
						background: BRAND,
						boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
						display: 'grid',
						placeItems: 'center',
						color: 'white',
						fontFamily: MONO,
						fontSize: 22,
					}}
				>
					{'‹›'}
				</div>
				<div style={{position: 'absolute', left: x - 24, top: 110, translate: '-100% 0', ...label(22, 'rgba(0,0,0,0.6)')}}>light</div>
				<div style={{position: 'absolute', left: x + 24, top: 110, ...label(22, 'rgba(255,255,255,0.7)')}}>dark</div>
				{frame >= SPLIT && frame < MONTAGE ? (
					<Cursor
						keys={[
							{f: 4, x: 1300, y: 900},
							{f: 22, x: 966, y: 548},
							{f: 52, x: 446, y: 548},
							{f: 84, x: 1506, y: 548},
							{f: 112, x: 1186, y: 548},
						].map((k) => ({...k, f: k.f + SPLIT}))}
						clicks={[22 + SPLIT]}
						appear={4 + SPLIT}
						scale={1.6}
					/>
				) : null}
			</div>

			{/* D — all three shots stay mounted from the start of C */}
			<div style={{position: 'absolute', inset: 0, background: shotMode === 'light' ? 'white' : T.semantic.dark.surface.base, ...show(MONTAGE, Infinity)}}>
				{SHOTS.map(([props, zoom], i) => {
					const mode: Mode = i === shot ? shotMode : 'light';
					return (
						<Stage
							key={i}
							piece="widget"
							theme={mode}
							zoom={zoom}
							width={1920}
							height={1080}
							p={props(mode)}
							style={{position: 'absolute', inset: 0, opacity: i === shot ? 1 : 0}}
						/>
					);
				})}
				<div style={{position: 'absolute', right: 64, bottom: 110, ...code(26, shotMode === 'light' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.7)')}}>
					{`data-theme="${shotMode}"`}
				</div>
			</div>

		</Bg>
	);
};
