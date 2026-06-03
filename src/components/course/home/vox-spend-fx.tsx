'use client';

import { useEffect, useRef, useState } from 'react';
import { formatVox } from '@/lib/format';
import {
	VOX_SPEND_EVENT,
	type VoxSpendDetail,
} from '@/modules/tools/lib/vox-fx';

/**
 * Mostra "−custo" subindo e sumindo perto do saldo de voxxys no header, sempre
 * que QUALQUER ferramenta debita (escuta o evento global vox:spend). Coloque
 * dentro de um container `relative` ao lado do saldo.
 */
export function VoxSpendFx() {
	const [items, setItems] = useState<{ id: number; amount: number }[]>([]);
	const idRef = useRef(0);

	useEffect(() => {
		const onSpend = (e: Event) => {
			const amount = (e as CustomEvent<VoxSpendDetail>).detail?.amount;
			if (!amount || amount <= 0) return;
			const id = ++idRef.current;
			setItems((prev) => [...prev, { id, amount }]);
			window.setTimeout(
				() => setItems((prev) => prev.filter((i) => i.id !== id)),
				1100,
			);
		};
		window.addEventListener(VOX_SPEND_EVENT, onSpend);
		return () => window.removeEventListener(VOX_SPEND_EVENT, onSpend);
	}, []);

	if (items.length === 0) return null;

	return (
		<span className="pointer-events-none absolute -top-2 left-1/2 z-50 -translate-x-1/2">
			{items.map((i) => (
				<span
					key={i.id}
					className="animate-vox-float absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-rose-500"
				>
					−{formatVox(i.amount)}
				</span>
			))}
		</span>
	);
}
