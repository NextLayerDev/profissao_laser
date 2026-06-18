'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';
import { StoreCourseCard } from '@/components/store/store-course-card';
import { useCourses } from '@/modules/courses';
import { useEntitlements } from '@/modules/subscriptions';

export function StoreContent() {
	const [search, setSearch] = useState('');
	const { data: courses, isLoading, error } = useCourses();
	const { entitlements } = useEntitlements();

	const currentPlanKey = entitlements?.subscription?.plan?.key ?? null;

	const filtered = (courses ?? [])
		.filter((c) => c.published)
		.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));

	return (
		<>
			<div className="text-center mb-10">
				<h1 className="text-4xl font-bold tracking-tight mb-3 text-slate-900 dark:text-white">
					Transforme sua carreira
				</h1>
				<p className="text-slate-600 dark:text-gray-400 text-lg max-w-xl mx-auto">
					Cursos e mentorias especializados em estética a laser para você
					crescer no mercado.
				</p>
			</div>

			{/* Search */}
			<div className="max-w-md mx-auto mb-8 relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-gray-500" />
				<input
					type="text"
					placeholder="Buscar cursos..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors shadow-sm dark:shadow-none"
				/>
			</div>

			{!isLoading && (
				<div className="mb-6 text-sm text-slate-500 dark:text-gray-500 text-right">
					{filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
				</div>
			)}

			{isLoading ? (
				<div className="animate-pulse space-y-6">
					<div className="flex flex-col gap-8">
						{Array.from({ length: 3 }).map((_, i) => (
							<div
								key={i}
								className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden"
							>
								<div className="h-52 bg-slate-200 dark:bg-white/5" />
								<div className="p-6 space-y-3">
									<div className="h-5 w-48 rounded bg-slate-200 dark:bg-white/5" />
									<div className="h-4 w-full rounded bg-slate-200 dark:bg-white/5" />
									<div className="flex gap-3 mt-4">
										<div className="flex-1 h-40 rounded-lg bg-slate-200 dark:bg-white/5" />
										<div className="flex-1 h-40 rounded-lg bg-slate-200 dark:bg-white/5" />
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			) : error ? (
				<div className="text-center py-20">
					<p className="text-red-400 font-medium">Erro ao carregar os cursos</p>
					<p className="text-slate-500 dark:text-gray-500 text-sm mt-1">
						Tente novamente mais tarde
					</p>
				</div>
			) : filtered.length > 0 ? (
				<div className="flex flex-col gap-8">
					{filtered.map((course) => (
						<StoreCourseCard
							key={course.id}
							course={course}
							currentPlanKey={currentPlanKey}
						/>
					))}
				</div>
			) : (
				<div className="text-center py-20">
					<Search className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
					<p className="text-slate-600 dark:text-gray-400 font-medium">
						Nenhum curso encontrado
					</p>
					<p className="text-slate-500 dark:text-gray-500 text-sm mt-1">
						Tente outro termo ou categoria
					</p>
				</div>
			)}
		</>
	);
}
