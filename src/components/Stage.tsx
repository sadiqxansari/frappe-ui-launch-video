import React, {useLayoutEffect, useRef, useState} from 'react';
import {continueRender, delayRender, staticFile, useCurrentFrame} from '../lib/player';
import type {Mode} from '../theme';
import {STAGE_VERSION} from '../stageVersion';

export type Targets = Record<string, {x: number; y: number} | null>;

type StageApi = {
	ready: Promise<void>;
	targets?: Targets;
	set: (frame: number, p: Record<string, unknown>, theme: Mode, zoom: number) => Promise<void>;
};

/**
 * A window onto the stage app (stage/, built into public/stage): real
 * frappe-ui components rendered by Vue. Every frame the film hands the stage
 * this frame's props and waits until Vue has rendered and frappe-ui's own
 * transitions have been seeked to this frame.
 */
export const Stage: React.FC<{
	piece: 'widget' | 'mosaic' | 'recipe' | 'docs' | 'story' | 'charts' | 'wall' | 'crm' | 'card';
	p?: Record<string, unknown>;
	theme?: Mode;
	zoom?: number;
	width: number;
	height: number;
	style?: React.CSSProperties;
	/** Called with the piece's reported control positions (iframe px) after each frame. */
	onTargets?: (t: Targets) => void;
}> = ({piece, p = {}, theme = 'light', zoom = 1, width, height, style, onTargets}) => {
	const frame = useCurrentFrame();
	const ref = useRef<HTMLIFrameElement>(null);
	const [loadHandle] = useState(() => delayRender(`stage ${piece} load`));
	const [api, setApi] = useState<StageApi | null>(null);
	const key = JSON.stringify(p);

	const onLoad = async () => {
		const win = ref.current?.contentWindow as (Window & {__stage?: StageApi}) | null;
		while (!win?.__stage) await new Promise((r) => setTimeout(r, 20));
		await win.__stage.ready;
		setApi(win.__stage);
	};

	useLayoutEffect(() => {
		if (!api) return;
		const h = delayRender(`stage ${piece} frame ${frame}`);
		// The page always lays out at 1×; the iframe is scaled from outside.
		// (CSS zoom inside would break frappe-ui components that measure
		// themselves, like TabButtons' sliding indicator.)
		api.set(frame, JSON.parse(key), theme, 1).then(() => {
			if (onTargets && api.targets) {
				const scaled: Targets = {};
				for (const [k, v] of Object.entries(api.targets)) scaled[k] = v && (Object.fromEntries(Object.entries(v).map(([a, n]) => [a, (n as number) * zoom])) as {x: number; y: number});
				onTargets(scaled);
			}
			// shown only once it has drawn a real frame: while it loads, the bare
			// page (unstyled, every piece at its default) would flash through
			if (ref.current) ref.current.style.visibility = 'visible';
			// let React commit anything onTargets changed before the capture
			setTimeout(() => {
				continueRender(h);
				continueRender(loadHandle);
			}, 0);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [api, frame, key, theme, zoom, piece, loadHandle]);

	return (
		<div style={{width, height, overflow: 'hidden', ...style}}>
			<iframe
				ref={ref}
				title={piece}
				src={`${staticFile('stage/index.html')}?v=${STAGE_VERSION}#${piece}`}
				onLoad={onLoad}
				style={{
					width: width / zoom,
					height: height / zoom,
					border: 0,
					background: 'transparent',
					display: 'block',
					// Must match the page's own color-scheme, which the stage pins to
					// `normal`: on a mismatch Chrome paints the iframe opaque, hiding
					// whatever the film draws behind it (the Studio's own UI is dark).
					colorScheme: 'normal',
					visibility: 'hidden', // until its first frame is set (see above)
					scale: String(zoom),
					transformOrigin: '0 0',
				}}
			/>
		</div>
	);
};
