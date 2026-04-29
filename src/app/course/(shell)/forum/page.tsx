'use client';

import { MessagesSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ForumTab } from '@/components/duvidas/forum-tab';
import { getCurrentUser } from '@/lib/auth';

export default function ForumCoursePage() {
	const [customerId, setCustomerId] = useState('customer-1');

	useEffect(() => {
		const user = getCurrentUser();
		setCustomerId(user?.sub ?? 'customer-1');
	}, []);

	return (
		<div className="p-4 md:p-8 max-w-4xl mx-auto">
			<div className="mb-6 flex items-center gap-3">
				<div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg p-2">
					<MessagesSquare className="w-5 h-5 text-white" />
				</div>
				<div>
					<h2 className="text-2xl font-black text-slate-900 dark:text-white">
						Fórum
					</h2>
					<p className="text-slate-500 dark:text-gray-500 text-sm">
						Troque experiências e tire dúvidas com a comunidade.
					</p>
				</div>
			</div>

			<ForumTab currentUserId={customerId} />
		</div>
	);
}
