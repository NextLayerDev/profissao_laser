'use client';

import { Check, Copy, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCreatePromoLink } from '@/hooks/use-promo-links';
import type { Product } from '@/types/products';
import type { CreatePromoLinkResponse } from '@/types/promo-link';

interface CreatePromoLinkModalProps {
	product: Product;
	onClose: () => void;
}

export function CreatePromoLinkModal({
	product,
	onClose,
}: CreatePromoLinkModalProps) {
	const [maxRedemptions, setMaxRedemptions] = useState('');
	const [discountPercent, setDiscountPercent] = useState('');
	const [durationMonths, setDurationMonths] = useState('');
	const [expiresAt, setExpiresAt] = useState('');
	const [result, setResult] = useState<CreatePromoLinkResponse | null>(null);
	const [copied, setCopied] = useState(false);

	const mutation = useCreatePromoLink();

	function handleClose() {
		setMaxRedemptions('');
		setDiscountPercent('');
		setDurationMonths('');
		setExpiresAt('');
		setResult(null);
		setCopied(false);
		mutation.reset();
		onClose();
	}

	async function handleSubmit() {
		const maxR = Number(maxRedemptions);
		const discP = Number(discountPercent);
		const durM = Number(durationMonths);

		if (!maxR || maxR < 1) {
			toast.error('Informe a quantidade máxima de usos');
			return;
		}
		if (!discP || discP < 1 || discP > 100) {
			toast.error('Informe um desconto válido (1 a 100%)');
			return;
		}
		if (!durM || durM < 1) {
			toast.error('Informe a duração em meses');
			return;
		}

		try {
			const response = await mutation.mutateAsync({
				productId: product.id,
				maxRedemptions: maxR,
				discountPercent: discP,
				durationMonths: durM,
				expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
			});
			setResult(response);
			toast.success('Link promocional gerado com sucesso!');
		} catch {
			toast.error('Erro ao gerar link promocional');
		}
	}

	async function copyToClipboard(text: string) {
		try {
			await navigator.clipboard.writeText(text);
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

			<div className="relative bg-[#1a1a1d] border border-gray-800 rounded-2xl w-full max-w-lg mx-4 p-6 shadow-2xl">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-xl font-bold">
						{result ? 'Link promocional gerado!' : 'Gerar Link Promocional'}
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
						<div className="mb-5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
							<p className="text-sm text-amber-300">
								<span className="font-medium">Produto:</span> {product.name}
							</p>
							<p className="text-xs text-amber-400/70 mt-1">
								Link compartilhável — vários clientes podem usar.
							</p>
						</div>

						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label
										htmlFor="promo-discount"
										className="block text-sm font-medium text-gray-300 mb-2"
									>
										Desconto (%)
									</label>
									<input
										id="promo-discount"
										type="number"
										min={1}
										max={100}
										value={discountPercent}
										onChange={(e) => setDiscountPercent(e.target.value)}
										placeholder="Ex: 50"
										className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
									/>
								</div>
								<div>
									<label
										htmlFor="promo-duration"
										className="block text-sm font-medium text-gray-300 mb-2"
									>
										Duração (meses)
									</label>
									<input
										id="promo-duration"
										type="number"
										min={1}
										value={durationMonths}
										onChange={(e) => setDurationMonths(e.target.value)}
										placeholder="Ex: 6"
										className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
									/>
								</div>
							</div>

							<div>
								<label
									htmlFor="promo-max-redemptions"
									className="block text-sm font-medium text-gray-300 mb-2"
								>
									Máximo de usos
								</label>
								<input
									id="promo-max-redemptions"
									type="number"
									min={1}
									value={maxRedemptions}
									onChange={(e) => setMaxRedemptions(e.target.value)}
									placeholder="Ex: 20"
									className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
								/>
							</div>

							<div>
								<label
									htmlFor="promo-expires-at"
									className="block text-sm font-medium text-gray-300 mb-2"
								>
									Data de expiração{' '}
									<span className="text-gray-500">(opcional)</span>
								</label>
								<input
									id="promo-expires-at"
									type="datetime-local"
									value={expiresAt}
									onChange={(e) => setExpiresAt(e.target.value)}
									className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-violet-500/50 transition-colors"
								/>
							</div>
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
							<div>
								<p className="text-sm font-medium text-emerald-300">
									Link promocional gerado!
								</p>
								<p className="text-xs text-emerald-400/70 mt-0.5">
									Compartilhe o link com os clientes.
								</p>
							</div>
						</div>

						<div>
							<span className="block text-sm font-medium text-gray-300 mb-2">
								Link promocional
							</span>
							<div className="flex items-center gap-2">
								<code className="flex-1 bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 font-mono truncate block">
									{result.url}
								</code>
								<button
									type="button"
									onClick={() => copyToClipboard(result.url)}
									className={`shrink-0 p-3 rounded-xl transition-colors ${
										copied
											? 'bg-emerald-500/20 text-emerald-400'
											: 'bg-[#252528] hover:bg-[#2a2a2d] text-gray-400 hover:text-white'
									}`}
									title="Copiar link"
								>
									{copied ? (
										<Check className="w-4 h-4" />
									) : (
										<Copy className="w-4 h-4" />
									)}
								</button>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<span className="text-gray-500">Produto:</span>
								<p className="text-gray-200 mt-0.5">{result.productName}</p>
							</div>
							<div>
								<span className="text-gray-500">Desconto:</span>
								<p className="text-gray-200 mt-0.5">
									{result.discountPercent}%
								</p>
							</div>
							<div>
								<span className="text-gray-500">Máx. usos:</span>
								<p className="text-gray-200 mt-0.5">{result.maxRedemptions}</p>
							</div>
							<div>
								<span className="text-gray-500">Duração:</span>
								<p className="text-gray-200 mt-0.5">
									{result.durationMonths}{' '}
									{result.durationMonths === 1 ? 'mês' : 'meses'}
								</p>
							</div>
							{result.expiresAt && (
								<div className="col-span-2">
									<span className="text-gray-500">Expira em:</span>
									<p className="text-gray-200 mt-0.5">
										{new Date(result.expiresAt).toLocaleDateString('pt-BR', {
											day: '2-digit',
											month: '2-digit',
											year: 'numeric',
											hour: '2-digit',
											minute: '2-digit',
										})}
									</p>
								</div>
							)}
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
