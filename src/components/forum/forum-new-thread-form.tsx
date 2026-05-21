'use client';

import { ChevronLeft, Loader2, Send } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCreateForumPost, useForumCategories } from '@/hooks/use-forum';

export function ForumNewThreadForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const presetCategoryId = searchParams.get('categoryId') ?? '';

	const { data: categories = [] } = useForumCategories();
	const createMut = useCreateForumPost();

	const [title, setTitle] = useState('');
	const [content, setContent] = useState('');
	const [categoryId, setCategoryId] = useState(presetCategoryId);

	useEffect(() => {
		if (presetCategoryId && !categoryId) setCategoryId(presetCategoryId);
	}, [presetCategoryId, categoryId]);

	const canSubmit = title.trim() && content.trim();

	async function handleSubmit() {
		if (!canSubmit) return;
		try {
			const created = await createMut.mutateAsync({
				title: title.trim(),
				content: content.trim(),
				categoryId: categoryId || undefined,
			});
			const targetCategory = categoryId || created.categoryId;
			if (targetCategory) {
				router.push(`/course/forum/${targetCategory}/${created.id}`);
			} else {
				router.push('/course/forum');
			}
		} catch {
			// toast handled by mutation
		}
	}

	return (
		<div className="space-y-4">
			<Link
				href="/course/forum"
				className="inline-flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 hover:underline"
			>
				<ChevronLeft className="w-3.5 h-3.5" />
				Voltar ao fórum
			</Link>

			<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-5 space-y-4">
				<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
					Nova thread
				</h2>

				<div>
					<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
						Categoria
					</span>
					<select
						value={categoryId}
						onChange={(e) => setCategoryId(e.target.value)}
						className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
					>
						<option value="">Sem categoria</option>
						{categories.map((c) => (
							<option key={c.id} value={c.id}>
								{c.name}
							</option>
						))}
					</select>
				</div>

				<div>
					<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
						Título *
					</span>
					<input
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="Resumo da sua thread"
						className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
					/>
				</div>

				<div>
					<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
						Mensagem *
					</span>
					<textarea
						value={content}
						onChange={(e) => setContent(e.target.value)}
						rows={8}
						placeholder="Conte com detalhes..."
						className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-none"
					/>
				</div>

				<div className="flex items-center justify-end gap-2">
					<Link
						href="/course/forum"
						className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors text-sm"
					>
						Cancelar
					</Link>
					<button
						type="button"
						onClick={handleSubmit}
						disabled={!canSubmit || createMut.isPending}
						className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{createMut.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Send className="w-4 h-4" />
						)}
						Publicar thread
					</button>
				</div>
			</div>
		</div>
	);
}
