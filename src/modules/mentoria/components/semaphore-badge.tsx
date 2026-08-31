import type { Semaphore } from '../types';

const STYLES: Record<Semaphore, { dot: string; label: string; text: string }> = {
	green: { dot: 'bg-emerald-500', label: 'Saudável', text: 'text-emerald-600 dark:text-emerald-400' },
	yellow: { dot: 'bg-amber-500', label: 'Atenção', text: 'text-amber-600 dark:text-amber-400' },
	red: { dot: 'bg-red-500', label: 'Crítico', text: 'text-red-600 dark:text-red-400' },
	unmeasured: { dot: 'bg-slate-300 dark:bg-gray-600', label: 'Não medido', text: 'text-slate-500 dark:text-gray-400' },
};

/** Semáforo do indicador: 🟢 Saudável / 🟡 Atenção / 🔴 Crítico / ⚪ Não medido. */
export function SemaphoreBadge({
	value,
	compact = false,
}: {
	value: Semaphore;
	compact?: boolean;
}) {
	const style = STYLES[value];
	return (
		<span className={`inline-flex items-center gap-1.5 text-xs ${style.text}`}>
			<span className={`w-2 h-2 rounded-full ${style.dot}`} />
			{!compact && style.label}
		</span>
	);
}
