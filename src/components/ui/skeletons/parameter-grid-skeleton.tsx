import { Skeleton } from '@/components/ui/skeleton';

/** Skeleton do grid de parâmetros (espelha o ParameterGridCard). */
export function ParameterGridSkeleton({ count = 6 }: { count?: number }) {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
			{Array.from({ length: count }).map((_, i) => (
				<div
					key={i}
					className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0e0e10]"
				>
					<div className="flex gap-4 p-4">
						{/* imagem alta à esquerda */}
						<Skeleton className="w-32 sm:w-44 shrink-0 self-stretch min-h-[240px] rounded-xl" />
						{/* conteúdo */}
						<div className="flex min-w-0 flex-1 flex-col gap-3">
							<Skeleton className="h-5 w-3/4" />
							<Skeleton className="h-4 w-1/2" />
							<div className="flex gap-1.5">
								<Skeleton className="h-5 w-16 rounded-md" />
								<Skeleton className="h-5 w-14 rounded-md" />
							</div>
							<div className="grid grid-cols-3 gap-x-3 gap-y-3 pt-1">
								{Array.from({ length: 9 }).map((__, j) => (
									<div key={j} className="space-y-1">
										<Skeleton className="h-2.5 w-12" />
										<Skeleton className="h-4 w-10" />
									</div>
								))}
							</div>
						</div>
					</div>
					{/* footer */}
					<div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 dark:border-white/5">
						<div className="flex items-center gap-2">
							<Skeleton className="h-8 w-8 rounded-full" />
							<div className="space-y-1">
								<Skeleton className="h-3 w-24" />
								<Skeleton className="h-2.5 w-16" />
							</div>
						</div>
						<Skeleton className="h-8 w-24 rounded-lg" />
					</div>
				</div>
			))}
		</div>
	);
}
