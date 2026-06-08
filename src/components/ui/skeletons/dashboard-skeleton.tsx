import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
	return (
		<div className="flex-1 p-6 md:p-8">
			<div className="">
				<Skeleton className="h-48 w-full rounded-2xl mb-8" />
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 mb-8">
					{Array.from({ length: 10 }).map((_, i) => (
						<Skeleton key={i} className="h-20 rounded-lg" />
					))}
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2 space-y-6">
						<Skeleton className="h-64 w-full rounded-xl" />
						<div className="grid grid-cols-2 gap-4">
							<Skeleton className="h-40 rounded-xl" />
							<Skeleton className="h-40 rounded-xl" />
						</div>
						<Skeleton className="h-48 w-full rounded-xl" />
					</div>
					<div className="space-y-4">
						<Skeleton className="h-32 w-full rounded-xl" />
						<Skeleton className="h-48 w-full rounded-xl" />
						<Skeleton className="h-36 w-full rounded-xl" />
					</div>
				</div>
			</div>
		</div>
	);
}
