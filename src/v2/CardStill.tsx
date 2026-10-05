import React from 'react';
import {AbsoluteFill} from '../lib/player';
import {Stage} from '../components/Stage';

// A look at stage one's finished card, light and dark side by side (not in the film).
export const CardStill: React.FC = () => (
	<AbsoluteFill style={{flexDirection: 'row'}}>
		<Stage piece="card" theme="light" zoom={1.6} width={960} height={1080} />
		<Stage piece="card" theme="dark" zoom={1.6} width={960} height={1080} />
	</AbsoluteFill>
);
