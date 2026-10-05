import React from 'react';
import {AbsoluteFill, Sequence} from './lib/player';
import {S1Mark} from './scenes/S1Mark';
import {S2Color} from './scenes/S2Color';
import {S3Layers} from './scenes/S3Layers';
import {S5Type} from './scenes/S5Type';
import {S6Shape} from './scenes/S6Shape';
import {S7Components} from './scenes/S7Components';
import {S7Recipes} from './scenes/S7Recipes';
import {S8Playground} from './scenes/S8Playground';
import {S9Docs} from './scenes/S9Docs';
import {SCharts} from './scenes/SCharts';
import {S10End} from './scenes/S10End';
import {BEAT} from './lib/anim';
import {S} from './timeline';
import {typedScene} from './components/Typed';

// Scenes butt-join on downbeats; each scene owns its own in and out.
export const SCENES: [string, number, number, React.FC][] = [
	['Mark', S.mark, S.beat1, S1Mark],
	['Beat1', S.beat1, S.color, typedScene('It starts with color.', {accent: 'color'})],
	['Color', S.color, S.layers, S2Color],
	['Tokens', S.layers, S.type, S3Layers],
	['Type', S.type, S.shape, S5Type],
	['Shape', S.shape, S.beat2, S6Shape],
	['Beat2', S.beat2, S.playground, typedScene('Then come the pieces.', {accent: 'pieces'})],
	['Playground', S.playground, S.components, S8Playground],
	['Components', S.components, S.charts, S7Components],
	['Charts', S.charts, S.agent, SCharts],
	['Agent', S.agent, S.recipes, S9Docs],
	['Recipes', S.recipes, S.end, S7Recipes],
	['End', S.end, S.total, S10End],
];

export const LaunchVideo: React.FC = () => (
	<AbsoluteFill style={{background: '#fff'}}>
		{SCENES.map(([name, from, to, Scene]) => (
			<Sequence key={name} name={name} from={from} durationInFrames={to - from} premountFor={BEAT * 3}>
				<Scene />
			</Sequence>
		))}
	</AbsoluteFill>
);

