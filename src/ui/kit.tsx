import React from 'react';
import {FONT, MONO, T, v} from '../theme';

// React stand-ins for frappe-ui components. Sizes and token names follow the
// Vue sources (src/components/*/*.vue); every colour is a semantic variable,
// so wrapping any of these in themeVars('dark') flips them the way the real
// library flips under [data-theme="dark"].

const r = (n: number | string) => T.radius[String(n)];
export const sh = (k: string) => T.shadows[k];

const txt = (size: number, weight = 420): React.CSSProperties => ({
	fontFamily: FONT,
	fontSize: size,
	fontWeight: weight,
	letterSpacing: size <= 13 ? '0.02em' : '0.015em',
	lineHeight: 1.35,
});

export type Variant = 'solid' | 'subtle' | 'outline' | 'ghost';
export type Theme = 'gray' | 'red' | 'blue' | 'green';
export type Size = 'xs' | 'sm' | 'md' | 'lg';

const BTN_SIZE: Record<Size, {h: number; px: number; fs: number; fw: number; rad: number}> = {
	xs: {h: 24, px: 6, fs: 12, fw: 420, rad: 3},
	sm: {h: 28, px: 8, fs: 14, fw: 420, rad: 4},
	md: {h: 32, px: 10, fs: 14, fw: 500, rad: 4},
	lg: {h: 40, px: 12, fs: 16, fw: 500, rad: 5},
};

const BTN_COLORS: Record<Variant, Record<Theme, [string, string, string?]>> = {
	solid: {
		gray: ['ink-base', 'surface-gray-10'],
		blue: ['ink-base', 'surface-blue-6'],
		green: ['ink-base', 'surface-green-7'],
		red: ['ink-base', 'surface-red-7'],
	},
	subtle: {
		gray: ['ink-gray-8', 'surface-gray-2'],
		blue: ['ink-blue-5', 'surface-blue-2'],
		green: ['ink-green-8', 'surface-green-2'],
		red: ['ink-red-7', 'surface-red-2'],
	},
	outline: {
		gray: ['ink-gray-8', 'surface-base', 'outline-gray-2'],
		blue: ['ink-blue-5', 'surface-base', 'outline-blue-1'],
		green: ['ink-green-8', 'surface-base', 'outline-green-3'],
		red: ['ink-red-7', 'surface-base', 'outline-red-1'],
	},
	ghost: {
		gray: ['ink-gray-8', 'transparent'],
		blue: ['ink-blue-5', 'transparent'],
		green: ['ink-green-8', 'transparent'],
		red: ['ink-red-7', 'transparent'],
	},
};

export const Button: React.FC<{
	label?: string;
	variant?: Variant;
	theme?: Theme;
	size?: Size;
	iconLeft?: React.ReactNode;
	loading?: number; // 0..1 spinner progress (frame-driven)
	pressed?: boolean;
	style?: React.CSSProperties;
	children?: React.ReactNode;
}> = ({label, variant = 'subtle', theme = 'gray', size = 'sm', iconLeft, loading, pressed, style, children}) => {
	const s = BTN_SIZE[size];
	const [fg, bg, border] = BTN_COLORS[variant][theme];
	const pressedBg = pressed ? (variant === 'solid' ? `surface-${theme === 'gray' ? 'gray-8' : `${theme}-8`}` : `surface-${theme}-4`) : null;
	return (
		<div
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 6,
				height: s.h,
				padding: `0 ${s.px}px`,
				borderRadius: r(s.rad),
				background: pressedBg ? v(pressedBg) : bg === 'transparent' ? 'transparent' : v(bg),
				color: v(fg),
				boxShadow: border ? `inset 0 0 0 1px ${v(border)}` : undefined,
				whiteSpace: 'nowrap',
				...txt(s.fs, s.fw),
				...style,
			}}
		>
			{loading !== undefined ? <Spinner size={s.fs} t={loading} /> : iconLeft}
			{children ?? label}
		</div>
	);
};

export const Spinner: React.FC<{size?: number; t: number; color?: string}> = ({size = 14, t, color}) => (
	<svg width={size} height={size} viewBox="0 0 24 24" style={{rotate: `${t * 360}deg`}}>
		<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity={0.25} strokeWidth="3" />
		<path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke={color ?? 'currentColor'} strokeWidth="3" strokeLinecap="round" />
	</svg>
);

/** Switch, md size. `on` is 0..1 so the knob can travel. */
export const Switch: React.FC<{on: number; scale?: number}> = ({on}) => (
	<div
		style={{
			width: 32,
			height: 20,
			borderRadius: 999,
			border: '3px solid transparent',
			boxSizing: 'border-box',
			background: `color-mix(in oklch, ${v('surface-gray-10')} ${on * 100}%, ${v('surface-gray-4')})`,
			position: 'relative',
		}}
	>
		<div
			style={{
				position: 'absolute',
				top: 0,
				left: on * 12,
				width: 14,
				height: 14,
				borderRadius: 999,
				background: v('surface-base'),
				boxShadow: sh('base'),
			}}
		/>
	</div>
);

export const Checkbox: React.FC<{checked: number; label?: string}> = ({checked, label}) => (
	<div style={{display: 'inline-flex', alignItems: 'center', gap: 8, ...txt(14), color: v('ink-gray-8')}}>
		<div
			style={{
				width: 16,
				height: 16,
				borderRadius: 4,
				boxSizing: 'border-box',
				background: checked > 0.5 ? v('surface-gray-10') : v('surface-base'),
				border: checked > 0.5 ? 'none' : `1px solid ${v('outline-gray-4')}`,
				display: 'grid',
				placeItems: 'center',
			}}
		>
			<svg width="12" height="12" viewBox="0 0 12 12" style={{opacity: checked > 0.5 ? 1 : 0}}>
				<path
					d="M2.5 6.2l2.3 2.3 4.7-5"
					fill="none"
					stroke={v('ink-base')}
					strokeWidth="1.6"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeDasharray={12}
					strokeDashoffset={12 * (1 - Math.min(1, Math.max(0, (checked - 0.5) * 2)))}
				/>
			</svg>
		</div>
		{label}
	</div>
);

const BADGE: Record<string, [string, string]> = {
	gray: ['ink-gray-6', 'surface-gray-2'],
	blue: ['ink-blue-7', 'surface-blue-2'],
	green: ['ink-green-7', 'surface-green-2'],
	amber: ['ink-amber-7', 'surface-amber-2'],
	red: ['ink-red-7', 'surface-red-2'],
	violet: ['ink-violet-7', 'surface-violet-2'],
};

export const Badge: React.FC<{label: string; theme?: keyof typeof BADGE; size?: 'sm' | 'md'; dot?: boolean}> = ({
	label,
	theme = 'gray',
	size = 'md',
	dot,
}) => (
	<div
		style={{
			display: 'inline-flex',
			alignItems: 'center',
			gap: 5,
			height: size === 'sm' ? 16 : 20,
			padding: '0 6px',
			borderRadius: 999,
			color: v(BADGE[theme][0]),
			background: v(BADGE[theme][1]),
			...txt(12, 500),
		}}
	>
		{dot ? <div style={{width: 6, height: 6, borderRadius: 9, background: 'currentColor'}} /> : null}
		{label}
	</div>
);

export const Tag: React.FC<{label: string}> = ({label}) => (
	<div
		style={{
			display: 'inline-flex',
			alignItems: 'center',
			gap: 4,
			height: 22,
			padding: '0 6px 0 8px',
			borderRadius: r(3),
			color: v('ink-gray-7'),
			background: v('surface-gray-2'),
			...txt(13),
		}}
	>
		{label}
		<span style={{color: v('ink-gray-5'), fontSize: 13}}>×</span>
	</div>
);

const AV_COLORS = ['blue', 'green', 'amber', 'red', 'violet', 'gray'];
export const Avatar: React.FC<{name: string; size?: number; ring?: boolean}> = ({name, size = 28, ring}) => {
	const initials = name
		.split(' ')
		.map((p) => p[0])
		.join('')
		.slice(0, 2);
	const c = AV_COLORS[(name.charCodeAt(0) + name.length) % AV_COLORS.length];
	return (
		<div
			style={{
				width: size,
				height: size,
				borderRadius: 999,
				display: 'grid',
				placeItems: 'center',
				flexShrink: 0,
				color: v(c === 'gray' ? 'ink-gray-5' : `ink-${c}-7`),
				background: v(`surface-${c}-2`),
				boxShadow: ring ? `0 0 0 2px ${v('surface-base')}` : undefined,
				...txt(size * 0.4, 500),
			}}
		>
			{initials}
		</div>
	);
};

export const TextInput: React.FC<{
	value?: string;
	placeholder?: string;
	focused?: boolean;
	caret?: boolean;
	width?: number;
	variant?: 'subtle' | 'outline';
	icon?: React.ReactNode;
	style?: React.CSSProperties;
}> = ({value, placeholder, focused, caret, width = 220, variant = 'subtle', icon, style}) => (
	<div
		style={{
			width,
			height: 28,
			boxSizing: 'border-box',
			display: 'flex',
			alignItems: 'center',
			gap: 6,
			padding: '0 8px',
			borderRadius: r(4),
			background: focused || variant === 'outline' ? v('surface-base') : v('surface-gray-2'),
			border: `1px solid ${focused ? v('outline-gray-4') : variant === 'outline' ? v('outline-gray-2') : v('surface-gray-2')}`,
			boxShadow: focused ? sh('sm') : undefined,
			color: value ? v('ink-gray-8') : v('ink-gray-4'),
			...txt(14),
			...style,
		}}
	>
		{icon}
		<span>{value || placeholder}</span>
		{caret ? <span style={{width: 1.5, height: 16, background: v('ink-gray-8'), marginLeft: -5}} /> : null}
	</div>
);

/** TabButtons: segmented control with a sliding thumb. `active` may be fractional. */
export const TabButtons: React.FC<{options: string[]; active: number; size?: number; mono?: boolean}> = ({
	options,
	active,
	size = 14,
	mono,
}) => {
	const w = options.map((o) => o.length * size * (mono ? 0.62 : 0.58) + 20);
	const left = (i: number) => w.slice(0, i).reduce((a, b) => a + b, 0);
	const i0 = Math.floor(active);
	const f = active - i0;
	const thumbX = left(i0) + (left(Math.min(i0 + 1, options.length - 1)) - left(i0)) * f;
	const thumbW = w[i0] + ((w[Math.min(i0 + 1, options.length - 1)] ?? w[i0]) - w[i0]) * f;
	return (
		<div
			style={{
				display: 'inline-flex',
				position: 'relative',
				padding: 2,
				borderRadius: r(4),
				background: v('surface-gray-2'),
				height: 28,
				boxSizing: 'border-box',
			}}
		>
			<div
				style={{
					position: 'absolute',
					top: 2,
					bottom: 2,
					left: 2 + thumbX,
					width: thumbW,
					borderRadius: r(3),
					background: v('surface-base'),
					boxShadow: sh('sm'),
				}}
			/>
			{options.map((o, i) => (
				<div
					key={o}
					style={{
						position: 'relative',
						width: w[i],
						display: 'grid',
						placeItems: 'center',
						color: Math.round(active) === i ? v('ink-gray-9') : v('ink-gray-5'),
						...(mono ? {fontFamily: MONO, fontSize: size - 1} : txt(size, 500)),
					}}
				>
					{o}
				</div>
			))}
		</div>
	);
};

export const Slider: React.FC<{value: number; width?: number}> = ({value, width = 220}) => (
	<div style={{width, height: 16, position: 'relative', display: 'flex', alignItems: 'center'}}>
		<div style={{height: 4, width: '100%', borderRadius: 9, background: v('surface-gray-3')}} />
		<div style={{position: 'absolute', height: 4, width: value * width, borderRadius: 9, background: v('surface-gray-10')}} />
		<div
			style={{
				position: 'absolute',
				left: value * width - 8,
				width: 16,
				height: 16,
				borderRadius: 99,
				background: v('surface-base'),
				boxShadow: sh('md'),
				border: `1px solid ${v('outline-gray-2')}`,
				boxSizing: 'border-box',
			}}
		/>
	</div>
);

export const Progress: React.FC<{value: number; width?: number; label?: string}> = ({value, width = 220, label}) => (
	<div style={{width}}>
		{label ? (
			<div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 10, ...txt(14, 500)}}>
				<span style={{color: v('ink-gray-8')}}>{label}</span>
				<span style={{color: v('ink-gray-4')}}>{Math.round(value * 100)}%</span>
			</div>
		) : null}
		<div style={{height: 8, borderRadius: r(7), background: v('surface-gray-2'), overflow: 'hidden'}}>
			<div style={{height: '100%', width: `${value * 100}%`, background: v('surface-gray-10'), borderRadius: r(7)}} />
		</div>
	</div>
);

export const Rating: React.FC<{value: number}> = ({value}) => (
	<div style={{display: 'flex', gap: 4}}>
		{[0, 1, 2, 3, 4].map((i) => (
			<svg key={i} width="22" height="22" viewBox="0 0 24 24">
				<path
					d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"
					fill={value > i ? v('surface-amber-7') : v('surface-gray-3')}
					style={{fill: value > i ? T.ramps.amber['500'] : undefined}}
				/>
			</svg>
		))}
	</div>
);

export const Toast: React.FC<{title: string; body?: string}> = ({title, body}) => (
	<div
		style={{
			width: 300,
			padding: '10px 12px',
			borderRadius: r(6),
			background: v('surface-gray-10'),
			color: v('ink-base'),
			boxShadow: sh('lg'),
			display: 'flex',
			gap: 10,
			alignItems: 'flex-start',
			boxSizing: 'border-box',
		}}
	>
		<div style={{width: 16, height: 16, borderRadius: 99, background: T.ramps.green['500'], marginTop: 1, display: 'grid', placeItems: 'center'}}>
			<svg width="10" height="10" viewBox="0 0 12 12">
				<path d="M2.5 6.2l2.3 2.3 4.7-5" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
			</svg>
		</div>
		<div>
			<div style={txt(14, 500)}>{title}</div>
			{body ? <div style={{...txt(13), opacity: 0.7, marginTop: 2}}>{body}</div> : null}
		</div>
	</div>
);

export const Tooltip: React.FC<{text: string}> = ({text}) => (
	<div style={{display: 'inline-flex', flexDirection: 'column', alignItems: 'center'}}>
		<div
			style={{
				padding: '4px 8px',
				borderRadius: r(4),
				background: v('surface-gray-10'),
				color: v('ink-base'),
				...txt(12),
				boxShadow: sh('md'),
			}}
		>
			{text}
		</div>
		<div
			style={{
				width: 0,
				height: 0,
				borderLeft: '5px solid transparent',
				borderRight: '5px solid transparent',
				borderTop: `5px solid ${v('surface-gray-10')}`,
			}}
		/>
	</div>
);

/** Plain elevated panel (dialogs, popovers, cards). */
export const Panel: React.FC<{
	children: React.ReactNode;
	elevation?: string;
	radius?: number;
	style?: React.CSSProperties;
}> = ({children, elevation = 'lg', radius = 7, style}) => (
	<div
		style={{
			background: v('surface-base'),
			borderRadius: r(radius),
			boxShadow: `${sh(elevation)}, 0 0 0 1px ${v('outline-gray-1')}`,
			color: v('ink-gray-8'),
			...txt(14),
			...style,
		}}
	>
		{children}
	</div>
);

export const Text: React.FC<{
	size?: number;
	weight?: number;
	color?: string;
	children: React.ReactNode;
	style?: React.CSSProperties;
}> = ({size = 14, weight = 420, color = 'ink-gray-8', children, style}) => (
	<div style={{...txt(size, weight), color: v(color), ...style}}>{children}</div>
);
