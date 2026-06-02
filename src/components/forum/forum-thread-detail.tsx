'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { ForumPostClassic } from '@/components/forum/forum-post-classic';
import { ForumReplyForm } from '@/components/forum/forum-reply-form';
import { ForumThreadDetailSkeleton } from '@/components/ui/skeletons/forum-skeleton';
import { useForumPost, useUpvoteForumPost } from '@/hooks/use-forum';

interface ForumThreadDetailProps {
	postId: string;
	categoryId: string;
}

export function ForumThreadDetail({
	postId,
	categoryId,
}: ForumThreadDetailProps) {
	const { data: post, isLoading } = useForumPost(postId);
	const upvoteMut = useUpvoteForumPost();

	if (isLoading) {
		return <ForumThreadDetailSkeleton />;
	}

	if (!post) {
		return (
			<div className="py-16 text-center text-sm text-slate-500 dark:text-gray-400">
				Thread não encontrada.
			</div>
		);
	}

	const replies = post.replies ?? [];

	return (
		<div className="space-y-4">
			{/* Breadcrumbs */}
			<div className="flex items-center gap-2 text-sm">
				<Link
					href="/course/forum"
					className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400 hover:underline"
				>
					<ChevronLeft className="w-3.5 h-3.5" />
					Fórum
				</Link>
				<span className="text-slate-400">/</span>
				<Link
					href={`/course/forum/${categoryId}`}
					className="text-violet-600 dark:text-violet-400 hover:underline"
				>
					{post.categoryName || 'Categoria'}
				</Link>
			</div>

			{/* OP */}
			<ForumPostClassic
				post={post}
				postNumber={1}
				isOp
				onUpvote={() => upvoteMut.mutate(post.id)}
			/>

			{/* Replies count */}
			<div className="flex items-center justify-between pt-2">
				<p className="text-sm font-semibold text-slate-700 dark:text-gray-200">
					{replies.length === 0
						? 'Sem respostas ainda'
						: `${replies.length} ${replies.length === 1 ? 'resposta' : 'respostas'}`}
				</p>
			</div>

			{/* Replies */}
			{replies.map((r, idx) => (
				<ForumPostClassic
					key={r.id}
					post={r}
					postNumber={idx + 2}
					isOp={false}
				/>
			))}

			{/* Reply form */}
			<ForumReplyForm postId={post.id} />
		</div>
	);
}
