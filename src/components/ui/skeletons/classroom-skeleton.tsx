import { Skeleton } from '@/components/ui/skeleton';

export function ClassroomSkeleton() {
	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] flex flex-col">
			<div className="h-14 border-b border-slate-200 dark:border-white/6 px-5 flex items-center gap-4">
				<Skeleton className="h-4 w-14" />
				<Skeleton className="w-px h-6" />
				<Skeleton className="w-8 h-8 rounded-lg" />
				<div className="space-y-1">
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-3 w-20" />
				</div>
				<div className="flex-1" />
				<Skeleton className="h-8 w-28 rounded-xl" />
				<Skeleton className="h-8 w-24 rounded-full" />
			</div>
			<div className="flex flex-1 overflow-hidden">
				<div className="flex-1 flex flex-col min-w-0">
					<Skeleton className="aspect-video w-full rounded-none" />
					<div className="px-6 py-4 flex items-center gap-4 border-b border-slate-200 dark:border-white/10">
						<Skeleton className="h-8 w-20" />
						<Skeleton className="h-8 w-20" />
						<Skeleton className="h-8 w-16" />
						<div className="flex-1" />
						<Skeleton className="h-8 w-40 rounded-full" />
					</div>
					<div className="p-6">
						<Skeleton className="h-64 w-full rounded-xl" />
					</div>
				</div>
				<div className="w-72 xl:w-[380px] border-l border-slate-200 dark:border-white/6 flex flex-col">
					<div className="p-4 border-b border-slate-200 dark:border-white/10">
						<Skeleton className="h-16 w-full rounded-xl" />
					</div>
					<div className="p-4 border-b border-slate-200 dark:border-white/10">
						<Skeleton className="h-9 w-full rounded-xl" />
					</div>
					<div className="flex-1 overflow-hidden">
						{Array.from({ length: 3 }).map((_, m) => (
							<div key={m}>
								<div className="px-4 py-3 border-b border-slate-200 dark:border-white/6 flex items-center gap-2">
									<Skeleton className="w-8 h-8 rounded-lg" />
									<Skeleton className="h-4 w-28" />
									<div className="flex-1" />
									<Skeleton className="h-4 w-12 rounded-full" />
								</div>
								{Array.from({ length: 4 }).map((_, l) => (
									<div
										key={l}
										className="px-4 py-3 border-b border-slate-100 dark:border-white/5 flex items-center gap-3"
									>
										<Skeleton className="w-7 h-7 rounded-full" />
										<Skeleton className="h-4 w-40 flex-1" />
									</div>
								))}
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
