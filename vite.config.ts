import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// Which composition the page shows, and which of its frames, is fixed at build
// time from the environment:
//   COMP  composition id (src/compositions.ts), default the whole film
//   FROM  first frame, default 0
//   TO    frame to stop before, default the composition's end
//   OUT   build directory, default dist
const env = process.env;

const comp = env.COMP ?? 'FrappeUILaunch';
// the score is off for now: set to true to render the film with it
export const WITH_SCORE = true;

// The film's score (scripts/score.py) as a HyperFrames audio track. It goes
// in the page's HTML, where HyperFrames looks for it, trimmed to start at the
// first frame this build renders.
const score = {
	name: 'score',
	transformIndexHtml(html: string, ctx: {path: string}) {
		if (!WITH_SCORE || comp !== 'FrappeUILaunch' || !ctx.path.endsWith('/index.html')) return html;
		const from = Number(env.FROM ?? 0) / 60;
		return html.replace(
			'<div id="film"></div>',
			`<div id="film"></div>\n\t\t\t<audio src="./audio/score.wav" data-start="0" data-media-start="${from}" data-track-index="0" data-volume="1"></audio>`,
		);
	},
};

export default defineConfig({
	base: './',
	plugins: [react(), score],
	define: {
		__COMP__: JSON.stringify(comp),
		__FROM__: String(Number(env.FROM ?? 0)),
		__TO__: String(Number(env.TO ?? 0)),
	},
	build: {outDir: env.OUT ?? 'dist', emptyOutDir: true, assetsInlineLimit: 0, chunkSizeWarningLimit: 4000},
});
