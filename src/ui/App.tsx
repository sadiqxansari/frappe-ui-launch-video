import {BookOpen, ChartColumn, Filter, Home, Inbox, ListFilter, Plus, Search, Ticket, Users} from 'lucide-react';
import React from 'react';
import {prog, spr} from '../lib/anim';
import {BRAND, v} from '../theme';
import {Avatar, Badge, Button, Checkbox, TabButtons, Text, TextInput} from './kit';

// The Helpdesk-style "Tickets" screen, desktop and mobile, built from the kit.
// `t` is the scene frame; each piece enters on its own cue so the screen
// assembles itself.

const enter = (t: number, at: number, dx = 0, dy = 16): React.CSSProperties => {
	const p = spr(t, at, 26, 0.12);
	return {opacity: Math.min(1, prog(t, at, 10)), translate: `${(1 - p) * dx}px ${(1 - p) * dy}px`};
};

export const TICKETS: [string, string, string, string, string][] = [
	['Payment failed on renewal', 'Open', 'Urgent', 'Priya Nair', '2m'],
	['Cannot add custom domain', 'Open', 'High', 'Rahul Shah', '14m'],
	['Backup restore stuck at 80%', 'Replied', 'High', 'Mei Chen', '32m'],
	['Invite link expired', 'Open', 'Medium', 'Ana Lopez', '1h'],
	['Export report to Excel', 'Replied', 'Low', 'Omar Haddad', '2h'],
	['SSO login loops back', 'Open', 'Urgent', 'Sara Iyer', '3h'],
	['Change billing email', 'Resolved', 'Low', 'Leo Martin', '5h'],
	['Webhook retries failing', 'Open', 'Medium', 'Kofi Mensah', '6h'],
];

const STATUS: Record<string, 'blue' | 'amber' | 'green'> = {Open: 'blue', Replied: 'amber', Resolved: 'green'};
const PRIORITY: Record<string, 'red' | 'amber' | 'gray'> = {Urgent: 'red', High: 'amber', Medium: 'gray', Low: 'gray'};

const NAV: [string, typeof Inbox, boolean][] = [
	['Inbox', Inbox, false],
	['Tickets', Ticket, true],
	['Customers', Users, false],
	['Knowledge base', BookOpen, false],
	['Reports', ChartColumn, false],
];

export const Desktop: React.FC<{t: number; at: number}> = ({t, at}) => (
	<div
		style={{
			width: 1400,
			height: 820,
			borderRadius: 14,
			overflow: 'hidden',
			background: v('surface-base'),
			boxShadow: `0 0 0 1px ${v('outline-gray-2')}, 0 30px 60px -20px rgba(0,0,0,0.25)`,
			display: 'flex',
			...enter(t, at, 0, 30),
		}}
	>
		{/* Sidebar */}
		<div style={{position: 'relative', width: 240, background: v('surface-sidebar'), borderRight: `1px solid ${v('outline-gray-1')}`, padding: 10, boxSizing: 'border-box', ...enter(t, at + 14, -30, 0)}}>
			<div style={{display: 'flex', alignItems: 'center', gap: 8, padding: '6px 6px 12px'}}>
				<div style={{width: 26, height: 26, borderRadius: 7, background: BRAND, display: 'grid', placeItems: 'center', color: 'white'}}>
					<Ticket size={15} strokeWidth={2} />
				</div>
				<Text weight={600} color="ink-gray-9">
					Helpdesk
				</Text>
			</div>
			<TextInput placeholder="Search" width={220} icon={<Search size={14} color={v('ink-gray-5')} />} />
			<div style={{marginTop: 10, display: 'flex', flexDirection: 'column', gap: 2}}>
				{NAV.map(([name, Icon, active]) => (
					<div
						key={name}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 8,
							height: 30,
							padding: '0 8px',
							borderRadius: 6,
							background: active ? v('surface-base') : 'transparent',
							boxShadow: active ? `0 0 0 1px ${v('outline-gray-1')}, 0 1px 2px rgba(0,0,0,0.05)` : undefined,
						}}
					>
						<Icon size={15} color={v(active ? 'ink-gray-8' : 'ink-gray-6')} strokeWidth={1.6} />
						<Text color={active ? 'ink-gray-9' : 'ink-gray-7'} weight={active ? 500 : 420}>
							{name}
						</Text>
					</div>
				))}
			</div>
			<div style={{position: 'absolute', bottom: 16, display: 'flex', alignItems: 'center', gap: 8, padding: '0 6px'}}>
				<Avatar name="Jay Rao" size={24} />
				<Text>Jay Rao</Text>
			</div>
		</div>
		{/* Main */}
		<div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
			<div
				style={{
					height: 52,
					display: 'flex',
					alignItems: 'center',
					padding: '0 20px',
					borderBottom: `1px solid ${v('outline-gray-1')}`,
					...enter(t, at + 26, 0, -12),
				}}
			>
				<Text color="ink-gray-5" size={16}>
					Tickets
				</Text>
				<Text color="ink-gray-4" size={16} style={{margin: '0 8px'}}>
					/
				</Text>
				<Text color="ink-gray-9" size={16} weight={500}>
					All tickets
				</Text>
				<div style={{marginLeft: 'auto'}}>
					<Button label="New ticket" variant="solid" size="sm" iconLeft={<Plus size={14} strokeWidth={2} />} />
				</div>
			</div>
			<div style={{display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', ...enter(t, at + 36)}}>
				<TabButtons options={['Open', 'Replied', 'Resolved']} active={0} />
				<div style={{marginLeft: 'auto', display: 'flex', gap: 8}}>
					<Button label="Filter" variant="outline" size="sm" iconLeft={<Filter size={14} strokeWidth={1.6} />} />
					<Button label="Sort" variant="outline" size="sm" iconLeft={<ListFilter size={14} strokeWidth={1.6} />} />
				</div>
			</div>
			<div
				style={{
					display: 'flex',
					padding: '0 20px',
					height: 32,
					alignItems: 'center',
					background: v('surface-gray-2'),
					margin: '0 20px',
					borderRadius: 6,
					...enter(t, at + 44),
				}}
			>
				<Cols head />
			</div>
			<div style={{padding: '4px 20px'}}>
				{TICKETS.map((row, i) => (
					<div key={row[0]} style={{display: 'flex', alignItems: 'center', height: 50, padding: '0 20px', borderBottom: `1px solid ${v('outline-gray-1')}`, ...enter(t, at + 50 + i * 4)}}>
						<Cols row={row} checked={i === 1 || i === 3} />
					</div>
				))}
			</div>
		</div>
	</div>
);

const Cols: React.FC<{head?: boolean; row?: (typeof TICKETS)[number]; checked?: boolean}> = ({head, row, checked}) => {
	const W = [28, 420, 120, 120, 200, 70];
	if (head) {
		return (
			<>
				{['', 'Subject', 'Status', 'Priority', 'Assigned to', 'Updated'].map((h, i) => (
					<Text key={h + i} color="ink-gray-5" size={13} style={{width: W[i]}}>
						{h}
					</Text>
				))}
			</>
		);
	}
	const [subj, status, prio, who, when] = row!;
	return (
		<>
			<div style={{width: W[0]}}>
				<Checkbox checked={checked ? 1 : 0} />
			</div>
			<Text color="ink-gray-8" weight={500} style={{width: W[1]}}>
				{subj}
			</Text>
			<div style={{width: W[2]}}>
				<Badge label={status} theme={STATUS[status]} />
			</div>
			<div style={{width: W[3]}}>
				<Badge label={prio} theme={PRIORITY[prio]} dot />
			</div>
			<div style={{width: W[4], display: 'flex', alignItems: 'center', gap: 8}}>
				<Avatar name={who} size={22} />
				<Text color="ink-gray-7">{who}</Text>
			</div>
			<Text color="ink-gray-5" style={{width: W[5]}}>
				{when}
			</Text>
		</>
	);
};

export const Phone: React.FC<{t: number; at: number}> = ({t, at}) => (
	<div
		style={{
			width: 390,
			height: 800,
			borderRadius: 54,
			padding: 12,
			boxSizing: 'border-box',
			background: '#111',
			boxShadow: '0 0 0 1.5px rgba(128,128,128,0.35), 0 30px 60px -20px rgba(0,0,0,0.35)',
			...enter(t, at, 0, 40),
		}}
	>
		<div style={{width: '100%', height: '100%', borderRadius: 42, overflow: 'hidden', background: v('surface-base'), position: 'relative', display: 'flex', flexDirection: 'column'}}>
			<div style={{height: 44}} />
			<div style={{display: 'flex', alignItems: 'center', padding: '6px 18px 12px', ...enter(t, at + 12)}}>
				<Text size={22} weight={600} color="ink-gray-9">
					Tickets
				</Text>
				<div style={{marginLeft: 'auto'}}>
					<Avatar name="Jay Rao" size={30} />
				</div>
			</div>
			<div style={{padding: '0 18px 10px', ...enter(t, at + 16)}}>
				<TabButtons options={['Open', 'Replied', 'Resolved']} active={0} />
			</div>
			<div style={{flex: 1, overflow: 'hidden'}}>
				{TICKETS.slice(0, 6).map((row, i) => (
					<div key={row[0]} style={{padding: '12px 18px', borderTop: `1px solid ${v('outline-gray-1')}`, ...enter(t, at + 20 + i * 4)}}>
						<div style={{display: 'flex', justifyContent: 'space-between'}}>
							<Text weight={500} color="ink-gray-9">
								{row[0]}
							</Text>
							<Text color="ink-gray-5" size={13}>
								{row[4]}
							</Text>
						</div>
						<div style={{display: 'flex', gap: 6, marginTop: 8, alignItems: 'center'}}>
							<Badge label={row[1]} theme={STATUS[row[1]]} />
							<Badge label={row[2]} theme={PRIORITY[row[2]]} dot />
							<Text color="ink-gray-5" size={13} style={{marginLeft: 4}}>
								{row[3]}
							</Text>
						</div>
					</div>
				))}
			</div>
			<div
				style={{
					height: 74,
					borderTop: `1px solid ${v('outline-gray-1')}`,
					display: 'flex',
					justifyContent: 'space-around',
					alignItems: 'flex-start',
					paddingTop: 14,
					background: v('surface-base'),
					...enter(t, at + 30, 0, 20),
				}}
			>
				{[Home, Ticket, Users, Search].map((I, i) => (
					<I key={i} size={22} color={v(i === 1 ? 'ink-gray-9' : 'ink-gray-5')} strokeWidth={1.7} />
				))}
			</div>
		</div>
	</div>
);

