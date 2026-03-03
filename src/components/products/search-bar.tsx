import { Filter, Plus, Search } from 'lucide-react';
import type { SearchBarProps } from '@/types/components/search-bar';

export function SearchBar({ value, onChange, onAddCourse }: SearchBarProps) {
	return (
		<div className="flex items-center gap-4 mb-8">
			<div className="flex-1 relative">
				<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 dark:text-gray-500" />
				<input
					type="text"
					placeholder="Qual produto quer encontrar?"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="w-full bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl py-4 pl-12 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors shadow-sm dark:shadow-none"
				/>
			</div>
			<button
				type="button"
				className="flex items-center gap-2 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl px-6 py-4 text-sm font-medium text-slate-700 dark:text-gray-300 hover:border-slate-300 dark:hover:border-gray-700 transition-colors shadow-sm dark:shadow-none"
			>
				<Filter className="w-4 h-4" />
				Mais filtros
			</button>
			<button
				type="button"
				onClick={onAddCourse}
				className="flex items-center gap-2 bg-violet-600 rounded-xl px-6 py-4 text-sm font-medium hover:bg-violet-700 transition-colors"
			>
				<Plus className="w-4 h-4" />
				Adicionar curso
			</button>
		</div>
	);
}
