'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
	BadgeCheck,
	CheckSquare,
	Link2,
	MessageSquareQuote,
	Paperclip,
	Plus,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import { useTaskMutations, useTasks } from '@/modules/mentoria/hooks';
import { addTaskEvidenceLink } from '@/modules/mentoria/service';
import type { MntTask, TaskStatus } from '@/modules/mentoria/types';
import {
	BTN_GHOST,
	BTN_PRIMARY,
	CARD,
	EmptyState,
	fmtDate,
	INPUT,
	JourneyGate,
	LABEL,
	MntHeader,
	MntSkeleton,
} from '../_components/shared';

const STATUS_META: Record<TaskStatus, { label: string; badge: string }> = {
	pending: {
		label: 'Pendente',
		badge: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
	},
	in_progress: {
		label: 'Em andamento',
		badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
	},
	done: {
		label: 'Concluída',
		badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
	},
	overdue: {
		label: 'Atrasada',
		badge: 'bg-red-500/15 text-red-600 dark:text-red-400',
	},
	cancelled: {
		label: 'Cancelada',
		badge: 'bg-slate-500/10 text-slate-400',
	},
};

const ORDER: TaskStatus[] = [
	'overdue',
	'pending',
	'in_progress',
	'done',
	'cancelled',
];

export default function TarefasPage() {
	return (
		<SubscriptionGate toolKey="mentoria_360">
			<JourneyGate>
				{({ journeyId }) => <Content journeyId={journeyId} />}
			</JourneyGate>
		</SubscriptionGate>
	);
}

function Content({ journeyId }: { journeyId: string }) {
	const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
	const { data: tasks, isLoading } = useTasks(journeyId);
	const { create, update, uploadEvidence } = useTaskMutations(journeyId);
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState({
		title: '',
		description: '',
		due_date: '',
		priority: 'medium',
	});

	if (isLoading) return <MntSkeleton />;

	const visible = (tasks ?? []).filter(
		(t) => filter === 'all' || t.status === filter,
	);
	const grouped = ORDER.map((status) => ({
		status,
		tasks: visible.filter((t) => t.status === status),
	})).filter((g) => g.tasks.length > 0);

	const submit = () => {
		if (!form.title.trim()) {
			toast.error('Dê um título à tarefa.');
			return;
		}
		create.mutate(
			{
				title: form.title,
				description: form.description || null,
				due_date: form.due_date || null,
				priority: form.priority,
			},
			{
				onSuccess: () => {
					setShowForm(false);
					setForm({
						title: '',
						description: '',
						due_date: '',
						priority: 'medium',
					});
					toast.success('Tarefa criada!');
				},
				onError: () => toast.error('Não foi possível criar a tarefa.'),
			},
		);
	};

	return (
		<div className="p-4 md:p-8 max-w-5xl mx-auto">
			<MntHeader
				title="Minhas tarefas"
				subtitle="Ações geradas pelos encontros, ferramentas e metas"
				icon={CheckSquare}
				backHref="/course/mentoria"
				actions={
					<button
						type="button"
						onClick={() => setShowForm((v) => !v)}
						className={BTN_PRIMARY}
					>
						<Plus className="w-4 h-4" />
						Nova tarefa
					</button>
				}
			/>

			{showForm && (
				<div className={`${CARD} p-5 mb-6 space-y-4`}>
					<div>
						<span className={LABEL}>Título</span>
						<input
							className={INPUT}
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
						/>
					</div>
					<div>
						<span className={LABEL}>Descrição</span>
						<textarea
							className={`${INPUT} min-h-20`}
							value={form.description}
							onChange={(e) =>
								setForm({ ...form, description: e.target.value })
							}
						/>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<span className={LABEL}>Prazo</span>
							<input
								type="date"
								className={INPUT}
								value={form.due_date}
								onChange={(e) => setForm({ ...form, due_date: e.target.value })}
							/>
						</div>
						<div>
							<span className={LABEL}>Prioridade</span>
							<select
								className={INPUT}
								value={form.priority}
								onChange={(e) => setForm({ ...form, priority: e.target.value })}
							>
								<option value="low">Baixa</option>
								<option value="medium">Média</option>
								<option value="high">Alta</option>
							</select>
						</div>
					</div>
					<button
						type="button"
						onClick={submit}
						disabled={create.isPending}
						className={BTN_PRIMARY}
					>
						Criar tarefa
					</button>
				</div>
			)}

			{/* Filtro */}
			<div className="flex flex-wrap gap-2 mb-6">
				<FilterChip
					active={filter === 'all'}
					label={`Todas (${(tasks ?? []).length})`}
					onClick={() => setFilter('all')}
				/>
				{ORDER.map((status) => {
					const count = (tasks ?? []).filter((t) => t.status === status).length;
					if (count === 0) return null;
					return (
						<FilterChip
							key={status}
							active={filter === status}
							label={`${STATUS_META[status].label} (${count})`}
							onClick={() => setFilter(status)}
						/>
					);
				})}
			</div>

			{grouped.length === 0 ? (
				<EmptyState
					icon={CheckSquare}
					title="Nenhuma tarefa por aqui"
					description="Crie tarefas manualmente ou gere a partir dos encontros e ferramentas."
				/>
			) : (
				<div className="space-y-8">
					{grouped.map((group) => (
						<section key={group.status}>
							<h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-3">
								{STATUS_META[group.status].label}
							</h3>
							<div className="space-y-3">
								{group.tasks.map((task) => (
									<TaskCard
										key={task.id}
										task={task}
										onStatus={(status) =>
											update.mutate({ taskId: task.id, body: { status } })
										}
										onUpload={(file) =>
											uploadEvidence.mutate(
												{ taskId: task.id, file },
												{
													onSuccess: () => toast.success('Evidência anexada!'),
													onError: () =>
														toast.error('Falha ao anexar evidência.'),
												},
											)
										}
										journeyId={journeyId}
									/>
								))}
							</div>
						</section>
					))}
				</div>
			)}
		</div>
	);
}

function FilterChip({
	active,
	label,
	onClick,
}: {
	active: boolean;
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition ${
				active
					? 'bg-teal-500/15 border-teal-500/50 text-teal-600 dark:text-teal-400'
					: 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400'
			}`}
		>
			{label}
		</button>
	);
}

function TaskCard({
	task,
	onStatus,
	onUpload,
	journeyId,
}: {
	task: MntTask;
	onStatus: (status: TaskStatus) => void;
	onUpload: (file: File) => void;
	journeyId: string;
}) {
	const fileRef = useRef<HTMLInputElement>(null);
	const qc = useQueryClient();
	const [linkUrl, setLinkUrl] = useState('');
	const [showLink, setShowLink] = useState(false);

	const addLink = useMutation({
		mutationFn: () =>
			addTaskEvidenceLink(task.id, { kind: 'link', url: linkUrl }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['mentoria', 'tasks', journeyId] });
			setShowLink(false);
			setLinkUrl('');
			toast.success('Link anexado!');
		},
		onError: () => toast.error('Falha ao anexar link.'),
	});

	const priorityColor =
		task.priority === 'high'
			? 'text-red-500'
			: task.priority === 'medium'
				? 'text-amber-500'
				: 'text-slate-400';

	return (
		<div className={`${CARD} p-4`}>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2 flex-wrap">
						<p className="font-medium text-slate-900 dark:text-slate-100">
							{task.title}
						</p>
						<span
							className={`text-[11px] px-2 py-0.5 rounded-full ${STATUS_META[task.status].badge}`}
						>
							{STATUS_META[task.status].label}
						</span>
						<span className={`text-[11px] ${priorityColor}`}>
							●{' '}
							{task.priority === 'high'
								? 'Alta'
								: task.priority === 'medium'
									? 'Média'
									: 'Baixa'}
						</span>
						{task.mentor_validated_at && (
							<span className="inline-flex items-center gap-1 text-[11px] text-teal-600 dark:text-teal-400">
								<BadgeCheck className="w-3.5 h-3.5" />
								Validada pelo mentor
							</span>
						)}
					</div>
					{task.description && (
						<p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
							{task.description}
						</p>
					)}
					<p className="text-xs text-slate-400 mt-1">
						Prazo: {fmtDate(task.due_date)}
					</p>
					{task.mentor_comment && (
						<div className="mt-2 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 rounded-xl px-3 py-2">
							<MessageSquareQuote className="w-4 h-4 mt-0.5 text-teal-500 shrink-0" />
							<span>{task.mentor_comment}</span>
						</div>
					)}
					{task.evidences.length > 0 && (
						<div className="mt-2 flex flex-wrap gap-2">
							{task.evidences.map((ev) =>
								ev.url ? (
									<a
										key={ev.id}
										href={ev.url}
										target="_blank"
										rel="noreferrer"
										className="inline-flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:underline"
									>
										<Paperclip className="w-3 h-3" />
										{ev.note ?? ev.kind}
									</a>
								) : (
									<span key={ev.id} className="text-xs text-slate-400">
										{ev.note}
									</span>
								),
							)}
						</div>
					)}
				</div>

				<div className="flex flex-col items-end gap-2">
					<select
						className={`${INPUT} w-auto text-xs`}
						value={task.status}
						onChange={(e) => onStatus(e.target.value as TaskStatus)}
					>
						{Object.entries(STATUS_META).map(([value, meta]) => (
							<option key={value} value={value}>
								{meta.label}
							</option>
						))}
					</select>
					<div className="flex gap-1.5">
						<button
							type="button"
							onClick={() => fileRef.current?.click()}
							className={`${BTN_GHOST} !px-2.5 !py-1.5 text-xs`}
							title="Anexar arquivo"
						>
							<Paperclip className="w-3.5 h-3.5" />
						</button>
						<button
							type="button"
							onClick={() => setShowLink((v) => !v)}
							className={`${BTN_GHOST} !px-2.5 !py-1.5 text-xs`}
							title="Anexar link"
						>
							<Link2 className="w-3.5 h-3.5" />
						</button>
					</div>
					<input
						ref={fileRef}
						type="file"
						className="hidden"
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) onUpload(file);
							e.target.value = '';
						}}
					/>
				</div>
			</div>

			{showLink && (
				<div className="mt-3 flex gap-2">
					<input
						className={INPUT}
						placeholder="https://..."
						value={linkUrl}
						onChange={(e) => setLinkUrl(e.target.value)}
					/>
					<button
						type="button"
						onClick={() => linkUrl.trim() && addLink.mutate()}
						disabled={addLink.isPending}
						className={BTN_PRIMARY}
					>
						Anexar
					</button>
				</div>
			)}
		</div>
	);
}
