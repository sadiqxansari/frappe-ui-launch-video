import React from 'react';
import {useCurrentFrame} from '../lib/player';
import {Bg, Headline, Split} from '../components/Common';
import {Cursor} from '../components/Cursor';
import {Stage} from '../components/Stage';
import {BEAT, inOut, kf, prog, spr, typed} from '../lib/anim';
import {BRAND, code, label, Mode, MONO, night, T} from '../theme';
import {DIVE_K} from './S8Playground';

// ─── Parts (scene frames) ────────────────────────────────────────────────
// A — montage on the playground's dot grid, each shot flipping theme
const SHOT = BEAT * 2;
const MONT_END = BEAT + SHOT * 4;
// B — the last shot shrinks into its tile; the grid lands around it
const OUT = MONT_END;
const OUT_LEN = 48;
const MORPH_TILE = 5; // Checkbox: column 1, row 1
// C — the attribute, typed; a light/dark divider dragged across the grid
const CODE = BEAT * 11;
const SPLIT = BEAT * 13;
// D — pull back to the wall
const WALL = BEAT * 18;

// ─── A: the montage ──────────────────────────────────────────────────────
// Opens on the playground's Button at the dive's final framing, then cuts on
// the beat. Each shot flips half way; they alternate so the last ends light.
type Shot = {p: (m: Mode) => Record<string, unknown>; k: number; from: Mode; at: number; len: number; flip: boolean};
const SHOTS: Shot[] = [
	{p: () => ({kind: 'deploy'}), k: DIVE_K, from: 'light', at: 0, len: BEAT, flip: false},
	{p: (m) => ({kind: 'switch', on: m === 'dark'}), k: 6, from: 'light', at: BEAT, len: SHOT, flip: true},
	{p: () => ({kind: 'badges'}), k: 4, from: 'dark', at: BEAT + SHOT, len: SHOT, flip: true},
	{p: () => ({kind: 'form', value: 'Quarterly review'}), k: 3.2, from: 'light', at: BEAT + SHOT * 2, len: SHOT, flip: true},
	{p: (m) => ({kind: 'checkbox', a: true, b: m === 'light'}), k: 4, from: 'dark', at: BEAT + SHOT * 3, len: SHOT, flip: true},
];
const other = (m: Mode): Mode => (m === 'light' ? 'dark' : 'light');

// ─── B–D: the grid of twelve, then the wall ──────────────────────────────
const COLS = 4;
const TW = 433;
const TH = 222;
const GAP = 20;
const TOP = 268;
const PX = TW + GAP; // wall pitch
const PY = TH + GAP;

// The twelve: none of them is in the montage, except Checkbox, which the
// montage's last shot becomes.
type Tile = {name: string; widget?: (g: number) => Record<string, unknown>; story?: string; w?: number; h?: number; zoom?: number};
const TILES: Tile[] = [
	{name: 'Slider', widget: (g) => ({kind: 'slider', value: Math.round(kf(g, [BEAT, BEAT * 3, BEAT * 5], [20, 75, 45]))}), zoom: 1.7},
	{name: 'Password', story: 'Password_NewPassword', w: 198, h: 74},
	{name: 'TabButtons', widget: (g) => ({kind: 'tabbuttons', active: g < BEAT * 2 ? 0 : g < BEAT * 4 ? 1 : 2}), zoom: 2},
	{name: 'Duration', story: 'Duration_SlaPolicy', w: 367, h: 130},
	{name: 'Tooltip', widget: (g) => ({kind: 'tooltip', open: g >= BEAT * 2}), zoom: 1.9},
	// the montage's last shot shrinks into this tile
	{name: 'Checkbox', widget: () => ({kind: 'checkbox', a: true, b: true}), zoom: 1.8},
	{name: 'Progress', widget: (g) => ({kind: 'progress', value: Math.round(kf(g, [0, BEAT * 5], [10, 82]))}), zoom: 1.6},
	{name: 'FileUploader', story: 'FileUploader_Attachments', w: 320, h: 136},
	{name: 'Rating', widget: (g) => ({kind: 'rating', value: Math.floor(kf(g, [BEAT, BEAT * 3], [0, 4.99]))}), zoom: 2.2},
	{name: 'Textarea', story: 'Textarea_CommentBox', w: 260, h: 113},
	{name: 'Toast', widget: (g) => ({kind: 'toast', show: g >= BEAT, title: 'Invite sent', body: 'mei@acme.co can join now.'}), zoom: 1.05},
	{name: 'Spinner', story: 'Spinner_SyncStatus', w: 320, h: 43},
];

// The wall around the twelve: docs stories (real frappe-ui examples), 7 × 5
// cells with the twelve at columns 1–4, rows 1–3. [story, label, col, row,
// colSpan, rowSpan, natural width, natural height]
const STORIES: [string, string, number, number, number, number, number, number][] = [
	['Button_SelectionToolbar', 'Button', 0, 0, 2, 1, 504, 40],
	['Button_StackedActions', 'Button', 2, 0, 1, 1, 232, 64],
	['Breadcrumbs_PageHeader', 'Breadcrumbs', 3, 0, 2, 1, 582, 80],
	['Avatar_Assignees', 'Avatar', 5, 0, 1, 1, 336, 146],
	['TextInput_Search', 'TextInput', 6, 0, 1, 1, 240, 28],
	['Progress_Onboarding', 'Progress', 0, 1, 1, 2, 320, 269],
	['Checkbox_SettingsList', 'Checkbox', 0, 3, 1, 1, 320, 151],
	['Tabs_Underline', 'Tabs', 5, 1, 2, 1, 496, 80],
	['Alert_Banners', 'Alert', 5, 2, 1, 2, 298, 360],
	['Switch_Icons', 'Switch', 6, 2, 1, 1, 320, 78],
	['Slider_Range', 'Slider', 6, 3, 1, 1, 240, 69],
	['Avatar_Presence', 'Avatar', 0, 4, 1, 1, 240, 128],
	['Badge_Reactions', 'Badge', 1, 4, 2, 1, 448, 66],
	['Skeleton_List', 'Skeleton', 3, 4, 1, 1, 256, 196],
	['KeyboardShortcut_PaletteFooter', 'KeyboardShortcut', 4, 4, 2, 1, 500, 42],
	['Badge_RowTags', 'Badge', 6, 4, 1, 1, 414, 81],
];
const WIDTHS: Record<string, number> = {
	TextInput_Search: 240,
	Textarea_CommentBox: 260,
	KeyboardShortcut_PaletteFooter: 500,
	Checkbox_SettingsList: 320,
	Radio_SettingsList: 320,
	Slider_Range: 240,
};
const fit = (tw: number, th: number, w: number, h: number) => Math.min(1.6, (tw - 40) / w, (th - 50) / h);

// Wall cell (c, r) sits at o + s·(c·PX, r·PY). At s = 1 the twelve are where
// they land; at S_END the whole 7 × 5 wall fits under the headline. Scaling
// about one fixed point P joins the two.
const S_END = 1792 / (7 * PX - GAP);
const O1 = {x: 64 - PX, y: TOP - PY};
const O2 = {x: 64, y: 300};
const P = {x: (O2.x - S_END * O1.x) / (1 - S_END), y: (O2.y - S_END * O1.y) / (1 - S_END)};

const ATTR_A = '<html data-theme="';
const ATTR_B = 'dark';
const ATTR_C = '">';

/**
 * Components. Opens where the playground's dive ends: its Button on the dot
 * grid. Real components cut in on the beat, each flipping light ↔ dark half
 * way, the page under them flipping too. The last lands light and the camera
 * pulls back to a grid of twelve others. One attribute is typed; a divider
 * dragged across the grid shows every one of them in both themes. Then the
 * camera pulls back again to a wall of real docs examples.
 */
export const S7Components: React.FC = () => {
	const frame = useCurrentFrame();
	const g = frame - OUT; // grid time

	// A
	const shot = SHOTS.reduce((cur, s, i) => (frame >= s.at ? i : cur), 0);
	const sh = SHOTS[shot];
	const shotMode: Mode = sh.flip && frame - sh.at >= sh.len / 2 ? other(sh.from) : sh.from;

	// C — the divider
	const f = frame - SPLIT;
	const x =
		frame < SPLIT
			? 1920
			: f < 24
				? 1920 - 960 * prog(f, 0, 24, inOut)
				: f < 140
					? kf(f, [24, 52, 84, 112], [960, 440, 1500, 1180])
					: 1180 + 740 * prog(f, 140, 30, inOut);
	const attr = typed(frame, ATTR_A + ATTR_B + ATTR_C, CODE, 2.3);
	const attrOut = prog(frame, WALL - 10, 16);

	// D
	const wallScale = kf(frame, [WALL, WALL + BEAT * 3], [1, S_END], inOut);

	const grid = (mode: Mode) => {
		const sem = T.semantic[mode];
		const dim = mode === 'light' ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.55)';
		return (
			<div style={{position: 'absolute', inset: 0, background: mode === 'light' ? T.ramps.gray['100'] : night}}>
				{/* the attribute, typed over the grid */}
				<div style={{position: 'absolute', left: 64, top: 128, fontFamily: MONO, fontSize: 52, letterSpacing: '-0.02em', whiteSpace: 'pre', opacity: 1 - attrOut}}>
					<span style={{color: dim}}>{attr.slice(0, ATTR_A.length)}</span>
					<span style={{color: BRAND}}>{attr.slice(ATTR_A.length, ATTR_A.length + ATTR_B.length)}</span>
					<span style={{color: dim}}>{attr.slice(ATTR_A.length + ATTR_B.length)}</span>
				</div>
				<div style={{position: 'absolute', left: 0, top: 0, transformOrigin: `${P.x}px ${P.y}px`, scale: String(wallScale)}}>
					{mode === 'light'
						? STORIES.map(([name, lbl, c, r, cs, rs, w, h]) => {
								const tw = cs * PX - GAP;
								const th = rs * PY - GAP;
								return (
									<Card
										key={name}
										mode={mode}
										name={lbl}
										style={{left: O1.x + c * PX, top: O1.y + r * PY, width: tw, height: th, opacity: prog(frame, WALL + 56 + (Math.abs(c - 2.5) + Math.abs(r - 2)) * 3, 24)}}
									>
										<Stage piece="story" p={{name, w: WIDTHS[name]}} zoom={fit(tw, th, w, h)} width={tw} height={th - 30} style={{position: 'absolute', left: 0, top: 30}} />
									</Card>
								);
							})
						: null}
					{TILES.map((tile, i) => {
						const col = i % COLS;
						const row = Math.floor(i / COLS);
						const p = i === MORPH_TILE ? (g >= OUT_LEN ? 1 : 0) : spr(g, 8 + i * 3, 24, 0.22);
						return (
							<Card
								key={tile.name}
								mode={mode}
								name={tile.name}
								style={{left: 64 + col * PX, top: TOP + row * PY, width: TW, height: TH, opacity: i === MORPH_TILE ? p : Math.min(1, p * 2), scale: String(i === MORPH_TILE ? 1 : 0.92 + 0.08 * p)}}
							>
								{tile.widget ? (
									<Stage piece="widget" theme={mode} p={tile.widget(g)} zoom={tile.zoom!} width={TW} height={TH - 30} style={{position: 'absolute', left: 0, top: 30}} />
								) : (
									<Stage
										piece="story"
										theme={mode}
										p={{name: tile.story, w: WIDTHS[tile.story!]}}
										zoom={fit(TW, TH, tile.w!, tile.h!)}
										width={TW}
										height={TH - 30}
										style={{position: 'absolute', left: 0, top: 30}}
									/>
								)}
							</Card>
						);
					})}
				</div>
				<Headline lines={['50+ components.']} at={WALL + 30} size={84} color={sem.ink['gray-9']} style={{left: 64, top: 130}} />
			</div>
		);
	};

	return (
		<Bg color={T.ramps.gray['100']} mode="light">
			{/* B–D: mounted from the start (hidden) so every page is loaded */}
			<div style={{position: 'absolute', inset: 0, opacity: frame >= OUT ? 1 : 0}}>
				<Split x={x} bg={false}>
					{grid}
				</Split>
				{frame >= SPLIT && frame < SPLIT + 175 ? (
					<>
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
								...code(22),
							}}
						>
							{'‹›'}
						</div>
						<Cursor
							keys={[
								{f: 4, x: 1300, y: 900},
								{f: 22, x: 966, y: 548},
								{f: 52, x: 446, y: 548},
								{f: 84, x: 1506, y: 548},
								{f: 112, x: 1186, y: 548},
								{f: 140, x: 1186, y: 548},
								{f: 170, x: 1600, y: 900},
							].map((k) => ({...k, f: k.f + SPLIT}))}
							clicks={[22 + SPLIT]}
							appear={4 + SPLIT}
							hide={SPLIT + 150}
							scale={1.6}
						/>
					</>
				) : null}
			</div>

			{/* A: every shot stays mounted from the start; only the current one shows */}
			{SHOTS.slice(0, -1).map((s, i) => {
				const on = i === shot;
				const m: Mode = on ? shotMode : s.from;
				return (
					<div key={i} style={{position: 'absolute', inset: 0, opacity: on ? 1 : 0, ...dots(on ? shotMode : 'light')}}>
						<Stage piece="widget" theme={m} zoom={s.k} width={1920} height={1080} p={s.p(m)} style={{position: 'absolute', inset: 0}} />
					</div>
				);
			})}
			{/* The last shot is a card from the start: full frame on the dot grid,
			    then it shrinks into its tile in the grid, zoom and all. */}
			{frame < OUT + OUT_LEN
				? (() => {
						const last = SHOTS[SHOTS.length - 1];
						const on = shot === SHOTS.length - 1;
						const m: Mode = on ? shotMode : last.from;
						const t = prog(frame, OUT, OUT_LEN, inOut);
						const lerp = (a: number, b: number) => a + (b - a) * t;
						const tile = {x: 64 + (MORPH_TILE % COLS) * PX, y: TOP + Math.floor(MORPH_TILE / COLS) * PY};
						const box = {x: lerp(0, tile.x), y: lerp(0, tile.y), w: lerp(1920, TW), h: lerp(1080, TH)};
						const head = lerp(0, 30); // room for the tile's name
						const zoom = Math.exp(lerp(Math.log(last.k), Math.log(TILES[MORPH_TILE].zoom!)));
						const sem = T.semantic[m];
						return (
							<div
								style={{
									position: 'absolute',
									left: box.x,
									top: box.y,
									width: box.w,
									height: box.h,
									borderRadius: lerp(0, 18),
									overflow: 'hidden',
									background: sem.surface.base,
									boxShadow: `0 0 0 1px rgba(0,0,0,${0.06 * t})`,
									opacity: on ? 1 : 0,
								}}
							>
								<div style={{position: 'absolute', inset: 0, ...dots(m), backgroundPosition: `${box.w / 2 - (14 * DIVE_K) / 2}px ${box.h / 2 - (14 * DIVE_K) / 2}px`, opacity: 1 - t}} />
								<div style={{position: 'absolute', left: 20, top: 16, ...label(17, sem.ink['gray-5']), opacity: prog(frame, OUT + OUT_LEN - 16, 16)}}>{TILES[MORPH_TILE].name}</div>
								<Stage piece="widget" theme={m} zoom={zoom} width={box.w} height={box.h - head} p={last.p(m)} style={{position: 'absolute', left: 0, top: head}} />
							</div>
						);
					})()
				: null}
		</Bg>
	);
};

/**
 * The playground preview's dot grid (14px pitch, 1px dots) at the dive's end
 * scale, centred: one grid for every shot, as if the camera never left it.
 */
const dots = (mode: Mode): React.CSSProperties => {
	const k = DIVE_K;
	const pitch = 14 * k;
	return {
		// longhands only: React drops longhands mixed with the shorthand on update
		backgroundColor: T.semantic[mode].surface.base,
		backgroundImage: `radial-gradient(circle, ${mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'} ${k}px, transparent ${k}px)`,
		backgroundSize: `${pitch}px ${pitch}px`,
		backgroundPosition: `${960 - pitch / 2}px ${540 - pitch / 2}px`,
	};
};

/** One tile: the card and its name, in the theme it is painted in. */
const Card: React.FC<{mode: Mode; name: string; style: React.CSSProperties; children: React.ReactNode}> = ({mode, name, style, children}) => {
	const sem = T.semantic[mode];
	return (
		<div
			style={{
				position: 'absolute',
				borderRadius: 18,
				background: sem.surface.base,
				boxShadow: `0 0 0 1px ${sem.outline['gray-1']}`,
				overflow: 'hidden',
				...style,
			}}
		>
			<div style={{position: 'absolute', left: 20, top: 16, ...label(17, sem.ink['gray-5'])}}>{name}</div>
			{children}
		</div>
	);
};

