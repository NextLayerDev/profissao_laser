'use client';

import { useEffect, useState } from 'react';

/** Barra fina no topo que acompanha o progresso de rolagem da página. */
export function ScrollProgress() {
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		const onScroll = () => {
			const el = document.documentElement;
			const max = el.scrollHeight - el.clientHeight;
			setProgress(max > 0 ? (el.scrollTop / max) * 100 : 0);
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
		};
	}, []);

	return (
		<div className="fixed top-0 left-0 right-0 z-[60] h-0.5 pointer-events-none">
			<div
				className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.7)]"
				style={{ width: `${progress}%` }}
			/>
		</div>
	);
}
