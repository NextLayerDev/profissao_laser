'use client';

import { AlertTriangle, Check, Copy, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCreatePlanLink } from '@/hooks/use-plan-links';
import { useLandingPlans } from '@/modules/plans';
import type { PlanLink } from '@/types/plan-link';

interface CreateAnnualLinkModalProps {
	onClose: () => void;
}

/** Gera um link ANUAL: o admin trava o plano e o 1º ano sai pelo piso × 12. */
export function CreateAnnualLinkModal({ onClose }: CreateAnnualLinkModalProps) {
	const [planKey, setPlanKey] = useState('');
	const [voxGrant, setVoxGrant] = useState('');
	const [maxRedemptions, setMaxRedemptions] = useState('');
	const [expiresAt, setExpiresAt] = useState('');
	const [result, setResult] = useState<PlanLink | null>(null);
	const [copied, setCopied] = useState(false);

	const { data: plans, isLoading: plansLoading } = useLandingPlans();
	const mutation = useCreatePlanLink();

	function handleClose() {
		mutation.reset();
		onClose();
	}

	async function handleSubmit() {
		if (!planKey) {
			toast.error('Escolha o plano do link anual');
			return;
		}
		const grant = voxGrant.trim() === '' ? 0 : Number(voxGrant);
		if (Number.isNaN(grant) || grant < 0) {
			toast.error('Informe uma quantidade válida de voxxys (ou deixe 0)');
			return;
		}
		const maxR =
			maxRedemptions.trim() === '' ? undefined : Number(maxRedemptions);
		if (maxR !== undefined && (!Number.isInteger(maxR) || maxR < 1)) {
			toast.error(
				'Máximo de usos deve ser um inteiro ≥ 1 (ou vazio = ilimitado)',
			);
			return;
		}

		try {
			const link = await mutation.mutateAsync({
				kind: 'annual_fixed',
				plan_key: planKey,
				vox_grant: grant,
				max_redemptions: maxR,
				expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
			});
			// API antiga ignora o kind e cria um link MENSAL silenciosamente —
			// valida a resposta pra não entregar o link errado pro admin.
			if (link.kind !== 'annual_fixed') {
				toast.error(
					'A API ainda não suporta links anuais — este link saiu como MENSAL. Desative-o na aba "Links de Plano" e tente de novo após o deploy da API.',
					{ duration: 10000 },
				);
				return;
			}
			setResult(link);
			toast.success('Link anual gerado!');
		} catch {
			toast.error('Erro ao gerar o link anual');
		}
	}

	const url = result
		? `${typeof window !== 'undefined' ? window.location.origin : ''}/link-plano/${result.token}`
		: '';

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
			toast.success('Link copiado!');
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error('Não foi possível copiar. Copie manualmente.');
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<button
				type="button"
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={handleClose}
				onKeyDown={(e) => {
					if (e.key === 'Escape') handleClose();
				}}
			>
				<span className="sr-only">Fechar modal</span>
			</button>

			<div className="relative bg-[#1a1a1d] border border-gray-800 rounded-2xl w-full max-w-lg mx-4 p-6 shadow-2xl text-white">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-xl font-bold">
						{result ? 'Link anual gerado!' : 'Gerar Link Anual'}
					</h2>
					<button
						type="button"
						onClick={handleClose}
						className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#252528]"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{!result ? (
					<>
						{/* AVISO obrigatório: 1º ano a custo vai 100% pra upvox */}
						<div className="mb-4 p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl flex gap-3">
							<AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
							<div className="text-sm text-amber-200/90 leading-snug">
								<p className="font-semibold text-amber-300">
									O valor pago no 1º ano vai 100% para a upvox.
								</p>
								<p className="mt-1 text-amber-200/70 text-xs">
									O comprador assina o plano ANUAL pagando só o piso mensal × 12
									no 1º ano (fatura única) — a empresa não retém lucro nesse
									ano. O uso dos voxxys de presente gera custo na{' '}
									<span className="font-medium">fatura aberta</span> (R$
									1,20/voxxy como referência, cobrado pelo custo real de cada
									ferramenta usada).
								</p>
							</div>
						</div>

						<div className="space-y-4">
							<div>
								<label
									htmlFor="annual-link-plan"
									className="block text-sm font-medium text-gray-300 mb-2"
								>
									Plano do link <span className="text-red-400">*</span>
								</label>
								<select
									id="annual-link-plan"
									value={planKey}
									onChange={(e) => setPlanKey(e.target.value)}
									disabled={plansLoading}
									className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-violet-500/50 transition-colors disabled:opacity-50"
								>
									<option value="">
										{plansLoading ? 'Carregando planos…' : 'Escolha o plano'}
									</option>
									{(plans ?? []).map((p) => (
										<option
											key={p.key}
											value={p.key}
											disabled={p.annual == null || p.annual <= 0}
										>
											{p.name}
											{p.annual != null && p.annual > 0
												? ` — ${p.annual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/ano`
												: ' — sem preço anual'}
										</option>
									))}
								</select>
								<p className="text-xs text-gray-500 mt-1.5">
									A página do link vende SÓ este plano, na cobrança anual.
								</p>
							</div>

							<div>
								<label
									htmlFor="annual-link-vox-grant"
									className="block text-sm font-medium text-gray-300 mb-2"
								>
									Voxxys de presente por assinatura
								</label>
								<input
									id="annual-link-vox-grant"
									type="number"
									min={0}
									value={voxGrant}
									onChange={(e) => setVoxGrant(e.target.value)}
									placeholder="Ex: 50 (0 = sem presente)"
									className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
								/>
								<p className="text-xs text-gray-500 mt-1.5">
									Todos que assinarem por este link ganham essa quantidade.
								</p>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label
										htmlFor="annual-link-max-redemptions"
										className="block text-sm font-medium text-gray-300 mb-2"
									>
										Máximo de usos{' '}
										<span className="text-gray-500">(opcional)</span>
									</label>
									<input
										id="annual-link-max-redemptions"
										type="number"
										min={1}
										value={maxRedemptions}
										onChange={(e) => setMaxRedemptions(e.target.value)}
										placeholder="∞"
										className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
									/>
								</div>
								<div>
									<label
										htmlFor="annual-link-expires-at"
										className="block text-sm font-medium text-gray-300 mb-2"
									>
										Expira em <span className="text-gray-500">(opcional)</span>
									</label>
									<input
										id="annual-link-expires-at"
										type="datetime-local"
										value={expiresAt}
										onChange={(e) => setExpiresAt(e.target.value)}
										className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-violet-500/50 transition-colors"
									/>
								</div>
							</div>

							<p className="text-xs text-gray-500">
								Cada CPF só pode usar UM link especial (trava global, vale para
								links mensais e anuais). O desconto vale só para o 1º ano.
							</p>
						</div>

						<div className="flex items-center gap-3 mt-6">
							<button
								type="button"
								onClick={handleClose}
								className="flex-1 px-5 py-3 rounded-xl font-medium text-sm bg-[#252528] hover:bg-[#2a2a2d] transition-colors"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={handleSubmit}
								disabled={mutation.isPending}
								className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm bg-violet-600 hover:bg-violet-700 transition-colors disabled:opacity-50"
							>
								{mutation.isPending && (
									<Loader2 className="w-4 h-4 animate-spin" />
								)}
								Gerar link anual
							</button>
						</div>
					</>
				) : (
					<div className="space-y-5">
						<div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
							<div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
								<Check className="w-4 h-4 text-emerald-400" />
							</div>
							<p className="text-sm text-emerald-300">
								Link pronto. Quem abrir assina o plano escolhido no ANUAL, com o
								1º ano pelo piso mensal × 12.
							</p>
						</div>

						<div className="flex items-center gap-2 p-3 bg-[#0d0d0f] border border-gray-700 rounded-xl">
							<code className="flex-1 text-xs text-gray-300 truncate">
								{url}
							</code>
							<button
								type="button"
								onClick={copyToClipboard}
								className={`p-2 rounded-lg transition-colors shrink-0 ${
									copied
										? 'bg-emerald-500/20 text-emerald-400'
										: 'text-gray-400 hover:text-white hover:bg-[#252528]'
								}`}
								title="Copiar link"
							>
								<Copy className="w-4 h-4" />
							</button>
						</div>

						<button
							type="button"
							onClick={handleClose}
							className="w-full px-5 py-3 rounded-xl font-medium text-sm bg-[#252528] hover:bg-[#2a2a2d] transition-colors"
						>
							Fechar
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
