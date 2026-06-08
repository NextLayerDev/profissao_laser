import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatCardProps {
	value: string | number;
	label: string;
	icon?: LucideIcon;
	/**
	 * Ícone customizado (ex.: `<VoxxysIcon />`) renderizado no lugar de `icon`
	 * quando o ícone não é um `LucideIcon`. Tem precedência sobre `icon`.
	 */
	renderIcon?: ReactNode;
	color?: string;
}

export function StatCard({
	value,
	label,
	icon: Icon,
	renderIcon,
	color,
}: StatCardProps) {
	const hasIcon = !!renderIcon || !!Icon;
	return (
		<div className="flex items-center gap-4 p-4 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-lg">
			{hasIcon && (
				<div
					className={`w-10 h-10 rounded-lg flex items-center justify-center ${color || 'bg-violet-500/10 text-violet-600 dark:text-violet-400'}`}
				>
					{renderIcon ?? (Icon ? <Icon className="w-5 h-5" /> : null)}
				</div>
			)}
			<div>
				<p className="font-mono text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
					{value}
				</p>
				<p className="text-slate-500 dark:text-gray-400 text-sm">{label}</p>
			</div>
		</div>
	);
}
