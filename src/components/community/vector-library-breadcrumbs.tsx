'use client';

import { ChevronRight } from 'lucide-react';
export type BreadcrumbItem = {
	id: string | null;
	name: string;
};

interface VectorLibraryBreadcrumbsProps {
	items: BreadcrumbItem[];
	onNavigate: (folderId: string | null) => void;
}

export function VectorLibraryBreadcrumbs({
	items,
	onNavigate,
}: VectorLibraryBreadcrumbsProps) {
	return (
		<nav className="flex items-center gap-1 text-sm">
			{items.map((item, i) => (
				<span key={item.id ?? 'root'} className="flex items-center gap-1">
					{i > 0 && (
						<ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
					)}
					<button
						type="button"
						onClick={() => onNavigate(item.id)}
						className={`font-medium truncate max-w-[180px] ${
							i === items.length - 1
								? 'text-slate-900 dark:text-white cursor-default'
								: 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
						}`}
					>
						{item.name}
					</button>
				</span>
			))}
		</nav>
	);
}
