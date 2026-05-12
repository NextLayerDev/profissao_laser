import { Skeleton } from '@/components/ui/skeleton';

export function CardGridSkeleton({
	count = 8,
	cols = 4,
}: {
	count?: number;
	cols?: number;
}) {
	const gridClass =
		cols === 6
			? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
			: cols === 3
				? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
				: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';

	return (
		<div className="p-4 md:p-8">
			<div className="flex items-center gap-4 mb-8">
				<Skeleton className="w-1 h-10 rounded-full" />
				<Skeleton className="w-10 h-10 rounded-lg" />
				<div className="space-y-2">
					<Skeleton className="h-5 w-40" />
					<Skeleton className="h-3 w-56" />
				</div>
			</div>
			<div className="flex items-center gap-3 mb-6">
				<Skeleton className="h-9 w-64 rounded-lg" />
				<Skeleton className="h-9 w-24 rounded-lg" />
			</div>
			<div className={`grid ${gridClass} gap-4`}>
				{Array.from({ length: count }).map((_, i) => (
					<div
						key={i}
						className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden"
					>
						<Skeleton className="aspect-square w-full rounded-none" />
						<div className="p-3 space-y-2">
							<Skeleton className="h-4 w-3/4" />
							<Skeleton className="h-3 w-1/2" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
