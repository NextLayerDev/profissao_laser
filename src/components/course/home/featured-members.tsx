'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useFeaturedMembers } from '@/hooks/use-community';

const GRADIENTS = [
	'from-violet-500 to-fuchsia-500',
	'from-blue-500 to-cyan-500',
	'from-emerald-500 to-teal-500',
	'from-pink-500 to-rose-500',
];

function getInitials(name: string): string {
	return name
		.split(' ')
		.slice(0, 2)
		.map((w) => w[0])
		.join('')
		.toUpperCase();
}

export function FeaturedMembers() {
	const { data: members, isLoading } = useFeaturedMembers();

	return (
		<section className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/5 rounded-2xl p-6">
			<div className="flex justify-between items-center mb-5">
				<h3 className="text-lg font-bold text-slate-900 dark:text-white">
					Membros em Destaque
				</h3>
				<Link
					href="/course/membros"
					className="text-violet-600 dark:text-violet-400 hover:text-violet-500 text-sm font-medium transition-colors"
				>
					Ver todos
				</Link>
			</div>

			<div className="grid grid-cols-2 gap-3">
				{isLoading ? (
					Array.from({ length: 4 }).map((_, i) => (
						<div
							key={`skeleton-${i}`}
							className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5"
						>
							<div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse shrink-0" />
							<div className="flex-1 space-y-1.5">
								<div className="h-4 bg-slate-200 dark:bg-white/10 rounded animate-pulse w-3/4" />
								<div className="h-3 bg-slate-200 dark:bg-white/10 rounded animate-pulse w-1/2" />
							</div>
						</div>
					))
				) : !members?.length ? (
					<p className="col-span-2 text-sm text-slate-400 dark:text-gray-500 text-center py-4">
						Nenhum membro em destaque
					</p>
				) : (
					members.slice(0, 4).map((member, i) => (
						<div
							key={member.id}
							className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5"
						>
							{member.image ? (
								<img
									src={member.image}
									alt={member.name}
									className="w-10 h-10 rounded-full object-cover shrink-0"
								/>
							) : (
								<div
									className={`w-10 h-10 rounded-full bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}
								>
									{getInitials(member.name)}
								</div>
							)}
							<div className="min-w-0">
								<p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
									{member.name}
								</p>
								<span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400">
									{member.badge ?? member.featuredRole ?? 'Destaque'}
								</span>
							</div>
						</div>
					))
				)}
			</div>

			{/* Banner motivacional with background image */}
			<div className="relative mt-5 rounded-xl overflow-hidden">
				<Image
					src="/img/NETWORK.jpeg"
					alt=""
					aria-hidden
					fill
					className="object-cover"
				/>
				<div className="absolute inset-0 bg-gradient-to-r from-violet-900/80 via-purple-900/75 to-fuchsia-900/80" />
				<div className="relative p-4 text-center">
					<p className="text-sm font-medium text-white/90">
						Participe, colabore e cresca junto!
					</p>
				</div>
			</div>
		</section>
	);
}
