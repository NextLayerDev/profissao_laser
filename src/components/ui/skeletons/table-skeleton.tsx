import { Skeleton } from '@/components/ui/skeleton';

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Skeleton className="w-1 h-10 rounded-full" />
				<Skeleton className="w-10 h-10 rounded-lg" />
				<div className="space-y-2">
					<Skeleton className="h-5 w-36" />
					<Skeleton className="h-3 w-64" />
				</div>
			</div>
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-5"
					>
						<Skeleton className="w-10 h-10 rounded-xl mb-3" />
						<Skeleton className="h-6 w-16 mb-1" />
						<Skeleton className="h-3 w-20" />
					</div>
				))}
			</div>
			<div className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg">
				<Skeleton className="h-9 w-28 rounded-lg" />
				<Skeleton className="h-9 w-28 rounded-lg" />
				<Skeleton className="h-9 w-28 rounded-lg" />
				<div className="flex-1" />
				<Skeleton className="h-9 w-48 rounded-lg" />
			</div>
			<div className="border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden">
				<div className="bg-slate-50 dark:bg-white/5 px-4 py-3 flex gap-4">
					{Array.from({ length: 7 }).map((_, i) => (
						<Skeleton key={i} className="h-4 w-20" />
					))}
				</div>
				{Array.from({ length: rows }).map((_, i) => (
					<div
						key={i}
						className="px-4 py-3 flex gap-4 border-t border-slate-100 dark:border-white/5"
					>
						{Array.from({ length: 7 }).map((_, j) => (
							<Skeleton key={j} className="h-4 w-16" />
						))}
					</div>
				))}
			</div>
		</div>
	);
}
