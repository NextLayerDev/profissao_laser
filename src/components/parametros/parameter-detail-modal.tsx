'use client';

import { ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ParameterCard } from '@/components/parametros/parameter-card';
import { useParameterPasses } from '@/hooks/use-parameters';

interface ParameterDetailModalProps {
	parameterId: string | null;
	onClose: () => void;
}

/**
 * Detalhe de um parâmetro. Se for multi-passada (pai), mostra um stepper para
 * navegar as passadas em ordem (passada 1 = o próprio pai), cada uma um recipe.
 */
export function ParameterDetailModal({
	parameterId,
	onClose,
}: ParameterDetailModalProps) {
	const [mounted, setMounted] = useState(false);
	const [step, setStep] = useState(0);
	useEffect(() => setMounted(true), []);
	// reseta o passo ao abrir outro parâmetro
	// biome-ignore lint/correctness/useExhaustiveDependencies: reset ao trocar de id
	useEffect(() => setStep(0), [parameterId]);

	const { data, isLoading } = useParameterPasses(parameterId);
	const passes = data?.passes ?? [];
	const multi = passes.length > 1;
	const current = passes[step] ?? passes[0];

	if (!mounted || !parameterId) return null;

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
			<button
				type="button"
				onClick={onClose}
				aria-label="Fechar"
				className="fixed inset-0 bg-black/70 backdrop-blur-sm cursor-default"
			/>
			<div className="relative z-10 my-auto w-full max-w-2xl">
				<button
					type="button"
					onClick={onClose}
					aria-label="Fechar"
					className="absolute -top-2 -right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg hover:text-red-500 dark:border-white/10 dark:bg-[#1a1a1d] dark:text-gray-300"
				>
					<X className="h-4 w-4" />
				</button>

				{isLoading || !current ? (
					<div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 dark:border-white/10 dark:bg-[#0e0e10]">
						<Loader2 className="h-6 w-6 animate-spin text-violet-500" />
					</div>
				) : (
					<>
						{multi ? (
							<div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 dark:border-white/10 dark:bg-[#1a1a1d]">
								<button
									type="button"
									disabled={step === 0}
									onClick={() => setStep((s) => Math.max(0, s - 1))}
									className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-white/5"
								>
									<ChevronLeft className="h-4 w-4" />
									Anterior
								</button>
								<span className="text-sm font-bold text-slate-900 dark:text-white">
									Passada {step + 1} de {passes.length}
								</span>
								<button
									type="button"
									disabled={step >= passes.length - 1}
									onClick={() =>
										setStep((s) => Math.min(passes.length - 1, s + 1))
									}
									className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-white/5"
								>
									Próxima
									<ChevronRight className="h-4 w-4" />
								</button>
							</div>
						) : null}
						<ParameterCard parameter={current} variant="simple" />
					</>
				)}
			</div>
		</div>,
		document.body,
	);
}
