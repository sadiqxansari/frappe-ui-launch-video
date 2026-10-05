import React from 'react';
import {Img, staticFile, useCurrentFrame} from '../lib/player';
import {Mark} from '../components/Hud';
import {Stage} from '../components/Stage';
import {inOut, inn, kf, prog, spr} from '../lib/anim';
import {BRAND, disp, ink, label, MONO} from '../theme';
import {PAPER} from './tokens';
import {PEOPLE} from './StageThree';

// The apps frappe-ui was pulled out of, and is now inside (README "Used
// by"). CRM first: it is the one on screen. Below it, the apps whose recipe
// we show, nearest first; above it, the rest.
type App = {name: string; file: string; recipe?: string};
const RECIPES: App[] = [
	{name: 'Gameplan', file: 'gameplan.svg', recipe: 'discussions'},
	{name: 'Mail', file: 'mail.svg', recipe: 'mail'},
	{name: 'Drive', file: 'drive.svg', recipe: 'files'},
	{name: 'Helpdesk', file: 'helpdesk.svg', recipe: 'tickets'},
];
const OTHERS: App[] = [
	{name: 'Frappe HR', file: 'hrms.svg'},
	{name: 'Insights', file: 'products/insights4fcfaa.png'},
	{name: 'Frappe Cloud', file: 'fc.svg'},
	{name: 'Learning', file: 'products/learning.png'},
];
// the column, top to bottom, with each app's place relative to CRM
const COLUMN = [...[...OTHERS].reverse(), {name: 'CRM', file: 'crm.svg'}, ...RECIPES].map((a, j) => ({...a, r: j - OTHERS.length, j}));
// Every app icon is a rounded square with corners 2/7 of its side.
const CORNER = 2 / 7;

const LIGHT = 14; // the deal page, as stage three left it, goes light at once
// and slides right, to become CRM's recipe, as the rail of apps slides in
// from the left: CRM in the centre, the others above and below, greyed out
const SIDE = 34;
// then the column moves up one app at a time: the one below CRM comes
// into the centre, and its recipe comes in on the right
const STEP = SIDE + 44 + 45;
const HOLD = 85; // each recipe, on screen
const STEPS = RECIPES.map((_, i) => STEP + i * HOLD);
const MOVE = 40;
const RING = STEPS[STEPS.length - 1] + HOLD; // then the rail bends into a ring, Helpdesk at its left
const FOLD = RING + 110; // and fold into the mark
const LOCKUP = FOLD + 86; // the lockup: the name opens out of the mark
const R = 330;
const ARC = (2 * Math.PI * R) / 9; // between apps on the ring
const BEND = 70;
const W = 1600; // the deal page, page px
const H = 900;
const SIZE = 120;
const SMALL = 84; // an app not in focus
const COL_X = 110;
const GAP = 150; // between apps in the column
const LOOP = COLUMN.length;
const REC = {k: 0.972, x: 285, w: 1600, h: 900}; // the deal page's own size // the recipe, to the column's right
const LOCK_MARK = {x: 452, y: 470}; // where the mark sits in the lockup
export const END_LEN = LOCKUP + 250;

/**
 * End. The deal page, from dark to light, slides right beside a rail of the
 * apps built on frappe-ui, CRM in focus; and one by one
 * the apps above come into the centre with their recipe beside them. Then
 * every app takes its place on a ring, turns once, and folds into the
 * Frappe UI mark, which opens into the lockup and the install line.
 */
export const End: React.FC = () => {
	const frame = useCurrentFrame();
	// the mark slides to where the lockup has it, and hands over to it
	const mx = kf(frame, [FOLD + 44, LOCKUP], [960, LOCK_MARK.x], inOut);
	const my = kf(frame, [FOLD + 44, LOCKUP], [540, LOCK_MARK.y], inOut);
	const ms = kf(frame, [FOLD + 14, LOCKUP], [150, 170], inOut);
	if (frame >= LOCKUP) return <Lockup f={frame - LOCKUP} />;

	// the deal page, full frame → CRM's recipe, on the right
	const side = prog(frame, SIDE, 44, inOut);
	const pk = 1.2 + (REC.k - 1.2) * side;
	const px = REC.x * side;
	const py = (540 - (REC.h * REC.k) / 2) * side;

	// the column: CRM to the left, then down one app per recipe
	const left = side;
	const pos = STEPS.reduce((a, f) => a + prog(frame, f, MOVE, inOut), 0);
	// a screen shows while its app is in the centre, and moves with the column
	const screen = (k: number) => ({o: Math.max(0, 1 - Math.abs(pos - k)) * (1 - prog(frame, RING, 24)), y: (k - pos) * 60});
	const crm = screen(0);

	// the ring
	const fold = prog(frame, FOLD, 34, inn);
	const markIn = spr(frame, FOLD + 14, 26, 0);

	// the rail bends into the ring: Helpdesk, in focus, holds the ring's left
	// while the column curls round, above and below, into a circle; then it turns
	const bend = prog(frame, RING, BEND, inOut);
	const spin = (Math.max(0, frame - RING - BEND) * 0.12 * Math.PI) / 180;
	const onRing = (d: number) => {
		const s = -d * (GAP + (ARC - GAP) * bend); // along the column (or the arc), up from Helpdesk
		const ax = COL_X + (960 - R - COL_X) * bend; // Helpdesk's place
		let x = ax;
		let y = 540 - s;
		if (bend > 0.001) {
			const rho = R / bend; // the column's curve tightens to the ring's
			x = ax + rho - rho * Math.cos(s / rho);
			y = 540 - rho * Math.sin(s / rho);
		}
		// and, once round, it turns
		const c = Math.cos(spin);
		const sn = Math.sin(spin);
		return {x: 960 + (x - 960) * c - (y - 540) * sn, y: 540 + (x - 960) * sn + (y - 540) * c};
	};


	return (
		<div style={{position: 'absolute', inset: 0, background: PAPER.light, overflow: 'hidden'}}>
			{/* the deal page, where stage three left it; CRM's screen from then on */}
			{frame < RING + 30 ? (
				<div
					style={{
						position: 'absolute',
						left: px,
						top: py + crm.y,
						width: W * pk,
						height: H * pk,
						overflow: 'hidden',
						borderRadius: 16 * side,
						opacity: crm.o,
						boxShadow: `0 0 0 1px rgba(0,0,0,${0.08 * side}), 0 24px 60px rgba(0,0,0,${0.12 * side})`,
					}}
				>
					<div style={{transformOrigin: '0 0', scale: String(pk)}}>
						<Stage piece="crm" theme={frame < LIGHT ? 'dark' : 'light'} width={W} height={H} p={{view: 'deal', nav: 'deals', faces: PEOPLE}} />
					</div>
				</div>
			) : null}

			{/* the recipes: each comes up from below as its app does, and goes on up (and back) */}
			{RECIPES.map((app, i) => {
				if (frame < STEPS[i] - 30 || frame > RING + 30) return null;
				const {o, y} = screen(i + 1);
				return (
					<div
						key={app.recipe}
						style={{
							position: 'absolute',
							left: REC.x,
							top: 540 - (REC.h * REC.k) / 2 + y,
							width: REC.w * REC.k,
							height: REC.h * REC.k,
							borderRadius: 16,
							overflow: 'hidden',
							opacity: o,
							boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 24px 60px rgba(0,0,0,0.12)',
						}}
					>
						<Stage piece="recipe" theme="light" zoom={REC.k} width={REC.w * REC.k} height={REC.h * REC.k} p={{name: app.recipe}} />
					</div>
				);
			})}

			{COLUMN.map((app) => {
				// in the column: its distance from the centre, in apps
				// a loop: an app leaving the top comes back in at the bottom
				const d = (((app.r - pos + LOOP / 2) % LOOP) + LOOP) % LOOP - LOOP / 2;
				const edge = Math.min(1, (LOOP / 2 - Math.abs(d)) * 2) * (1 - bend) + bend; // fades at the frame's edge as it wraps
				const focus = Math.max(0, 1 - Math.abs(d));
				const colX = -SIZE + (COL_X + SIZE) * left;
				const ring = bend;
				const at = frame >= RING ? onRing(d) : {x: colX, y: 540 + d * GAP};
				const {x, y} = at;
				const fx = x + (960 - x) * fold;
				const fy = y + (540 - y) * fold;
				const grey = (1 - focus) * (1 - ring);
				const size = (SMALL + (SIZE - SMALL) * Math.max(focus, ring)) * (1 - 0.75 * fold);
				const o = edge * (1 - 0.55 * grey) * (1 - prog(frame, FOLD + 24, 10));
				if (o <= 0.001 || fy < -SIZE || fy > 1080 + SIZE) return null;
				return (
					<Img
						key={app.name}
						src={staticFile(`logos/${app.file}`)}
						style={{
							position: 'absolute',
							left: fx - size / 2,
							top: fy - size / 2,
							width: size,
							height: size,
							borderRadius: size * CORNER,
							objectFit: 'cover',
							opacity: o,
							// follows the icon's own shape, so no box shows behind its corners
							filter: `grayscale(${grey}) drop-shadow(0 8px 10px rgba(0,0,0,${0.22 * (1 - grey)}))`,
						}}
					/>
				);
			})}

			{markIn > 0.001 ? (
				<div style={{position: 'absolute', left: mx, top: my, translate: '-50% -50%', scale: String(0.6 + 0.4 * markIn), opacity: Math.min(1, markIn * 2)}}>
					<Mark size={ms} />
				</div>
			) : null}
		</div>
	);
};

/**
 * The lockup, on the light page: the mark stays where it landed and the name
 * opens out beside it, as it did in the opening; then the install line.
 */
const Lockup: React.FC<{f: number}> = ({f}) => {
	const name = prog(f, 4, 40, inOut);
	const ver = prog(f, 26, 36, inOut);
	const q = prog(f, 64, 22);
	return (
		<div style={{position: 'absolute', inset: 0, background: PAPER.light}}>
			<div style={{position: 'absolute', left: LOCK_MARK.x, top: LOCK_MARK.y, translate: '-50% -50%'}}>
				<Mark size={170} />
			</div>
			<div style={{position: 'absolute', left: LOCK_MARK.x + 85, top: LOCK_MARK.y, translate: '0 -50%', display: 'flex', alignItems: 'center'}}>
				<div style={{maxWidth: 820 * name, overflow: 'hidden', paddingBottom: 30, marginBottom: -30}}>
					<div style={{...disp(170, 650), color: ink, whiteSpace: 'nowrap', paddingLeft: 40, translate: `${(1 - name) * -120}px 0`, opacity: Math.min(1, name * 1.5)}}>Frappe UI</div>
				</div>
				<div style={{maxWidth: 360 * ver, overflow: 'hidden', paddingBottom: 30, marginBottom: -30}}>
					<div style={{...disp(170, 650), color: BRAND, whiteSpace: 'nowrap', paddingLeft: 40, paddingRight: 20, translate: `${(1 - ver) * 140}px 0`, opacity: Math.min(1, ver * 1.5)}}>1.0</div>
				</div>
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: LOCK_MARK.y + 150, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, opacity: q, translate: `0 ${(1 - q) * 20}px`}}>
				<div style={{fontFamily: MONO, fontSize: 34, color: ink, padding: '16px 28px', borderRadius: 14, boxShadow: 'inset 0 0 0 1.5px rgba(0,0,0,0.15)'}}>npm install frappe-ui</div>
				<div style={{...label(34, 'rgba(0,0,0,0.55)')}}>ui.frappe.io</div>
			</div>
		</div>
	);
};
