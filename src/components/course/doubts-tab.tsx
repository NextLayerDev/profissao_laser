'use client';

import { Loader2, Lock, MessageSquare, Send } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useCreateDoubt, useDoubts } from '@/hooks/use-doubts';
import type { Doubt } from '@/types/doubts';
import { formatMessageTime } from '@/utils/formatDate';

interface DoubtsTabProps {
	lessonId: string | null;
	hasChatAccess: boolean;
	upgradeTiers?: { chat?: string | null } | null;
}

function DoubtCard({ doubt }: { doubt: Doubt }) {
	return (
		<div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
			<div className="flex items-start justify-between gap-2">
				<p className="text-sm text-white leading-relaxed flex-1">
					{doubt.content}
				</p>
			</div>
			<div className="flex items-center gap-2 text-xs text-slate-500">
				<span className="font-medium text-slate-400">{doubt.authorName}</span>
				<span>·</span>
				<span>{formatMessageTime(doubt.createdAt)}</span>
			</div>
			{doubt.replies.length > 0 && (
				<div className="mt-3 pl-4 border-l-2 border-violet-500/30 space-y-2">
					{doubt.replies.map((reply) => (
						<div key={reply.id} className="space-y-1">
							<p className="text-sm text-slate-300 leading-relaxed">
								{reply.content}
							</p>
							<div className="flex items-center gap-2 text-xs text-slate-500">
								<span className="font-medium text-violet-400">
									{reply.authorName}
								</span>
								{reply.isInstructor && (
									<span className="px-1.5 py-0.5 bg-violet-500/20 text-violet-300 rounded text-[10px] font-medium">
										Instrutor
									</span>
								)}
								<span>·</span>
								<span>{formatMessageTime(reply.createdAt)}</span>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export function DoubtsTab({
	lessonId,
	hasChatAccess,
	upgradeTiers,
}: DoubtsTabProps) {
	const [question, setQuestion] = useState('');
	const { data: doubts = [], isLoading } = useDoubts(lessonId ?? '');
	const createDoubt = useCreateDoubt(lessonId ?? '');

	if (!hasChatAccess) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-slate-500">
				<Lock className="w-12 h-12 mb-4" />
				<p className="text-sm font-medium">
					{upgradeTiers?.chat
						? `Dúvidas disponível no plano ${upgradeTiers.chat}`
						: 'Dúvidas disponível no plano Ouro ou Platina'}
				</p>
				<p className="text-xs mt-1">
					Faça upgrade para enviar dúvidas sobre as aulas.
				</p>
				<Link
					href="/store"
					className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
				>
					Ver planos
				</Link>
			</div>
		);
	}

	if (!lessonId) {
		return (
			<div className="flex flex-col items-center justify-center py-10 text-slate-600">
				<MessageSquare className="w-8 h-8 mb-3" />
				<p className="text-sm">Selecione uma aula para ver as dúvidas.</p>
			</div>
		);
	}

	const handleSubmit = async () => {
		if (!question.trim()) return;
		try {
			await createDoubt.mutateAsync(question.trim());
			setQuestion('');
		} catch {
			// erro tratado pelo hook
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-10">
				<Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
			</div>
		);
	}

	return (
		<div className="space-y-5">
			<div className="flex flex-col gap-2">
				<label
					htmlFor="question-textarea"
					className="text-sm font-medium text-slate-300"
				>
					Envie sua dúvida sobre esta aula
				</label>
				<textarea
					id="question-textarea"
					value={question}
					onChange={(e) => setQuestion(e.target.value)}
					placeholder="Escreva sua dúvida aqui..."
					rows={3}
					className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/60 transition-colors resize-none"
				/>
				<div className="flex justify-end">
					<button
						type="button"
						disabled={!question.trim() || createDoubt.isPending}
						onClick={handleSubmit}
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
			</div>

			{doubts.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-10 text-slate-600">
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
	);
}
