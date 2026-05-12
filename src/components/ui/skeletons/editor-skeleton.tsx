import { Skeleton } from '@/components/ui/skeleton';

export function EditorSkeleton() {
	return (
		<div className="flex h-[calc(100vh-8rem)]">
			<div className="w-14 border-r border-slate-200 dark:border-white/10 p-2 space-y-2">
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={i} className="w-10 h-10 rounded-lg" />
				))}
			</div>
			<div className="flex-1 flex flex-col">
				<div className="h-12 border-b border-slate-200 dark:border-white/10 px-4 flex items-center gap-3">
					<Skeleton className="h-8 w-24 rounded-lg" />
					<Skeleton className="h-8 w-24 rounded-lg" />
					<div className="flex-1" />
					<Skeleton className="h-8 w-32 rounded-lg" />
				</div>
				<div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-white/[0.02]">
					<Skeleton className="w-[600px] h-[400px] rounded-lg" />
				</div>
			</div>
			<div className="w-72 border-l border-slate-200 dark:border-white/10 p-4 space-y-4">
				<Skeleton className="h-5 w-24" />
				<Skeleton className="h-32 w-full rounded-lg" />
				<Skeleton className="h-9 w-full rounded-lg" />
				<Skeleton className="h-9 w-full rounded-lg" />
			</div>
		</div>
	);
}
