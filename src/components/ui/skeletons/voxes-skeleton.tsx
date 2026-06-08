import { Skeleton } from '@/components/ui/skeleton';

/** Skeleton dos cards de pacotes de Voxxys. */
export function VoxesPackagesSkeleton({ count = 3 }: { count?: number }) {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{Array.from({ length: count }).map((_, i) => (
				<div
					key={i}
					className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5"
				>
					<Skeleton className="h-5 w-24 mb-3" />
					<Skeleton className="h-8 w-32 mb-2" />
					<Skeleton className="h-3 w-40 mb-5" />
					<Skeleton className="h-10 w-full rounded-xl" />
				</div>
			))}
		</div>
	);
}

/** Skeleton do extrato (histórico) de Voxxys — encaixa dentro do painel. */
export function VoxesHistorySkeleton({ count = 6 }: { count?: number }) {
	return (
		<div className="divide-y divide-slate-100 dark:divide-white/5">
			{Array.from({ length: count }).map((_, i) => (
				<div key={i} className="flex items-center gap-4 px-4 py-3.5">
					<Skeleton className="h-9 w-9 rounded-lg" />
					<div className="flex-1 space-y-1.5">
						<Skeleton className="h-4 w-40" />
						<Skeleton className="h-3 w-24" />
					</div>
					<Skeleton className="h-5 w-16" />
				</div>
			))}
		</div>
	);
}
