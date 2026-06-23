'use client';

import { Monitor, Smartphone, Sparkles } from 'lucide-react';
import { DynamicRoomView } from '@/modules/tools/components/dynamic-room-view';
import { RoomEditContext } from '@/modules/tools/lib/room-ui';
import type { AiToolDefinition } from '@/modules/tools/services/tool-definitions.service';

export type PreviewDevice = 'mobile' | 'desktop';

/**
 * Prévia ao vivo da sala "no lugar do agente" — frame de Celular | Computador
 * + Aluno | Admin, refletindo as edições na hora (via previewDef) e clicável:
 * tocar num elemento seleciona/foca o campo correspondente no formulário.
 */
export function RoomLivePreview({
	previewDef,
	screen,
	onScreenChange,
	device,
	onDeviceChange,
	selected,
	onPick,
	onBackToAgent,
}: {
	previewDef: AiToolDefinition | null;
	screen: 'customer' | 'admin';
	onScreenChange: (s: 'customer' | 'admin') => void;
	device: PreviewDevice;
	onDeviceChange: (d: PreviewDevice) => void;
	selected?: string;
	onPick: (field: string) => void;
	onBackToAgent: () => void;
}) {
	const room = previewDef?.engine_runtime === 'room_v1' ? previewDef : null;

	return (
		<aside className="space-y-3">
			<div className="forge-rise flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.07] bg-[#0a0c10]/90 p-2">
				{/* Aluno | Admin */}
				<Segmented
					value={screen}
					onChange={(v) => onScreenChange(v as 'customer' | 'admin')}
					options={[
						{ value: 'customer', label: 'Aluno' },
						{ value: 'admin', label: 'Admin' },
					]}
				/>
				{/* Celular | Computador */}
				<Segmented
					value={device}
					onChange={(v) => onDeviceChange(v as PreviewDevice)}
					options={[
						{ value: 'mobile', label: 'Celular', icon: Smartphone },
						{ value: 'desktop', label: 'Computador', icon: Monitor },
					]}
				/>
				<button
					type="button"
					onClick={onBackToAgent}
					className="ml-auto flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white"
				>
					<Sparkles className="h-3.5 w-3.5" /> Agente
				</button>
			</div>

			<p className="px-1 font-mono text-[11px] uppercase tracking-widest text-violet-300">
				Prévia ao vivo · clique nos elementos pra editar
			</p>

			{room ? (
				<RoomEditContext.Provider value={{ editable: true, selected, onPick }}>
					{device === 'mobile' ? (
						<div className="mx-auto w-[380px] max-w-full rounded-[2.2rem] border-[6px] border-[#15171d] bg-slate-50 p-1.5 shadow-2xl dark:bg-[#0b0e12]">
							<div className="max-h-[70vh] overflow-y-auto rounded-[1.7rem] p-3">
								<DynamicRoomView
									toolKey={room.tool_key}
									definitionOverride={room}
									previewAs={screen === 'admin' ? 'admin' : 'customer'}
								/>
							</div>
						</div>
					) : (
						<div className="overflow-hidden rounded-xl border border-white/10 bg-slate-50 shadow-xl dark:bg-[#0b0e12]">
							<div className="flex items-center gap-1.5 border-b border-black/5 bg-black/5 px-3 py-2 dark:border-white/5 dark:bg-white/5">
								<span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
								<span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
								<span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
							</div>
							<div className="max-h-[72vh] overflow-y-auto p-4 sm:p-6">
								<DynamicRoomView
									toolKey={room.tool_key}
									definitionOverride={room}
									previewAs={screen === 'admin' ? 'admin' : 'customer'}
								/>
							</div>
						</div>
					)}
				</RoomEditContext.Provider>
			) : (
				<p className="rounded-2xl border border-white/10 bg-[#0c0f12]/80 p-8 text-center text-sm text-rose-400">
					Defina o nome/identificador da sala pra ver a prévia.
				</p>
			)}
		</aside>
	);
}

function Segmented({
	value,
	onChange,
	options,
}: {
	value: string;
	onChange: (v: string) => void;
	options: {
		value: string;
		label: string;
		icon?: React.ComponentType<{ className?: string }>;
	}[];
}) {
	return (
		<div className="inline-flex items-center gap-0.5 rounded-lg border border-white/10 bg-black/20 p-0.5">
			{options.map((o) => {
				const on = value === o.value;
				const Icon = o.icon;
				return (
					<button
						key={o.value}
						type="button"
						onClick={() => onChange(o.value)}
						className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
							on
								? 'bg-violet-500/20 text-violet-100 ring-1 ring-violet-400/30'
								: 'text-slate-400 hover:text-slate-200'
						}`}
					>
						{Icon && <Icon className="h-3.5 w-3.5" />}
						{o.label}
					</button>
				);
			})}
		</div>
	);
}
