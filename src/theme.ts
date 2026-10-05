import {loadFont, loadMono} from './lib/fonts';
import type React from 'react';
import {staticFile} from './lib/player';
import tokens from './data/tokens.json';

// Every colour, radius and shadow in the film comes from frappe-ui's own
// tokens (src/data/tokens.json, exported from tailwind/tokens.js).
export const T = tokens as unknown as {
	ramps: Record<string, Record<string, string>>;
	rampsDark: Record<string, Record<string, string>>;
	semantic: Record<'light' | 'dark', Record<string, Record<string, string>>>;
	radius: Record<string, string>;
	shadows: Record<string, string>;
	fontSize: Record<string, {fontSize: string; lineHeight: string; letterSpacing: string; fontWeight: number}>;
};

export type Mode = 'light' | 'dark';

/** The `--surface-*`, `--ink-*`, `--outline-*` variables for one theme, as a style object. */
export const themeVars = (mode: Mode): React.CSSProperties => {
	const out: Record<string, string> = {};
	for (const [cat, entries] of Object.entries(T.semantic[mode])) {
		for (const [name, value] of Object.entries(entries)) out[`--${cat}-${name}`] = value;
	}
	return out as React.CSSProperties;
};

/** Shorthand for a semantic token variable: v('surface-gray-2'). */
export const v = (name: string) => `var(--${name})`;

export const BRAND = '#B352FF'; // the Frappe UI mark
export const RAMP_NAMES = ['gray', 'blue', 'green', 'red', 'orange', 'amber', 'yellow', 'teal', 'cyan', 'purple', 'pink', 'violet'];
export const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

export const paper = T.ramps.gray['50'];
export const ink = T.ramps.gray['900'];
export const night = 'oklch(0.168 0 0)';

export const FONT = 'Inter Variable';
loadFont({family: FONT, url: staticFile('fonts/Inter.var.woff2'), weight: '100 900'});
export const MONO = loadMono().fontFamily;

/** Display type: Inter with the tight tracking big sizes need. */
export const disp = (size: number, weight = 600): React.CSSProperties => ({
	fontFamily: FONT,
	fontSize: size,
	fontWeight: weight,
	letterSpacing: `${size >= 120 ? -0.045 : size >= 60 ? -0.03 : -0.015}em`,
	lineHeight: 1,
	fontFeatureSettings: '"cv11", "ss01"',
});

/** Labels and captions: Inter, set the way frappe-ui's type tokens set it. */
export const label = (size = 20, color?: string): React.CSSProperties => ({
	fontFamily: FONT,
	fontSize: size,
	fontWeight: 420,
	letterSpacing: '0.01em',
	lineHeight: 1.35,
	fontFeatureSettings: '"cv11", "ss01"',
	color,
});

/** Code only (a class name, a token, an attribute, a command): mono. */
export const code = (size = 20, color?: string): React.CSSProperties => ({
	fontFamily: MONO,
	fontSize: size,
	fontWeight: 400,
	letterSpacing: '0.02em',
	lineHeight: 1.2,
	color,
});
