'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
	ChevronDown,
	ChevronRight,
	Loader2,
	MessageSquare,
	Send,
	X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useProducts } from '@/hooks/use-products';
import { getLessonDoubts, replyToDoubt } from '@/services/doubts';
import { getLessons, getModules } from '@/services/modules';
import type { Doubt, DoubtReply } from '@/types/doubts';
import type { Lesson, Module } from '@/types/modules';
import { formatMessageTime } from '@/utils/formatDate';

interface DoubtsModalProps {
	open: boolean;
	onClose: () => void;
	onUnansweredCountChange?: (count: number) => void;
}

function ChatBubble({
	content,
	authorName,
	createdAt,
	isInstructor,
}: {
	content: string;
	authorName: string;
	createdAt: string;
	isInstructor: boolean;
}) {
	return (
		<div className={`flex ${isInstructor ? 'justify-end' : 'justify-start'}`}>
			<div
				className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
					isInstructor
						? 'bg-violet-600 text-white rounded-br-md'
						: 'bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white rounded-bl-md'
				}`}
			>
				<p className="text-sm leading-relaxed">{content}</p>
				<p className="text-xs mt-1 opacity-80">
					{authorName}
					{isInstructor && ' · Instrutor'}
					{' · '}
					{formatMessageTime(createdAt)}
				</p>
			</div>
		</div>
	);
}

function DoubtThread({ doubt, lessonId }: { doubt: Doubt; lessonId: string }) {
	const [reply, setReply] = useState('');
	const [replying, setReplying] = useState(false);
	const qc = useQueryClient();

	const handleReply = async () => {
		if (!reply.trim()) return;
		setReplying(true);
		try {
			await replyToDoubt(doubt.id, { content: reply.trim() });
			qc.invalidateQueries({ queryKey: ['doubts', lessonId] });
			setReply('');
		} finally {
			setReplying(false);
		}
	};

	const messages: Array<{
		id: string;
		content: string;
		authorName: string;
		createdAt: string;
		isInstructor: boolean;
	}> = [
		{
			id: `doubt-${doubt.id}`,
			content: doubt.content,
			authorName: doubt.authorName,
			createdAt: doubt.createdAt,
			isInstructor: false,
		},
		...(doubt.replies as DoubtReply[]).map((r) => ({
			id: r.id,
			content: r.content,
			authorName: r.authorName,
			createdAt: r.createdAt,
			isInstructor: r.isInstructor,
		})),
	];

	return (
		<div className="space-y-3">
			<div className="space-y-2">
				{messages.map((msg) => (
					<ChatBubble
						key={msg.id}
						content={msg.content}
						authorName={msg.authorName}
						createdAt={msg.createdAt}
						isInstructor={msg.isInstructor}
					/>
				))}
			</div>
			<div className="flex gap-2 pl-2">
				<input
					type="text"
					value={reply}
					onChange={(e) => setReply(e.target.value)}
					placeholder="Responder..."
					className="flex-1 px-3 py-2 text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50"
				/>
				<button
					type="button"
					onClick={handleReply}
					disabled={!reply.trim() || replying}
					className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
				>
					{replying ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						<Send className="w-4 h-4" />
					)}
					Responder
				</button>
			</div>
		</div>
	);
}

function LessonItem({
	lesson,
	isSelected,
	onSelect,
}: {
	lesson: Lesson;
	isSelected: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			className={`w-full text-left px-4 py-2.5 flex items-center gap-2 rounded-lg transition-colors ${
				isSelected
					? 'bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-500/30'
					: 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
			}`}
		>
			<ChevronRight className="w-4 h-4 shrink-0 opacity-50" />
			<span className="text-sm truncate">{lesson.title}</span>
		</button>
	);
}

function ModuleSection({
	module,
	productId,
	expandedModules,
	selectedLessonId,
	onToggleModule,
	onSelectLesson,
}: {
	module: Module;
	productId: string;
	expandedModules: Set<string>;
	selectedLessonId: string | null;
	onToggleModule: (id: string) => void;
	onSelectLesson: (lesson: Lesson) => void;
}) {
	const isExpanded = expandedModules.has(module.id);
	const { data: lessons = [], isLoading } = useQuery({
		queryKey: ['lessons', module.id],
		queryFn: () => getLessons(module.id),
		enabled: isExpanded && !!productId,
	});

	const displayLessons = lessons.length > 0 ? lessons : (module.lessons ?? []);

	return (
		<div className="rounded-lg overflow-hidden border border-slate-200 dark:border-white/10">
			<button
				type="button"
				onClick={() => onToggleModule(module.id)}
				className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-[#252528] hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-left"
			>
				<div className="flex items-center gap-2 min-w-0">
					<ChevronDown
						className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
					/>
					<span className="font-medium text-sm text-slate-900 dark:text-white truncate">
						{module.title}
					</span>
				</div>
				<span className="text-xs text-slate-500 shrink-0">
					{displayLessons.length} aula{displayLessons.length !== 1 ? 's' : ''}
				</span>
			</button>
			{isExpanded && (
				<div className="border-t border-slate-200 dark:border-white/10 py-1 px-2 space-y-0.5">
					{isLoading ? (
						<div className="flex items-center justify-center py-4">
							<Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
						</div>
					) : (
						displayLessons.map((lesson: Lesson) => (
							<LessonItem
								key={lesson.id}
								lesson={lesson}
								isSelected={selectedLessonId === lesson.id}
								onSelect={() => onSelectLesson(lesson)}
							/>
						))
					)}
				</div>
			)}
		</div>
	);
}

export function DoubtsModal({
	open,
	onClose,
	onUnansweredCountChange,
}: DoubtsModalProps) {
	const [productId, setProductId] = useState<string>('');
	const [expandedModules, setExpandedModules] = useState<Set<string>>(
		new Set(),
	);
	const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
	const [lessonUnansweredMap, setLessonUnansweredMap] = useState<
		Record<string, number>
	>({});
	const { products = [], isLoading: productsLoading } = useProducts();

	const handleUnansweredCount = useCallback(
		(lessonId: string, count: number) => {
			setLessonUnansweredMap((prev) => ({ ...prev, [lessonId]: count }));
		},
		[],
	);

	useEffect(() => {
		if (!onUnansweredCountChange) return;
		const total = Object.values(lessonUnansweredMap).reduce((a, b) => a + b, 0);
		onUnansweredCountChange(total);
	}, [lessonUnansweredMap, onUnansweredCountChange]);

	const { data: modules = [] } = useQuery({
		queryKey: ['modules', productId],
		queryFn: () => getModules(productId),
		enabled: !!productId,
	});

	const toggleModule = useCallback((id: string) => {
		setExpandedModules((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});
	}, []);

	const handleSelectLesson = useCallback((lesson: Lesson) => {
		setSelectedLesson(lesson);
	}, []);

	const handleProductChange = (value: string) => {
		setProductId(value);
		setExpandedModules(new Set());
		setSelectedLesson(null);
	};

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<button
				type="button"
				className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default"
				onClick={onClose}
				onKeyDown={(e) => e.key === 'Escape' && onClose()}
				aria-label="Fechar"
			/>
			<div className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-[#1a1a1d] rounded-2xl shadow-xl flex flex-col overflow-hidden border border-slate-200 dark:border-white/10">
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
							<MessageSquare className="w-5 h-5 text-white" />
						</div>
						<div>
							<h2 className="text-lg font-bold text-slate-900 dark:text-white">
								Dúvidas por Módulo
							</h2>
							<p className="text-sm text-slate-500 dark:text-slate-400">
								Selecione uma aula para ver e responder às dúvidas
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Product selector */}
				<div className="px-6 py-3 border-b border-slate-200 dark:border-white/10 shrink-0">
					<label
						htmlFor="doubts-product-select"
						className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
					>
						Produto
					</label>
					<select
						id="doubts-product-select"
						value={productId}
						onChange={(e) => handleProductChange(e.target.value)}
						className="w-full max-w-md px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
					>
						<option value="">Selecione um produto</option>
						{products.map((p) => (
							<option key={p.id} value={p.id}>
								{p.name}
							</option>
						))}
					</select>
				</div>

				{/* Two-panel layout */}
				<div className="flex-1 flex min-h-0 overflow-hidden">
					{/* Left: Modules & Lessons */}
					<div className="w-72 border-r border-slate-200 dark:border-white/10 flex flex-col overflow-hidden shrink-0">
						<div className="px-4 py-3 border-b border-slate-200 dark:border-white/10">
							<p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
								Módulos e Aulas
							</p>
						</div>
						<div className="flex-1 overflow-y-auto p-3 space-y-2">
							{!productId && !productsLoading && (
								<div className="py-8 text-center text-sm text-slate-500">
									Selecione um produto
								</div>
							)}
							{productId &&
								modules.map((mod) => (
									<ModuleSection
										key={mod.id}
										module={mod}
										productId={productId}
										expandedModules={expandedModules}
										selectedLessonId={selectedLesson?.id ?? null}
										onToggleModule={toggleModule}
										onSelectLesson={handleSelectLesson}
									/>
								))}
						</div>
					</div>

					{/* Right: Chat */}
					<div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-[#0d0d0f]">
						{selectedLesson ? (
							<ChatPanel
								lesson={selectedLesson}
								onUnansweredCount={handleUnansweredCount}
							/>
						) : (
							<div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-8">
								<MessageSquare className="w-16 h-16 mb-4 opacity-30" />
								<p className="text-sm font-medium">
									Selecione uma aula à esquerda
								</p>
								<p className="text-xs mt-1">
									As dúvidas serão carregadas ao selecionar
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function ChatPanel({
	lesson,
	onUnansweredCount,
}: {
	lesson: Lesson;
	onUnansweredCount?: (lessonId: string, count: number) => void;
}) {
	const { data: doubts = [], isLoading } = useQuery({
		queryKey: ['doubts', lesson.id],
		queryFn: () => getLessonDoubts(lesson.id),
		enabled: !!lesson.id,
	});

	useEffect(() => {
		if (doubts.length > 0 && onUnansweredCount) {
			const count = doubts.filter((d) => d.replies.length === 0).length;
			onUnansweredCount(lesson.id, count);
		}
	}, [doubts, lesson.id, onUnansweredCount]);

	return (
		<>
			<div className="px-4 py-3 border-b border-slate-200 dark:border-white/10 shrink-0">
				<h3 className="font-semibold text-slate-900 dark:text-white">
					{lesson.title}
				</h3>
				<p className="text-xs text-slate-500 mt-0.5">
					{doubts.length} dúvida{doubts.length !== 1 ? 's' : ''}
				</p>
			</div>
			<div className="flex-1 overflow-y-auto p-4 space-y-6">
				{isLoading ? (
					<div className="flex items-center justify-center py-16">
						<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
					</div>
				) : doubts.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 text-slate-500">
						<MessageSquare className="w-12 h-12 mb-4 opacity-40" />
						<p className="text-sm">Nenhuma dúvida nesta aula.</p>
					</div>
				) : (
					doubts.map((doubt) => (
						<div
							key={doubt.id}
							className="bg-white dark:bg-[#1a1a1d] rounded-xl p-4 border border-slate-200 dark:border-white/10"
						>
							{doubt.replies.length === 0 && (
								<span className="inline-block px-2 py-0.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium rounded-full mb-3">
									Sem resposta
								</span>
							)}
							<DoubtThread doubt={doubt} lessonId={lesson.id} />
						</div>
					))
				)}
			</div>
		</>
	);
}
