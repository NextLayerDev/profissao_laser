interface SectionHeaderProps {
	title: string;
	action?: React.ReactNode;
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
	return (
		<div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-white/10">
			<h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
				{title}
			</h2>
			{action}
		</div>
	);
}
