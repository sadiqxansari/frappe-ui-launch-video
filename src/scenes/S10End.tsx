import React from 'react';
import {Img, staticFile, useCurrentFrame} from '../lib/player';
import {Bg, Headline, Split} from '../components/Common';
import {Mark} from '../components/Hud';
import {inOut, kf, prog, spr} from '../lib/anim';
import {disp, ink, label, MONO, paper} from '../theme';

// Apps that depend on frappe-ui (README "Used by", confirmed in each repo's
// package.json). Logos from frappe.io/products; Gameplan is not listed there.
const APPS: [string, string][] = [
	['Frappe Cloud', 'products/cloud.png'],
	['CRM', 'products/crmaff993.png'],
	['Helpdesk', 'products/helpdesk8109cf.png'],
	['Frappe HR', 'products/hrbde4d8.png'],
	['Insights', 'products/insights4fcfaa.png'],
	['Builder', 'products/builder4a28b3.png'],
	['Drive', 'products/drive8851a7.png'],
	['Learning', 'products/learning.png'],
	['Gameplan', 'gameplan.svg'],
];

const CX = 1210;
const CY = 560;
const R = 340;
const ORBIT_END = 180;

/**
 * End. The apps built on it orbit the mark on a slowly turning ring, then
 * fall into it; the lockup lands on a split frame, half light, half dark,
 * with the install line and the docs URL.
 */
export const S10End: React.FC = () => {
	const frame = useCurrentFrame();

	if (frame < ORBIT_END) {
		const spin = frame * 0.14 - 90; // degrees
		const collapse = prog(frame, ORBIT_END - 34, 32, inOut);
		const ring = prog(frame, 0, 40, inOut);
		return (
			<Bg color={paper}>
				<Headline lines={['Already inside', "Frappe's apps."]} at={2} size={84} color={ink} style={{left: 64, top: 380}} />
				<svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
					<circle
						cx={CX}
						cy={CY}
						r={R}
						fill="none"
						stroke="#B352FF"
						strokeOpacity={0.35 * (1 - collapse)}
						strokeWidth={1.5}
						strokeDasharray="4 8"
						pathLength={1000}
						strokeDashoffset={-frame * 0.6}
						style={{opacity: ring}}
					/>
					<circle cx={CX} cy={CY} r={R * 0.52} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={1} style={{opacity: ring * (1 - collapse)}} />
					<circle cx={CX} cy={CY} r={R * 1.42} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={1} style={{opacity: ring * (1 - collapse)}} />
				</svg>
				{APPS.map(([name, file], i) => {
					const enter = spr(frame, 8 + i * 5, 26, 0.25);
					const a = ((spin + (i * 360) / APPS.length) * Math.PI) / 180;
					const r = R * Math.min(1, enter) * (1 - collapse);
					const x = CX + Math.cos(a) * r;
					const y = CY + Math.sin(a) * r;
					const size = 118 * (0.4 + 0.6 * enter) * (1 - 0.7 * collapse);
					return (
						<div
							key={name}
							style={{
								position: 'absolute',
								left: x,
								top: y,
								translate: '-50% -50%',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: 12,
								opacity: Math.min(1, enter * 2) * (1 - collapse),
							}}
						>
							<Img src={staticFile(`logos/${file}`)} style={{width: size, height: size, borderRadius: size * 0.22, boxShadow: '0 12px 24px -12px rgba(0,0,0,0.35)'}} />
							<div style={{...label(18, 'rgba(0,0,0,0.55)'), whiteSpace: 'nowrap', opacity: 1 - collapse * 3}}>{name}</div>
						</div>
					);
				})}
				<div style={{position: 'absolute', left: CX, top: CY, translate: '-50% -50%', scale: String(0.9 + 0.1 * spr(frame, 0, 30, 0.3) + 0.25 * collapse)}}>
					<Mark size={170} />
				</div>
			</Bg>
		);
	}

	const f = frame - ORBIT_END;
	const x = kf(f, [0, 40], [1920, 960], inOut);
	const p = spr(f, 10, 30, 0.15);
	const q = prog(f, 36, 20);
	return (
		<Bg color={paper}>
			<Split x={x}>
				{(mode) => {
					const fg = mode === 'light' ? ink : 'white';
					const soft = mode === 'light' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.6)';
					return (
						<div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
							<div style={{display: 'flex', alignItems: 'center', gap: 40, scale: String(0.94 + 0.06 * p), opacity: Math.min(1, p * 2)}}>
								<Mark size={170} />
								<div style={{...disp(170, 650), color: fg}}>Frappe UI</div>
								<div style={{...disp(170, 650), color: '#B352FF'}}>1.0</div>
							</div>
							<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, marginTop: 70, opacity: q, translate: `0 ${(1 - q) * 20}px`}}>
								<div
									style={{
										fontFamily: MONO,
										fontSize: 34,
										color: fg,
										padding: '16px 28px',
										borderRadius: 14,
										boxShadow: `inset 0 0 0 1.5px ${mode === 'light' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)'}`,
									}}
								>
									npm install frappe-ui
								</div>
								<div style={{...label(34, soft)}}>ui.frappe.io</div>
							</div>
						</div>
					);
				}}
			</Split>
			<div style={{position: 'absolute', left: x - 1, top: 0, bottom: 0, width: 2, background: '#B352FF', opacity: 1 - prog(f, 60, 30)}} />
		</Bg>
	);
};
