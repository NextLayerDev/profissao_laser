'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
	CalendarClock,
	Lock,
	Pencil,
	Plus,
	Trash2,
	Users,
	Video,
	X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { useEntitlements } from '@/hooks/use-entitlements';
import { usePermissions } from '@/hooks/use-permissions';
import {
	useCreateSession,
	useDeleteSession,
	useJoinRoomFree,
	useMentorshipSessions,
	useRoomPresenceRealtime,
	useRoomState,
	useUpdateSession,
} from '../hooks/use-mentorship';
import { useRunTool } from '../hooks/use-run-tool';
import { useToolDefinition } from '../hooks/use-tool-definition';
import {
	type CreateSessionBody,
	joinSession,
	type MentorshipSession,
} from '../services/mentorship.service';

/** Formata data (YYYY-MM-DD) + hora (HH:MM) para exibição BRT amigável. */
function formatWhen(date: string, time?: string | null): string {
	try {
		const d = new Date(`${date}T${time?.length ? time : '00:00'}:00-03:00`);
		const fmt = new Intl.DateTimeFormat('pt-BR', {
			day: '2-digit',
			month: 'short',
			hour: time ? '2-digit' : undefined,
			minute: time ? '2-digit' : undefined,
			timeZone: 'America/Sao_Paulo',
		});
		return fmt.format(d);
	} catch {
		return date;
	}
}

/** Overlay + backdrop clicável (botão, a11y-safe) + cartão central. */
function ModalShell({
	onClose,
	children,
}: {
	onClose: () => void;
	children: ReactNode;
}) {
	return (
		<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
			<button
				type="button"
				aria-label="Fechar"
				className="absolute inset-0 cursor-default"
				onClick={onClose}
			/>
			<div className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl dark:border-white/10 dark:bg-[#161618]">
				{children}
			</div>
		</div>
	);
}

/* ════════════════════ Sala (modal de uma sessão) ════════════════════ */
function RoomModal({
	sessionId,
	toolKey,
	courseSlug,
	onClose,
}: {
	sessionId: string;
	toolKey: string;
	courseSlug?: string;
	onClose: () => void;
}) {
	const qc = useQueryClient();
	const router = useRouter();
	const { data: state, isLoading } = useRoomState(sessionId);
	useRoomPresenceRealtime(sessionId);
	const joinFree = useJoinRoomFree(sessionId);
	const runTool = useRunTool(toolKey, courseSlug);

	// Ticker 1s só pra atualizar o "abre em…" sem esperar o polling de 5s.
	const [, setTick] = useState(0);
	useEffect(() => {
		const t = setInterval(() => setTick((n) => n + 1), 1_000);
		return () => clearInterval(t);
	}, []);

	const openLink = (url: string) => window.open(url, '_blank', 'noopener');

	const enterFree = async () => {
		const res = await joinFree.mutateAsync().catch(() => null);
		if (res?.externalUrl) openLink(res.externalUrl);
	};

	const enterPaid = async () => {
		const res = await runTool.run((invocationId) =>
			joinSession(sessionId, invocationId),
		);
		if (res) {
			qc.invalidateQueries({ queryKey: ['mentorship', 'room', sessionId] });
			openLink(res.externalUrl);
		}
	};

	const busy = joinFree.isPending || runTool.pending;
	const capFull =
		!!state &&
		state.session.cap != null &&
		state.activeCount >= state.session.cap &&
		!state.hasJoined;

	const opensInMs = state ? new Date(state.opensAt).getTime() - Date.now() : 0;
	const opensLabel =
		opensInMs > 0 ? `Abre em ${Math.ceil(opensInMs / 60_000)} min` : 'Abrindo…';

	return (
		<ModalShell onClose={onClose}>
			{isLoading || !state ? (
				<div className="py-10 text-center text-slate-500 dark:text-gray-400">
					A carregar a sala…
				</div>
			) : (
				<>
					<div className="flex items-start justify-between gap-3">
						<div>
							<h3 className="text-lg font-bold text-slate-900 dark:text-white">
								{state.session.title}
							</h3>
							<p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400">
								<CalendarClock className="size-4" />
								{formatWhen(state.session.date, state.session.time)}
								{state.isLive && (
									<span className="ml-1 inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-500">
										<span className="size-1.5 animate-pulse rounded-full bg-red-500" />
										AO VIVO
									</span>
								)}
							</p>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
						>
							<X className="size-5" />
						</button>
					</div>

					{state.session.description && (
						<p className="mt-3 whitespace-pre-wrap text-sm text-slate-600 dark:text-gray-300">
							{state.session.description}
						</p>
					)}

					<div className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300">
						<Users className="size-4" />
						<span>
							{state.activeCount}
							{state.session.cap != null ? ` / ${state.session.cap}` : ''} na
							sala
						</span>
					</div>
					{state.attendees.length > 0 && (
						<div className="mt-2 flex flex-wrap gap-1.5">
							{state.attendees.slice(0, 12).map((a) => (
								<span
									key={a.customerId}
									title={a.customerName ?? ''}
									className="grid size-7 place-items-center overflow-hidden rounded-full bg-slate-200 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-gray-200"
								>
									{a.customerImage ? (
										// biome-ignore lint/performance/noImgElement: avatar dinâmico
										<img
											src={a.customerImage}
											alt={a.customerName ?? ''}
											className="size-full object-cover"
										/>
									) : (
										(a.customerName ?? '?').charAt(0).toUpperCase()
									)}
								</span>
							))}
						</div>
					)}

					{/* Ação principal */}
					<div className="mt-5">
						{state.hasJoined && state.externalUrl ? (
							<button
								type="button"
								onClick={() => openLink(state.externalUrl as string)}
								className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700"
							>
								<Video className="size-5" /> Abrir sala
							</button>
						) : state.hasEnded ? (
							state.session.recordingUrl &&
							(state.access === 'included' || state.hasJoined) ? (
								<button
									type="button"
									onClick={() => openLink(state.session.recordingUrl as string)}
									className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 font-semibold text-white hover:bg-slate-900 dark:bg-white/10 dark:hover:bg-white/20"
								>
									<Video className="size-5" /> Ver gravação
								</button>
							) : (
								<p className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm text-slate-500 dark:bg-white/5 dark:text-gray-400">
									Esta sessão já terminou.
								</p>
							)
						) : !state.isOpen ? (
							<button
								type="button"
								disabled
								className="w-full cursor-not-allowed rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-medium text-slate-500 dark:bg-white/5 dark:text-gray-400"
							>
								{opensLabel}
							</button>
						) : capFull ? (
							<p className="rounded-xl bg-amber-500/10 px-4 py-3 text-center text-sm font-medium text-amber-600 dark:text-amber-400">
								Sala cheia ({state.session.cap} participantes).
							</p>
						) : state.access === 'blocked' ? (
							<button
								type="button"
								onClick={() => router.push('/course/store')}
								className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 font-semibold text-white hover:opacity-90"
							>
								<Lock className="size-4" /> Disponível no plano — fazer upgrade
							</button>
						) : state.access === 'pay' ? (
							<button
								type="button"
								disabled={busy}
								onClick={enterPaid}
								className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff3b30] px-4 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-60"
							>
								<Video className="size-5" /> Entrar
								<span className="rounded-md bg-white/20 px-1.5 py-0.5 text-xs">
									{state.voxCost} voxxys
								</span>
							</button>
						) : (
							<button
								type="button"
								disabled={busy}
								onClick={enterFree}
								className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff3b30] px-4 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-60"
							>
								<Video className="size-5" /> Entrar
							</button>
						)}
					</div>
					{state.access === 'pay' && !state.hasJoined && !state.hasEnded && (
						<p className="mt-2 text-center text-xs text-slate-400 dark:text-gray-500">
							Seu plano não inclui esta mentoria — a entrada custa{' '}
							{state.voxCost} voxxys (cobrado uma vez por sessão).
						</p>
					)}
				</>
			)}
		</ModalShell>
	);
}

/* ════════════════════ Form de sessão (admin) ════════════════════ */
const EMPTY: CreateSessionBody = {
	title: '',
	description: '',
	date: '',
	time: '',
	durationMin: 60,
	joinOpensMinutesBefore: 10,
	externalUrl: '',
	cap: null,
	recordingUrl: '',
};

const FIELD_CLS =
	'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-[#1a1a1d] dark:text-white';

/** Label associado por aninhar o controle dentro do <label> (a11y-safe). */
function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: o controle é aninhado via children
		<label className="block">
			<span className="mb-1 block text-xs font-medium text-slate-600 dark:text-gray-400">
				{label}
			</span>
			{children}
		</label>
	);
}

function SessionFormModal({
	toolKey,
	editing,
	onClose,
}: {
	toolKey: string;
	editing: MentorshipSession | null;
	onClose: () => void;
}) {
	const create = useCreateSession(toolKey);
	const update = useUpdateSession(toolKey);
	const [form, setForm] = useState<CreateSessionBody>(
		editing
			? {
					title: editing.title,
					description: editing.description ?? '',
					date: editing.date,
					time: editing.time ?? '',
					durationMin: editing.durationMin,
					joinOpensMinutesBefore: editing.joinOpensMinutesBefore,
					externalUrl: '',
					cap: editing.cap ?? null,
					recordingUrl: editing.recordingUrl ?? '',
				}
			: EMPTY,
	);

	const set = <K extends keyof CreateSessionBody>(
		k: K,
		v: CreateSessionBody[K],
	) => setForm((f) => ({ ...f, [k]: v }));

	const submit = async () => {
		if (!form.title.trim() || !form.date) {
			toast.error('Título e data são obrigatórios.');
			return;
		}
		if (!editing && !form.externalUrl.trim()) {
			toast.error('Cole o link da sala (Zoom/Meet).');
			return;
		}
		const body: CreateSessionBody = {
			...form,
			description: form.description?.trim() || undefined,
			time: form.time?.trim() || undefined,
			cap: form.cap ? Number(form.cap) : null,
			recordingUrl: form.recordingUrl?.trim() || null,
		};
		if (editing) {
			const patch = { ...body } as Partial<CreateSessionBody>;
			if (!form.externalUrl.trim()) delete patch.externalUrl;
			await update.mutateAsync({ id: editing.id, body: patch });
		} else {
			await create.mutateAsync(body);
		}
		onClose();
	};

	const busy = create.isPending || update.isPending;

	return (
		<ModalShell onClose={onClose}>
			<div className="mb-4 flex items-center justify-between">
				<h3 className="text-lg font-bold text-slate-900 dark:text-white">
					{editing ? 'Editar sessão' : 'Nova sessão'}
				</h3>
				<button
					type="button"
					onClick={onClose}
					className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
				>
					<X className="size-5" />
				</button>
			</div>

			<div className="space-y-3">
				<Field label="Título">
					<input
						className={FIELD_CLS}
						value={form.title}
						onChange={(e) => set('title', e.target.value)}
						placeholder="Mentoria de lançamento"
					/>
				</Field>
				<Field label="Descrição">
					<textarea
						className={FIELD_CLS}
						rows={2}
						value={form.description}
						onChange={(e) => set('description', e.target.value)}
					/>
				</Field>
				<div className="grid grid-cols-2 gap-3">
					<Field label="Data">
						<input
							type="date"
							className={FIELD_CLS}
							value={form.date}
							onChange={(e) => set('date', e.target.value)}
						/>
					</Field>
					<Field label="Hora">
						<input
							type="time"
							className={FIELD_CLS}
							value={form.time ?? ''}
							onChange={(e) => set('time', e.target.value)}
						/>
					</Field>
				</div>
				<div className="grid grid-cols-2 gap-3">
					<Field label="Duração (min)">
						<input
							type="number"
							className={FIELD_CLS}
							value={form.durationMin ?? 60}
							onChange={(e) => set('durationMin', Number(e.target.value))}
						/>
					</Field>
					<Field label="Abre antes (min)">
						<input
							type="number"
							className={FIELD_CLS}
							value={form.joinOpensMinutesBefore ?? 10}
							onChange={(e) =>
								set('joinOpensMinutesBefore', Number(e.target.value))
							}
						/>
					</Field>
				</div>
				<Field
					label={
						<>
							Link da sala (Zoom/Meet)
							{editing && (
								<span className="ml-1 text-slate-400">
									— deixe vazio p/ manter
								</span>
							)}
						</>
					}
				>
					<input
						className={FIELD_CLS}
						value={form.externalUrl}
						onChange={(e) => set('externalUrl', e.target.value)}
						placeholder="https://zoom.us/j/…"
					/>
				</Field>
				<div className="grid grid-cols-2 gap-3">
					<Field label="Limite de vagas">
						<input
							type="number"
							min={1}
							className={FIELD_CLS}
							value={form.cap ?? ''}
							onChange={(e) =>
								set('cap', e.target.value ? Number(e.target.value) : null)
							}
							placeholder="Sem limite"
						/>
					</Field>
					<Field label="Gravação (URL)">
						<input
							className={FIELD_CLS}
							value={form.recordingUrl ?? ''}
							onChange={(e) => set('recordingUrl', e.target.value)}
							placeholder="Após a sessão"
						/>
					</Field>
				</div>
			</div>

			<button
				type="button"
				disabled={busy}
				onClick={submit}
				className="mt-5 w-full rounded-xl bg-[#ff3b30] px-4 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-60"
			>
				{busy ? 'A guardar…' : editing ? 'Guardar' : 'Criar sessão'}
			</button>
		</ModalShell>
	);
}

/* ════════════════════ Card de sessão ════════════════════ */
function SessionCard({
	session,
	onEnter,
	isAdmin,
	onEdit,
	onDelete,
}: {
	session: MentorshipSession;
	onEnter: () => void;
	isAdmin: boolean;
	onEdit: () => void;
	onDelete: () => void;
}) {
	return (
		<div className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[#ff3b30]/40 dark:border-white/10 dark:bg-[#1a1a1d]">
			<div className="flex items-start gap-3">
				<span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#ff3b30]/10 text-[#ff3b30]">
					<Video className="size-5" />
				</span>
				<div className="min-w-0 flex-1">
					<h4 className="truncate font-semibold text-slate-900 dark:text-white">
						{session.title}
					</h4>
					<p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-gray-400">
						<CalendarClock className="size-3.5" />
						{formatWhen(session.date, session.time)}
						{session.cap != null && (
							<>
								<span className="mx-1">·</span>
								<Users className="size-3.5" /> {session.cap} vagas
							</>
						)}
					</p>
				</div>
			</div>
			{session.description && (
				<p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-gray-300">
					{session.description}
				</p>
			)}
			<div className="mt-3 flex items-center gap-2">
				<button
					type="button"
					onClick={onEnter}
					className="flex-1 rounded-lg bg-[#ff3b30] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
				>
					Entrar
				</button>
				{isAdmin && (
					<>
						<button
							type="button"
							onClick={onEdit}
							className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
						>
							<Pencil className="size-4" />
						</button>
						<button
							type="button"
							onClick={onDelete}
							className="rounded-lg border border-slate-200 p-2 text-red-500 hover:bg-red-50 dark:border-white/10 dark:hover:bg-red-500/10"
						>
							<Trash2 className="size-4" />
						</button>
					</>
				)}
			</div>
		</div>
	);
}

/* ════════════════════ View principal ════════════════════ */
export function DynamicRoomView({ toolKey }: { toolKey: string }) {
	const def = useToolDefinition(toolKey);
	const { data: sessions, isLoading } = useMentorshipSessions(toolKey);
	const { isSuperAdmin } = usePermissions();
	const { courses } = useEntitlements();
	const courseSlug = courses[0]?.slug;
	const del = useDeleteSession(toolKey);

	const [roomId, setRoomId] = useState<string | null>(null);
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<MentorshipSession | null>(null);

	const sorted = useMemo(
		() =>
			[...(sessions ?? [])].sort((a, b) =>
				`${a.date}${a.time ?? ''}`.localeCompare(`${b.date}${b.time ?? ''}`),
			),
		[sessions],
	);

	const openCreate = () => {
		setEditing(null);
		setFormOpen(true);
	};
	const openEdit = (s: MentorshipSession) => {
		setEditing(s);
		setFormOpen(true);
	};

	return (
		<div className="mx-auto max-w-4xl">
			<div className="flex items-start justify-between gap-3">
				<PageHeader
					title={def.data?.title ?? 'Mentoria'}
					subtitle={
						def.data?.description ??
						'Salas de vídeo e lives ao vivo da sua jornada.'
					}
				/>
				{isSuperAdmin && (
					<button
						type="button"
						onClick={openCreate}
						className="mt-1 flex shrink-0 items-center gap-1.5 rounded-xl bg-[#ff3b30] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
					>
						<Plus className="size-4" /> Nova sessão
					</button>
				)}
			</div>

			{isLoading ? (
				<p className="mt-8 text-center text-slate-500 dark:text-gray-400">
					A carregar sessões…
				</p>
			) : sorted.length === 0 ? (
				<div className="mt-10 rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-white/10">
					<Video className="mx-auto size-8 text-slate-300 dark:text-gray-600" />
					<p className="mt-3 text-slate-500 dark:text-gray-400">
						Nenhuma sessão agendada ainda.
					</p>
					{isSuperAdmin && (
						<button
							type="button"
							onClick={openCreate}
							className="mt-3 text-sm font-semibold text-[#ff3b30] hover:underline"
						>
							Agendar a primeira
						</button>
					)}
				</div>
			) : (
				<div className="mt-6 grid gap-3 sm:grid-cols-2">
					{sorted.map((s) => (
						<SessionCard
							key={s.id}
							session={s}
							onEnter={() => setRoomId(s.id)}
							isAdmin={isSuperAdmin}
							onEdit={() => openEdit(s)}
							onDelete={() => {
								if (confirm(`Remover a sessão "${s.title}"?`)) del.mutate(s.id);
							}}
						/>
					))}
				</div>
			)}

			{roomId && (
				<RoomModal
					sessionId={roomId}
					toolKey={toolKey}
					courseSlug={courseSlug}
					onClose={() => setRoomId(null)}
				/>
			)}
			{formOpen && (
				<SessionFormModal
					toolKey={toolKey}
					editing={editing}
					onClose={() => setFormOpen(false)}
				/>
			)}
		</div>
	);
}
