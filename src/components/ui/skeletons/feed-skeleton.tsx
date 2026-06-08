import { Skeleton } from '@/components/ui/skeleton';

/** Skeleton do feed da comunidade (cards de projeto na home/vitrine). */
export function FeedCardsSkeleton({ count = 3 }: { count?: number }) {
	return (
		<div className="space-y-4">
			{Array.from({ length: count }).map((_, i) => (
				<div
					key={i}
					className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#1a1a1d]"
				>
					{/* autor */}
					<div className="flex items-center gap-3 p-3">
						<Skeleton className="h-9 w-9 rounded-full" />
						<div className="space-y-1.5">
							<Skeleton className="h-3.5 w-28" />
							<Skeleton className="h-3 w-20" />
						</div>
					</div>
					{/* imagem */}
					<Skeleton className="h-72 w-full rounded-none" />
					{/* conteúdo */}
					<div className="space-y-2 px-3 py-2.5">
						<Skeleton className="h-4 w-1/2" />
						<Skeleton className="h-3 w-3/4" />
						<div className="flex gap-3 pt-1">
							<Skeleton className="h-4 w-12" />
							<Skeleton className="h-4 w-12" />
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
