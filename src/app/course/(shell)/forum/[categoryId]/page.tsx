'use client';

import { use } from 'react';
import { ForumThreadList } from '@/components/forum/forum-thread-list';
import { useForumCategories } from '@/hooks/use-forum';

interface PageProps {
	params: Promise<{ categoryId: string }>;
}

export default function ForumCategoryPage({ params }: PageProps) {
	const { categoryId } = use(params);
	const { data: categories = [] } = useForumCategories();
	const category = categories.find((c) => c.id === categoryId);

	return (
		<div className="p-4 md:p-8 space-y-4 max-w-6xl mx-auto">
			<ForumThreadList categoryId={categoryId} categoryName={category?.name} />
		</div>
	);
}
