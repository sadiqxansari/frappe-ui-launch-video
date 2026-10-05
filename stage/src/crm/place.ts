// A block's placement, as the film sends it (p.at[id]): offset, scale,
// opacity and how high in the air it still is (sh, 0 = set down). Height
// reads as a soft drop shadow that follows the block's own shape. When the
// film tilts the page, it passes the shadow's own offset and blur (shx, shy,
// shb) so the shadow stays on the page where the block was.
// bg: the surface the block sits on ('base' or 'sidebar'), filled in behind it
// while it is lifted, so it rises as a solid tile rather than bare text.
export type Placed = { x?: number; y?: number; s?: number; o?: number; sh?: number; shx?: number; shy?: number; shb?: number; bg?: 'base' | 'sidebar' }
export const placeStyle = (a: Placed = {}) => ({
  transform: `translate(${a.x ?? 0}px, ${a.y ?? 0}px) scale(${a.s ?? 1})`,
  opacity: a.o ?? 1,
  backgroundColor: a.bg ? (a.bg === 'sidebar' ? 'var(--surface-gray-1)' : 'var(--surface-base)') : undefined,
  borderRadius: a.bg ? '6px' : undefined,
  filter: a.sh
    ? `drop-shadow(${(a.shx ?? 0).toFixed(2)}px ${(a.shy ?? 14 * a.sh).toFixed(2)}px ${(a.shb ?? 18 * a.sh).toFixed(2)}px rgba(0,0,0,${(0.16 * Math.min(1, a.sh)).toFixed(3)}))`
    : undefined,
})
