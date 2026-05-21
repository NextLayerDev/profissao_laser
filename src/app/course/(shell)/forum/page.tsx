'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { ForumBoardList } from '@/components/forum/forum-board-list';

export default function ForumBoardListPage() {
	return (
		<div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
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

			<ForumBoardList />
		</div>
	);
}
