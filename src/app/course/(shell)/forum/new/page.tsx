'use client';

import { Suspense } from 'react';
import { ForumNewThreadForm } from '@/components/forum/forum-new-thread-form';

export default function ForumNewThreadPage() {
	return (
		<div className="p-4 md:p-8">
			<Suspense
				fallback={<div className="text-sm text-slate-500">Carregando…</div>}
			>
				<ForumNewThreadForm />
			</Suspense>
		</div>
	);
}
