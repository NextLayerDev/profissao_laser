'use client';

// Apresentação de "Minhas tarefas" — recebe a lista já carregada e devolve os
// eventos (criar, trocar status, anexar arquivo, anexar link). Quem busca e
// quem muta é o `page.tsx`.
//
// Mesma razão das outras vistas da Mentoria: uma tarefa em cada status,
// validada pelo mentor e com evidências dos dois tipos (arquivo/link com
// `url`, nota de texto sem `url`) ao mesmo tempo é caro de reproduzir de
// propósito numa jornada real. `app/(dev)/mentoria-tarefas-check` monta os
// cenários com fixtures.

import { Badge, Button, buttonLabel, type Tone } from '@upvox-dev/ui';
import {
	BadgeCheck,
	CheckSquare,
	Link2,
	MessageSquareQuote,
	Paperclip,
	Plus,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Text } from 'react-native-css/components/Text';
import type { MntTask, TaskStatus } from '@/modules/mentoria/types';
import {
	CARD,
	EmptyState,
	fmtDate,
	INPUT,
	LABEL,
	MntHeader,
} from '../../_components/shared';

const STATUS_META: Record<TaskStatus, { label: string; tone: Tone }> = {
	pending: { label: 'Pendente', tone: 'neutral' },
	in_progress: { label: 'Em andamento', tone: 'brand' },
	done: { label: 'Concluída', tone: 'success' },
	overdue: { label: 'Atrasada', tone: 'danger' },
	cancelled: { label: 'Cancelada', tone: 'neutral' },
};

const PRIORITY_META: Record<
	MntTask['priority'],
	{ label: string; tone: Tone }
> = {
	high: { label: 'Alta', tone: 'danger' },
	medium: { label: 'Média', tone: 'warning' },
	low: { label: 'Baixa', tone: 'neutral' },
};

const ORDER: TaskStatus[] = [
	'overdue',
	'pending',
	'in_progress',
	'done',
	'cancelled',
];

export type NewTaskInput = {
	title: string;
	description: string | null;
	due_date: string | null;
	priority: string;
};

export function TarefasView({
	tasks,
	creating,
	updatingTaskId,
	uploadingTaskId,
	addingLinkTaskId,
	onCreate,
	onStatusChange,
	onUpload,
	onAddLink,
}: {
	tasks: MntTask[];
	creating: boolean;
	updatingTaskId: string | null;
	uploadingTaskId: string | null;
	addingLinkTaskId: string | null;
	onCreate: (input: NewTaskInput) => void;
	onStatusChange: (taskId: string, status: TaskStatus) => void;
	onUpload: (taskId: string, file: File) => void;
	onAddLink: (taskId: string, url: string) => void;
}) {
	const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState({
		title: '',
		description: '',
		due_date: '',
		priority: 'medium',
	});

	const submit = () => {
		onCreate({
			title: form.title,
			description: form.description || null,
			due_date: form.due_date || null,
			priority: form.priority,
		});
		setShowForm(false);
		setForm({ title: '', description: '', due_date: '', priority: 'medium' });
	};

	const visible = tasks.filter((t) => filter === 'all' || t.status === filter);
	const grouped = ORDER.map((status) => ({
		status,
		tasks: visible.filter((t) => t.status === status),
	})).filter((g) => g.tasks.length > 0);

	return (
		<div className="p-4 md:p-8 max-w-5xl mx-auto">
			<MntHeader
				title="Minhas tarefas"
				subtitle="Ações geradas pelos encontros, ferramentas e metas"
				icon={CheckSquare}
				backHref="/course/mentoria"
				actions={
					// Ícone + texto é um ARRAY de children, e array bypassa o wrap
					// automático do Button em <Text> — o texto cru quebraria em
					// runtime. Daí o <Text> explícito; `buttonLabel` veste só ele.
					<Button variant="primary" onPress={() => setShowForm((v) => !v)}>
						<Plus className="h-4 w-4 text-on-brand" aria-hidden />
						<Text className={buttonLabel({ variant: 'primary' })}>
							Nova tarefa
						</Text>
					</Button>
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
					<Button variant="primary" onPress={submit} disabled={creating}>
						<Text className={buttonLabel({ variant: 'primary' })}>
							{creating ? 'Criando...' : 'Criar tarefa'}
						</Text>
					</Button>
				</div>
			)}

			{/* Filtro */}
			<div className="flex flex-wrap gap-2 mb-6">
				<FilterChip
					active={filter === 'all'}
					label={`Todas (${tasks.length})`}
					onClick={() => setFilter('all')}
				/>
				{ORDER.map((status) => {
					const count = tasks.filter((t) => t.status === status).length;
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
							<h3 className="text-caption uppercase tracking-wide text-muted mb-3">
								{STATUS_META[group.status].label}
							</h3>
							<div className="space-y-3">
								{group.tasks.map((task) => (
									<TaskCard
										key={task.id}
										task={task}
										updating={updatingTaskId === task.id}
										uploading={uploadingTaskId === task.id}
										addingLink={addingLinkTaskId === task.id}
										onStatus={(status) => onStatusChange(task.id, status)}
										onUpload={(file) => onUpload(task.id, file)}
										onAddLink={(url) => onAddLink(task.id, url)}
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
			className={`rounded-chip px-3.5 py-1.5 text-caption border transition ${
				active
					? 'border-brand-border bg-brand-wash text-brand dark:text-violet-400'
					: 'border-subtle text-muted'
			}`}
		>
			{label}
		</button>
	);
}

function TaskCard({
	task,
	updating,
	uploading,
	addingLink,
	onStatus,
	onUpload,
	onAddLink,
}: {
	task: MntTask;
	updating: boolean;
	uploading: boolean;
	addingLink: boolean;
	onStatus: (status: TaskStatus) => void;
	onUpload: (file: File) => void;
	onAddLink: (url: string) => void;
}) {
	const fileRef = useRef<HTMLInputElement>(null);
	const [linkUrl, setLinkUrl] = useState('');
	const [showLink, setShowLink] = useState(false);

	return (
		<div className={`${CARD} p-4`}>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2 flex-wrap">
						<p className="text-label text-primary">{task.title}</p>
						<Badge tone={STATUS_META[task.status].tone}>
							{STATUS_META[task.status].label}
						</Badge>
						<Badge tone={PRIORITY_META[task.priority].tone}>
							{PRIORITY_META[task.priority].label}
						</Badge>
						{task.mentor_validated_at && (
							<span className="inline-flex items-center gap-1 rounded-chip bg-success-wash px-2 py-0.5 text-caption text-emerald-600 dark:text-emerald-400">
								<BadgeCheck className="w-3 h-3" aria-hidden />
								Validada pelo mentor
							</span>
						)}
					</div>
					{task.description && (
						<p className="mt-1 text-body text-muted">{task.description}</p>
					)}
					<p className="mt-1 text-caption text-muted">
						Prazo: {fmtDate(task.due_date)}
					</p>
					{task.mentor_comment && (
						<div className="mt-2 flex items-start gap-2 rounded-control bg-surface-sunken px-3 py-2">
							<MessageSquareQuote
								className="w-4 h-4 mt-0.5 shrink-0 text-brand dark:text-violet-400"
								aria-hidden
							/>
							<p className="text-body text-secondary">{task.mentor_comment}</p>
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
										className="inline-flex items-center gap-1 text-caption text-brand hover:underline dark:text-violet-400"
									>
										<Paperclip className="w-3 h-3" aria-hidden />
										{ev.note ?? ev.kind}
									</a>
								) : (
									<span key={ev.id} className="text-caption text-muted">
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
						disabled={updating}
						onChange={(e) => onStatus(e.target.value as TaskStatus)}
					>
						{Object.entries(STATUS_META).map(([value, meta]) => (
							<option key={value} value={value}>
								{meta.label}
							</option>
						))}
					</select>
					<div className="flex gap-1.5">
						<Button
							variant="ghost"
							size="sm"
							disabled={uploading}
							onPress={() => fileRef.current?.click()}
							accessibilityLabel="Anexar arquivo"
						>
							<Paperclip className="w-3.5 h-3.5" aria-hidden />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onPress={() => setShowLink((v) => !v)}
							accessibilityLabel="Anexar link"
						>
							<Link2 className="w-3.5 h-3.5" aria-hidden />
						</Button>
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
					<Button
						variant="primary"
						disabled={addingLink}
						onPress={() => {
							if (!linkUrl.trim()) return;
							onAddLink(linkUrl);
							setLinkUrl('');
							setShowLink(false);
						}}
					>
						<Text className={buttonLabel({ variant: 'primary' })}>Anexar</Text>
					</Button>
				</div>
			)}
		</div>
	);
}
