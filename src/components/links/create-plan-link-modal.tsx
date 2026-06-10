'use client';

import { AlertTriangle, Check, Copy, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCreatePlanLink } from '@/hooks/use-plan-links';
import type { PlanLink } from '@/types/plan-link';

interface CreatePlanLinkModalProps {
	onClose: () => void;
}

export function CreatePlanLinkModal({ onClose }: CreatePlanLinkModalProps) {
	const [voxGrant, setVoxGrant] = useState('');
	const [maxRedemptions, setMaxRedemptions] = useState('');
	const [expiresAt, setExpiresAt] = useState('');
	const [result, setResult] = useState<PlanLink | null>(null);
	const [copied, setCopied] = useState(false);

	const mutation = useCreatePlanLink();

	function handleClose() {
		mutation.reset();
		onClose();
	}

	async function handleSubmit() {
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
				vox_grant: grant,
				max_redemptions: maxR,
				expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
			});
			setResult(link);
			toast.success('Link de plano gerado!');
		} catch {
			toast.error('Erro ao gerar o link');
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
						{result ? 'Link gerado!' : 'Gerar Link de Plano'}
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
						{/* AVISO obrigatório: 1º mês a custo vai 100% pra upvox */}
						<div className="mb-4 p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl flex gap-3">
							<AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
							<div className="text-sm text-amber-200/90 leading-snug">
								<p className="font-semibold text-amber-300">
									O valor pago no 1º mês vai 100% para a upvox.
								</p>
								<p className="mt-1 text-amber-200/70 text-xs">
									O comprador paga só o custo de plataforma + R$ 1,50 no 1º mês
									— a empresa não retém lucro nesse mês. O uso dos voxxys de
									presente gera custo na{' '}
									<span className="font-medium">fatura aberta</span> (R$
									1,20/voxxy como referência, cobrado pelo custo real de cada
									ferramenta usada).
								</p>
							</div>
						</div>

						<div className="space-y-4">
							<div>
								<label
									htmlFor="plan-link-vox-grant"
									className="block text-sm font-medium text-gray-300 mb-2"
								>
									Voxxys de presente por assinatura
								</label>
								<input
									id="plan-link-vox-grant"
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
										htmlFor="plan-link-max-redemptions"
										className="block text-sm font-medium text-gray-300 mb-2"
									>
										Máximo de usos{' '}
										<span className="text-gray-500">(opcional)</span>
									</label>
									<input
										id="plan-link-max-redemptions"
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
										htmlFor="plan-link-expires-at"
										className="block text-sm font-medium text-gray-300 mb-2"
									>
										Expira em <span className="text-gray-500">(opcional)</span>
									</label>
									<input
										id="plan-link-expires-at"
										type="datetime-local"
										value={expiresAt}
										onChange={(e) => setExpiresAt(e.target.value)}
										className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-violet-500/50 transition-colors"
									/>
								</div>
							</div>

							<p className="text-xs text-gray-500">
								Cada CPF só pode usar UM link especial (trava global). O
								desconto vale só para o 1º mês, na cobrança mensal.
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
								Gerar link
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
								Link pronto. Compartilhe — quem abrir escolhe o plano e paga o
								1º mês a preço de custo.
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
