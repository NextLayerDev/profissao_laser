'use client';

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from 'react';

interface AntifraudContextValue {
	/** Mostra a marca d'água apenas durante impressão ou gravação (quando detectável) */
	showWatermark: boolean;
	setShowWatermark: (show: boolean) => void;
}

const AntifraudContext = createContext<AntifraudContextValue | null>(null);

export function AntifraudProvider({ children }: { children: ReactNode }) {
	const [showWatermark, setShowWatermark] = useState(false);

	const setShow = useCallback((show: boolean) => {
		setShowWatermark(show);
	}, []);

	return (
		<AntifraudContext.Provider
			value={{ showWatermark, setShowWatermark: setShow }}
		>
			{children}
		</AntifraudContext.Provider>
	);
}

export function useAntifraud(): AntifraudContextValue | null {
	return useContext(AntifraudContext);
}
