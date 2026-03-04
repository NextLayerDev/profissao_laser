'use client';

import {
	ChevronDown,
	ChevronRight,
	Loader2,
	MessageSquare,
	Send,
	X,
} from 'lucide-react';
import { useState } from 'react';
import {
	type LessonWithDoubts,
	type ModuleWithDoubts,
	type ProductWithDoubts,
	useDoubtsByModules,
	useReplyToDoubt,
} from '@/hooks/use-admin-doubts';
import type { Doubt } from '@/types/doubts';

function formatDate(iso: string) {
	try {
		return new Date(iso).toLocaleDateString('pt-PT', {
			day: '2-digit',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit',
		});
	} catch {
		return iso;
	}
}

function DoubtItem({
	doubt,
	lessonTitle,
	onReply,
}: {
	doubt: Doubt;
	lessonTitle: string;
	onReply: (doubtId: string, content: string) => Promise<void>;
}) {
	const [replyText, setReplyText] = useState('');
	const [replying, setReplying] = useState(false);

	async function handleReply(e: React.FormEvent) {
		e.preventDefault();
		const content = replyText.trim();
		if (!content) return;
		setReplying(true);
		try {
			await onReply(doubt.id, content);
			setReplyText('');
		} finally {
			setReplying(false);
		}
	}

	return (
		<div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
			<div>
				<p className="text-xs text-slate-500 mb-1">{lessonTitle}</p>
				<p className="text-sm text-white leading-relaxed">{doubt.content}</p>
				<p className="text-xs text-slate-500 mt-2">
					{doubt.authorName} · {formatDate(doubt.createdAt)}
				</p>
			</div>
			{doubt.replies.map((r) => (
				<div key={r.id} className="pl-4 border-l-2 border-violet-500/30 py-2">
					<p className="text-sm text-slate-200">{r.content}</p>
					<p className="text-xs text-violet-400 mt-1">
						{r.authorName}
						{r.isInstructor && ' · Instrutor'}
						{' · '}
						{formatDate(r.createdAt)}
					</p>
				</div>
			))}
			<form onSubmit={handleReply} className="flex gap-2">
				<input
					type="text"
					value={replyText}
					onChange={(e) => setReplyText(e.target.value)}
					placeholder="Responder..."
					className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
				/>
				<button
					type="submit"
					disabled={!replyText.trim() || replying}
					className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
				>
					{replying ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						<Send className="w-4 h-4" />
					)}
					Responder
				</button>
			</form>
		</div>
	);
}

function LessonRow({
	lesson,
	onReply,
}: {
	lesson: LessonWithDoubts;
	onReply: (doubtId: string, content: string) => Promise<void>;
}) {
	const [expanded, setExpanded] = useState(false);
	const count = lesson.doubts.length;
	const unanswered = lesson.doubts.filter((d) => d.replies.length === 0).length;

	return (
		<div className="border-b border-white/5 last:border-0">
			<button
				type="button"
				onClick={() => setExpanded((e) => !e)}
				className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-white/5 transition-colors"
			>
				{expanded ? (
					<ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
				) : (
					<ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
				)}
				<span className="flex-1 text-sm font-medium text-slate-200 truncate">
					{lesson.title}
				</span>
				{count > 0 ? (
					<>
						<span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full font-medium">
							{count} dúvida{count !== 1 ? 's' : ''}
						</span>
						{unanswered > 0 && (
							<span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-medium">
								{unanswered} pendente{unanswered !== 1 ? 's' : ''}
							</span>
						)}
					</>
				) : (
					<span className="text-xs text-slate-500">Sem dúvidas</span>
				)}
			</button>
			{expanded && (
				<div className="px-4 pb-4 space-y-3">
					{count === 0 ? (
						<p className="text-sm text-slate-500 py-4">
							Nenhuma dúvida nesta aula ainda.
						</p>
					) : (
						lesson.doubts.map((doubt) => (
							<DoubtItem
								key={doubt.id}
								doubt={doubt}
								lessonTitle={lesson.title}
								onReply={onReply}
							/>
						))
					)}
				</div>
			)}
		</div>
	);
}

function ProductCard({
	productWithDoubts: pw,
	onReply,
}: {
	productWithDoubts: ProductWithDoubts;
	onReply: (doubtId: string, content: string) => Promise<void>;
}) {
	const [expanded, setExpanded] = useState(false);
	const totalModules = pw.modules.length;
	const totalDoubts = pw.modules.reduce(
		(acc, m) => acc + m.lessons.reduce((a, l) => a + l.doubts.length, 0),
		0,
	);

	return (
		<div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
			<button
				type="button"
				onClick={() => setExpanded((e) => !e)}
				className="w-full flex items-center gap-2 px-4 py-4 text-left hover:bg-white/[0.03] transition-colors"
			>
				{expanded ? (
					<ChevronDown className="w-5 h-5 text-violet-400 shrink-0" />
				) : (
					<ChevronRight className="w-5 h-5 text-violet-400 shrink-0" />
				)}
				<span className="flex-1 font-bold text-white">{pw.course.name}</span>
				<span className="text-xs text-slate-500">
					{totalModules} módulo{totalModules !== 1 ? 's' : ''}
				</span>
				{totalDoubts > 0 && (
					<span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full font-medium">
						{totalDoubts} dúvida{totalDoubts !== 1 ? 's' : ''}
					</span>
				)}
			</button>
			{expanded && (
				<div className="px-4 pb-4 pt-0 space-y-2">
					{pw.modules.map((mod) => (
						<ModuleSection key={mod.id} module={mod} onReply={onReply} />
					))}
				</div>
			)}
		</div>
	);
}

function ModuleSection({
	module: mod,
	onReply,
}: {
	module: ModuleWithDoubts;
	onReply: (doubtId: string, content: string) => Promise<void>;
}) {
	const [expanded, setExpanded] = useState(false);
	const totalDoubts = mod.lessons.reduce((acc, l) => acc + l.doubts.length, 0);
	const unanswered = mod.lessons.reduce(
		(acc, l) => acc + l.doubts.filter((d) => d.replies.length === 0).length,
		0,
	);

	return (
		<div className="mb-4">
			<button
				type="button"
				onClick={() => setExpanded((e) => !e)}
				className="w-full flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/[0.07] rounded-lg transition-colors text-left"
			>
				{expanded ? (
					<ChevronDown className="w-4 h-4 text-violet-400 shrink-0" />
				) : (
					<ChevronRight className="w-4 h-4 text-violet-400 shrink-0" />
				)}
				<span className="flex-1 font-semibold text-white">{mod.title}</span>
				<span className="text-xs text-slate-500">
					{mod.lessons.length} aula{mod.lessons.length !== 1 ? 's' : ''}
				</span>
				{totalDoubts > 0 && (
					<>
						<span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full font-medium">
							{totalDoubts} dúvida{totalDoubts !== 1 ? 's' : ''}
						</span>
						{unanswered > 0 && (
							<span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-medium">
								{unanswered} pendente{unanswered !== 1 ? 's' : ''}
							</span>
						)}
					</>
				)}
			</button>
			{expanded && (
				<div className="mt-2 ml-2 space-y-1">
					{mod.lessons.map((lesson) => (
						<LessonRow key={lesson.id} lesson={lesson} onReply={onReply} />
					))}
				</div>
			)}
		</div>
	);
}

export interface DoubtsModalProps {
	open: boolean;
	onClose: () => void;
}

export function DoubtsModal({ open, onClose }: DoubtsModalProps) {
	const {
		data: productsWithDoubts = [],
		isLoading,
		isError,
	} = useDoubtsByModules(open);
	const replyMutation = useReplyToDoubt();

	async function handleReply(doubtId: string, content: string) {
		await replyMutation.mutateAsync({ doubtId, content });
	}

	if (!open) return null;

	return (
		<>
			<div
				className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
				onClick={onClose}
				aria-hidden
			/>
			<div
				className="fixed inset-4 md:inset-8 lg:inset-12 z-50 flex flex-col bg-[#0d0d0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
				role="dialog"
				aria-modal="true"
				aria-labelledby="doubts-modal-title"
			>
				<div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center">
							<MessageSquare className="w-5 h-5 text-violet-400" />
						</div>
						<div>
							<h2
								id="doubts-modal-title"
								className="text-lg font-bold text-white"
							>
								Dúvidas por Módulo
							</h2>
							<p className="text-xs text-slate-500">
								Responda às dúvidas dos alunos por aula
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
						aria-label="Fechar"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-6">
					{isLoading ? (
						<div className="flex flex-col items-center justify-center py-20">
							<Loader2 className="w-10 h-10 text-violet-400 animate-spin mb-4" />
							<p className="text-slate-500">A carregar dúvidas...</p>
						</div>
					) : isError ? (
						<div className="flex flex-col items-center justify-center py-20 text-red-400">
							<p className="text-sm">Erro ao carregar dúvidas.</p>
						</div>
					) : productsWithDoubts.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-20 text-slate-500">
							<MessageSquare className="w-12 h-12 mb-4 opacity-50" />
							<p className="text-sm">Nenhuma dúvida no momento.</p>
						</div>
					) : (
						<div className="space-y-4">
							{productsWithDoubts.map((pw) => (
								<ProductCard
									key={pw.product.id}
									productWithDoubts={pw}
									onReply={handleReply}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</>
	);
}
