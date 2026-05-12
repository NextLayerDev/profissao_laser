import { Skeleton } from '@/components/ui/skeleton';

export function CardListSkeleton({ count = 4 }: { count?: number }) {
	return (
		<div className="p-4 md:p-8">
			<div className="flex items-center gap-4 mb-8">
				<Skeleton className="w-1 h-10 rounded-full" />
				<Skeleton className="w-10 h-10 rounded-lg" />
				<div className="space-y-2">
					<Skeleton className="h-5 w-40" />
					<Skeleton className="h-3 w-64" />
				</div>
			</div>
			<div className="space-y-3">
				{Array.from({ length: count }).map((_, i) => (
					<div
						key={i}
						className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-6"
					>
						<div className="flex items-center gap-4">
							<Skeleton className="w-11 h-11 rounded-lg" />
							<div className="flex-1 space-y-2">
								<Skeleton className="h-5 w-48" />
								<Skeleton className="h-3 w-24" />
							</div>
							<Skeleton className="h-9 w-28 rounded-lg" />
						</div>
						<div className="mt-4 space-y-1.5">
							<Skeleton className="h-1.5 w-full rounded-full" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
