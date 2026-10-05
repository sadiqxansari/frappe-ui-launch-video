import React from 'react';
import {useCurrentFrame} from '../lib/player';
import {Bg, Headline} from '../components/Common';
import {BAR, BEAT, inOut, kf, out, prog} from '../lib/anim';
import {BRAND, FONT, ink, code, label, paper, T} from '../theme';

const WEIGHTS: [number, string][] = [
	[420, 'Regular'],
	[500, 'Medium'],
	[600, 'Semibold'],
	[700, 'Bold'],
	[800, 'Black'],
];
// Part three: close-ups of the type tokens, measured
const RED = BRAND; // redlines, as on the mark

/**
 * 04 — Type. The weight axis sweeping on one giant glyph pair, the five
 * weights frappe-ui ships, then close-ups of the type tokens with redlines:
 * leading set by use, tracking set by size, and figures that hold still.
 */
export const S5Type: React.FC = () => {
	const frame = useCurrentFrame();

	if (frame < BEAT * 2) {
		const w = kf(frame, [4, 40, 66], [420, 800, 600], inOut);
		return (
			<Bg color={paper}>
				<div
					style={{
						position: 'absolute',
						left: 56,
						top: 60,
						fontFamily: FONT,
						fontSize: 800,
						fontWeight: w,
						letterSpacing: '-0.05em',
						lineHeight: 1,
						color: ink,
					}}
				>
					Aa
				</div>
				<div style={{position: 'absolute', right: 64, top: 420, width: 420}}>
					<div style={{...label(24, 'rgba(0,0,0,0.5)')}}>Inter Variable · wght</div>
					<div style={{fontFamily: FONT, fontSize: 150, fontWeight: 600, letterSpacing: '-0.04em', color: BRAND, fontVariantNumeric: 'tabular-nums'}}>
						{Math.round(w)}
					</div>
					<div style={{position: 'relative', height: 2, background: 'rgba(0,0,0,0.15)', marginTop: 20}}>
						<div
							style={{
								position: 'absolute',
								left: `${((w - 400) / 420) * 100}%`,
								top: -9,
								width: 20,
								height: 20,
								borderRadius: 99,
								background: BRAND,
								translate: '-50% 0',
							}}
						/>
					</div>
				</div>
			</Bg>
		);
	}

	if (frame < BAR) {
		const f = frame - BEAT * 2;
		return (
			<Bg color={paper}>
				<div style={{position: 'absolute', left: 64, top: 118}}>
					{WEIGHTS.map(([w, name], i) => {
						const p = prog(f, i * 6, 20, out);
						return (
							<div key={w} style={{display: 'flex', alignItems: 'baseline', gap: 36, height: 166, overflow: 'hidden'}}>
								<span style={{...label(22, 'rgba(0,0,0,0.45)'), width: 60}}>{w}</span>
								<span
									style={{
										fontFamily: FONT,
										fontSize: 150,
										fontWeight: w,
										letterSpacing: '-0.035em',
										color: ink,
										whiteSpace: 'nowrap',
										translate: `0 ${(1 - p) * 100}%`,
										lineHeight: 1.1,
									}}
								>
									Inter {name}
								</span>
							</div>
						);
					})}
				</div>
			</Bg>
		);
	}

	const f = frame - BAR;
	return <Setting f={f} />;
};

const tok = (k: string) => T.fontSize[k] as {fontSize: string; lineHeight: string; letterSpacing: string; fontWeight: number};

/**
 * One block of text, first in the browser's defaults, then set with
 * frappe-ui's tokens: purple slices show the space between letters, which
 * opens to text-base's 0.02em; they fade, and purple guides show the line
 * boxes, which open to text-p-base's 1.5. Then the text settles into its
 * finished colour. The text on the left; the change, on the right.
 */
const Setting: React.FC<{f: number}> = ({f}) => {
	const M = 4.5;
	const base = tok('base');
	const para = tok('p-base');
	const size = parseFloat(base.fontSize) * M;
	const ls = parseFloat(base.letterSpacing); // em
	const NORMAL = 1.21; // Inter's line-height: normal
	const LH = parseFloat(para.lineHeight);

	// beats
	const slicesIn = prog(f, 10, 14);
	const track = prog(f, 36, 30, inOut);
	const slicesOut = prog(f, 80, 16);
	const guidesIn = prog(f, 100, 14);
	const lead = prog(f, 120, 40, inOut);
	const guidesOut = prog(f, 176, 16);
	const finish = prog(f, 196, 30, inOut);

	const lsNow = ls * track;
	const lh = NORMAL + (LH - NORMAL) * lead;
	const pitch = size * lh;
	const titleH = size * (NORMAL + (parseFloat(base.lineHeight) - NORMAL) * lead);
	const GAP = 10 * M; // title to body
	const LEFT = 110;
	const TOP = 300;
	const slice = (1 - slicesOut) * slicesIn;
	const guide = (1 - guidesOut) * guidesIn;
	// the body starts in the title's ink and, once set, eases to a lighter gray
	const bodyColor = `color-mix(in oklab, ${ink} ${100 - 100 * finish}%, ${T.ramps.gray['700']})`;

	// each letter in its own box, with the space it gets after it shaded
	const spaced = (line: string, key: string) => (
		<div key={key} style={{height: key === 'title' ? titleH : pitch, lineHeight: `${key === 'title' ? titleH : pitch}px`, whiteSpace: 'pre'}}>
			{line.split('').map((ch, i) => (
				<span key={i} style={{position: 'relative', display: 'inline-block', letterSpacing: `${lsNow}em`}}>
					{ch === ' ' ? '\u00a0' : ch}
					<span style={{position: 'absolute', right: 0, top: '22%', bottom: '22%', width: Math.max(1.5, lsNow * size), background: RED, opacity: 0.85 * slice}} />
				</span>
			))}
		</div>
	);
	const LINES = ['Revenue is up 12% on last quarter,', 'most of it from annual plans, while', 'churn held steady at 2.1%.'];

	const Row: React.FC<{name: string; from: string; to: string; done: boolean}> = ({name, from, to, done}) => (
		<div style={{marginBottom: 64}}>
			<div style={{...label(28, 'rgba(0,0,0,0.6)')}}>{name}</div>
			<div style={{display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 10}}>
				<span style={{...code(48, ink)}}>{from}</span>
				<span style={{...code(34, 'rgba(0,0,0,0.5)')}}>→</span>
				<span style={{...code(48, done ? RED : ink)}}>{to}</span>
			</div>
		</div>
	);

	return (
		<Bg color={paper}>
			<Headline lines={['Same words. Set on purpose.']} at={0} size={56} color={ink} style={{left: 64, top: 80}} />

			<div style={{position: 'absolute', left: LEFT, top: TOP, fontFamily: FONT, fontSize: size, fontWeight: base.fontWeight, opacity: prog(f, 2, 14)}}>
				<div style={{fontWeight: 600, color: ink}}>{spaced('Quarterly review', 'title')}</div>
				<div style={{height: GAP}} />
				<div style={{color: bodyColor}}>{LINES.map((l, i) => spaced(l, `l${i}`))}</div>
			</div>
			{/* line boxes of the paragraph */}
			{[0, 1, 2, 3].map((k) => (
				<div
					key={k}
					style={{
						position: 'absolute',
						left: LEFT - 40,
						top: TOP + titleH + GAP + k * pitch,
						width: 1240,
						borderTop: '2px dashed #8B2BD9', // a deeper purple: these must read
						opacity: guide,
					}}
				/>
			))}

			<div style={{position: 'absolute', left: 1400, top: 330}}>
				<Row name="Letter spacing" from="0" to={`${ls}em`} done={track > 0.5} />
				<Row name="Line height" from="normal" to={String(LH)} done={lead > 0.5} />
			</div>
		</Bg>
	);
};
