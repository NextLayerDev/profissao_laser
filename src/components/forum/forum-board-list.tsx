'use client';

import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { ForumBoardRow } from '@/components/forum/forum-board-row';
import { useForumCategories, useForumPosts } from '@/hooks/use-forum';

export function ForumBoardList() {
	const { data: categories = [], isLoading: catsLoading } =
		useForumCategories();
	// Pega os 50 posts mais recentes pra derivar "última atividade" por categoria
	// sem fazer N+1 queries.
	const { data: postsResponse, isLoading: postsLoading } = useForumPosts({
		limit: 50,
	});
	const recentPosts = postsResponse?.posts ?? [];

	const lastPostByCategory = useMemo(() => {
		const map = new Map<string, (typeof recentPosts)[number]>();
		for (const p of recentPosts) {
			if (!p.categoryId) continue;
			const existing = map.get(p.categoryId);
			if (!existing || p.updatedAt > existing.updatedAt) {
				map.set(p.categoryId, p);
			}
		}
		return map;
	}, [recentPosts]);

	if (catsLoading || postsLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<Loader2 className="w-6 h-6 animate-spin text-violet-500" />
			</div>
		);
	}

	if (categories.length === 0) {
		return (
			<div className="py-16 text-center text-sm text-slate-500 dark:text-gray-400">
				Nenhuma categoria no fórum ainda.
			</div>
		);
	}

	return (
		<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
			{/* Header de colunas */}
			<div className="grid grid-cols-[1fr_80px_240px] gap-4 px-4 py-2.5 bg-slate-100 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
				<span>Categoria</span>
				<span className="text-center">Posts</span>
				<span>Última atividade</span>
			</div>

			{/* Rows */}
			<div>
				{categories.map((cat) => (
					<ForumBoardRow
						key={cat.id}
						category={cat}
						lastPost={lastPostByCategory.get(cat.id) ?? null}
					/>
				))}
			</div>
		</div>
	);
}
