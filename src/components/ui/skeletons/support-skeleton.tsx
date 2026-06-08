import { Skeleton } from '@/components/ui/skeleton';

export function SupportSkeleton() {
	return (
		<div className="px-4 py-6 md:px-8 md:py-10 space-y-8">
			<Skeleton className="h-40 w-full rounded-xl" />
			<div className="grid grid-cols-3 gap-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<div
						key={i}
						className="p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-center"
					>
						<Skeleton className="h-8 w-12 mx-auto mb-2" />
						<Skeleton className="h-3 w-16 mx-auto" />
					</div>
				))}
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className="p-5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg"
					>
						<Skeleton className="w-11 h-11 rounded-xl mb-3" />
						<Skeleton className="h-4 w-28 mb-1" />
						<Skeleton className="h-3 w-40" />
					</div>
				))}
			</div>
			<div className="space-y-3">
				<Skeleton className="h-5 w-32" />
				{Array.from({ length: 3 }).map((_, i) => (
					<div
						key={i}
						className="p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg flex items-center gap-4"
					>
						<Skeleton className="h-4 w-12" />
						<Skeleton className="h-5 w-16 rounded-full" />
						<Skeleton className="h-4 w-32 flex-1" />
						<Skeleton className="h-3 w-20" />
					</div>
				))}
			</div>
		</div>
	);
}
