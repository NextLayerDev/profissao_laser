'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';

export function ThemeToggle() {
	const { theme, toggleTheme } = useTheme();

	return (
		<button
			type="button"
			onClick={toggleTheme}
			className="h-9 w-9 flex items-center justify-center rounded-lg bg-linear-to-br from-slate-100 to-slate-200 dark:from-white/8 dark:to-white/3 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:from-blue-50 hover:to-slate-100 dark:hover:from-white/12 dark:hover:to-white/6 shadow-sm dark:shadow-none transition-all duration-200"
			aria-label={
				theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'
			}
		>
			{theme === 'dark' ? (
				<Sun className="h-5 w-5" />
			) : (
				<Moon className="h-5 w-5" />
			)}
		</button>
	);
}
