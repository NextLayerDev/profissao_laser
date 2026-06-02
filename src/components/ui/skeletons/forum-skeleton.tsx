import { Skeleton } from '@/components/ui/skeleton';

const row =
	'flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5';

/** Skeleton da lista de categorias do fórum (board). */
export function ForumBoardSkeleton({ count = 5 }: { count?: number }) {
	return (
		<div className="space-y-3">
			{Array.from({ length: count }).map((_, i) => (
				<div key={i} className={row}>
					<Skeleton className="h-10 w-10 rounded-xl" />
					<div className="flex-1 space-y-1.5">
						<Skeleton className="h-4 w-40" />
						<Skeleton className="h-3 w-56" />
					</div>
					<Skeleton className="h-4 w-10" />
				</div>
			))}
		</div>
	);
}

/** Skeleton de uma lista de posts/discussões do fórum. */
export function ForumListSkeleton({ count = 6 }: { count?: number }) {
	return (
		<div className="space-y-3">
			{Array.from({ length: count }).map((_, i) => (
				<div key={i} className={row}>
					<Skeleton className="h-9 w-9 rounded-full" />
					<div className="flex-1 space-y-1.5">
						<Skeleton className="h-4 w-2/3" />
						<Skeleton className="h-3 w-1/3" />
					</div>
					<Skeleton className="h-5 w-12 rounded-full" />
				</div>
			))}
		</div>
	);
}

/** Skeleton do detalhe de uma discussão (post principal + respostas). */
export function ForumThreadDetailSkeleton() {
	return (
		<div className="space-y-4">
			<Skeleton className="h-4 w-40" />
			{/* post principal */}
			<div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
				<div className="flex items-center gap-3 mb-4">
					<Skeleton className="h-10 w-10 rounded-full" />
					<div className="space-y-1.5">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-3 w-20" />
					</div>
				</div>
				<Skeleton className="h-5 w-3/4 mb-3" />
				<div className="space-y-2">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-2/3" />
				</div>
			</div>
			{/* respostas */}
			{Array.from({ length: 2 }).map((_, i) => (
				<div
					key={i}
					className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5"
				>
					<div className="flex items-center gap-3 mb-3">
						<Skeleton className="h-8 w-8 rounded-full" />
						<Skeleton className="h-3 w-24" />
					</div>
					<Skeleton className="h-4 w-full mb-1.5" />
					<Skeleton className="h-4 w-1/2" />
				</div>
			))}
		</div>
	);
}
