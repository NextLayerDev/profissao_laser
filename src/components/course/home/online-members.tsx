'use client';

import Link from 'next/link';
import { useOnlineMembers } from '@/hooks/use-community';

const AVATAR_GRADIENTS = [
	'linear-gradient(135deg, #8b5cf6, #d946ef)',
	'linear-gradient(135deg, #3b82f6, #06b6d4)',
	'linear-gradient(135deg, #ec4899, #f43f5e)',
	'linear-gradient(135deg, #10b981, #14b8a6)',
	'linear-gradient(135deg, #f59e0b, #ef4444)',
];

function getInitials(name: string): string {
	return name
		.split(' ')
		.slice(0, 2)
		.map((w) => w[0])
		.join('')
		.toUpperCase();
}

export function OnlineMembers() {
	const { data: members, isLoading } = useOnlineMembers();

	const displayed = members?.slice(0, 5) ?? [];
	const total = members?.length ?? 0;
	const extra = Math.max(0, total - 5);

	return (
		<div className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<span className="relative flex h-2.5 w-2.5">
						<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
						<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
					</span>
					<h3 className="text-sm font-bold text-slate-900 dark:text-white">
						Membros online agora
					</h3>
				</div>
				<Link
					href="/course/membros"
					className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-600 font-medium transition-colors"
				>
					Ver todos
				</Link>
			</div>

			{isLoading ? (
				<div className="flex items-center gap-3">
					<div className="flex -space-x-2">
						{Array.from({ length: 5 }).map((_, i) => (
							<div
								key={`skeleton-${i}`}
								className="w-9 h-9 rounded-full bg-slate-200 dark:bg-white/10 border-2 border-white dark:border-[#12121a] animate-pulse"
							/>
						))}
					</div>
				</div>
			) : !members?.length ? (
				<p className="text-xs text-slate-400 dark:text-gray-500">
					Nenhum membro online
				</p>
			) : (
				<div className="flex items-center gap-3">
					<div className="flex -space-x-2">
						{displayed.map((member, i) => (
							<div
								key={member.id}
								className="w-9 h-9 rounded-full border-2 border-white dark:border-[#12121a] flex items-center justify-center text-[11px] font-bold text-white shrink-0 overflow-hidden"
								style={
									member.image
										? undefined
										: {
												background:
													AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length],
											}
								}
							>
								{member.image ? (
									<img
										src={member.image}
										alt={member.name}
										className="w-full h-full object-cover"
									/>
								) : (
									getInitials(member.name)
								)}
							</div>
						))}
					</div>
					{extra > 0 && (
						<span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">
							+{extra}
						</span>
					)}
				</div>
			)}
		</div>
	);
}
