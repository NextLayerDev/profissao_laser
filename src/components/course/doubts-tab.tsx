'use client';

import { Loader2, MessageSquare, Send } from 'lucide-react';
import { useState } from 'react';
import { useCreateDoubt, useLessonDoubts } from '@/hooks/use-doubts';
import type { Doubt } from '@/types/doubts';

function formatDate(iso: string) {
	try {
		return new Date(iso).toLocaleDateString('pt-PT', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	} catch {
		return iso;
	}
}

function DoubtCard({ doubt }: { doubt: Doubt }) {
	return (
		<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 space-y-3">
			<div className="flex items-start justify-between gap-2">
				<div className="flex-1 min-w-0">
					<p className="text-sm text-slate-900 dark:text-white leading-relaxed">
						{doubt.content}
					</p>
					<p className="text-xs text-slate-500 mt-2">
						{doubt.authorName} · {formatDate(doubt.createdAt)}
					</p>
				</div>
			</div>
			{doubt.replies.length > 0 && (
				<div className="space-y-2 pl-4 border-l-2 border-violet-500/30">
					{doubt.replies.map((reply) => (
						<div key={reply.id} className="py-2">
							<p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
								{reply.content}
							</p>
							<div className="flex items-center gap-2 mt-1">
								<span className="text-xs text-violet-600 dark:text-violet-400 font-medium">
									{reply.authorName}
								</span>
								{reply.isInstructor && (
									<span className="text-[10px] px-1.5 py-0.5 bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 rounded font-medium">
										Instrutor
									</span>
								)}
								<span className="text-xs text-slate-500">
									{formatDate(reply.createdAt)}
								</span>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export interface DoubtsTabProps {
	lessonId: string | null;
	hasAccess: boolean;
}

export function DoubtsTab({ lessonId, hasAccess }: DoubtsTabProps) {
	const [question, setQuestion] = useState('');
	const {
		data: doubts = [],
		isLoading,
		isError,
	} = useLessonDoubts(lessonId ?? '');
	const createDoubt = useCreateDoubt(lessonId ?? '');

	if (!lessonId) {
		return (
			<div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-600">
				<MessageSquare className="w-8 h-8 mb-3" />
				<p className="text-sm">Selecione uma aula para ver as dúvidas.</p>
			</div>
		);
	}

	if (!hasAccess) {
		return null;
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const content = question.trim();
		if (!content) return;
		try {
			await createDoubt.mutateAsync(content);
			setQuestion('');
		} catch {
			// Error handled by mutation
		}
	}

	return (
		<div className="space-y-5">
			<form onSubmit={handleSubmit} className="flex flex-col gap-2">
				<label
					htmlFor="question-textarea"
					className="text-sm font-medium text-slate-600 dark:text-slate-300"
				>
					Envie sua dúvida sobre esta aula
				</label>
				<textarea
					id="question-textarea"
					value={question}
					onChange={(e) => setQuestion(e.target.value)}
					placeholder="Escreva sua dúvida aqui..."
					rows={3}
					className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500/60 transition-colors resize-none"
				/>
				<div className="flex justify-end">
					<button
						type="submit"
						disabled={!question.trim() || createDoubt.isPending}
						className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
					>
						{createDoubt.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Send className="w-4 h-4" />
						)}
						Enviar dúvida
					</button>
				</div>
				{createDoubt.isError && (
					<p className="text-sm text-red-400">
						Erro ao enviar. Tente novamente.
					</p>
				)}
			</form>

			<div>
				<h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">
					Dúvidas desta aula
				</h3>
				{isLoading ? (
					<div className="flex justify-center py-10">
						<Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
					</div>
				) : isError ? (
					<div className="flex flex-col items-center justify-center py-10 text-red-500 dark:text-red-400">
						<p className="text-sm">Erro ao carregar dúvidas.</p>
					</div>
				) : doubts.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-600">
						<MessageSquare className="w-8 h-8 mb-3" />
						<p className="text-sm">Nenhuma dúvida enviada ainda.</p>
						<p className="text-xs mt-1">Seja o primeiro a perguntar!</p>
					</div>
				) : (
					<div className="space-y-3">
						{doubts.map((doubt) => (
							<DoubtCard key={doubt.id} doubt={doubt} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}
