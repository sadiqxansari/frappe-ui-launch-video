import {Moon, Rocket, Search, Sun} from 'lucide-react';
import React from 'react';
import {Mark} from '../components/Hud';
import {FONT, MONO, v} from '../theme';
import {Button, Size, Switch, TabButtons, Text, TextInput, Theme, Variant} from './kit';

export type Knobs = {
	variant: number; // index into VARIANTS, may be fractional mid-slide
	theme: number;
	size: number;
	iconLeft: number;
	loading: number;
	label: string;
	caret?: boolean;
	changed?: string; // code line to highlight
	spin: number;
};

const VARIANTS: Variant[] = ['solid', 'subtle', 'outline', 'ghost'];
const THEMES: Theme[] = ['gray', 'red'];
const SIZES: Size[] = ['xs', 'sm', 'md', 'lg'];

const NAV = ['Introduction', 'Installation', 'Colors', 'Typography', 'Radius', 'Alert', 'Avatar', 'Badge', 'Breadcrumbs', 'Button', 'Checkbox', 'Combobox', 'Dialog', 'Dropdown'];

/** ui.frappe.io, the Button page, drawn at 1× in a 1200 × 700 box. */
export const DocsPage: React.FC<{k: Knobs; dark: boolean; children?: React.ReactNode}> = ({k, dark, children}) => {
	const variant = VARIANTS[Math.round(k.variant)];
	const theme = THEMES[Math.round(k.theme)];
	const size = SIZES[Math.round(k.size)];
	const code = [
		['<Button', ''],
		[`  variant="${variant}"`, 'variant'],
		[`  theme="${theme}"`, 'theme'],
		[`  size="${size}"`, 'size'],
		[`  label="${k.label}"`, 'label'],
		...(k.iconLeft > 0.5 ? [['  icon-left="lucide-rocket"', 'iconLeft']] : []),
		...(k.loading > 0.5 ? [['  loading', 'loading']] : []),
		['/>', ''],
	];
	return (
		<div style={{width: 1200, height: 700, background: v('surface-base'), position: 'relative', fontFamily: FONT, overflow: 'hidden'}}>
			{/* sidebar */}
			<div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 200, borderRight: `1px solid ${v('outline-gray-1')}`, padding: '12px 10px', boxSizing: 'border-box'}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 8, padding: '0 6px 12px'}}>
					<Mark size={20} />
					<Text weight={600} color="ink-gray-9">
						Frappe UI
					</Text>
				</div>
				<TextInput placeholder="Search" width={180} icon={<Search size={13} color={v('ink-gray-5')} />} />
				<div style={{marginTop: 10}}>
					{NAV.map((n) => (
						<div
							key={n}
							style={{
								height: 28,
								display: 'flex',
								alignItems: 'center',
								padding: '0 8px',
								borderRadius: 6,
								background: n === 'Button' ? v('surface-gray-3') : 'transparent',
							}}
						>
							<Text color={n === 'Button' ? 'ink-gray-9' : 'ink-gray-6'} weight={n === 'Button' ? 500 : 420} size={13}>
								{n}
							</Text>
						</div>
					))}
				</div>
			</div>
			{/* top bar */}
			<div style={{position: 'absolute', left: 200, right: 0, top: 0, height: 44, borderBottom: `1px solid ${v('outline-gray-1')}`, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 6}}>
				<Text color="ink-gray-5">Components</Text>
				<Text color="ink-gray-4">/</Text>
				<Text color="ink-gray-9">Button</Text>
				<div style={{marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center', color: v('ink-gray-7')}}>
					<GithubMark />
					{dark ? <Moon size={16} strokeWidth={1.7} /> : <Sun size={16} strokeWidth={1.7} />}
				</div>
			</div>
			{/* content */}
			<div style={{position: 'absolute', left: 240, top: 66, width: 760}}>
				<Text size={22} weight={600} color="ink-gray-9">
					Button
				</Text>
				<Text color="ink-gray-6" style={{marginTop: 8}}>
					A clickable element that runs an action, submits a form or opens a link.
				</Text>
				<div style={{marginTop: 18, border: `1px solid ${v('outline-gray-2')}`, borderRadius: 12, overflow: 'hidden'}}>
					<div style={{display: 'flex', height: 372}}>
						<div
							style={{
								flex: 1,
								display: 'grid',
								placeItems: 'center',
								backgroundImage: `radial-gradient(${v('outline-gray-2')} 1px, transparent 1px)`,
								backgroundSize: '14px 14px',
							}}
						>
							<div style={{zoom: 1.6}}>
								<Button
									label={k.label}
									variant={variant}
									theme={theme}
									size={size}
									loading={k.loading > 0.5 ? k.spin : undefined}
									iconLeft={k.iconLeft > 0.5 ? <Rocket size={size === 'lg' ? 16 : 14} strokeWidth={1.7} /> : undefined}
								/>
							</div>
						</div>
						<div style={{width: 360, borderLeft: `1px solid ${v('outline-gray-2')}`, padding: 16, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 11}}>
							<Knob name="label">
								<TextInput value={k.label} variant="outline" width={326} focused={k.caret} caret={k.caret} />
							</Knob>
							<Knob name="variant">
								<TabButtons options={VARIANTS} active={k.variant} size={13} mono />
							</Knob>
							<Knob name="theme">
								<TabButtons options={THEMES} active={k.theme} size={13} mono />
							</Knob>
							<Knob name="size">
								<TabButtons options={SIZES} active={k.size} size={13} mono />
							</Knob>
							<div style={{height: 1, background: v('outline-gray-1'), margin: '2px 0'}} />
							{[
								['iconLeft', k.iconLeft],
								['disabled', 0],
								['loading', k.loading],
							].map(([n, on]) => (
								<div key={n as string} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
									<span style={{fontFamily: MONO, fontSize: 12, color: v('ink-gray-6')}}>{n}</span>
									<Switch on={on as number} />
								</div>
							))}
						</div>
					</div>
					<div style={{borderTop: `1px solid ${v('outline-gray-2')}`, background: v('surface-gray-1'), padding: '12px 0'}}>
						{code.map(([line, key]) => (
							<div
								key={line}
								style={{
									fontFamily: MONO,
									fontSize: 13,
									lineHeight: '21px',
									padding: '0 18px',
									whiteSpace: 'pre',
									color: line.startsWith('  ') ? v('ink-gray-8') : v('ink-red-6'),
									background: key && key === k.changed ? 'rgba(179,82,255,0.16)' : 'transparent',
								}}
							>
								{line}
							</div>
						))}
					</div>
				</div>
			</div>
			{children}
		</div>
	);
};

const Knob: React.FC<{name: string; children: React.ReactNode}> = ({name, children}) => (
	<div>
		<div style={{fontFamily: MONO, fontSize: 12, color: v('ink-gray-6'), marginBottom: 6}}>{name}</div>
		{children}
	</div>
);

const GithubMark: React.FC = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
		<path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" />
	</svg>
);
