'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { ForumThreadRow } from '@/components/forum/forum-thread-row';
import { ForumListSkeleton } from '@/components/ui/skeletons/forum-skeleton';
import { useForumPosts } from '@/hooks/use-forum';

interface ForumThreadListProps {
	categoryId: string;
	categoryName?: string;
}

export function ForumThreadList({
	categoryId,
	categoryName,
}: ForumThreadListProps) {
	const { data: postsResponse, isLoading } = useForumPosts({
		categoryId,
		limit: 50,
	});
	const posts = postsResponse?.posts ?? [];

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2 text-sm">
					<Link
						href="/course/forum"
						className="text-violet-600 dark:text-violet-400 hover:underline"
					>
						Fórum
					</Link>
					<span className="text-slate-400">/</span>
					<span className="font-semibold text-slate-700 dark:text-gray-200">
						{categoryName || 'Categoria'}
					</span>
				</div>
				<Link
					href={`/course/forum/new?categoryId=${categoryId}`}
					className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition-colors"
				>
					<Plus className="w-3.5 h-3.5" />
					Nova thread
				</Link>
			</div>

			{isLoading ? (
				<ForumListSkeleton />
			) : posts.length === 0 ? (
				<div className="py-16 text-center bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
					<p className="text-sm text-slate-500 dark:text-gray-400">
						Ainda não tem nenhuma thread nessa categoria.
					</p>
					<Link
						href={`/course/forum/new?categoryId=${categoryId}`}
						className="inline-block mt-3 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
					>
						Criar a primeira
					</Link>
				</div>
			) : (
				<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
					{/* Header de colunas */}
					<div className="grid grid-cols-[1fr_80px_240px] gap-4 px-4 py-2.5 bg-slate-100 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
						<span>Tópico</span>
						<span className="text-center">Respostas</span>
						<span>Última atividade</span>
					</div>
					<div>
						{posts.map((p) => (
							<ForumThreadRow key={p.id} post={p} categoryId={categoryId} />
						))}
					</div>
				</div>
			)}
		</div>
	);
}
