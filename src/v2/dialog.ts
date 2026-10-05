import G from '../../stage/src/wall/geometry.json';

// Where the stage page (piece `wall`) sits on the film's canvas, and where
// the dialog's pieces are on it. Measured once from the built page: the
// dialog is 512 × 460.28, centred in tile 0; its Create button sits
// 427.76, 404.28 from its top left, 60.24 × 28. The canvas keeps stage
// one's Button where it was (right edge x 24.97, centre y 0), so the page
// goes down with the Create button exactly on it.
export const SAVE_W = 49.94;
export const CREATE_W = 60.24;
export const RIGHT = SAVE_W / 2;

const t0 = G.tiles[0];
const home = {
	x: G.margin + t0.c * (G.unitW + G.gap),
	y: G.margin + t0.r * (G.unitH + G.gap),
	w: t0.w * G.unitW + (t0.w - 1) * G.gap,
	h: t0.h * G.unitH + (t0.h - 1) * G.gap,
};
const DC_P = {x: home.x + home.w / 2, y: home.y + home.h / 2};
export const PAGE = {x: DC_P.x - 256 + 427.76 + CREATE_W - RIGHT, y: DC_P.y - 230.14 + 404.28 + 14};

type Box = {x: number; y: number; w: number; h: number};
// Each piece's box relative to the dialog's top left (page px, measured).
const REL: Record<string, Box> = {
	org: {x: 24, y: 120.5, w: 224, h: 48.95},
	status: {x: 24, y: 250.39, w: 224, h: 48.95},
	close: {x: 24, y: 315.34, w: 224, h: 48.95},
};
const dialogTL = {x: DC_P.x - 256 - PAGE.x, y: DC_P.y - 230.14 - PAGE.y};
/** A piece's box where it belongs in the dialog, on the canvas. */
export const atomHome = (id: string): Box => ({...REL[id], x: dialogTL.x + REL[id].x, y: dialogTL.y + REL[id].y});
/** The input inside a piece: below its 20.94px label, 28 tall. */
export const CONTROL_Y = 20.94;

// At the end of stage one, three of the pieces sit above the Button (as they
// do in the dialog, over its Create), left aligned with it, one above the
// other; the last of them 16px clear of the Button's top.
export const STACK_IDS = ['org', 'status', 'close'];
export const stackBox = (i: number): Box => ({x: -RIGHT, y: -14 - 16 - 48.95 - (STACK_IDS.length - 1 - i) * 60, w: 224, h: 48.95});
/** The offset that takes a piece from its place in the dialog to the stack. */
export const stackOffset = (id: string) => {
	const h = atomHome(id);
	const s = stackBox(STACK_IDS.indexOf(id));
	return {x: s.x - h.x, y: s.y - h.y};
};
