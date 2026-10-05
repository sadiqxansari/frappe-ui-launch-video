import React from 'react';
import {AbsoluteFill, Sequence} from '../lib/player';
import {BEAT} from '../lib/anim';
import {MARK_LEN, S1Mark} from '../scenes/S1Mark';
import {STAGE_ONE_END, StageOne} from './StageOne';
import {STAGE_TWO_END, StageTwo} from './StageTwo';
import {STAGE_THREE_END, StageThree} from './StageThree';
import {End, END_LEN} from './End';

// v2: tokens → components → products, on one continuous camera.
const MARK = MARK_LEN; // the logo reveal

export const V2_SCENES: [string, number, React.FC][] = [
	['Mark', MARK, S1Mark],
	['StageOne', STAGE_ONE_END, StageOne],
	['StageTwo', STAGE_TWO_END, StageTwo],
	['StageThree', STAGE_THREE_END, StageThree],
	['End', END_LEN, End],
];

export const V2_TOTAL = V2_SCENES.reduce((a, [, d]) => a + d, 0);

export const Film: React.FC = () => {
	let at = 0;
	return (
		<AbsoluteFill style={{background: '#fff'}}>
			{V2_SCENES.map(([name, dur, Scene]) => {
				const from = at;
				at += dur;
				return (
					<Sequence key={name} name={name} from={from} durationInFrames={dur} premountFor={BEAT * 3}>
						<Scene />
					</Sequence>
				);
			})}
		</AbsoluteFill>
	);
};
