import { Skeleton } from '@/components/ui/skeleton';

export function SubscriptionSkeleton() {
	return (
		<div className="px-6 py-8 space-y-6">
			<div className="flex items-center gap-4 mb-8">
				<Skeleton className="w-1 h-10 rounded-full" />
				<Skeleton className="w-10 h-10 rounded-lg" />
				<div className="space-y-2">
					<Skeleton className="h-5 w-36" />
					<Skeleton className="h-3 w-56" />
				</div>
			</div>
			<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-6 space-y-5">
				<div className="flex items-center gap-3">
					<Skeleton className="w-10 h-10 rounded-lg" />
					<div className="space-y-1.5">
						<Skeleton className="h-3 w-16" />
						<Skeleton className="h-5 w-32" />
					</div>
					<div className="flex-1" />
					<Skeleton className="h-6 w-20 rounded-full" />
				</div>
				<Skeleton className="h-8 w-40 ml-[52px]" />
				<Skeleton className="h-3 w-48 ml-[52px]" />
			</div>
			<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden">
				<div className="p-6 flex items-center gap-3">
					<Skeleton className="w-10 h-10 rounded-lg" />
					<div className="space-y-1.5">
						<Skeleton className="h-5 w-28" />
						<Skeleton className="h-3 w-56" />
					</div>
				</div>
				<div className="px-6 flex gap-4 border-b border-slate-200 dark:border-white/10">
					<Skeleton className="h-8 w-24" />
					<Skeleton className="h-8 w-24" />
				</div>
				<div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							key={i}
							className="border border-slate-200 dark:border-white/10 rounded-lg p-5 space-y-4"
						>
							<Skeleton className="h-5 w-20 rounded-full" />
							<Skeleton className="h-5 w-32" />
							<Skeleton className="h-7 w-24" />
							<div className="space-y-2">
								{Array.from({ length: 5 }).map((_, j) => (
									<Skeleton key={j} className="h-3 w-full" />
								))}
							</div>
							<Skeleton className="h-10 w-full rounded-lg" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
