'use client';

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';

/**
 * Provider + contexto do COMMAND PALETTE global (⌘K / Ctrl+K). Mora um por shell
 * (admin vs course) e carrega o público fixo daquela superfície — o palette
 * consome `useToolCatalog(audience)` lá dentro. Aqui só guardamos o estado
 * aberto/fechado, expomos `open()/close()/toggle()` e registramos o atalho
 * global de teclado (uma vez, no provider).
 *
 * O `audience` é fixo por shell (regra dos hooks do catálogo): admin no
 * admin-layout-wrapper, student no course (shell) layout.
 */

export type PaletteAudience = 'admin' | 'student';

interface CommandPaletteContextValue {
	audience: PaletteAudience;
	isOpen: boolean;
	open: () => void;
	close: () => void;
	toggle: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
	null,
);

function isEditableTarget(el: EventTarget | null): boolean {
	if (!(el instanceof HTMLElement)) return false;
	const tag = el.tagName;
	return (
		tag === 'INPUT' ||
		tag === 'TEXTAREA' ||
		tag === 'SELECT' ||
		el.isContentEditable
	);
}

export function CommandPaletteProvider({
	audience,
	children,
}: {
	audience: PaletteAudience;
	children: React.ReactNode;
}) {
	const [isOpen, setIsOpen] = useState(false);

	const open = useCallback(() => setIsOpen(true), []);
	const close = useCallback(() => setIsOpen(false), []);
	const toggle = useCallback(() => setIsOpen((v) => !v), []);

	// Atalho global ⌘K / Ctrl+K — registrado uma única vez por shell.
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			const isCmdK =
				(e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K');
			if (isCmdK) {
				e.preventDefault();
				setIsOpen((v) => !v);
				return;
			}
			// `/` abre o palette quando o foco não está num campo de texto.
			if (e.key === '/' && !isEditableTarget(e.target)) {
				e.preventDefault();
				setIsOpen(true);
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, []);

	const value = useMemo<CommandPaletteContextValue>(
		() => ({ audience, isOpen, open, close, toggle }),
		[audience, isOpen, open, close, toggle],
	);

	return (
		<CommandPaletteContext.Provider value={value}>
			{children}
		</CommandPaletteContext.Provider>
	);
}

/**
 * Acessa o palette do shell atual. Fora de um `CommandPaletteProvider` devolve
 * um no-op seguro (ex.: páginas sem shell), pra `open()` nunca quebrar render.
 */
export function useCommandPalette(): CommandPaletteContextValue {
	const ctx = useContext(CommandPaletteContext);
	if (!ctx) {
		return {
			audience: 'student',
			isOpen: false,
			open: () => {},
			close: () => {},
			toggle: () => {},
		};
	}
	return ctx;
}
