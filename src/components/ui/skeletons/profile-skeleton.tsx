import { Skeleton } from '@/components/ui/skeleton';

const card =
	'bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl p-6';

/** Skeleton da página de Perfil (banner+avatar → ícones → infos → senha). */
export function ProfileSkeleton() {
	return (
		<div className="space-y-6">
			{/* Hero / banner com avatar */}
			<div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d]">
				<Skeleton className="h-28 sm:h-36 w-full rounded-none" />
				<div className="px-6 pb-6">
					<div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14 sm:-mt-16">
						<Skeleton className="w-28 h-28 rounded-2xl border-4 border-white dark:border-[#1a1a1d]" />
						<div className="flex-1 space-y-2 sm:pb-2">
							<Skeleton className="h-6 w-48" />
							<Skeleton className="h-4 w-64" />
						</div>
					</div>
				</div>
			</div>

			{/* Card de ícones de perfil */}
			<div className={card}>
				<Skeleton className="h-5 w-40 mb-4" />
				<div className="flex flex-wrap gap-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} className="w-16 h-16 rounded-2xl" />
					))}
				</div>
			</div>

			{/* Card de informações */}
			<div className={card}>
				<Skeleton className="h-5 w-32 mb-4" />
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="space-y-1.5">
							<Skeleton className="h-3 w-24" />
							<Skeleton className="h-10 w-full rounded-xl" />
						</div>
					))}
				</div>
				<div className="mt-4 space-y-1.5">
					<Skeleton className="h-3 w-16" />
					<Skeleton className="h-20 w-full rounded-xl" />
				</div>
			</div>

			{/* Card de senha */}
			<div className={card}>
				<Skeleton className="h-5 w-36 mb-4" />
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-10 w-full rounded-xl" />
					))}
				</div>
			</div>
		</div>
	);
}
