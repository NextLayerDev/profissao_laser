'use client';

import { isAxiosError } from 'axios';
import {
	AlertTriangle,
	ArrowUpDown,
	CreditCard,
	Gift,
	Layers,
	Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { useChangeStudentPlan, usePlanOptions } from '@/hooks/use-students';
import type { ChangePlanMode, Student } from '@/services/students';

interface Props {
	student: Student | null;
	onClose: () => void;
}

function messageForError(err: unknown): string {
	if (isAxiosError(err)) {
		const status = err.response?.status;
		const apiMessage = (err.response?.data as { message?: string } | undefined)
			?.message;
		if (status === 409) {
			return 'Este aluno não tem assinatura paga ativa, então não dá para usar "Cobrança normal". Escolha "Cortesia" para liberar o plano sem cobrança.';
		}
		if (apiMessage) return apiMessage;
	}
	return 'Erro ao alterar o plano do aluno.';
}

export function ChangePlanModal({ student, onClose }: Props) {
	const { groups, isLoading: loadingPlans } = usePlanOptions();
	const changePlan = useChangeStudentPlan();

	const [planId, setPlanId] = useState('');
	const [mode, setMode] = useState<ChangePlanMode>('stripe');

	if (!student) return null;

	async function handleConfirm() {
		if (!student || !planId) return;
		try {
			await changePlan.mutateAsync({ id: student.id, planId, mode });
			setPlanId('');
			onClose();
		} catch (err) {
			toast.error(messageForError(err));
		}
	}

	return (
		<ModalOverlay onClose={onClose} tone="plans">
			<div className="p-6 space-y-5">
				<div className="flex items-center gap-2">
					<ArrowUpDown className="w-5 h-5 text-violet-500" />
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						Alterar plano do aluno
					</h3>
				</div>

				<div>
					<p className="text-sm font-semibold text-slate-900 dark:text-white">
						{student.name ?? 'Sem nome'}
					</p>
					<p className="text-xs text-slate-500 dark:text-gray-500">
						{student.email}
					</p>
				</div>

				{/* Current plan */}
				<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] px-4 py-3">
					<span className="text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-1">
						<Layers className="w-3 h-3" />
						Plano atual
					</span>
					<p className="text-sm font-semibold text-slate-900 dark:text-white">
						{student.plan?.name ?? 'Sem plano'}
					</p>
				</div>

				{/* Mode segmented control */}
				<div>
					<span className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5">
						Como aplicar
					</span>
					<div
						className="grid grid-cols-2 gap-2"
						aria-label="Como aplicar a mudança de plano"
					>
						<ModeOption
							icon={CreditCard}
							label="Cobrança normal"
							hint="Cobra o aluno e altera a assinatura (Stripe)"
							active={mode === 'stripe'}
							onClick={() => setMode('stripe')}
						/>
						<ModeOption
							icon={Gift}
							label="Cortesia"
							hint="Libera o plano sem cobrar (suporte/migração)"
							active={mode === 'override'}
							onClick={() => setMode('override')}
						/>
					</div>
				</div>

				{/* Cortesia warning */}
				{mode === 'override' && (
					<div className="flex items-start gap-2.5 rounded-lg border border-amber-300/60 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3 py-2.5">
						<AlertTriangle
							className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
							aria-hidden="true"
						/>
						<p className="text-xs leading-relaxed text-amber-700 dark:text-amber-200">
							<span className="font-semibold">Cortesia (sem cobrança):</span> o
							aluno recebe este plano de graça, na hora, e nada é cobrado no
							cartão. Use para suporte, migração ou liberação manual. Para
							cobrar de verdade, escolha “Cobrança normal”.
						</p>
					</div>
				)}

				{/* Plan picker */}
				<div>
					<span className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5">
						Selecionar novo plano
					</span>
					{loadingPlans ? (
						<div className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-500 py-3">
							<Loader2 className="w-4 h-4 animate-spin" />
							Carregando planos...
						</div>
					) : groups.length === 0 ? (
						<div className="text-sm text-slate-500 dark:text-gray-500 py-3 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-lg">
							Nenhum plano disponível.
						</div>
					) : (
						<div className="space-y-3 max-h-64 overflow-y-auto pr-1">
							{groups.map((group) => (
								<div key={group.courseId}>
									<p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-gray-500 mb-1.5">
										{group.courseTitle}
									</p>
									<div className="space-y-2">
										{group.plans.map((plan) => {
											const selected = planId === plan.id;
											const isCurrent = student?.plan?.id === plan.id;
											return (
												<button
													key={plan.id}
													type="button"
													onClick={() => setPlanId(plan.id)}
													aria-pressed={selected}
													className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
														selected
															? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10'
															: 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
													}`}
												>
													<div className="flex flex-col min-w-0">
														<span className="text-sm font-medium text-slate-900 dark:text-white truncate">
															{plan.name}
														</span>
														<span className="text-xs font-mono text-slate-400 dark:text-gray-500 truncate">
															{plan.key}
														</span>
													</div>
													{isCurrent && (
														<span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-gray-400">
															Atual
														</span>
													)}
												</button>
											);
										})}
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				<div className="flex gap-3 pt-1">
					<button
						type="button"
						onClick={onClose}
						disabled={changePlan.isPending}
						className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white disabled:opacity-50"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={handleConfirm}
						disabled={changePlan.isPending || !planId}
						className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-60"
					>
						{changePlan.isPending && (
							<Loader2 className="w-4 h-4 animate-spin" />
						)}
						{changePlan.isPending ? 'Alterando...' : 'Confirmar alteração'}
					</button>
				</div>
			</div>
		</ModalOverlay>
	);
}

function ModeOption({
	icon: Icon,
	label,
	hint,
	active,
	onClick,
}: {
	icon: typeof Gift;
	label: string;
	hint: string;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			aria-pressed={active}
			onClick={onClick}
			className={`flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-lg border text-left transition-all ${
				active
					? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10'
					: 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
			}`}
		>
			<span className="flex items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-white">
				<Icon
					className={`w-4 h-4 ${active ? 'text-violet-500' : 'text-slate-400'}`}
				/>
				{label}
			</span>
			<span className="text-[11px] text-slate-500 dark:text-gray-400">
				{hint}
			</span>
		</button>
	);
}
