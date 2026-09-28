'use client';

import {
	CheckCircle2,
	History,
	Loader2,
	MessageSquare,
	Paperclip,
	Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	linkLabel,
	normalizeUrl,
} from '@/app/course/(shell)/mentoria/_components/shared';
import type { MntTask } from '@/modules/mentoria/types';
import {
	mentoriaErrorMessage,
	useMentorCommentTask,
	useMentorJourneyTasks,
	useMentorTaskComments,
	useMentorValidateTask,
} from '../../../_components/admin-hooks';
import {
	Badge,
	Card,
	dangerBtn,
	Field,
	formatDate,
	formatDateTime,
	inputClass,
	Modal,
	primaryBtn,
	secondaryBtn,
} from '../../../_components/ui';
import { QueryState, TASK_STATUS } from './common';

export function TasksTab({ journeyId }: { journeyId: string }) {
	const tasks = useMentorJourneyTasks(journeyId);
	const commentTask = useMentorCommentTask(journeyId);
	const validateTask = useMentorValidateTask(journeyId);
	const [commentFor, setCommentFor] = useState<MntTask | null>(null);

	const doValidate = async (task: MntTask) => {
		try {
			await validateTask.mutateAsync(task.id);
			toast.success('Tarefa validada');
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao validar a tarefa'));
		}
	};

	// null limpa o comentário atual; o histórico fica.
	const saveComment = async (text: string | null) => {
		if (!commentFor) return;
		try {
			await commentTask.mutateAsync({ taskId: commentFor.id, comment: text });
			toast.success(text ? 'Comentário salvo' : 'Comentário limpo');
			setCommentFor(null);
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao salvar o comentário'));
		}
	};

	return (
		<>
			<QueryState
				loading={tasks.isLoading}
				error={tasks.isError}
				empty={!tasks.data?.length}
				errorText="Não foi possível carregar as tarefas."
				emptyText="Nenhuma tarefa."
			>
				<Card>
					<ul className="divide-y divide-slate-100 dark:divide-white/5">
						{tasks.data?.map((t) => (
							<TaskRow
								key={t.id}
								task={t}
								onComment={() => setCommentFor(t)}
								onValidate={() => doValidate(t)}
								validating={validateTask.isPending}
							/>
						))}
					</ul>
				</Card>
			</QueryState>

			{commentFor && (
				<CommentModal
					task={commentFor}
					onClose={() => setCommentFor(null)}
					onSave={saveComment}
					pending={commentTask.isPending}
				/>
			)}
		</>
	);
}

function TaskRow({
	task: t,
	onComment,
	onValidate,
	validating,
}: {
	task: MntTask;
	onComment: () => void;
	onValidate: () => void;
	validating: boolean;
}) {
	const [showHistory, setShowHistory] = useState(false);
	const st = TASK_STATUS[t.status] ?? {
		tone: 'slate' as const,
		label: t.status,
	};
	return (
		<li className="px-5 py-4" data-task-id={t.id}>
			<div className="flex items-start justify-between gap-4 flex-wrap">
				<div className="min-w-0">
					<p className="font-medium text-slate-900 dark:text-white">
						{t.title}
					</p>
					<div className="flex items-center gap-2 mt-1 flex-wrap">
						<Badge tone={st.tone}>{st.label}</Badge>
						{t.due_date && (
							<span className="text-xs text-slate-400 dark:text-gray-500">
								Prazo: {formatDate(t.due_date)}
							</span>
						)}
						{t.mentor_validated_at && (
							<span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
								<CheckCircle2 className="w-3.5 h-3.5" />
								Validada em {formatDate(t.mentor_validated_at)}
							</span>
						)}
					</div>
					{/* Evidências que o aluno anexou: é o que o mentor valida. */}
					{(t.evidences?.length ?? 0) > 0 && (
						<div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
							{t.evidences.map((ev) => {
								const href =
									ev.url &&
									(ev.kind === 'link' ? normalizeUrl(ev.url) : ev.url);
								return href ? (
									<a
										key={ev.id}
										href={href}
										target="_blank"
										rel="noreferrer"
										className="inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:underline"
									>
										<Paperclip className="w-3 h-3" />
										{ev.note ??
											(ev.kind === 'link' ? linkLabel(href) : ev.kind)}
									</a>
								) : (
									<span key={ev.id} className="text-xs text-muted">
										{ev.note ?? ev.url}
									</span>
								);
							})}
						</div>
					)}
					{t.mentor_comment && (
						<p className="text-sm text-slate-600 dark:text-gray-400 mt-2 border-l-2 border-violet-400 pl-3 whitespace-pre-line">
							{t.mentor_comment}
						</p>
					)}
				</div>
				<div className="flex gap-2 flex-wrap">
					<button
						type="button"
						className={secondaryBtn}
						aria-expanded={showHistory}
						onClick={() => setShowHistory((v) => !v)}
					>
						<History className="w-3.5 h-3.5" />
						Histórico
					</button>
					<button type="button" className={secondaryBtn} onClick={onComment}>
						<MessageSquare className="w-3.5 h-3.5" />
						Comentar
					</button>
					{!t.mentor_validated_at && t.status === 'done' && (
						<button
							type="button"
							className={primaryBtn}
							onClick={onValidate}
							disabled={validating}
						>
							<CheckCircle2 className="w-4 h-4" />
							Validar
						</button>
					)}
				</div>
			</div>
			{showHistory && <CommentHistory taskId={t.id} />}
		</li>
	);
}

function CommentHistory({ taskId }: { taskId: string }) {
	const comments = useMentorTaskComments(taskId, true);
	if (comments.isLoading) {
		return (
			<p className="mt-3 text-sm text-muted inline-flex items-center gap-2">
				<Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando…
			</p>
		);
	}
	if (comments.isError) {
		return (
			<p className="mt-3 text-sm text-muted">
				{mentoriaErrorMessage(comments.error, 'Não foi possível carregar.')}
			</p>
		);
	}
	if (!comments.data?.length) {
		return <p className="mt-3 text-sm text-muted">Sem comentários.</p>;
	}
	return (
		<ol className="mt-3 space-y-2" data-testid="task-comment-history">
			{comments.data.map((c) => (
				<li
					key={c.id}
					className="rounded-control bg-surface-sunken px-3 py-2 text-sm"
				>
					<p className="text-xs text-muted">
						{formatDateTime(c.created_at)}
						{c.author_name ? ` · ${c.author_name}` : ''}
					</p>
					<p className="text-primary whitespace-pre-line">{c.body}</p>
				</li>
			))}
		</ol>
	);
}

function CommentModal({
	task,
	onClose,
	onSave,
	pending,
}: {
	task: MntTask;
	onClose: () => void;
	onSave: (text: string | null) => void;
	pending: boolean;
}) {
	// Começa vazio: cada comentário é um novo item do histórico.
	const [text, setText] = useState('');
	return (
		<Modal title={`Comentário — ${task.title}`} onClose={onClose}>
			<div className="space-y-4">
				{task.mentor_comment && (
					<p className="text-sm text-muted border-l-2 border-violet-400 pl-3 whitespace-pre-line">
						Atual: {task.mentor_comment}
					</p>
				)}
				<Field label="Novo comentário">
					<textarea
						className={`${inputClass} min-h-28`}
						value={text}
						maxLength={5000}
						onChange={(e) => setText(e.target.value)}
					/>
				</Field>
				<div className="flex justify-between gap-2 flex-wrap">
					{task.mentor_comment ? (
						<button
							type="button"
							className={dangerBtn}
							disabled={pending}
							onClick={() => onSave(null)}
							title="O histórico fica"
						>
							<Trash2 className="w-3.5 h-3.5" />
							Limpar atual
						</button>
					) : (
						<span />
					)}
					<div className="flex gap-2">
						<button type="button" className={secondaryBtn} onClick={onClose}>
							Cancelar
						</button>
						<button
							type="button"
							className={primaryBtn}
							disabled={pending || !text.trim()}
							onClick={() => onSave(text.trim())}
						>
							{pending && <Loader2 className="w-4 h-4 animate-spin" />}
							Comentar
						</button>
					</div>
				</div>
			</div>
		</Modal>
	);
}
