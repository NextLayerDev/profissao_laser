import { Skeleton } from '@/components/ui/skeleton';

/** Cards de membro (só os cards — vão dentro do grid já existente do view). */
export function MemberCardsSkeleton({ count = 9 }: { count?: number }) {
	return (
		<>
			{Array.from({ length: count }).map((_, i) => (
				<div
					key={i}
					className="bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl p-6"
				>
					<div className="flex flex-col items-center gap-3">
						<Skeleton className="w-20 h-20 rounded-2xl" />
						<Skeleton className="h-4 w-28" />
						<Skeleton className="h-3 w-20" />
						<div className="flex gap-1.5 pt-1">
							<Skeleton className="h-5 w-12 rounded-full" />
							<Skeleton className="h-5 w-12 rounded-full" />
						</div>
					</div>
				</div>
			))}
		</>
	);
}

/** Cards de projeto da vitrine (só os cards — vão dentro do grid existente). */
export function ProjectCardsSkeleton({ count = 6 }: { count?: number }) {
	return (
		<>
			{Array.from({ length: count }).map((_, i) => (
				<div
					key={i}
					className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden"
				>
					<Skeleton className="aspect-[4/3] w-full rounded-none" />
					<div className="p-4 space-y-2">
						<div className="flex items-center gap-2">
							<Skeleton className="h-8 w-8 rounded-full" />
							<Skeleton className="h-3 w-24" />
						</div>
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-3 w-1/2" />
					</div>
				</div>
			))}
		</>
	);
}
