import React from 'react';
import {useCurrentFrame} from '../lib/player';
import {Bg, Headline} from '../components/Common';
import {Stage} from '../components/Stage';
import {out, prog, spr} from '../lib/anim';
import {disp, ink, paper} from '../theme';

// docs/components/recipes. Tickets first: it is the app the agent just
// built, held for a moment so the cut from the agent scene is invisible.
const RECIPES: [string, string][] = [
	['tickets', 'Tickets'],
	['discussions', 'Discussions'],
	['compose', 'Compose'],
	['deals', 'Deals'],
	['mail', 'Mail'],
	['files', 'Files'],
	['tasks', 'Tasks'],
	['accounting', 'Accounting'],
];

const LEAD = 20; // Tickets, carried over
const PER = 54; // frames per recipe: a beat and a half

const start = (k: number) => (k === 0 ? 0 : LEAD + (k - 1) * PER);

/**
 * Recipes. Follows the app the agent built, in the same frame: the other
 * recipes from the docs, a beat and a half each, desktop beside mobile. Each
 * cuts in on its beat and settles up into place. All light.
 */
export const S7Recipes: React.FC = () => {
	const frame = useCurrentFrame();
	let i = 0;
	for (let k = 0; k < RECIPES.length; k++) if (frame >= start(k)) i = k;
	// The current screen and the next one are mounted; the next stays hidden
	// until its cut, so every cut lands on a loaded page.
	const live = [i, i + 1].filter((k) => k < RECIPES.length);
	const f = frame - start(i);
	const settle = i === 0 ? 1 : prog(f, 0, 14, out);
	const phone = i === 0 ? 1 : spr(f, 4, 20, 0.2);
	return (
		<Bg color={paper}>
			<Headline lines={['Or start from a recipe.']} at={LEAD} size={72} color={ink} style={{left: 110, top: 118, whiteSpace: 'nowrap'}} />
			<div style={{position: 'absolute', right: 110, top: 118, ...disp(72, 600), color: 'rgba(0,0,0,0.28)', opacity: i === 0 ? 0 : 1}}>{RECIPES[i][1]}</div>
			{live.map((k) => {
				const [name] = RECIPES[k];
				return (
					<div key={name} style={{position: 'absolute', inset: 0, opacity: k === i ? 1 : 0}}>
						<div
							style={{
								position: 'absolute',
								left: 110,
								top: 250,
								borderRadius: 14,
								overflow: 'hidden',
								boxShadow: '0 0 0 1px rgba(128,128,128,0.25), 0 40px 80px -30px rgba(0,0,0,0.4)',
								translate: `0 ${k === i ? (1 - settle) * 24 : 0}px`,
							}}
						>
							<Stage piece="recipe" theme="light" zoom={0.84} width={1440 * 0.84} height={900 * 0.84} p={{name}} />
						</div>
						<div
							style={{
								position: 'absolute',
								left: 1400,
								top: 230,
								padding: 10,
								borderRadius: 50,
								background: '#0b0b0b',
								boxShadow: '0 0 0 1.5px rgba(128,128,128,0.3), 0 30px 60px -24px rgba(0,0,0,0.4)',
								translate: `0 ${k === i ? (1 - phone) * 40 : 0}px`,
							}}
						>
							<div style={{borderRadius: 40, overflow: 'hidden'}}>
								<Stage piece="recipe" theme="light" zoom={0.8} width={390 * 0.8} height={844 * 0.8} p={{name, mobile: true}} />
							</div>
						</div>
					</div>
				);
			})}
		</Bg>
	);
};
