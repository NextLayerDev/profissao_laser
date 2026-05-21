'use client';

import { use } from 'react';
import { ForumThreadDetail } from '@/components/forum/forum-thread-detail';

interface PageProps {
	params: Promise<{ categoryId: string; postId: string }>;
}

export default function ForumThreadPage({ params }: PageProps) {
	const { categoryId, postId } = use(params);

	return (
		<div className="p-4 md:p-8 max-w-4xl mx-auto">
			<ForumThreadDetail postId={postId} categoryId={categoryId} />
		</div>
	);
}
