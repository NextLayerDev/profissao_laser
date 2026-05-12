'use client';

import type React from 'react';

export function ModalOverlay({
	onClose,
	children,
}: {
	onClose: () => void;
	children: React.ReactNode;
}) {
	return (
		// biome-ignore lint/a11y/useSemanticElements: backdrop cannot be <button> since it contains modal with buttons (invalid HTML)
		<div
			role="button"
			tabIndex={0}
			aria-label="Fechar modal"
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm cursor-pointer"
			onClick={onClose}
			onKeyDown={(e) => e.key === 'Escape' && onClose()}
		>
			<div
				role="dialog"
				className="bg-white dark:bg-[#12103a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.key === 'Escape' && onClose()}
			>
				{children}
			</div>
		</div>
	);
}
