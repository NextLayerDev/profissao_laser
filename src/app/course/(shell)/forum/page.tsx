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
		<div className="p-4 md:p-8 max-w-[1400px] mx-auto">
			{/* Hero Banner */}
			<section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 via-pink-700 to-fuchsia-800 p-6 md:p-10 mb-8">
				<div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
				<div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-400/20 rounded-full blur-3xl animate-pulse" />
				<div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
				<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-400/50 to-transparent" />
				<div className="relative z-10 flex items-center gap-4">
					<div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
						<MessagesSquare className="w-7 h-7 text-white" />
					</div>
					<div>
						<h2 className="text-2xl md:text-3xl font-black text-white">
							Fórum
						</h2>
						<p className="mt-1 text-rose-200 text-sm md:text-base">
							Troque experiências e tire dúvidas com a comunidade.
						</p>
					</div>
				</div>
			</section>

			<ForumTab currentUserId={customerId} />
		</div>
	);
}
