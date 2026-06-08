import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
	icon: LucideIcon;
	title: string;
	description?: string;
	action?: {
		label: string;
		onClick: () => void;
	};
}

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
}: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center py-16 px-6 text-center">
			<div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-4">
				<Icon className="w-6 h-6 text-slate-400 dark:text-gray-500" />
			</div>
			<h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
				{title}
			</h3>
			{description && (
				<p className="text-slate-500 dark:text-gray-400 text-sm max-w-xs">
					{description}
				</p>
			)}
			{action && (
				<button
					type="button"
					onClick={action.onClick}
					className="mt-4 px-5 py-2 bg-violet-600 hover:bg-violet-400 text-white font-medium text-sm rounded-lg transition-colors"
				>
					{action.label}
				</button>
			)}
		</div>
	);
}
