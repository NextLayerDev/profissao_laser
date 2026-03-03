'use client';

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react';
import { THEME_DARK, THEME_LIGHT, type Theme } from '@/theme/constants';

const STORAGE_KEY = 'profissao-laser-theme';

interface ThemeContextValue {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	toggleTheme: () => void;
	themeClasses: typeof THEME_LIGHT | typeof THEME_DARK;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredTheme(): Theme {
	if (typeof window === 'undefined') return 'dark';
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === 'light' || stored === 'dark') return stored;
	return 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<Theme>('dark');
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setThemeState(getStoredTheme());
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!mounted) return;
		const root = document.documentElement;
		if (theme === 'dark') {
			root.classList.add('dark');
		} else {
			root.classList.remove('dark');
		}
		localStorage.setItem(STORAGE_KEY, theme);
	}, [theme, mounted]);

	const setTheme = useCallback((newTheme: Theme) => {
		setThemeState(newTheme);
	}, []);

	const toggleTheme = useCallback(() => {
		setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
	}, []);

	const themeClasses = theme === 'dark' ? THEME_DARK : THEME_LIGHT;

	return (
		<ThemeContext.Provider
			value={{ theme, setTheme, toggleTheme, themeClasses }}
		>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme(): ThemeContextValue {
	const ctx = useContext(ThemeContext);
	if (!ctx) {
		throw new Error('useTheme must be used within ThemeProvider');
	}
	return ctx;
}
