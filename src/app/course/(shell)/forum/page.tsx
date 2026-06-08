'use client';

import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ForumBoardList } from '@/components/forum/forum-board-list';
import { ForumRecentDiscussions } from '@/components/forum/forum-recent-discussions';

export default function ForumBoardListPage() {
	const [search, setSearch] = useState('');
	const [debounced, setDebounced] = useState('');

	// Debounce leve pra não disparar uma query a cada tecla.
	useEffect(() => {
		const t = setTimeout(() => setDebounced(search.trim()), 300);
		return () => clearTimeout(t);
	}, [search]);

	const searching = debounced.length > 0;

	return (
		<div className="p-4 md:p-8 space-y-6">
			<div className="flex items-center justify-between">
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

			{/* Busca no fórum — filtra posts por título/conteúdo (?search no backend) */}
			<div className="relative">
				<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-gray-500" />
				<input
					type="text"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Buscar discussões no fórum..."
					className="w-full pl-12 pr-4 h-12 rounded-full bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
				/>
			</div>

			{searching ? (
				<ForumRecentDiscussions
					limit={50}
					search={debounced}
					title={`Resultados para "${debounced}"`}
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
