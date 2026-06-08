import { Skeleton } from '@/components/ui/skeleton';

export function WizardSkeleton() {
	return (
		<div className="p-4 md:p-8 space-y-8">
			<div className="flex items-center gap-4">
				<Skeleton className="w-1 h-10 rounded-full" />
				<Skeleton className="w-10 h-10 rounded-lg" />
				<div className="space-y-2">
					<Skeleton className="h-5 w-36" />
					<Skeleton className="h-3 w-56" />
				</div>
			</div>
			<div className="flex items-center gap-2">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="flex items-center gap-2">
						<Skeleton className="w-8 h-8 rounded-full" />
						<Skeleton className="h-3 w-20" />
						{i < 2 && <Skeleton className="h-0.5 w-12" />}
					</div>
				))}
			</div>
			<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-8">
				<div className="flex flex-col items-center justify-center py-12 space-y-4">
					<Skeleton className="w-16 h-16 rounded-2xl" />
					<Skeleton className="h-5 w-48" />
					<Skeleton className="h-3 w-64" />
					<Skeleton className="h-10 w-40 rounded-lg mt-4" />
				</div>
			</div>
		</div>
	);
}
