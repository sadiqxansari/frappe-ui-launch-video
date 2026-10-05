import type React from 'react';
import {LaunchVideo, SCENES} from './LaunchVideo';
import {S} from './timeline';
import {Film, V2_SCENES, V2_TOTAL} from './v2/Film';
import {CardStill} from './v2/CardStill';

export type Comp = {component: React.FC; durationInFrames: number};

/** Everything the page can show, by id (pick one with VITE_COMP). */
export const COMPOSITIONS: Record<string, Comp> = {
	FrappeUILaunch: {component: Film, durationInFrames: V2_TOTAL},
	'V2-CardStill': {component: CardStill, durationInFrames: 1},
	...Object.fromEntries(V2_SCENES.map(([name, dur, Scene]) => [`V2-${name}`, {component: Scene, durationInFrames: dur}])),
	'FrappeUILaunch-v1': {component: LaunchVideo, durationInFrames: S.total},
	...Object.fromEntries(SCENES.map(([name, from, to, Scene], i) => [`v1-S${i + 1}-${name}`, {component: Scene, durationInFrames: to - from}])),
};
