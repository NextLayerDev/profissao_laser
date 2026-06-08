'use client';

import { useEffect, useState } from 'react';

/**
 * Retorna `value` com delay — útil pra rate-limit auto-search.
 * Quando `value` muda rapidamente, só atualiza após `delayMs` de quietude.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const handle = setTimeout(() => setDebounced(value), delayMs);
		return () => clearTimeout(handle);
	}, [value, delayMs]);

	return debounced;
}
