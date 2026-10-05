import G from '../../stage/src/wall/geometry.json';

// The stage page's full size (piece `wall`).
export const PAGE_W = G.margin * 2 + G.cols * (G.unitW + G.gap) - G.gap;
export const PAGE_H = G.margin * 2 + G.rows * (G.unitH + G.gap) - G.gap;
