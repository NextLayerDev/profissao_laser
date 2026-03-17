'use client';

import { Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCreateForumPost, useForumCategories } from '@/hooks/use-forum';

interface ForumNewPostModalProps {
	onClose: () => void;
}

export function ForumNewPostModal({ onClose }: ForumNewPostModalProps) {
	const [title, setTitle] = useState('');
	const [content, setContent] = useState('');
	const [categoryId, setCategoryId] = useState('');

	const { data: categories = [] } = useForumCategories();
	const create = useCreateForumPost();

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!title.trim() || !content.trim()) {
			toast.error('Preencha o título e o conteúdo');
			return;
		}
		create.mutate(
			{
				title: title.trim(),
				content: content.trim(),
				categoryId: categoryId || undefined,
			},
			{
				onSuccess: () => {
					toast.success('Pergunta publicada!');
					onClose();
				},
				onError: () => toast.error('Erro ao publicar pergunta'),
			},
		);
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<button
				type="button"
				aria-label="Fechar"
				className="absolute inset-0 bg-black/50 backdrop-blur-sm"
				onClick={onClose}
			/>
			<div
				role="dialog"
				aria-modal="true"
				className="relative w-full max-w-lg bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl"
			>
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10">
					<h2 className="text-base font-bold text-slate-900 dark:text-white">
						Nova pergunta
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="p-6 space-y-4">
					{categories.length > 0 && (
						<div>
							<label
								htmlFor="post-category"
								className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5"
							>
								Categoria (opcional)
							</label>
							<select
								id="post-category"
								value={categoryId}
								onChange={(e) => setCategoryId(e.target.value)}
								className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
							>
								<option value="">Sem categoria</option>
								{categories.map((cat) => (
									<option key={cat.id} value={cat.id}>
										{cat.name}
									</option>
								))}
							</select>
						</div>
					)}

					<div>
						<label
							htmlFor="post-title"
							className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5"
						>
							Título *
						</label>
						<input
							id="post-title"
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Qual é a sua dúvida?"
							maxLength={200}
							className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
						/>
					</div>

					<div>
						<label
							htmlFor="post-content"
							className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5"
						>
							Descrição *
						</label>
						<textarea
							id="post-content"
							value={content}
							onChange={(e) => setContent(e.target.value)}
							placeholder="Descreva a sua dúvida com detalhes..."
							rows={5}
							className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
						/>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={create.isPending}
							className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white rounded-xl transition-colors"
						>
							{create.isPending && (
								<Loader2 className="w-3.5 h-3.5 animate-spin" />
							)}
							Publicar
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
