'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import { ModalOverlay } from '@/components/ui/modal-overlay';

/** Confirmação de ação destrutiva/irreversível — sem `window.confirm`. */
export function ConfirmDialog({
	title,
	description,
	confirmLabel = 'Confirmar',
	cancelLabel = 'Cancelar',
	tone = 'danger',
	loading = false,
	onConfirm,
	onCancel,
}: {
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	tone?: 'danger' | 'neutral';
	loading?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}) {
	const confirmCls =
		tone === 'danger'
			? 'bg-red-600 hover:bg-red-500'
			: 'bg-violet-600 hover:bg-violet-500';

	return (
		<ModalOverlay onClose={onCancel} widthClassName="max-w-md">
			<div className="p-6">
				<div className="flex items-start gap-3">
					<div
						className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${
							tone === 'danger'
								? 'bg-red-100 dark:bg-red-500/15'
								: 'bg-violet-100 dark:bg-violet-500/15'
						}`}
					>
						<AlertTriangle
							className={`w-5 h-5 ${
								tone === 'danger'
									? 'text-red-600 dark:text-red-400'
									: 'text-violet-600 dark:text-violet-400'
							}`}
						/>
					</div>
					<div className="min-w-0">
						<h3 className="text-base font-semibold text-slate-900 dark:text-white">
							{title}
						</h3>
						<p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
							{description}
						</p>
					</div>
				</div>

				<div className="flex justify-end gap-2 mt-6">
					<button
						type="button"
						onClick={onCancel}
						disabled={loading}
						className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors disabled:opacity-50"
					>
						{cancelLabel}
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={loading}
						className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 ${confirmCls}`}
					>
						{loading && <Loader2 className="w-4 h-4 animate-spin" />}
						{confirmLabel}
					</button>
				</div>
			</div>
		</ModalOverlay>
	);
}
