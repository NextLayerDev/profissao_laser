'use client';

import {
	Disc3,
	KeyRound,
	MessageSquare,
	Paperclip,
	Users,
	Video,
} from 'lucide-react';
import type { BuilderRoomState } from './builder-model';
import { Field, FormSection, inputCls, Switch } from './builder-ui';

type PlanLite = { id: string; key: string; name: string };

/**
 * Seções do builder para tools de SALA (Mentoria, `room_v1`): substituem
 * Campos/Fluxo/Resultado/Preço quando `toolType==='room'`. Editam `state.room`
 * (BuilderRoomState) via `setRoom`. O vídeo é sempre link externo (colado por
 * sessão, não aqui).
 */
export function RoomBuilderSections({
	room,
	plans,
	plansLoading,
	setRoom,
}: {
	room: BuilderRoomState;
	plans: PlanLite[];
	plansLoading?: boolean;
	setRoom: (partial: Partial<BuilderRoomState>) => void;
}) {
	const togglePlan = (key: string) => {
		const has = room.includedPlanKeys.includes(key);
		setRoom({
			includedPlanKeys: has
				? room.includedPlanKeys.filter((k) => k !== key)
				: [...room.includedPlanKeys, key],
		});
	};

	return (
		<>
			{/* ── Sala ── */}
			<FormSection
				step="02"
				title="Sala"
				subtitle="Capacidade, agendamento e recursos da mentoria."
				icon={<Video className="h-4 w-4" />}
				accent="cyan"
				delay={60}
			>
				<div className="grid gap-5 sm:grid-cols-3">
					<Field
						label="Limite de vagas"
						hint="vazio = sem limite"
						htmlFor="room-cap"
					>
						<div className="relative">
							<Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
							<input
								id="room-cap"
								type="number"
								min={1}
								value={room.cap ?? ''}
								onChange={(e) =>
									setRoom({
										cap: e.target.value
											? Math.max(1, Number(e.target.value))
											: null,
									})
								}
								placeholder="Sem limite"
								className={`${inputCls} pl-9`}
							/>
						</div>
					</Field>
					<Field
						label="Abre antes"
						hint="minutos antes do início"
						htmlFor="room-opens"
					>
						<input
							id="room-opens"
							type="number"
							min={0}
							max={120}
							value={room.opensMinutesBefore}
							onChange={(e) =>
								setRoom({
									opensMinutesBefore: Math.max(0, Number(e.target.value)),
								})
							}
							className={inputCls}
						/>
					</Field>
					<Field label="Duração padrão" hint="minutos" htmlFor="room-duration">
						<input
							id="room-duration"
							type="number"
							min={0}
							max={1440}
							value={room.defaultDurationMin}
							onChange={(e) =>
								setRoom({
									defaultDurationMin: Math.max(0, Number(e.target.value)),
								})
							}
							className={inputCls}
						/>
					</Field>
				</div>

				<div className="mt-5 space-y-2.5">
					<p className="text-[13px] font-medium text-slate-300">Recursos</p>
					<RoomFeatureRow
						icon={<Disc3 className="h-4 w-4" />}
						label="Gravação / replay"
						hint="link da gravação colado depois da sessão"
						checked={room.features.recording}
						onChange={(v) =>
							setRoom({ features: { ...room.features, recording: v } })
						}
					/>
					<RoomFeatureRow
						icon={<MessageSquare className="h-4 w-4" />}
						label="Chat ao vivo"
						checked={room.features.chat}
						onChange={(v) =>
							setRoom({ features: { ...room.features, chat: v } })
						}
					/>
					<RoomFeatureRow
						icon={<Paperclip className="h-4 w-4" />}
						label="Materiais / anexos"
						checked={room.features.materials}
						onChange={(v) =>
							setRoom({ features: { ...room.features, materials: v } })
						}
					/>
				</div>
			</FormSection>

			{/* ── Acesso ── */}
			<FormSection
				step="03"
				title="Acesso"
				subtitle="Quem entra de graça (por plano) e quem paga em voxes."
				icon={<KeyRound className="h-4 w-4" />}
				accent="amber"
				delay={120}
			>
				<Field
					label="Planos com entrada grátis"
					hint="quem tem um destes entra sem pagar"
				>
					{plansLoading ? (
						<p className="text-sm text-slate-500">A carregar planos…</p>
					) : plans.length === 0 ? (
						<p className="text-sm text-slate-500">Nenhum plano cadastrado.</p>
					) : (
						<div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
							{plans.map((p) => {
								const on = room.includedPlanKeys.includes(p.key);
								return (
									<button
										key={p.id}
										type="button"
										aria-pressed={on}
										onClick={() => togglePlan(p.key)}
										className={`flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition-colors ${
											on
												? 'border-amber-400/50 bg-amber-500/10'
												: 'border-white/10 bg-black/20 hover:bg-white/[0.04]'
										}`}
									>
										<span className="truncate text-[13px] font-medium text-slate-200">
											{p.name}
										</span>
										<span className="font-mono text-[11px] text-slate-500">
											{on ? 'incluído' : p.key}
										</span>
									</button>
								);
							})}
						</div>
					)}
				</Field>

				<div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-[13px] font-medium text-slate-200">
								Permitir entrada por voxes
							</p>
							<p className="text-[11px] text-slate-500">
								{room.allowVoxEntry
									? 'Quem não tem plano incluído pode entrar pagando.'
									: 'Só planos incluídos entram (sem comprar entrada).'}
							</p>
						</div>
						<Switch
							checked={room.allowVoxEntry}
							onChange={(v) => setRoom({ allowVoxEntry: v })}
							accent="amber"
						/>
					</div>

					{room.allowVoxEntry && (
						<Field
							label="Custo da entrada"
							hint="cobrado uma vez por sessão"
							htmlFor="room-voxcost"
							className="mt-4 max-w-[14rem]"
						>
							<div className="relative">
								<input
									id="room-voxcost"
									type="number"
									step={1}
									min={0}
									value={room.voxCost}
									onChange={(e) =>
										setRoom({ voxCost: Math.max(0, Number(e.target.value)) })
									}
									className={`${inputCls} pr-14 font-mono text-amber-200`}
								/>
								<span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-amber-400/80">
									voxxys
								</span>
							</div>
						</Field>
					)}
				</div>
			</FormSection>
		</>
	);
}

function RoomFeatureRow({
	icon,
	label,
	hint,
	checked,
	onChange,
}: {
	icon: React.ReactNode;
	label: string;
	hint?: string;
	checked: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5">
			<div className="flex items-center gap-2.5">
				<span className="text-slate-400">{icon}</span>
				<div>
					<p className="text-[13px] font-medium text-slate-200">{label}</p>
					{hint && <p className="text-[11px] text-slate-500">{hint}</p>}
				</div>
			</div>
			<Switch checked={checked} onChange={onChange} accent="cyan" />
		</div>
	);
}
