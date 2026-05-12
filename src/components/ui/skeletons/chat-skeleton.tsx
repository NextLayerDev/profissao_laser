import { Skeleton } from '@/components/ui/skeleton';

export function ChatSkeleton() {
	return (
		<div className="flex h-[calc(100vh-8rem)]">
			<div className="w-64 border-r border-slate-200 dark:border-white/10 p-4 space-y-2">
				<Skeleton className="h-5 w-20 mb-4" />
				<Skeleton className="h-9 w-full rounded-lg mb-3" />
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="flex items-center gap-3 p-2">
						<Skeleton className="w-3 h-3 rounded-full" />
						<Skeleton className="h-4 w-24" />
					</div>
				))}
			</div>
			<div className="flex-1 flex flex-col">
				<div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center gap-3">
					<Skeleton className="h-5 w-32" />
				</div>
				<div className="flex-1 p-4 space-y-4">
					{Array.from({ length: 5 }).map((_, i) => (
						<div
							key={i}
							className={`flex gap-3 ${i % 3 === 0 ? 'justify-end' : ''}`}
						>
							{i % 3 !== 0 && (
								<Skeleton className="w-8 h-8 rounded-full shrink-0" />
							)}
							<div className="space-y-1.5 max-w-[60%]">
								<Skeleton className="h-3 w-16" />
								<Skeleton
									className={`h-16 rounded-lg ${i % 3 === 0 ? 'w-48' : 'w-64'}`}
								/>
							</div>
						</div>
					))}
				</div>
				<div className="p-4 border-t border-slate-200 dark:border-white/10">
					<Skeleton className="h-10 w-full rounded-lg" />
				</div>
			</div>
		</div>
	);
}
