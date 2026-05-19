'use client';

import {
	ChevronDown,
	ChevronRight,
	Edit,
	FileText,
	Loader2,
	Play,
	Plus,
	Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
	useCreateKnowledgeBaseArticle,
	useDeleteKnowledgeBaseArticle,
	useKnowledgeBase,
	useUpdateKnowledgeBaseArticle,
} from '@/hooks/use-knowledge-base';
import type { CreateKnowledgeBasePayload } from '@/services/knowledge-base';
import type { KnowledgeBaseArticle } from '@/types/knowledge-base';
import { KBModal } from './kb-modal';

type TypeFilter = 'all' | 'article' | 'video';

export function KBAdminSection() {
	const { data: articles = [], isLoading } = useKnowledgeBase();
	const createMutation = useCreateKnowledgeBaseArticle();
	const updateMutation = useUpdateKnowledgeBaseArticle();
	const deleteMutation = useDeleteKnowledgeBaseArticle();

	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
	const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
	const [modal, setModal] = useState<{
		open: boolean;
		editing: KnowledgeBaseArticle | null;
	}>({ open: false, editing: null });

	const filtered = useMemo(() => {
		if (typeFilter === 'all') return articles;
		return articles.filter((a) => a.type === typeFilter);
	}, [articles, typeFilter]);

	function toggleExpanded(id: string) {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	async function handleSave(data: CreateKnowledgeBasePayload) {
		try {
			if (modal.editing) {
				await updateMutation.mutateAsync({
					id: modal.editing.id,
					payload: data,
				});
				toast.success('Artigo atualizado!');
			} else {
				await createMutation.mutateAsync(data);
				toast.success('Artigo criado!');
			}
			setModal({ open: false, editing: null });
		} catch {
			toast.error('Erro ao salvar');
		}
	}

	async function handleDelete(article: KnowledgeBaseArticle) {
		if (!confirm(`Excluir "${article.title}"?`)) return;
		try {
			await deleteMutation.mutateAsync(article.id);
			toast.success('Artigo excluído!');
		} catch {
			toast.error('Erro ao excluir');
		}
	}

	const articleCount = articles.filter((a) => a.type === 'article').length;
	const videoCount = articles.filter((a) => a.type === 'video').length;

	if (isLoading) {
		return (
			<div className="flex justify-center py-16">
				<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-slate-900 dark:text-white">
						Base de Conhecimento
					</h2>
					<p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
						{articleCount} artigo{articleCount !== 1 ? 's' : ''} · {videoCount}{' '}
						vídeo{videoCount !== 1 ? 's' : ''}
					</p>
				</div>
				<button
					type="button"
					onClick={() => setModal({ open: true, editing: null })}
					className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
				>
					<Plus className="w-4 h-4" />
					Novo
				</button>
			</div>

			{/* Filter tabs */}
			<div className="flex gap-1 bg-slate-100 dark:bg-white/5 rounded-xl p-1 w-fit">
				{(
					[
						{ key: 'all', label: `Todos (${articles.length})` },
						{ key: 'article', label: `Artigos (${articleCount})` },
						{ key: 'video', label: `Vídeos (${videoCount})` },
					] as const
				).map((tab) => (
					<button
						key={tab.key}
						type="button"
						onClick={() => setTypeFilter(tab.key)}
						className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
							typeFilter === tab.key
								? 'bg-white dark:bg-white/10 text-violet-600 dark:text-violet-400 shadow-sm'
								: 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Lista */}
			{filtered.length === 0 ? (
				<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl p-12 text-center">
					<p className="text-slate-600 dark:text-gray-400 mb-4">
						Nenhum artigo cadastrado
					</p>
					<button
						type="button"
						onClick={() => setModal({ open: true, editing: null })}
						className="text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 font-medium"
					>
						Criar primeiro artigo
					</button>
				</div>
			) : (
				<div className="space-y-3">
					{filtered.map((article) => {
						const isExpanded = expandedIds.has(article.id);
						const Icon = article.type === 'video' ? Play : FileText;
						return (
							<div
								key={article.id}
								className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden"
							>
								<div className="flex items-center gap-2 px-3 py-3">
									{/* Expand */}
									<button
										type="button"
										onClick={() => toggleExpanded(article.id)}
										className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors"
									>
										{isExpanded ? (
											<ChevronDown className="w-4 h-4 text-slate-500 dark:text-gray-400" />
										) : (
											<ChevronRight className="w-4 h-4 text-slate-500 dark:text-gray-400" />
										)}
									</button>

									{/* Icon */}
									<div
										className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
											article.type === 'video'
												? 'bg-rose-100 dark:bg-rose-500/20'
												: 'bg-violet-100 dark:bg-violet-500/20'
										}`}
									>
										<Icon
											className={`w-4 h-4 ${
												article.type === 'video'
													? 'text-rose-600 dark:text-rose-400'
													: 'text-violet-600 dark:text-violet-400'
											}`}
										/>
									</div>

									{/* Título */}
									<div className="flex-1 min-w-0">
										<p className="font-semibold text-slate-900 dark:text-white truncate">
											{article.title}
										</p>
										<div className="flex items-center gap-2 mt-0.5">
											<span className="text-xs text-slate-500 dark:text-gray-400">
												{article.type === 'video' ? 'Vídeo' : 'Artigo'}
											</span>
											{article.category && (
												<span className="text-xs text-slate-400 dark:text-gray-500">
													· {article.category}
												</span>
											)}
											{!article.isPublished && (
												<span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
													Rascunho
												</span>
											)}
										</div>
									</div>

									{/* Ações */}
									<button
										type="button"
										onClick={() => setModal({ open: true, editing: article })}
										className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
										aria-label="Editar"
									>
										<Edit className="w-4 h-4 text-slate-500 dark:text-gray-400" />
									</button>
									<button
										type="button"
										onClick={() => void handleDelete(article)}
										className="p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
										aria-label="Excluir"
									>
										<Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
									</button>
								</div>

								{/* Preview expandido */}
								{isExpanded && (
									<div className="px-4 pb-4 pt-0 border-t border-slate-200 dark:border-gray-700 space-y-3">
										{article.excerpt && (
											<div className="pt-3">
												<p className="text-sm font-medium text-slate-700 dark:text-gray-300">
													Resumo:
												</p>
												<p className="text-sm text-slate-600 dark:text-slate-400">
													{article.excerpt}
												</p>
											</div>
										)}
										{article.content && (
											<div>
												<p className="text-sm font-medium text-slate-700 dark:text-gray-300">
													Conteúdo:
												</p>
												<p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap line-clamp-6">
													{article.content}
												</p>
											</div>
										)}
										{article.videoUrl && (
											<div>
												<p className="text-sm font-medium text-slate-700 dark:text-gray-300">
													URL do vídeo:
												</p>
												<a
													href={article.videoUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="text-sm text-violet-600 dark:text-violet-400 underline break-all"
												>
													{article.videoUrl}
												</a>
											</div>
										)}
										{article.readTime != null && (
											<p className="text-xs text-slate-500 dark:text-gray-400">
												Tempo de leitura: {article.readTime} min
											</p>
										)}
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{/* Modal */}
			{modal.open && (
				<KBModal
					editing={modal.editing}
					nextOrder={articles.length}
					onClose={() => setModal({ open: false, editing: null })}
					onSave={handleSave}
				/>
			)}
		</div>
	);
}
