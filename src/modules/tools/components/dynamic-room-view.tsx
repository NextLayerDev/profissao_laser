'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
	Activity,
	CalendarClock,
	ExternalLink,
	Lock,
	MessageSquare,
	Paperclip,
	Pencil,
	Plus,
	Send,
	Trash2,
	Users,
	Video,
	X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
	type CSSProperties,
	type ReactNode,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { useEntitlements } from '@/hooks/use-entitlements';
import { usePermissions } from '@/hooks/use-permissions';
import {
	useAddMaterial,
	useCreateSession,
	useDeleteMaterial,
	useDeleteSession,
	useJoinRoomFree,
	useMaterials,
	useMentorshipSessions,
	useMessages,
	useMessagesRealtime,
	usePostMessage,
	useRoomPresenceRealtime,
	useRoomState,
	useSessionAttendees,
	useUpdateSession,
} from '../hooks/use-mentorship';
import { useRunTool } from '../hooks/use-run-tool';
import { useToolDefinition } from '../hooks/use-tool-definition';
import {
	type ResolvedRoomUi,
	RoomUiContext,
	resolveRoomUi,
	useRoomUi,
} from '../lib/room-ui';
import {
	type CreateSessionBody,
	joinSession,
	type MentorshipSession,
} from '../services/mentorship.service';
import type { AiToolDefinition } from '../services/tool-definitions.service';

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

/** Status visual da sessão (só p/ exibição — a autoridade de acesso é o servidor). */
type SessionStatus = 'agendada' | 'ao-vivo' | 'encerrada';
function sessionStatus(s: MentorshipSession): SessionStatus {
	try {
		const time = s.time?.length ? s.time : '00:00';
		const start = new Date(`${s.date}T${time}:00-03:00`).getTime();
		const end = start + (s.durationMin ?? 60) * 60_000;
		const now = Date.now();
		if (now < start) return 'agendada';
		if (now < end) return 'ao-vivo';
		return 'encerrada';
	} catch {
		return 'agendada';
	}
}

/** Data+hora curta (BRT) de um timestamp ISO — usado na presença do admin. */
function formatClock(iso: string | null): string {
	if (!iso) return '—';
	try {
		return new Intl.DateTimeFormat('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			timeZone: 'America/Sao_Paulo',
		}).format(new Date(iso));
	} catch {
		return '—';
	}
}

function StatusBadge({ status }: { status: SessionStatus }) {
	if (status === 'ao-vivo') {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold text-red-500">
				<span className="size-1.5 animate-pulse rounded-full bg-red-500" />
				AO VIVO
			</span>
		);
	}
	if (status === 'encerrada') {
		return (
			<span className="inline-flex items-center rounded-full bg-slate-500/15 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:text-gray-400">
				Encerrada
			</span>
		);
	}
	return (
		<span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
			Agendada
		</span>
	);
}

/** Sessões fictícias p/ a pré-visualização do builder (sem tocar o backend). */
function sampleSessions(def?: AiToolDefinition | null): MentorshipSession[] {
	const room = (
		def?.definition as { room?: { cap?: number | null } } | undefined
	)?.room;
	const cap = room?.cap ?? null;
	const key = def?.tool_key ?? 'preview';
	const now = new Date();
	const pad = (n: number) => String(n).padStart(2, '0');
	const ymd = (d: Date) =>
		`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
	const live = new Date(now.getTime() - 20 * 60_000);
	const tomorrow = new Date(now.getTime() + 24 * 3_600_000);
	return [
		{
			id: 'preview-live',
			toolKey: key,
			title: 'Sessão ao vivo (exemplo)',
			description: 'Exemplo de uma sessão em andamento.',
			date: ymd(now),
			time: `${pad(live.getHours())}:${pad(live.getMinutes())}`,
			durationMin: 120,
			joinOpensMinutesBefore: 10,
			cap,
			recordingUrl: null,
			hostId: null,
		},
		{
			id: 'preview-scheduled',
			toolKey: key,
			title: 'Próxima sessão (exemplo)',
			description: 'Exemplo de uma sessão agendada.',
			date: ymd(tomorrow),
			time: '20:00',
			durationMin: 60,
			joinOpensMinutesBefore: 10,
			cap,
			recordingUrl: null,
			hostId: null,
		},
	];
}

/** Banner/aviso personalizado no topo da sala (vem de room.ui[screen].notice). */
function RoomNotice({
	notice,
}: {
	notice: NonNullable<ResolvedRoomUi['notice']>;
}) {
	if (!notice.title && !notice.message) return null;
	const type = notice.type ?? 'info';
	const palette =
		type === 'warning'
			? 'border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-200'
			: type === 'success'
				? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'
				: 'border-sky-400/30 bg-sky-500/10 text-sky-700 dark:text-sky-200';
	return (
		<div className={`mb-4 rounded-2xl border px-4 py-3 ${palette}`}>
			{notice.title && <p className="text-sm font-semibold">{notice.title}</p>}
			{notice.message && (
				<p className="mt-0.5 whitespace-pre-wrap text-sm opacity-90">
					{notice.message}
				</p>
			)}
		</div>
	);
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
	isAdmin,
	onClose,
}: {
	sessionId: string;
	toolKey: string;
	courseSlug?: string;
	isAdmin: boolean;
	onClose: () => void;
}) {
	const qc = useQueryClient();
	const router = useRouter();
	const ui = useRoomUi();
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
								className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--room-accent)] px-4 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-60"
							>
								<Video className="size-5" /> {ui.L('enter', 'Entrar')}
								<span className="rounded-md bg-white/20 px-1.5 py-0.5 text-xs">
									{state.voxCost} voxxys
								</span>
							</button>
						) : (
							<button
								type="button"
								disabled={busy}
								onClick={enterFree}
								className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--room-accent)] px-4 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-60"
							>
								<Video className="size-5" /> {ui.L('enter', 'Entrar')}
							</button>
						)}
					</div>
					{state.access === 'pay' && !state.hasJoined && !state.hasEnded && (
						<p className="mt-2 text-center text-xs text-slate-400 dark:text-gray-500">
							Seu plano não inclui esta mentoria — a entrada custa{' '}
							{state.voxCost} voxxys (cobrado uma vez por sessão).
						</p>
					)}

					{ui.showMaterials(state.features.materials) &&
						(state.access === 'included' || state.hasJoined) && (
							<MaterialsSection sessionId={sessionId} isAdmin={isAdmin} />
						)}
					{ui.showChat(state.features.chat) && state.hasJoined && (
						<ChatPanel sessionId={sessionId} />
					)}
				</>
			)}
		</ModalShell>
	);
}

/* ════════════════════ Materiais ════════════════════ */
function MaterialsSection({
	sessionId,
	isAdmin,
}: {
	sessionId: string;
	isAdmin: boolean;
}) {
	const ui = useRoomUi();
	const { data: materials } = useMaterials(sessionId);
	const add = useAddMaterial(sessionId);
	const del = useDeleteMaterial(sessionId);
	const [title, setTitle] = useState('');
	const [url, setUrl] = useState('');

	const submit = () => {
		if (!title.trim() || !url.trim()) return;
		add.mutate(
			{ title: title.trim(), url: url.trim() },
			{
				onSuccess: () => {
					setTitle('');
					setUrl('');
				},
			},
		);
	};

	const list = materials ?? [];
	return (
		<div className="mt-5 border-t border-slate-200 pt-4 dark:border-white/10">
			<h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-gray-200">
				<Paperclip className="size-4" /> {ui.L('materialsTitle', 'Materiais')}
			</h4>
			{list.length === 0 ? (
				<p className="text-sm text-slate-400 dark:text-gray-500">
					Nenhum material ainda.
				</p>
			) : (
				<ul className="space-y-1.5">
					{list.map((m) => (
						<li key={m.id} className="flex items-center gap-2">
							<a
								href={m.url}
								target="_blank"
								rel="noopener noreferrer"
								className="flex flex-1 items-center gap-1.5 truncate text-sm text-[var(--room-accent)] hover:underline"
							>
								<ExternalLink className="size-3.5 shrink-0" />
								<span className="truncate">{m.title}</span>
							</a>
							{isAdmin && (
								<button
									type="button"
									onClick={() => del.mutate(m.id)}
									className="rounded p-1 text-slate-400 hover:text-red-500"
								>
									<Trash2 className="size-3.5" />
								</button>
							)}
						</li>
					))}
				</ul>
			)}
			{isAdmin && (
				<div className="mt-3 flex flex-col gap-2 sm:flex-row">
					<input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="Título"
						className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-white/10 dark:bg-[#1a1a1d] dark:text-white"
					/>
					<input
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						placeholder="https://…"
						className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-white/10 dark:bg-[#1a1a1d] dark:text-white"
					/>
					<button
						type="button"
						disabled={add.isPending}
						onClick={submit}
						className="flex items-center justify-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-60 dark:bg-white/10 dark:hover:bg-white/20"
					>
						<Plus className="size-4" /> Add
					</button>
				</div>
			)}
		</div>
	);
}

/* ════════════════════ Chat ao vivo ════════════════════ */
function ChatPanel({ sessionId }: { sessionId: string }) {
	const ui = useRoomUi();
	const { data: messages } = useMessages(sessionId);
	useMessagesRealtime(sessionId);
	const post = usePostMessage(sessionId);
	const [text, setText] = useState('');
	const endRef = useRef<HTMLDivElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: rola ao chegar msg nova
	useEffect(() => {
		endRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	const send = () => {
		const t = text.trim();
		if (!t) return;
		post.mutate(t, { onSuccess: () => setText('') });
	};

	const list = messages ?? [];
	return (
		<div className="mt-5 border-t border-slate-200 pt-4 dark:border-white/10">
			<h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-gray-200">
				<MessageSquare className="size-4" /> {ui.L('chatTitle', 'Chat ao vivo')}
			</h4>
			<div className="max-h-60 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-3 dark:bg-white/5">
				{list.length === 0 ? (
					<p className="text-sm text-slate-400 dark:text-gray-500">
						Seja o primeiro a falar.
					</p>
				) : (
					list.map((m) => (
						<div key={m.id} className="flex items-start gap-2">
							<span className="mt-0.5 grid size-6 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-200 text-[10px] font-semibold text-slate-600 dark:bg-white/10 dark:text-gray-200">
								{m.customerImage ? (
									// biome-ignore lint/performance/noImgElement: avatar dinâmico
									<img
										src={m.customerImage}
										alt={m.customerName ?? ''}
										className="size-full object-cover"
									/>
								) : (
									(m.customerName ?? '?').charAt(0).toUpperCase()
								)}
							</span>
							<div className="min-w-0">
								<span className="text-xs font-semibold text-slate-600 dark:text-gray-300">
									{m.customerName ?? 'Aluno'}
								</span>
								<p className="break-words text-sm text-slate-700 dark:text-gray-200">
									{m.content}
								</p>
							</div>
						</div>
					))
				)}
				<div ref={endRef} />
			</div>
			<div className="mt-2 flex gap-2">
				<input
					value={text}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') send();
					}}
					placeholder="Mensagem…"
					maxLength={2000}
					className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#1a1a1d] dark:text-white"
				/>
				<button
					type="button"
					disabled={post.isPending || !text.trim()}
					onClick={send}
					className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--room-accent)] text-white hover:opacity-90 disabled:opacity-50"
				>
					<Send className="size-4" />
				</button>
			</div>
		</div>
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
				className="mt-5 w-full rounded-xl bg-[var(--room-accent)] px-4 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-60"
			>
				{busy ? 'A guardar…' : editing ? 'Guardar' : 'Criar sessão'}
			</button>
		</ModalShell>
	);
}

/* ════════════════════ Acompanhamento (admin) ════════════════════ */
function SessionMonitorModal({
	session,
	toolKey,
	onClose,
}: {
	session: MentorshipSession;
	toolKey: string;
	onClose: () => void;
}) {
	const { data: attendees, isLoading } = useSessionAttendees(session.id);
	const update = useUpdateSession(toolKey);
	const [recording, setRecording] = useState(session.recordingUrl ?? '');
	const status = sessionStatus(session);
	const list = attendees ?? [];
	const active = list.filter((a) => !a.leftAt).length;

	const saveRecording = () =>
		update.mutate({
			id: session.id,
			body: { recordingUrl: recording.trim() || null },
		});

	return (
		<ModalShell onClose={onClose}>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<h3 className="flex items-center gap-1.5 text-lg font-bold text-slate-900 dark:text-white">
						<Activity className="size-5 text-[var(--room-accent)]" />
						<span className="truncate">{session.title}</span>
					</h3>
					<p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400">
						<CalendarClock className="size-4" />
						{formatWhen(session.date, session.time)}
						<StatusBadge status={status} />
					</p>
				</div>
				<button
					type="button"
					onClick={onClose}
					className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10"
				>
					<X className="size-5" />
				</button>
			</div>

			{/* Presença (histórico completo — não precisa entrar na sala) */}
			<div className="mt-4">
				<div className="mb-2 flex items-center justify-between">
					<h4 className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-gray-200">
						<Users className="size-4" /> Presença
					</h4>
					<span className="text-xs text-slate-500 dark:text-gray-400">
						{active} na sala · {list.length} no total
					</span>
				</div>
				{isLoading ? (
					<p className="text-sm text-slate-400 dark:text-gray-500">
						A carregar presença…
					</p>
				) : list.length === 0 ? (
					<p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400 dark:border-white/10 dark:text-gray-500">
						Ninguém entrou nesta sessão ainda.
					</p>
				) : (
					<ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 dark:divide-white/5 dark:border-white/10">
						{list.map((a) => (
							<li
								key={a.customerId}
								className="flex items-center gap-3 px-3 py-2"
							>
								<span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-200 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-gray-200">
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
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium text-slate-800 dark:text-gray-100">
										{a.customerName ?? 'Aluno'}
									</p>
									<p className="truncate text-xs text-slate-400 dark:text-gray-500">
										entrou {formatClock(a.joinedAt)}
										{a.leftAt ? ` · saiu ${formatClock(a.leftAt)}` : ''}
									</p>
								</div>
								{a.paid && (
									<span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
										pago
									</span>
								)}
								<span
									className={`size-2 shrink-0 rounded-full ${
										a.leftAt
											? 'bg-slate-300 dark:bg-white/20'
											: 'bg-emerald-500'
									}`}
									title={a.leftAt ? 'Saiu' : 'Na sala'}
								/>
							</li>
						))}
					</ul>
				)}
			</div>

			{/* Gravação */}
			<div className="mt-5 border-t border-slate-200 pt-4 dark:border-white/10">
				<h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-gray-200">
					<Video className="size-4" /> Gravação
				</h4>
				<div className="flex flex-col gap-2 sm:flex-row">
					<input
						value={recording}
						onChange={(e) => setRecording(e.target.value)}
						placeholder="https://… (link da gravação)"
						className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-white/10 dark:bg-[#1a1a1d] dark:text-white"
					/>
					<button
						type="button"
						disabled={update.isPending}
						onClick={saveRecording}
						className="flex items-center justify-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-60 dark:bg-white/10 dark:hover:bg-white/20"
					>
						Salvar
					</button>
				</div>
				{session.recordingUrl && (
					<a
						href={session.recordingUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--room-accent)] hover:underline"
					>
						<ExternalLink className="size-3.5" /> Abrir gravação atual
					</a>
				)}
			</div>

			{/* Materiais (mesmo componente do aluno, em modo admin) */}
			<MaterialsSection sessionId={session.id} isAdmin />
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
	onMonitor,
}: {
	session: MentorshipSession;
	onEnter: () => void;
	isAdmin: boolean;
	onEdit: () => void;
	onDelete: () => void;
	onMonitor: () => void;
}) {
	const ui = useRoomUi();
	return (
		<div className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[var(--room-accent)]/40 dark:border-white/10 dark:bg-[#1a1a1d]">
			<div className="flex items-start gap-3">
				<span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--room-accent)]/10 text-[var(--room-accent)]">
					<Video className="size-5" />
				</span>
				<div className="min-w-0 flex-1">
					<h4 className="truncate font-semibold text-slate-900 dark:text-white">
						{session.title}
					</h4>
					<p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-slate-500 dark:text-gray-400">
						<CalendarClock className="size-3.5" />
						{formatWhen(session.date, session.time)}
						{session.cap != null && (
							<>
								<span className="mx-1">·</span>
								<Users className="size-3.5" /> {session.cap} vagas
							</>
						)}
						{isAdmin && (
							<span className="ml-1">
								<StatusBadge status={sessionStatus(session)} />
							</span>
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
					className="flex-1 rounded-lg bg-[var(--room-accent)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
				>
					{ui.L('enter', 'Entrar')}
				</button>
				{isAdmin && (
					<>
						<button
							type="button"
							onClick={onMonitor}
							title="Acompanhar (presença, gravação, materiais)"
							className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
						>
							<Activity className="size-4" /> {ui.L('acompanhar', 'Acompanhar')}
						</button>
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
export function DynamicRoomView({
	toolKey,
	definitionOverride,
	previewAs,
}: {
	toolKey: string;
	/** Quando passado (pré-visualização do builder), usa a def rascunho e NÃO toca o backend. */
	definitionOverride?: AiToolDefinition;
	/** Força o papel no preview ('customer' | 'admin'); fora do preview, usa as permissões reais. */
	previewAs?: 'customer' | 'admin';
}) {
	const isPreview = !!definitionOverride;
	const defQuery = useToolDefinition(toolKey, { enabled: !definitionOverride });
	const def = definitionOverride ?? defQuery.data;
	const { data: fetchedSessions, isLoading: fetchLoading } =
		useMentorshipSessions(toolKey, !isPreview);
	const { isSuperAdmin } = usePermissions();
	const isAdmin = previewAs ? previewAs === 'admin' : isSuperAdmin;
	// Aparência personalizada desta tela (aluno/admin) — cor, tema, textos, etc.
	const roomUi = useMemo(() => resolveRoomUi(def, isAdmin), [def, isAdmin]);
	// No preview o courseSlug só alimentaria o RoomModal (que nunca monta) —
	// desliga a query de entitlements p/ honrar o "não toca o backend".
	const { courses } = useEntitlements(undefined, { enabled: !isPreview });
	const courseSlug = courses[0]?.slug;
	const del = useDeleteSession(toolKey);

	// No preview, renderiza sessões de exemplo (sem backend) e fica inerte.
	const sessions = isPreview ? sampleSessions(def) : fetchedSessions;
	const isLoading = isPreview ? false : fetchLoading;

	const [roomId, setRoomId] = useState<string | null>(null);
	const [monitorId, setMonitorId] = useState<string | null>(null);
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<MentorshipSession | null>(null);

	const sorted = useMemo(
		() =>
			[...(sessions ?? [])].sort((a, b) =>
				`${a.date}${a.time ?? ''}`.localeCompare(`${b.date}${b.time ?? ''}`),
			),
		[sessions],
	);

	// Se a sessão do monitor sumir (removida em outra aba/admin), fecha o modal.
	useEffect(() => {
		if (monitorId && !sorted.some((x) => x.id === monitorId)) {
			setMonitorId(null);
		}
	}, [monitorId, sorted]);

	const openCreate = () => {
		if (isPreview) return;
		setEditing(null);
		setFormOpen(true);
	};
	const openEdit = (s: MentorshipSession) => {
		if (isPreview) return;
		setEditing(s);
		setFormOpen(true);
	};

	// Tema forçado (dark/light) ganha fundo próprio + respiro, senão só o miolo
	// trocaria de cor e a faixa ao redor ficaria na cor do app (descasada).
	const themedShell = roomUi.themeClass
		? `rounded-2xl p-4 sm:p-6 ${roomUi.themeClass === 'dark' ? 'bg-[#0d0d0f]' : 'bg-slate-50'}`
		: '';

	return (
		<RoomUiContext.Provider value={roomUi}>
			<div
				className={`mx-auto max-w-4xl ${roomUi.themeClass} ${themedShell}`}
				style={{ '--room-accent': roomUi.accent } as CSSProperties}
			>
				{roomUi.notice && <RoomNotice notice={roomUi.notice} />}
				<div className="flex items-start justify-between gap-3">
					<PageHeader
						title={def?.title ?? 'Mentoria'}
						subtitle={
							def?.description ??
							roomUi.L(
								'headerSubtitle',
								'Salas de vídeo e lives ao vivo da sua jornada.',
							)
						}
					/>
					{isAdmin && (
						<button
							type="button"
							onClick={openCreate}
							className="mt-1 flex shrink-0 items-center gap-1.5 rounded-xl bg-[var(--room-accent)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
						>
							<Plus className="size-4" />{' '}
							{roomUi.L('novaSessao', 'Nova sessão')}
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
							{roomUi.L('emptyText', 'Nenhuma sessão agendada ainda.')}
						</p>
						{isAdmin && (
							<button
								type="button"
								onClick={openCreate}
								className="mt-3 text-sm font-semibold text-[var(--room-accent)] hover:underline"
							>
								{roomUi.L('emptyButton', 'Agendar a primeira')}
							</button>
						)}
					</div>
				) : (
					<div className="mt-6 grid gap-3 sm:grid-cols-2">
						{sorted.map((s) => (
							<SessionCard
								key={s.id}
								session={s}
								onEnter={() => {
									if (!isPreview) setRoomId(s.id);
								}}
								isAdmin={isAdmin}
								onEdit={() => openEdit(s)}
								onMonitor={() => {
									if (!isPreview) setMonitorId(s.id);
								}}
								onDelete={() => {
									if (isPreview) return;
									if (confirm(`Remover a sessão "${s.title}"?`))
										del.mutate(s.id);
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
						isAdmin={isAdmin}
						onClose={() => setRoomId(null)}
					/>
				)}
				{monitorId &&
					(() => {
						const s = sorted.find((x) => x.id === monitorId);
						return s ? (
							<SessionMonitorModal
								session={s}
								toolKey={toolKey}
								onClose={() => setMonitorId(null)}
							/>
						) : null;
					})()}
				{formOpen && (
					<SessionFormModal
						toolKey={toolKey}
						editing={editing}
						onClose={() => setFormOpen(false)}
					/>
				)}
			</div>
		</RoomUiContext.Provider>
	);
}
