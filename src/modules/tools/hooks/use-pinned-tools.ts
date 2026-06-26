'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Store de PINS (ferramentas fixadas na sidebar) em `localStorage`, separado por
 * público: o admin e o aluno têm conjuntos próprios. A sidebar mostra só os
 * pinados; o resto vive no hub/⌘K — é assim que escalamos pra infinitas tools
 * sem crescer o menu.
 *
 * SSR-safe: no servidor sempre devolve os `defaults` (nada de `localStorage`),
 * e a leitura real acontece num `useEffect` no cliente (`isReady` vira `true`).
 * Mudanças disparam um evento (`pl-pins` + `storage` nativo entre abas) pra
 * todos os consumidores re-sincronizarem na hora.
 */

type Audience = 'admin' | 'student';

const KEY: Record<Audience, string> = {
	admin: 'pl.pinned.admin',
	student: 'pl.pinned.student',
};

const PINS_EVENT = 'pl-pins';

function read(audience: Audience): string[] | null {
	if (typeof window === 'undefined') return null;
	try {
		const raw = window.localStorage.getItem(KEY[audience]);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return null;
		return parsed.filter((x): x is string => typeof x === 'string');
	} catch {
		return null;
	}
}

function write(audience: Audience, pins: string[]): void {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(KEY[audience], JSON.stringify(pins));
	} catch {
		// note: storage cheio/negado — pins viram efêmeros, sem quebrar a UI.
	}
	// note: notifica esta aba (custom) e as outras (storage nativo é só cross-tab).
	window.dispatchEvent(new CustomEvent(PINS_EVENT, { detail: { audience } }));
}

export interface UsePinnedTools {
	pins: string[];
	isPinned: (key: string) => boolean;
	toggle: (key: string) => void;
	isReady: boolean;
}

/**
 * @param audience qual conjunto de pins (admin vs aluno).
 * @param defaults usado quando NADA foi salvo ainda (usuário novo não fica vazio).
 */
export function usePinnedTools(
	audience: Audience,
	defaults: string[] = [],
): UsePinnedTools {
	const [pins, setPins] = useState<string[]>([]);
	const [isReady, setIsReady] = useState(false);

	// note: `defaults` muda de referência a cada render do caller; comparamos por
	// CONTEÚDO (string estável) pra não re-sincronizar à toa nos efeitos/callbacks.
	const defaultsKey = defaults.join('|');

	useEffect(() => {
		const fallback = defaultsKey ? defaultsKey.split('|') : [];
		const sync = () => {
			const stored = read(audience);
			setPins(stored ?? fallback);
			setIsReady(true);
		};
		sync();
		const onPins = () => sync();
		const onStorage = (e: StorageEvent) => {
			if (e.key === KEY[audience]) sync();
		};
		window.addEventListener(PINS_EVENT, onPins);
		window.addEventListener('storage', onStorage);
		return () => {
			window.removeEventListener(PINS_EVENT, onPins);
			window.removeEventListener('storage', onStorage);
		};
	}, [audience, defaultsKey]);

	const isPinned = useCallback((key: string) => pins.includes(key), [pins]);

	const toggle = useCallback(
		(key: string) => {
			// note: lê o estado vigente do storage (não o snapshot do render) pra
			// não perder writes concorrentes de outro consumidor montado.
			const fallback = defaultsKey ? defaultsKey.split('|') : [];
			const current = read(audience) ?? fallback;
			const next = current.includes(key)
				? current.filter((k) => k !== key)
				: [...current, key];
			write(audience, next);
			setPins(next);
		},
		[audience, defaultsKey],
	);

	return { pins, isPinned, toggle, isReady };
}
