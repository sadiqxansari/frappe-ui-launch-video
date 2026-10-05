import {Bell, CalendarDays, Moon, Search} from 'lucide-react';
import React from 'react';
import {v} from '../theme';
import {Avatar, Badge, Button, Panel, Progress, Slider, Switch, TabButtons, Tag, Text, TextInput, Toast} from './kit';

/** A ticket card, the way Helpdesk draws one with frappe-ui. */
export const TicketCard: React.FC<{style?: React.CSSProperties}> = ({style}) => (
	<Panel elevation="lg" style={{width: 400, padding: 20, ...style}}>
		<div style={{display: 'flex', alignItems: 'center', gap: 10}}>
			<Avatar name="Priya Nair" size={28} />
			<Text weight={500}>Priya Nair</Text>
			<Text color="ink-gray-5" style={{marginLeft: 'auto'}}>
				2m ago
			</Text>
		</div>
		<Text size={17} weight={600} color="ink-gray-9" style={{marginTop: 16}}>
			Payment failed on renewal
		</Text>
		<Text color="ink-gray-6" style={{marginTop: 6, lineHeight: 1.5}}>
			The card on file was declined twice. Can you retry before the site is suspended?
		</Text>
		<div style={{display: 'flex', gap: 6, marginTop: 14}}>
			<Badge label="Urgent" theme="red" dot />
			<Badge label="Billing" theme="gray" />
			<Badge label="Open" theme="blue" />
		</div>
		<div style={{height: 1, background: v('outline-gray-1'), margin: '18px -20px 16px'}} />
		<div style={{display: 'flex', gap: 8, justifyContent: 'flex-end'}}>
			<Button label="Close" variant="subtle" size="md" />
			<Button label="Reply" variant="solid" size="md" />
		</div>
	</Panel>
);

export const SettingsCard: React.FC<{t: number; style?: React.CSSProperties}> = ({t, style}) => (
	<Panel elevation="lg" style={{width: 340, padding: '8px 20px', ...style}}>
		{[
			['Email alerts', 1, Bell],
			['Weekly digest', 0, CalendarDays],
			['Dark mode', 1, Moon],
		].map(([name, on, Icon], i) => {
			const I = Icon as typeof Bell;
			return (
				<div
					key={name as string}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 10,
						padding: '14px 0',
						borderTop: i ? `1px solid ${v('outline-gray-1')}` : 'none',
					}}
				>
					<I size={16} color={v('ink-gray-6')} strokeWidth={1.6} />
					<Text>{name as string}</Text>
					<div style={{marginLeft: 'auto'}}>
						<Switch on={i === 1 ? t : (on as number)} />
					</div>
				</div>
			);
		})}
		<div style={{padding: '12px 0 18px', borderTop: `1px solid ${v('outline-gray-1')}`}}>
			<Text color="ink-gray-5" size={13} style={{marginBottom: 12}}>
				Density
			</Text>
			<Slider value={0.35 + 0.3 * t} width={300} />
		</div>
	</Panel>
);

export const FilterCard: React.FC<{style?: React.CSSProperties}> = ({style}) => (
	<Panel elevation="lg" style={{width: 400, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, ...style}}>
		<TextInput value="renewal" width={360} icon={<Search size={14} color={v('ink-gray-5')} />} />
		<div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
			<TabButtons options={['Day', 'Week', 'Month']} active={1} />
			<div style={{display: 'flex'}}>
				{['Ana Lopez', 'Rahul Shah', 'Mei Chen'].map((n, i) => (
					<div key={n} style={{marginLeft: i ? -6 : 0}}>
						<Avatar name={n} size={26} ring />
					</div>
				))}
			</div>
		</div>
		<div style={{display: 'flex', gap: 6}}>
			<Tag label="billing" />
			<Tag label="renewal" />
			<Tag label="card" />
		</div>
		<Progress value={0.64} width={360} label="Storage" />
	</Panel>
);

/** The collage the dark-mode split slides across. Laid out for a 1920×1080 frame at zoom 1.5. */
export const Mosaic: React.FC<{t: number}> = ({t}) => (
	<div style={{position: 'absolute', inset: 0, zoom: 1.5, top: 40}}>
		<TicketCard style={{position: 'absolute', left: 60, top: 110}} />
		<SettingsCard t={t} style={{position: 'absolute', left: 490, top: 80}} />
		<FilterCard style={{position: 'absolute', left: 860, top: 150}} />
		<div style={{position: 'absolute', left: 520, top: 440}}>
			<Toast title="Ticket assigned" body="Priya's ticket is now yours." />
		</div>
	</div>
);
