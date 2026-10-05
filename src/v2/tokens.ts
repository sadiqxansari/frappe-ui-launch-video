import type React from 'react';
import {Mode, T} from '../theme';

// Token lookups for the v2 film, by the names frappe-ui's classes use.

export const surface = (mode: Mode, k: string) => T.semantic[mode].surface[k];
export const inkT = (mode: Mode, k: string) => T.semantic[mode].ink[k];
export const outline = (mode: Mode, k: string) => T.semantic[mode].outline[k];
export const px = (s: string) => parseFloat(s);

export const PAPER: Record<Mode, string> = {light: T.ramps.gray['50'], dark: 'oklch(0.168 0 0)'};

/** Inter as frappe-ui sets it (same font file, same optical size). */
export const inter = (size: number, weight = 420, tracking = 0.02): React.CSSProperties => ({
	fontFamily: 'Inter Variable',
	fontSize: size,
	fontWeight: weight,
	letterSpacing: `${tracking}em`,
	fontVariationSettings: "'opsz' 24",
	WebkitFontSmoothing: 'antialiased',
});

export const TYPE_STEPS = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'].map((k) => ({
	k,
	size: px(T.fontSize[k].fontSize),
	tracking: parseFloat(T.fontSize[k].letterSpacing),
}));

export const RADII = Array.from({length: 10}, (_, i) => ({k: String(i), r: px(T.radius[String(i)])}));
export const SHADOWS = ['sm', 'base', 'md', 'lg', 'xl', '2xl'];
export const HUES = ['gray', 'blue', 'green', 'red', 'orange', 'amber', 'yellow', 'teal', 'cyan', 'purple', 'pink', 'violet'];
export const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
/** The gray row, as the surface tokens a page is painted with. */
export const SURFACES = ['base', ...Array.from({length: 10}, (_, i) => `gray-${i + 1}`)];
