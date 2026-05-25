'use client';

import type React from 'react';
import { ModalPortal } from './modal-portal';

export function ModalOverlay({
	onClose,
	children,
	widthClassName = 'max-w-lg',
}: {
	onClose: () => void;
	children: React.ReactNode;
	/** Largura máxima do painel (default `max-w-lg`). Ex.: `max-w-5xl`. */
	widthClassName?: string;
}) {
	return (
		<ModalPortal>
			{/* biome-ignore lint/a11y/useSemanticElements: backdrop cannot be <button> since it contains modal with buttons */}
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
					className={`bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl ${widthClassName} w-full max-h-[90vh] overflow-y-auto animate-[fade-in-up_0.25s_ease-out_both]`}
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.key === 'Escape' && onClose()}
				>
					{children}
				</div>
			</div>
		</ModalPortal>
	);
}
