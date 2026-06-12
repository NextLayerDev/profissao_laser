'use client';

import { ChevronLeft, Info, Loader2, Send, Tag } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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

	// Tema obrigatório quando existem temas — post sem tema some dos filtros.
	const needsCategory = categories.length > 0;
	const canSubmit =
		!!title.trim() && !!content.trim() && (!needsCategory || !!categoryId);

	async function handleSubmit() {
		if (!title.trim() || !content.trim()) return;
		if (needsCategory && !categoryId) {
			toast.error('Escolha um tema para a sua thread');
			return;
		}
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

			<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 md:p-6 space-y-5">
				<div>
					<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
						Nova thread
					</h2>
					<p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
						Escolha o tema certo — assim outros profissionais acham sua
						discussão.
					</p>
				</div>

				<fieldset>
					<legend className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
						<Tag className="w-3.5 h-3.5 text-violet-500" />
						Tema {needsCategory && '*'}
					</legend>
					{needsCategory ? (
						<div className="flex gap-2 flex-wrap">
							{categories.map((c) => {
								const color = c.color || '#8b5cf6';
								const selected = categoryId === c.id;
								return (
									<button
										key={c.id}
										type="button"
										aria-pressed={selected}
										onClick={() => setCategoryId(selected ? '' : c.id)}
										className={`px-3.5 py-1.5 text-sm font-semibold rounded-full border transition-all ${
											selected
												? 'text-white shadow-md scale-[1.03]'
												: 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-white/10 hover:border-violet-400/50'
										}`}
										style={
											selected
												? { backgroundColor: color, borderColor: color }
												: undefined
										}
									>
										{c.name}
									</button>
								);
							})}
						</div>
					) : (
						<p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-gray-400 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2">
							<Info className="w-3.5 h-3.5 shrink-0" />
							Ainda não há temas criados — sua thread será publicada sem tema e
							um admin pode categorizá-la depois.
						</p>
					)}
				</fieldset>

				<div>
					<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
						Título *
					</span>
					<input
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="Resumo da sua thread"
						maxLength={200}
						className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
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
						className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-none"
					/>
				</div>

				<div className="flex items-center justify-end gap-2">
					<Link
						href="/course/forum"
						className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-xl text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors text-sm"
					>
						Cancelar
					</Link>
					<button
						type="button"
						onClick={handleSubmit}
						disabled={!canSubmit || createMut.isPending}
						className="inline-flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
