import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {COMPOSITIONS} from './compositions';
import {FPS, FrameProvider, HEIGHT, WIDTH, pendingLabels, settled} from './lib/player';

// The film on HyperFrames' clock. The runtime fires `hf-seek` with a time on
// every seek (render, snapshot and Studio alike); we render that frame
// synchronously, then hold the capture (waitUntil) until the stage iframes
// have caught up. Which composition, and which of its frames, is fixed at
// build time (see vite.config.ts).

// Under the dev server this page has no clock; the review player is the way in.
if (import.meta.env.DEV) location.replace(`./review.html${location.hash}`);

const comp = COMPOSITIONS[__COMP__];
if (!comp) throw new Error(`No composition "${__COMP__}". Try one of: ${Object.keys(COMPOSITIONS).join(', ')}`);
const Component = comp.component;
const TO = __TO__ > 0 ? Math.min(__TO__, comp.durationInFrames) : comp.durationInFrames;

// The runtime boots at DOMContentLoaded, after this module: give it the length.
document.getElementById('root')!.setAttribute('data-duration', String((TO - __FROM__) / FPS));

const hf = ((window as any).__hf ??= {});
hf.buildReady ??= {};

let setFrame: (f: number) => void = () => {};
const App: React.FC = () => {
	const [frame, set] = React.useState(__FROM__);
	setFrame = set;
	return (
		<FrameProvider value={frame}>
			<div style={{position: 'relative', width: WIDTH, height: HEIGHT, overflow: 'hidden'}}>
				<Component />
			</div>
		</FrameProvider>
	);
};

const withTimeout = (p: Promise<void>, ms: number, what: () => string) =>
	Promise.race([p, new Promise<void>((_, rej) => setTimeout(() => rej(new Error(`still waiting after ${ms}ms: ${what()}`)), ms))]);

// Everything loaded (fonts, iframes) before HyperFrames calls the page ready.
hf.buildReady.film = new Promise<void>((resolve) => {
	createRoot(document.getElementById('film')!).render(<App />);
	setTimeout(() => withTimeout(settled(), 30000, () => pendingLabels().join(', ')).then(resolve, (e) => (console.error(e), resolve())), 0);
});

window.addEventListener('hf-seek', (e: Event) => {
	const {time, waitUntil} = (e as CustomEvent<{time: number; waitUntil: (p: PromiseLike<unknown>) => void}>).detail;
	const frame = Math.min(__FROM__ + Math.round(time * FPS), TO - 1);
	flushSync(() => setFrame(frame));
	waitUntil(
		withTimeout(settled(), 15000, () => `frame ${frame}: ${pendingLabels().join(', ')}`)
			// one more task so React commits whatever the stages reported back
			.then(() => new Promise<void>((r) => setTimeout(r, 0))),
	);
});
