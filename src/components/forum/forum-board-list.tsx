'use client';

import { useMemo } from 'react';
import { ForumBoardRow } from '@/components/forum/forum-board-row';
import { ForumBoardSkeleton } from '@/components/ui/skeletons/forum-skeleton';
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
		return <ForumBoardSkeleton />;
	}

	if (categories.length === 0) {
		return (
			<div className="py-10 text-center text-sm text-slate-500 dark:text-gray-400 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
				Sem temas definidos — veja as discussões recentes abaixo.
			</div>
		);
	}

	return (
		<section className="space-y-3">
			<h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
				Temas
			</h2>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{categories.map((cat) => (
					<ForumBoardRow
						key={cat.id}
						category={cat}
						lastPost={lastPostByCategory.get(cat.id) ?? null}
					/>
				))}
			</div>
		</section>
	);
}
