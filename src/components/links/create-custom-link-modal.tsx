'use client';

import { Check, Copy, Gift, Loader2, Wallet, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useLandingPlans } from '@/hooks/use-landing-plans';
import { useCreatePlanLink } from '@/hooks/use-plan-links';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import type { PlanLink, PlanLinkAccessMode } from '@/types/plan-link';

interface CreateCustomLinkModalProps {
	onClose: () => void;
}

const ERROS: Record<string, string> = {
	first_period_below_floor:
		'O preço do 1º período está abaixo do custo mínimo do plano. Suba o valor.',
	first_period_above_plan_price:
		'O preço do 1º período está acima do preço cheio do plano.',
	first_period_cents_required: 'Informe o preço do 1º período.',
	access_days_required: 'Informe por quantos dias o acesso vale.',
	plan_key_required: 'Escolha o plano do link.',
	plan_has_no_monthly_price: 'Esse plano não tem preço mensal no Stripe.',
	plan_has_no_yearly_price: 'Esse plano não tem preço anual no Stripe.',
};

function ModeOption({
	active,
	title,
	description,
	icon,
	onClick,
}: {
	active: boolean;
	title: string;
	description: string;
	icon: React.ReactNode;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`flex-1 text-left rounded-xl border p-3.5 transition-colors ${
				active
					? 'border-violet-500 bg-violet-500/10'
					: 'border-gray-700 bg-[#0d0d0f] hover:border-gray-600'
			}`}
		>
			<span className="flex items-center gap-2 text-sm font-semibold text-white">
				{icon}
				{title}
			</span>
			<span className="block text-xs text-gray-500 mt-1.5 leading-snug">
				{description}
			</span>
		</button>
	);
}

/**
 * Link Avançado: o admin define tudo — modo de entrada, plano (ou nenhum),
 * preço do 1º período, voxxys de presente e duração do acesso.
 */
export function CreateCustomLinkModal({ onClose }: CreateCustomLinkModalProps) {
	const [accessMode, setAccessMode] = useState<PlanLinkAccessMode>('free');
	const [planKey, setPlanKey] = useState('');
	const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
	const [firstPeriod, setFirstPeriod] = useState('');
	const [accessDays, setAccessDays] = useState('30');
	const [voxGrant, setVoxGrant] = useState('');
	const [grantsPlanVoxes, setGrantsPlanVoxes] = useState(true);
	const [maxRedemptions, setMaxRedemptions] = useState('');
	const [expiresAt, setExpiresAt] = useState('');
	const [result, setResult] = useState<PlanLink | null>(null);
	const [copied, setCopied] = useState(false);

	const { data: plans, isLoading: plansLoading } = useLandingPlans();
	const mutation = useCreatePlanLink();

	const isFree = accessMode === 'free';
	const selectedPlan = (plans ?? []).find((p) => p.key === planKey) ?? null;
	const fullPrice =
		interval === 'yearly' ? selectedPlan?.annual : selectedPlan?.monthly;

	function handleClose() {
		mutation.reset();
		onClose();
	}

	async function handleSubmit() {
		if (!isFree && !planKey) {
			toast.error('No modo pago é obrigatório escolher o plano');
			return;
		}

		const grant = voxGrant.trim() === '' ? 0 : Number(voxGrant);
		if (Number.isNaN(grant) || grant < 0) {
			toast.error('Informe uma quantidade válida de voxxys (ou deixe 0)');
			return;
		}

		let days: number | undefined;
		if (isFree) {
			days = Number(accessDays);
			if (!Number.isInteger(days) || days < 1) {
				toast.error('Dias de acesso deve ser um inteiro ≥ 1');
				return;
			}
		}

		let firstPeriodCents: number | undefined;
		if (!isFree) {
			const reais = Number(firstPeriod.replace(',', '.'));
			if (Number.isNaN(reais) || reais < 0) {
				toast.error('Informe o preço do 1º período');
				return;
			}
			firstPeriodCents = Math.round(reais * 100);
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
				kind: 'custom',
				plan_key: planKey || undefined,
				vox_grant: grant,
				grants_plan_voxes: grantsPlanVoxes,
				access_mode: accessMode,
				access_days: days,
				first_period_cents: firstPeriodCents,
				interval,
				max_redemptions: maxR,
				expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
			});
			// API antiga ignora o kind e cria um link MENSAL silenciosamente —
			// valida a resposta pra não entregar o link errado pro admin.
			if (link.kind !== 'custom') {
				toast.error(
					'A API ainda não suporta Links Avançados — este link saiu como MENSAL. Desative-o na aba "Links de Plano" e tente de novo após o deploy da API.',
					{ duration: 10000 },
				);
				return;
			}
			setResult(link);
			toast.success('Link avançado gerado!');
		} catch (err) {
			const raw = getApiErrorMessage(err, 'Erro ao gerar o link');
			toast.error(ERROS[raw] ?? raw);
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

			<div className="relative bg-[#1a1a1d] border border-gray-800 rounded-2xl w-full max-w-lg mx-4 p-6 shadow-2xl text-white max-h-[92vh] overflow-y-auto">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-xl font-bold">
						{result ? 'Link avançado gerado!' : 'Gerar Link Avançado'}
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
						<div className="space-y-4">
							<div>
								<span className="block text-sm font-medium text-gray-300 mb-2">
									Modo de entrada
								</span>
								<div className="flex gap-3">
									<ModeOption
										active={isFree}
										onClick={() => setAccessMode('free')}
										icon={<Gift className="w-4 h-4 text-violet-400" />}
										title="Acesso grátis"
										description="A pessoa entra sem pagar nada. Nenhum checkout."
									/>
									<ModeOption
										active={!isFree}
										onClick={() => setAccessMode('paid')}
										icon={<Wallet className="w-4 h-4 text-violet-400" />}
										title="Pago"
										description="Checkout do Stripe pelo preço que você definir."
									/>
								</div>
							</div>

							<div>
								<label
									htmlFor="custom-link-plan"
									className="block text-sm font-medium text-gray-300 mb-2"
								>
									Plano{' '}
									{isFree ? (
										<span className="text-gray-500">(opcional)</span>
									) : (
										<span className="text-red-400">*</span>
									)}
								</label>
								<select
									id="custom-link-plan"
									value={planKey}
									onChange={(e) => setPlanKey(e.target.value)}
									disabled={plansLoading}
									className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-violet-500/50 transition-colors disabled:opacity-50"
								>
									<option value="">
										{plansLoading
											? 'Carregando planos…'
											: isFree
												? 'Gratuito — sem assinatura'
												: 'Escolha o plano'}
									</option>
									{(plans ?? []).map((p) => (
										<option key={p.key} value={p.key}>
											{p.name}
											{p.monthly != null && p.monthly > 0
												? ` — ${p.monthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês`
												: ''}
										</option>
									))}
								</select>
								<p className="text-xs text-gray-500 mt-1.5">
									{isFree && !planKey
										? 'Sem plano: a pessoa entra só com os voxxys e usa as ferramentas pagando com eles — sem curso.'
										: isFree
											? 'Com plano: assinatura de cortesia, com as cotas grátis e os cursos do plano.'
											: 'O link vende só este plano.'}
								</p>
							</div>

							{!isFree && (
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label
											htmlFor="custom-link-interval"
											className="block text-sm font-medium text-gray-300 mb-2"
										>
											Cobrança
										</label>
										<select
											id="custom-link-interval"
											value={interval}
											onChange={(e) =>
												setInterval(e.target.value as 'monthly' | 'yearly')
											}
											className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-violet-500/50 transition-colors"
										>
											<option value="monthly">Mensal</option>
											<option value="yearly">Anual</option>
										</select>
									</div>
									<div>
										<label
											htmlFor="custom-link-first-period"
											className="block text-sm font-medium text-gray-300 mb-2"
										>
											Preço do 1º período{' '}
											<span className="text-red-400">*</span>
										</label>
										<input
											id="custom-link-first-period"
											type="number"
											min={0}
											step="0.01"
											value={firstPeriod}
											onChange={(e) => setFirstPeriod(e.target.value)}
											placeholder="Ex: 9.70"
											className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
										/>
									</div>
									<p className="col-span-2 -mt-2 text-xs text-gray-500">
										{fullPrice != null && fullPrice > 0
											? `Preço cheio do plano: ${fullPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. `
											: ''}
										A API recusa valores abaixo do custo mínimo calculado do
										plano (infra + cotas grátis + margem). Renovações voltam ao
										preço cheio.
									</p>
								</div>
							)}

							{isFree && (
								<div>
									<label
										htmlFor="custom-link-access-days"
										className="block text-sm font-medium text-gray-300 mb-2"
									>
										Dias de acesso <span className="text-red-400">*</span>
									</label>
									<input
										id="custom-link-access-days"
										type="number"
										min={1}
										value={accessDays}
										onChange={(e) => setAccessDays(e.target.value)}
										placeholder="30"
										className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
									/>
									<p className="text-xs text-gray-500 mt-1.5">
										Quanto tempo o acesso concedido dura. Também é o prazo para
										gastar os voxxys de presente.
									</p>
								</div>
							)}

							<div>
								<label
									htmlFor="custom-link-vox-grant"
									className="block text-sm font-medium text-gray-300 mb-2"
								>
									Voxxys de presente
								</label>
								<input
									id="custom-link-vox-grant"
									type="number"
									min={0}
									value={voxGrant}
									onChange={(e) => setVoxGrant(e.target.value)}
									placeholder="Ex: 20 (0 = sem presente)"
									className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
								/>
								<p className="text-xs text-gray-500 mt-1.5">
									Só vira custo na fatura quando forem <strong>usados</strong>,
									pelo custo real da ferramenta. Dados e não usados: R$ 0,00.
								</p>
							</div>

							{planKey && (
								<div className="rounded-xl border border-gray-700 bg-[#0d0d0f] p-3.5">
									<label
										htmlFor="custom-link-grants-plan-voxes"
										className="flex items-start gap-3 cursor-pointer"
									>
										<input
											id="custom-link-grants-plan-voxes"
											type="checkbox"
											checked={grantsPlanVoxes}
											onChange={(e) => setGrantsPlanVoxes(e.target.checked)}
											className="mt-0.5 w-4 h-4 accent-violet-500"
										/>
										<span className="text-sm text-gray-300">
											Incluir os{' '}
											<strong className="text-white">
												voxxys mensais do plano
											</strong>
											<span className="block text-xs text-gray-500 mt-1">
												Diferente do presente acima. Estes são cobrados a R$
												1,20 por voxxy efetivamente consumido.
											</span>
										</span>
									</label>
								</div>
							)}

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label
										htmlFor="custom-link-max-redemptions"
										className="block text-sm font-medium text-gray-300 mb-2"
									>
										Máximo de usos{' '}
										<span className="text-gray-500">(opcional)</span>
									</label>
									<input
										id="custom-link-max-redemptions"
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
										htmlFor="custom-link-expires-at"
										className="block text-sm font-medium text-gray-300 mb-2"
									>
										Expira em <span className="text-gray-500">(opcional)</span>
									</label>
									<input
										id="custom-link-expires-at"
										type="datetime-local"
										value={expiresAt}
										onChange={(e) => setExpiresAt(e.target.value)}
										className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-violet-500/50 transition-colors"
									/>
								</div>
							</div>

							<p className="text-xs text-gray-500">
								Cada pessoa resgata este link uma vez. Diferente dos links
								mensal e anual, a trava é <strong>por link</strong> — quem já
								comprou por outro link continua podendo usar este.
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
								{result.access_mode === 'free'
									? `Link pronto. Quem abrir ativa o acesso na hora, por ${result.access_days} dias.`
									: 'Link pronto. Quem abrir vai pro checkout com o preço que você definiu.'}
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
