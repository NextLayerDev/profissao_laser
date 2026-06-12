'use client';

import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ForumBoardList } from '@/components/forum/forum-board-list';
import { ForumRecentDiscussions } from '@/components/forum/forum-recent-discussions';
import { useForumCategories } from '@/hooks/use-forum';
import type { ForumSort } from '@/services/forum';

const SORT_OPTIONS: { value: ForumSort; label: string }[] = [
	{ value: 'recent', label: 'Mais recentes' },
	{ value: 'top', label: 'Mais votados' },
	{ value: 'unanswered', label: 'Sem resposta' },
];

export default function ForumBoardListPage() {
	const [search, setSearch] = useState('');
	const [debounced, setDebounced] = useState('');
	const [sort, setSort] = useState<ForumSort>('recent');
	const [categoryId, setCategoryId] = useState('');

	const { data: categories = [] } = useForumCategories();

	// Debounce leve pra não disparar uma query a cada tecla.
	useEffect(() => {
		const t = setTimeout(() => setDebounced(search.trim()), 300);
		return () => clearTimeout(t);
	}, [search]);

	// Com qualquer filtro ativo, vira a lista de resultados (sem boards).
	const filtering = debounced.length > 0 || sort !== 'recent' || !!categoryId;
	const selectedCategory = categories.find((c) => c.id === categoryId);
	const resultsTitle = debounced
		? `Resultados para "${debounced}"`
		: selectedCategory
			? `Tema: ${selectedCategory.name}`
			: categoryId === 'none'
				? 'Discussões sem tema'
				: sort === 'top'
					? 'Mais votadas'
					: sort === 'unanswered'
						? 'Sem resposta'
						: 'Discussões Recentes';

	return (
		<div className="p-4 md:p-8 space-y-6">
			<div className="flex items-center justify-between gap-4 flex-wrap">
				<div>
					<h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
						Fórum da Comunidade
					</h1>
					<p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
						Troque ideias, tire dúvidas e compartilhe técnicas com outros
						profissionais.
					</p>
				</div>
				<Link
					href="/course/forum/new"
					className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors"
				>
					<Plus className="w-4 h-4" />
					Nova thread
				</Link>
			</div>

			{/* Busca + ordenação */}
			<div className="flex flex-col sm:flex-row gap-2">
				<div className="relative flex-1">
					<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-gray-500" />
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Buscar discussões no fórum..."
						className="w-full pl-12 pr-4 h-12 rounded-full bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
					/>
				</div>
				<select
					value={sort}
					onChange={(e) => setSort(e.target.value as ForumSort)}
					className="h-12 px-4 rounded-full bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-violet-500/50"
				>
					{SORT_OPTIONS.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</select>
			</div>

			{/* Chips de tema */}
			{categories.length > 0 && (
				<div className="flex gap-2 flex-wrap">
					<button
						type="button"
						onClick={() => setCategoryId('')}
						className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
							categoryId === ''
								? 'bg-violet-600 text-white'
								: 'bg-slate-100 dark:bg-[#1a1a1d] text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
						}`}
					>
						Todos
					</button>
					{categories.map((cat) => {
						const color = cat.color || '#8b5cf6';
						const selected = categoryId === cat.id;
						return (
							<button
								key={cat.id}
								type="button"
								onClick={() => setCategoryId(selected ? '' : cat.id)}
								className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
									selected
										? 'text-white'
										: 'bg-slate-100 dark:bg-[#1a1a1d] text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
								}`}
								style={selected ? { backgroundColor: color } : undefined}
							>
								{cat.name}
							</button>
						);
					})}
					<button
						type="button"
						onClick={() => setCategoryId(categoryId === 'none' ? '' : 'none')}
						className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
							categoryId === 'none'
								? 'bg-slate-600 text-white'
								: 'bg-slate-100 dark:bg-[#1a1a1d] text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
						}`}
					>
						Sem tema
					</button>
				</div>
			)}

			{filtering ? (
				<ForumRecentDiscussions
					limit={50}
					search={debounced || undefined}
					sort={sort}
					categoryId={categoryId || undefined}
					title={resultsTitle}
				/>
			) : (
				<>
					<ForumBoardList />
					<ForumRecentDiscussions limit={20} />
				</>
			)}
		</div>
	);
}
