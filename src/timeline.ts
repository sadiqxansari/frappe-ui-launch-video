import {BAR} from './lib/anim';

// Scene starts in bars (100 bpm, one bar = 144 frames at 60 fps).
// Every scene change lands on a beat (half bars are two beats).
const BARS = {
	mark: 0,
	beat1: 3, // typed: "It starts with color."
	color: 4.5,
	layers: 7.5,
	type: 9.5, // weight axis, weights, then leading / tracking / weight close-ups
	shape: 12.5,
	beat2: 14.5, // typed: "Then come the pieces."
	playground: 16, // one Button, every prop; dives into it
	components: 18.75, // montage on its dot grid (light ↔ dark), the grid, dark mode across it, the wall
	charts: 24.5, // the import typed, then a real dashboard of frappe-ui/charts
	agent: 30.25, // "What if you just asked?", one prompt, the app it builds
	recipes: 34.75, // straight on from the agent's app
	end: 37.5,
	total: 40.5,
};

export const S = Object.fromEntries(Object.entries(BARS).map(([k, b]) => [k, b * BAR])) as Record<keyof typeof BARS, number>;
export const SCENE_BARS = BARS;
