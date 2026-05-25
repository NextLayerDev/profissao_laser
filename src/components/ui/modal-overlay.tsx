'use client';

import type React from 'react';

export type ModalTone = 'courses' | 'plans' | 'tools' | 'voxes';

const TONE_BG: Record<ModalTone, string> = {
	courses:
		'bg-gradient-to-br from-white via-sky-50/40 to-indigo-50/30 dark:from-[#1a1a1d] dark:via-sky-950/20 dark:to-indigo-950/10',
	plans:
		'bg-gradient-to-br from-white via-violet-50/40 to-fuchsia-50/30 dark:from-[#1a1a1d] dark:via-violet-950/20 dark:to-fuchsia-950/10',
	tools:
		'bg-gradient-to-br from-white via-emerald-50/40 to-cyan-50/30 dark:from-[#1a1a1d] dark:via-emerald-950/20 dark:to-cyan-950/10',
	voxes:
		'bg-gradient-to-br from-white via-amber-50/40 to-orange-50/30 dark:from-[#1a1a1d] dark:via-amber-950/20 dark:to-orange-950/10',
};

const TONE_BLOB_A: Record<ModalTone, string> = {
	courses: 'bg-sky-500/15 dark:bg-sky-500/10',
	plans: 'bg-violet-500/15 dark:bg-violet-500/10',
	tools: 'bg-emerald-500/15 dark:bg-emerald-500/10',
	voxes: 'bg-amber-500/15 dark:bg-amber-500/10',
};

const TONE_BLOB_B: Record<ModalTone, string> = {
	courses: 'bg-indigo-500/10 dark:bg-indigo-500/10',
	plans: 'bg-fuchsia-500/10 dark:bg-fuchsia-500/10',
	tools: 'bg-cyan-500/10 dark:bg-cyan-500/10',
	voxes: 'bg-orange-500/10 dark:bg-orange-500/10',
};

export function ModalOverlay({
	onClose,
	tone,
	children,
}: {
	onClose: () => void;
	/** Aplica gradient + blobs decorativos no diálogo, combinando com a paleta da área. */
	tone?: ModalTone;
	children: React.ReactNode;
}) {
	const dialogBg = tone ? TONE_BG[tone] : 'bg-white dark:bg-[#1a1a1d]';

	return (
		// biome-ignore lint/a11y/useSemanticElements: backdrop cannot be <button> since it contains modal with buttons
		<div
			role="button"
			tabIndex={0}
			aria-label="Fechar modal"
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm cursor-pointer animate-[fade-in-up_0.2s_ease-out_both]"
			onClick={onClose}
			onKeyDown={(e) => e.key === 'Escape' && onClose()}
		>
			<div
				role="dialog"
				className={`relative overflow-hidden border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col animate-[fade-in-up_0.25s_ease-out_both] ${dialogBg}`}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.key === 'Escape' && onClose()}
			>
				{tone && (
					<>
						<div
							className={`pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl ${TONE_BLOB_A[tone]}`}
						/>
						<div
							className={`pointer-events-none absolute -bottom-24 -left-16 w-52 h-52 rounded-full blur-3xl ${TONE_BLOB_B[tone]}`}
						/>
					</>
				)}
				<div className="relative overflow-y-auto flex-1">{children}</div>
			</div>
		</div>
	);
}
