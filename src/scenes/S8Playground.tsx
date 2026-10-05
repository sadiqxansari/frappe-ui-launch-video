import React, {useState} from 'react';
import {useCurrentFrame} from '../lib/player';
import {Bg, Headline} from '../components/Common';
import {Cursor} from '../components/Cursor';
import {Stage, Targets} from '../components/Stage';
import {BEAT, inOut, prog} from '../lib/anim';
import {ink, paper} from '../theme';

const Z = 1.45;
const PX = 64; // page position on screen
const PY = 184;
const PW = 1920 - PX;
const PH = 1080 - PY;

// Where the controls sit if the page has not reported yet (iframe px)
const FALLBACK: Targets = {
	solid: {x: 894, y: 330},
	red: {x: 950, y: 407},
	lg: {x: 1020, y: 484},
	iconLeft: {x: 1258, y: 547},
	label: {x: 990, y: 250},
	gray: {x: 894, y: 407},
	subtle: {x: 952, y: 330},
};
// The live Button in the preview, centred in it (iframe px)
const PREVIEW = {x: 564, y: 380};

// Clicks land on beats. The Button goes solid, red, large, gains an icon and
// a new label, then comes back to subtle gray: the Button the montage opens on.
const C = {solid: BEAT * 1, red: BEAT * 2, lg: BEAT * 3, icon: BEAT * 4, label: BEAT * 5, gray: BEAT * 6.5, subtle: BEAT * 7.5};
const DIVE = BEAT * 8.5; // the camera dives into the Button
const DIVE_END = BEAT * 11; // the scene's end; the montage opens on this exact framing
export const DIVE_K = 3.7; // page px → screen px at the end of the dive (the montage's first shot)

/**
 * Playground. The real docs playground (PlaygroundFrame with
 * Button.playground.vue). The cursor walks the knobs on the beat and the page
 * clicks its own controls. Then the camera dives into the live Button until
 * it fills the frame on its dot grid, where the component montage picks up.
 */
export const S8Playground: React.FC = () => {
	const frame = useCurrentFrame();
	const [targets, setTargets] = useState<Targets>(FALLBACK);
	const t = (k: string) => {
		const v = targets[k] ?? FALLBACK[k]!;
		return {x: PX + v.x, y: PY + v.y};
	};

	const labelText = frame < C.label + 8 ? 'Save' : 'Deploy'.slice(0, Math.max(0, Math.floor((frame - C.label - 8) / 3)));
	const knobs = {
		variant: frame >= C.solid && frame < C.subtle ? 'solid' : 'subtle',
		theme: frame >= C.red && frame < C.gray ? 'red' : 'gray',
		size: frame >= C.lg ? 'lg' : 'sm',
		iconLeft: frame >= C.icon,
		loading: false,
		label: labelText,
	};

	const keys = [
		{f: 0, x: 900, y: 760},
		{f: C.solid - 2, ...t('solid')},
		{f: C.red - 2, ...t('red')},
		{f: C.lg - 2, ...t('lg')},
		{f: C.icon - 2, ...t('iconLeft')},
		{f: C.label - 2, ...t('label')},
		{f: C.gray - 2, ...t('gray')},
		{f: C.subtle - 2, ...t('subtle')},
		{f: DIVE + 20, x: 1500, y: 1000},
	];

	// The dive: scale about the preview Button, easing in, until the page is
	// DIVE_K× with the Button centred: the montage's first frame, exactly.
	const focus = {x: PX + Z * PREVIEW.x, y: PY + Z * PREVIEW.y};
	const dive = prog(frame, DIVE, DIVE_END - 6 - DIVE, inOut);
	const scale = Math.exp(Math.log(DIVE_K / Z) * dive);
	const toCenter = dive;
	const shift = {x: (960 - focus.x) * toCenter, y: (540 - focus.y) * toCenter};

	return (
		<Bg color={paper}>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					transformOrigin: `${focus.x}px ${focus.y}px`,
					transform: `translate(${shift.x}px, ${shift.y}px) scale(${scale})`,
				}}
			>
				<Headline lines={['Every prop, live on the page.']} at={8} size={60} color={ink} style={{left: 64, top: 92}} />
				<div style={{position: 'absolute', left: PX, top: PY, borderTopLeftRadius: 14, overflow: 'hidden', boxShadow: '0 0 0 1px rgba(128,128,128,0.25), 0 40px 80px -30px rgba(0,0,0,0.35)'}}>
					<Stage piece="docs" theme="light" zoom={Z} width={PW} height={PH} p={{knobs, dark: false}} onTargets={setTargets} />
				</div>
			</div>
			<Cursor
				keys={keys}
				clicks={[C.solid, C.red, C.lg, C.icon, C.label, C.gray, C.subtle]}
				appear={4}
				hide={DIVE}
				scale={1.1}
			/>
		</Bg>
	);
};
