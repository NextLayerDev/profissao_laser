'use client';

import {
	CalendarOff,
	CalendarPlus,
	Clock,
	Loader2,
	Plus,
	Trash2,
	UserCog,
} from 'lucide-react';
import { useState } from 'react';
import {
	useAddDayOff,
	useAddHoliday,
	useDaysOff,
	useDeleteDayOff,
	useDeleteHoliday,
	useGlobalConfig,
	useHolidays,
	useTechSchedule,
	useUpdateGlobalConfig,
	useUpsertTechSchedule,
} from '@/hooks/use-appointment-config';
import { useUsers } from '@/hooks/use-users';
import type {
	UpdateGlobalConfigPayload,
	UpsertTechnicianSchedulePayload,
	WorkingDays,
} from '@/types/appointment-config';

const DAY_LABELS: Array<{ key: keyof WorkingDays; label: string }> = [
	{ key: 'mon', label: 'Seg' },
	{ key: 'tue', label: 'Ter' },
	{ key: 'wed', label: 'Qua' },
	{ key: 'thu', label: 'Qui' },
	{ key: 'fri', label: 'Sex' },
	{ key: 'sat', label: 'Sáb' },
	{ key: 'sun', label: 'Dom' },
];

function CardShell({
	title,
	icon: Icon,
	children,
}: {
	title: string;
	icon: typeof Clock;
	children: React.ReactNode;
}) {
	return (
		<div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-5">
			<div className="flex items-center gap-2 mb-4">
				<Icon className="w-4 h-4 text-violet-600" />
				<h3 className="font-semibold text-slate-900 dark:text-white">
					{title}
				</h3>
			</div>
			{children}
		</div>
	);
}

// ─── Global hours card ───────────────────────────────────────────────────

function GlobalHoursCard() {
	const { data: cfg, isLoading } = useGlobalConfig();
	const update = useUpdateGlobalConfig();

	const [form, setForm] = useState<UpdateGlobalConfigPayload>({});

	if (isLoading || !cfg) {
		return (
			<CardShell title="Horário padrão" icon={Clock}>
				<Loader2 className="w-5 h-5 animate-spin text-violet-600" />
			</CardShell>
		);
	}

	const value = (k: keyof UpdateGlobalConfigPayload) =>
		(form[k] ?? cfg[k]) as string;
	const workingDays = (form.workingDays ?? cfg.workingDays) as WorkingDays;

	const toggleDay = (key: keyof WorkingDays) => {
		setForm((f) => ({
			...f,
			workingDays: { ...workingDays, [key]: !workingDays[key] },
		}));
	};

	const onSubmit = () => {
		if (Object.keys(form).length === 0) return;
		update.mutate(form, {
			onSuccess: () => setForm({}),
		});
	};

	return (
		<CardShell title="Horário padrão" icon={Clock}>
			<div className="space-y-4">
				<div>
					<span className="text-xs font-medium text-slate-500 dark:text-gray-400 block mb-2">
						Dias úteis
					</span>
					<div className="flex flex-wrap gap-1.5">
						{DAY_LABELS.map((d) => (
							<button
								key={d.key}
								type="button"
								onClick={() => toggleDay(d.key)}
								className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
									workingDays[d.key]
										? 'bg-violet-600 text-white'
										: 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
								}`}
							>
								{d.label}
							</button>
						))}
					</div>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div>
						<label
							htmlFor="hour-start"
							className="text-xs font-medium text-slate-500 dark:text-gray-400 block mb-1"
						>
							Abre
						</label>
						<input
							id="hour-start"
							type="time"
							value={value('workingHourStart')}
							onChange={(e) =>
								setForm((f) => ({ ...f, workingHourStart: e.target.value }))
							}
							className="w-full h-10 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white px-3 focus:outline-none focus:border-violet-500"
						/>
					</div>
					<div>
						<label
							htmlFor="hour-end"
							className="text-xs font-medium text-slate-500 dark:text-gray-400 block mb-1"
						>
							Fecha
						</label>
						<input
							id="hour-end"
							type="time"
							value={value('workingHourEnd')}
							onChange={(e) =>
								setForm((f) => ({ ...f, workingHourEnd: e.target.value }))
							}
							className="w-full h-10 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white px-3 focus:outline-none focus:border-violet-500"
						/>
					</div>
					<div>
						<label
							htmlFor="lunch-start"
							className="text-xs font-medium text-slate-500 dark:text-gray-400 block mb-1"
						>
							Almoço (início)
						</label>
						<input
							id="lunch-start"
							type="time"
							value={form.lunchStart ?? cfg.lunchStart ?? ''}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									lunchStart: e.target.value || null,
								}))
							}
							className="w-full h-10 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white px-3 focus:outline-none focus:border-violet-500"
						/>
					</div>
					<div>
						<label
							htmlFor="lunch-end"
							className="text-xs font-medium text-slate-500 dark:text-gray-400 block mb-1"
						>
							Almoço (fim)
						</label>
						<input
							id="lunch-end"
							type="time"
							value={form.lunchEnd ?? cfg.lunchEnd ?? ''}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									lunchEnd: e.target.value || null,
								}))
							}
							className="w-full h-10 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white px-3 focus:outline-none focus:border-violet-500"
						/>
					</div>
				</div>

				<div>
					<label
						htmlFor="slot-duration"
						className="text-xs font-medium text-slate-500 dark:text-gray-400 block mb-1"
					>
						Duração do slot (min)
					</label>
					<input
						id="slot-duration"
						type="number"
						min={15}
						max={240}
						step={15}
						value={form.slotDurationMinutes ?? cfg.slotDurationMinutes}
						onChange={(e) =>
							setForm((f) => ({
								...f,
								slotDurationMinutes: Number(e.target.value),
							}))
						}
						className="w-32 h-10 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white px-3 focus:outline-none focus:border-violet-500"
					/>
				</div>

				<div className="flex justify-end">
					<button
						type="button"
						onClick={onSubmit}
						disabled={Object.keys(form).length === 0 || update.isPending}
						className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
					>
						{update.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
						Salvar
					</button>
				</div>
			</div>
		</CardShell>
	);
}

// ─── Holidays card ───────────────────────────────────────────────────────

function HolidaysCard() {
	const { data: holidays = [], isLoading } = useHolidays();
	const add = useAddHoliday();
	const del = useDeleteHoliday();
	const [date, setDate] = useState('');
	const [label, setLabel] = useState('');
	const [recurring, setRecurring] = useState(false);

	const onAdd = () => {
		if (!date || !label.trim()) return;
		add.mutate(
			{ date, label: label.trim(), recurringYearly: recurring },
			{
				onSuccess: () => {
					setDate('');
					setLabel('');
					setRecurring(false);
				},
			},
		);
	};

	return (
		<CardShell title="Feriados" icon={CalendarOff}>
			<div className="space-y-3">
				<div className="grid grid-cols-[140px_1fr_auto] gap-2">
					<input
						type="date"
						value={date}
						onChange={(e) => setDate(e.target.value)}
						className="h-10 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white px-3 focus:outline-none focus:border-violet-500"
					/>
					<input
						type="text"
						value={label}
						onChange={(e) => setLabel(e.target.value)}
						placeholder="Nome do feriado"
						className="h-10 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 px-3 focus:outline-none focus:border-violet-500"
					/>
					<button
						type="button"
						onClick={onAdd}
						disabled={!date || !label.trim() || add.isPending}
						className="inline-flex items-center gap-1 px-3 h-10 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg"
					>
						<Plus className="w-4 h-4" />
						Add
					</button>
				</div>
				<label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-gray-400 cursor-pointer">
					<input
						type="checkbox"
						checked={recurring}
						onChange={(e) => setRecurring(e.target.checked)}
						className="accent-violet-600"
					/>
					Repete todo ano nesta data
				</label>

				{isLoading ? (
					<Loader2 className="w-5 h-5 animate-spin text-violet-600 mt-2" />
				) : holidays.length === 0 ? (
					<p className="text-sm text-slate-500 dark:text-gray-400 py-4 text-center">
						Nenhum feriado cadastrado.
					</p>
				) : (
					<ul className="space-y-2 max-h-72 overflow-y-auto">
						{holidays.map((h) => (
							<li
								key={h.id}
								className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-white/5"
							>
								<div className="min-w-0">
									<p className="text-sm font-medium text-slate-900 dark:text-white truncate">
										{h.label}
									</p>
									<p className="text-xs text-slate-500 dark:text-gray-400">
										{h.date}
										{h.recurringYearly && ' • todo ano'}
									</p>
								</div>
								<button
									type="button"
									onClick={() => del.mutate(h.id)}
									className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
									aria-label="Remover"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		</CardShell>
	);
}

// ─── Days off card ───────────────────────────────────────────────────────

function DaysOffCard() {
	const { users } = useUsers();
	const technicians = users.filter(
		(u) =>
			u.role?.toLowerCase() === 'tecnico' ||
			u.role?.toLowerCase() === 'colaborador',
	);
	const [filterTech, setFilterTech] = useState<string>('');
	const { data: daysOff = [], isLoading } = useDaysOff(
		filterTech ? { technicianId: filterTech } : undefined,
	);
	const add = useAddDayOff();
	const del = useDeleteDayOff();

	const [techId, setTechId] = useState<string>('');
	const [date, setDate] = useState('');
	const [reason, setReason] = useState('');

	const onAdd = () => {
		if (!date) return;
		add.mutate(
			{
				technicianId: techId || null,
				date,
				reason: reason.trim() || undefined,
			},
			{
				onSuccess: () => {
					setDate('');
					setReason('');
				},
			},
		);
	};

	return (
		<CardShell title="Folgas" icon={CalendarPlus}>
			<div className="space-y-3">
				<div className="grid grid-cols-[1fr_140px_auto] gap-2">
					<select
						value={techId}
						onChange={(e) => setTechId(e.target.value)}
						className="h-10 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white px-3 focus:outline-none focus:border-violet-500"
					>
						<option value="">Folga global (todos)</option>
						{technicians.map((t) => (
							<option key={t.id} value={t.id}>
								{t.name}
							</option>
						))}
					</select>
					<input
						type="date"
						value={date}
						onChange={(e) => setDate(e.target.value)}
						className="h-10 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white px-3 focus:outline-none focus:border-violet-500"
					/>
					<button
						type="button"
						onClick={onAdd}
						disabled={!date || add.isPending}
						className="inline-flex items-center gap-1 px-3 h-10 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg"
					>
						<Plus className="w-4 h-4" />
						Add
					</button>
				</div>
				<input
					type="text"
					value={reason}
					onChange={(e) => setReason(e.target.value)}
					placeholder="Motivo (opcional)"
					className="w-full h-10 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 px-3 focus:outline-none focus:border-violet-500"
				/>

				<div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
					<span className="text-xs text-slate-500 dark:text-gray-400">
						Filtrar por técnico:
					</span>
					<select
						value={filterTech}
						onChange={(e) => setFilterTech(e.target.value)}
						className="h-8 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-gray-300 px-2 focus:outline-none focus:border-violet-500"
					>
						<option value="">Todos</option>
						{technicians.map((t) => (
							<option key={t.id} value={t.id}>
								{t.name}
							</option>
						))}
					</select>
				</div>

				{isLoading ? (
					<Loader2 className="w-5 h-5 animate-spin text-violet-600 mt-2" />
				) : daysOff.length === 0 ? (
					<p className="text-sm text-slate-500 dark:text-gray-400 py-4 text-center">
						Nenhuma folga cadastrada.
					</p>
				) : (
					<ul className="space-y-2 max-h-72 overflow-y-auto">
						{daysOff.map((d) => {
							const techName = d.technicianId
								? (technicians.find((t) => t.id === d.technicianId)?.name ??
									d.technicianId)
								: 'Todos';
							return (
								<li
									key={d.id}
									className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-white/5"
								>
									<div className="min-w-0">
										<p className="text-sm font-medium text-slate-900 dark:text-white truncate">
											{d.date} — {techName}
										</p>
										{d.reason && (
											<p className="text-xs text-slate-500 dark:text-gray-400 truncate">
												{d.reason}
											</p>
										)}
									</div>
									<button
										type="button"
										onClick={() => del.mutate(d.id)}
										className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
										aria-label="Remover"
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</CardShell>
	);
}

// ─── Technician override card ────────────────────────────────────────────

function TechnicianOverrideCard() {
	const { users } = useUsers();
	const technicians = users.filter(
		(u) =>
			u.role?.toLowerCase() === 'tecnico' ||
			u.role?.toLowerCase() === 'colaborador',
	);
	const [selectedTech, setSelectedTech] = useState<string>('');
	const { data: sched, isLoading } = useTechSchedule(selectedTech || null);
	const upsert = useUpsertTechSchedule(selectedTech);

	const [form, setForm] = useState<UpsertTechnicianSchedulePayload>({});

	const value = (k: keyof UpsertTechnicianSchedulePayload): string => {
		const v = form[k] ?? (sched ? sched[k] : null);
		return (v as string | null) ?? '';
	};
	const workingDays = (form.workingDays ??
		sched?.workingDays ??
		null) as WorkingDays | null;

	const toggleDay = (key: keyof WorkingDays) => {
		const base: WorkingDays = workingDays ?? {
			mon: true,
			tue: true,
			wed: true,
			thu: true,
			fri: true,
			sat: false,
			sun: false,
		};
		setForm((f) => ({
			...f,
			workingDays: { ...base, [key]: !base[key] },
		}));
	};

	const onSubmit = () => {
		if (!selectedTech || Object.keys(form).length === 0) return;
		upsert.mutate(form, { onSuccess: () => setForm({}) });
	};

	const onReset = () => setForm({});

	return (
		<CardShell title="Override por técnico" icon={UserCog}>
			<div className="space-y-3">
				<select
					value={selectedTech}
					onChange={(e) => {
						setSelectedTech(e.target.value);
						setForm({});
					}}
					className="w-full h-10 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white px-3 focus:outline-none focus:border-violet-500"
				>
					<option value="">Selecione um técnico</option>
					{technicians.map((t) => (
						<option key={t.id} value={t.id}>
							{t.name}
						</option>
					))}
				</select>

				{selectedTech && (
					<>
						{isLoading ? (
							<Loader2 className="w-5 h-5 animate-spin text-violet-600" />
						) : (
							<>
								<p className="text-xs text-slate-500 dark:text-gray-400">
									Campos vazios = usa config global. Preencha só o que quer
									sobrescrever.
								</p>
								<div>
									<span className="text-xs font-medium text-slate-500 dark:text-gray-400 block mb-2">
										Dias úteis (override)
									</span>
									<div className="flex flex-wrap gap-1.5">
										{DAY_LABELS.map((d) => (
											<button
												key={d.key}
												type="button"
												onClick={() => toggleDay(d.key)}
												className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
													workingDays?.[d.key]
														? 'bg-violet-600 text-white'
														: 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
												}`}
											>
												{d.label}
											</button>
										))}
									</div>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label
											htmlFor={`tech-start-${selectedTech}`}
											className="text-xs font-medium text-slate-500 dark:text-gray-400 block mb-1"
										>
											Abre
										</label>
										<input
											id={`tech-start-${selectedTech}`}
											type="time"
											value={value('workingHourStart')}
											onChange={(e) =>
												setForm((f) => ({
													...f,
													workingHourStart: e.target.value || null,
												}))
											}
											className="w-full h-10 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white px-3 focus:outline-none focus:border-violet-500"
										/>
									</div>
									<div>
										<label
											htmlFor={`tech-end-${selectedTech}`}
											className="text-xs font-medium text-slate-500 dark:text-gray-400 block mb-1"
										>
											Fecha
										</label>
										<input
											id={`tech-end-${selectedTech}`}
											type="time"
											value={value('workingHourEnd')}
											onChange={(e) =>
												setForm((f) => ({
													...f,
													workingHourEnd: e.target.value || null,
												}))
											}
											className="w-full h-10 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white px-3 focus:outline-none focus:border-violet-500"
										/>
									</div>
									<div>
										<label
											htmlFor={`tech-lunch-start-${selectedTech}`}
											className="text-xs font-medium text-slate-500 dark:text-gray-400 block mb-1"
										>
											Almoço (início)
										</label>
										<input
											id={`tech-lunch-start-${selectedTech}`}
											type="time"
											value={value('lunchStart')}
											onChange={(e) =>
												setForm((f) => ({
													...f,
													lunchStart: e.target.value || null,
												}))
											}
											className="w-full h-10 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white px-3 focus:outline-none focus:border-violet-500"
										/>
									</div>
									<div>
										<label
											htmlFor={`tech-lunch-end-${selectedTech}`}
											className="text-xs font-medium text-slate-500 dark:text-gray-400 block mb-1"
										>
											Almoço (fim)
										</label>
										<input
											id={`tech-lunch-end-${selectedTech}`}
											type="time"
											value={value('lunchEnd')}
											onChange={(e) =>
												setForm((f) => ({
													...f,
													lunchEnd: e.target.value || null,
												}))
											}
											className="w-full h-10 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white px-3 focus:outline-none focus:border-violet-500"
										/>
									</div>
								</div>
								<div className="flex justify-end gap-2">
									<button
										type="button"
										onClick={onReset}
										disabled={Object.keys(form).length === 0}
										className="px-3 py-2 text-sm text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 rounded-lg"
									>
										Cancelar
									</button>
									<button
										type="button"
										onClick={onSubmit}
										disabled={
											Object.keys(form).length === 0 || upsert.isPending
										}
										className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg"
									>
										{upsert.isPending && (
											<Loader2 className="w-4 h-4 animate-spin" />
										)}
										Salvar override
									</button>
								</div>
							</>
						)}
					</>
				)}
			</div>
		</CardShell>
	);
}

// ─── Section root ────────────────────────────────────────────────────────

export function AppointmentConfigSection() {
	return (
		<div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
			<div className="max-w-5xl mx-auto space-y-4">
				<div>
					<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
						Configurações de agendamento
					</h2>
					<p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
						Define horários, almoço, feriados e folgas. O slot picker do
						customer respeita tudo isso automaticamente.
					</p>
				</div>
				<div className="grid gap-4 lg:grid-cols-2">
					<GlobalHoursCard />
					<HolidaysCard />
					<DaysOffCard />
					<TechnicianOverrideCard />
				</div>
			</div>
		</div>
	);
}
