'use client';

import { MessageSquarePlus, Search } from 'lucide-react';
import { useState } from 'react';
import { ForumNewPostModal } from '@/components/duvidas/forum-new-post-modal';
import { ForumPostCard } from '@/components/duvidas/forum-post-card';
import { ForumPostDetail } from '@/components/duvidas/forum-post-detail';
import {
	useForumCategories,
	useForumPosts,
	useUpvoteForumPost,
} from '@/hooks/use-forum';
import type { ForumSort } from '@/services/forum';
import type { ForumPost } from '@/types/forum';

interface ForumTabProps {
	currentUserId: string;
}

const SORT_OPTIONS: { value: ForumSort; label: string }[] = [
	{ value: 'recent', label: 'Mais recentes' },
	{ value: 'top', label: 'Mais votados' },
	{ value: 'unanswered', label: 'Sem resposta' },
];

export function ForumTab({ currentUserId }: ForumTabProps) {
	const [search, setSearch] = useState('');
	const [categoryId, setCategoryId] = useState('');
	const [sort, setSort] = useState<ForumSort>('recent');
	const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
	const [showNewModal, setShowNewModal] = useState(false);

	const { data: categories = [] } = useForumCategories();
	const { data: postsData, isLoading } = useForumPosts({
		search: search || undefined,
		categoryId: categoryId || undefined,
		sort: sort === 'recent' ? undefined : sort,
		limit: 30,
	});
	const upvote = useUpvoteForumPost();

	const posts = postsData?.posts ?? [];

	if (selectedPost) {
		return (
			<ForumPostDetail
				postId={selectedPost.id}
				currentUserId={currentUserId}
				onBack={() => setSelectedPost(null)}
			/>
		);
	}

	return (
		<div className="space-y-5">
			{/* Toolbar */}
			<div className="flex flex-col sm:flex-row gap-3">
				{/* Search */}
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Buscar perguntas..."
						className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
					/>
				</div>

				{/* Sort */}
				<select
					value={sort}
					onChange={(e) => setSort(e.target.value as ForumSort)}
					className="px-3 py-2 text-sm bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
				>
					{SORT_OPTIONS.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</select>

				{/* Category filter */}
				{categories.length > 0 && (
					<select
						value={categoryId}
						onChange={(e) => setCategoryId(e.target.value)}
						className="px-3 py-2 text-sm bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
					>
						<option value="">Todas as categorias</option>
						<option value="none">Sem tema</option>
						{categories.map((cat) => (
							<option key={cat.id} value={cat.id}>
								{cat.name}
							</option>
						))}
					</select>
				)}

				{/* New post */}
				<button
					type="button"
					onClick={() => setShowNewModal(true)}
					className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-violet-600 hover:bg-violet-400 text-white rounded-xl transition-colors whitespace-nowrap"
				>
					<MessageSquarePlus className="w-4 h-4" />
					Nova pergunta
				</button>
			</div>

			{/* Category pills */}
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
						Todas
					</button>
					{categories.map((cat) => (
						<button
							key={cat.id}
							type="button"
							onClick={() => setCategoryId(cat.id === categoryId ? '' : cat.id)}
							className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
								categoryId === cat.id
									? 'text-white'
									: 'bg-slate-100 dark:bg-[#1a1a1d] text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
							}`}
							style={
								categoryId === cat.id
									? { backgroundColor: cat.color }
									: undefined
							}
						>
							{cat.name}
						</button>
					))}
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

			{/* Posts list */}
			{isLoading ? (
				<div className="animate-pulse space-y-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<div
							key={i}
							className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-lg p-4"
						>
							<div className="flex items-center gap-3">
								<div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-white/5" />
								<div className="flex-1 space-y-2">
									<div className="h-4 w-48 rounded bg-slate-200 dark:bg-white/5" />
									<div className="h-3 w-full rounded bg-slate-200 dark:bg-white/5" />
								</div>
								<div className="flex items-center gap-2">
									<div className="h-5 w-12 rounded-full bg-slate-200 dark:bg-white/5" />
									<div className="h-3 w-8 rounded bg-slate-200 dark:bg-white/5" />
								</div>
							</div>
						</div>
					))}
				</div>
			) : posts.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-600 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-lg">
					<MessageSquarePlus className="w-12 h-12 mb-3 opacity-40" />
					<p className="text-sm font-medium">Nenhuma pergunta encontrada</p>
					<p className="text-xs mt-1 mb-4">
						{search || categoryId
							? 'Tente ajustar os filtros'
							: 'Seja o primeiro a perguntar!'}
					</p>
					<button
						type="button"
						onClick={() => setShowNewModal(true)}
						className="px-4 py-2 text-sm font-semibold bg-violet-600 hover:bg-violet-400 text-white rounded-xl transition-colors"
					>
						Nova pergunta
					</button>
				</div>
			) : (
				<div className="space-y-3">
					{posts.map((post) => (
						<ForumPostCard
							key={post.id}
							post={post}
							onSelect={setSelectedPost}
							onUpvote={(id) => upvote.mutate(id)}
						/>
					))}
				</div>
			)}

			{/* New post modal */}
			{showNewModal && (
				<ForumNewPostModal onClose={() => setShowNewModal(false)} />
			)}
		</div>
	);
}
