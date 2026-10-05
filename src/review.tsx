import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {COMPOSITIONS} from './compositions';
import {FPS, FrameProvider, HEIGHT, WIDTH} from './lib/player';
import {V2_SCENES} from './v2/Film';

// The review player (npm run dev): one composition, a scrubber, and frame
// stepping, all at normal size. Keys:
//   ← / →        one frame        shift + ← / →   ten frames
//   space        play / pause     [ / ]           previous / next scene start
// The composition and frame live in the URL hash, so a reload (every save)
// comes back to the same frame.

const IDS = Object.keys(COMPOSITIONS);
// the score is off for now (and in vite.config.ts): true to play it along
const WITH_SCORE = true;

// scene starts on the film's timeline, for markers and [ / ]
const FILM_MARKS = (() => {
	let at = 0;
	return V2_SCENES.map(([name, dur]) => {
		const m = {name, at};
		at += dur;
		return m;
	});
})();

const readHash = () => {
	const [id, f] = decodeURIComponent(location.hash.slice(1)).split('@');
	return {id: COMPOSITIONS[id] ? id : 'FrappeUILaunch', frame: Math.max(0, Number(f) || 0)};
};

const time = (f: number) => {
	const s = f / FPS;
	return `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, '0')}`;
};

const Review: React.FC = () => {
	const [{id, frame}, setPos] = useState(readHash);
	const [playing, setPlaying] = useState(false);
	const comp = COMPOSITIONS[id];
	const last = comp.durationInFrames - 1;
	const marks = id === 'FrappeUILaunch' ? FILM_MARKS : [];
	const clamp = useCallback((f: number) => Math.max(0, Math.min(last, Math.round(f))), [last]);
	const go = useCallback((f: number | ((f: number) => number)) => setPos((p) => ({...p, frame: clamp(typeof f === 'function' ? f(p.frame) : f)})), [clamp]);

	useEffect(() => {
		history.replaceState(null, '', `#${id}@${frame}`);
	}, [id, frame]);

	// the film's score (scripts/score.py), played along with the whole film
	const audio = useRef<HTMLAudioElement>(null);
	useEffect(() => {
		const a = audio.current;
		if (!a) return;
		if (!playing) return void a.pause();
		a.currentTime = (frame >= last ? 0 : frame) / FPS;
		a.play().catch(() => {});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [playing, id]);

	// play in real time; if the stage can't keep up, frames are skipped, not slowed
	useEffect(() => {
		if (!playing) return;
		const t0 = performance.now();
		const f0 = frame >= last ? 0 : frame;
		let raf = 0;
		const tick = () => {
			const f = f0 + ((performance.now() - t0) / 1000) * FPS;
			if (f >= last) {
				go(last);
				setPlaying(false);
				return;
			}
			go(f);
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [playing]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			// a clicked button keeps focus, and space would click it again
			if (e.target instanceof HTMLButtonElement) e.target.blur();
			if (e.target instanceof HTMLSelectElement || e.target instanceof HTMLInputElement) {
				if (e.key !== ' ' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
			}
			const step = e.shiftKey ? 10 : 1;
			if (e.key === 'ArrowRight') (setPlaying(false), go((f) => f + step));
			else if (e.key === 'ArrowLeft') (setPlaying(false), go((f) => f - step));
			else if (e.key === ' ') setPlaying((p) => !p);
			else if (e.key === ']') go((f) => marks.find((m) => m.at > f)?.at ?? last);
			else if (e.key === '[') go((f) => [...marks].reverse().find((m) => m.at < f)?.at ?? 0);
			else return;
			e.preventDefault();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [go, last, marks]);

	// (the film takes no clicks: a click inside a stage iframe would take the
	// keyboard focus with it, and the arrow keys would stop stepping)
	// fit the 1920×1080 frame into the space above the controls
	const box = useRef<HTMLDivElement>(null);
	const [scale, setScale] = useState(0.5);
	useLayoutEffect(() => {
		const fit = () => {
			// the room inside the padding, not the box itself
			const el = box.current!;
			const cs = getComputedStyle(el);
			const w = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
			const h = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
			setScale(Math.min(w / WIDTH, h / HEIGHT));
		};
		fit();
		const ro = new ResizeObserver(fit);
		ro.observe(box.current!);
		return () => ro.disconnect();
	}, []);

	const Component = comp.component;
	const scene = [...marks].reverse().find((m) => m.at <= frame);

	return (
		<div className="app">
			{WITH_SCORE && id === 'FrappeUILaunch' ? <audio ref={audio} src="/audio/score.wav" preload="auto" /> : null}
			<div className="stage" ref={box}>
				<div style={{width: WIDTH * scale, height: HEIGHT * scale, position: 'relative', overflow: 'hidden', boxShadow: '0 0 0 1px #333'}}>
					<div style={{width: WIDTH, height: HEIGHT, position: 'absolute', left: 0, top: 0, transform: `scale(${scale})`, transformOrigin: '0 0', overflow: 'hidden', background: '#fff', pointerEvents: 'none'}}>
						<FrameProvider value={frame}>
							<Component key={id} />
						</FrameProvider>
					</div>
				</div>
			</div>
			<div className="controls">
				<div className="row">
					<button onClick={() => setPlaying((p) => !p)} title="Play / pause (space)">{playing ? '❚❚' : '▶'}</button>
					<button onClick={() => (setPlaying(false), go((f) => f - 10))} title="Back 10 frames (shift ←)">«</button>
					<button onClick={() => (setPlaying(false), go((f) => f - 1))} title="Back 1 frame (←)">‹</button>
					<button onClick={() => (setPlaying(false), go((f) => f + 1))} title="Forward 1 frame (→)">›</button>
					<button onClick={() => (setPlaying(false), go((f) => f + 10))} title="Forward 10 frames (shift →)">»</button>
					<label className="frame">
						<input
							type="number"
							value={frame}
							min={0}
							max={last}
							onChange={(e) => (setPlaying(false), go(Number(e.target.value)))}
						/>
						<span>/ {last}</span>
					</label>
					<span className="time">{time(frame)}</span>
					{scene ? <span className="scene">{scene.name} · {frame - scene.at}</span> : null}
					<span className="spacer" />
					<select value={id} onChange={(e) => (setPlaying(false), setPos({id: e.target.value, frame: 0}))}>
						{IDS.map((c) => (
							<option key={c} value={c}>
								{c}
							</option>
						))}
					</select>
				</div>
				<div className="track">
					<input
						type="range"
						min={0}
						max={last}
						value={frame}
						onChange={(e) => (setPlaying(false), go(Number(e.target.value)))}
					/>
					{marks.map((m) => (
						<button key={m.name} className="mark" style={{left: `${(m.at / last) * 100}%`}} onClick={() => (setPlaying(false), go(m.at))} title={`${m.name} (frame ${m.at})`}>
							{m.name}
						</button>
					))}
				</div>
			</div>
		</div>
	);
};

createRoot(document.getElementById('review')!).render(<Review />);
