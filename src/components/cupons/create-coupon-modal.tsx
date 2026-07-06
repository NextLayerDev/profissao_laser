'use client';

import { Loader2, Percent, Wallet, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCreateCoupon, useUpdateCoupon } from '@/hooks/use-upvox-coupons';
import type {
	CouponAppliesTo,
	CouponDiscountType,
	CouponDuration,
	CouponListItem,
	CreateCouponPayload,
} from '@/types/upvox-coupons';

interface CreateCouponModalProps {
	/** Quando presente, o modal edita este cupom em vez de criar um novo. */
	editing?: CouponListItem | null;
	onClose: () => void;
}

/** ISO → valor de `<input type="datetime-local">` (no fuso local, sem segundos). */
function isoToLocalInput(iso: string | null | undefined): string {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	const off = d.getTimezoneOffset() * 60000;
	return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

function localInputToIso(v: string): string | undefined {
	if (!v) return undefined;
	const d = new Date(v);
	return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

const APPLIES: { value: CouponAppliesTo; label: string; hint: string }[] = [
	{ value: 'all', label: 'Tudo', hint: 'Planos e voxxys' },
	{ value: 'plans', label: 'Planos', hint: 'Só assinaturas' },
	{ value: 'voxes', label: 'Voxxys', hint: 'Só pacotes' },
];

const DURATIONS: { value: CouponDuration; label: string }[] = [
	{ value: 'once', label: '1ª cobrança' },
	{ value: 'repeating', label: 'X meses' },
	{ value: 'forever', label: 'Sempre' },
];

export function CreateCouponModal({
	editing,
	onClose,
}: CreateCouponModalProps) {
	const isEdit = !!editing;
	const create = useCreateCoupon();
	const update = useUpdateCoupon();

	const [code, setCode] = useState(editing?.code ?? '');
	const [discountType, setDiscountType] = useState<CouponDiscountType>(
		editing?.discount_type ?? 'percent',
	);
	const [value, setValue] = useState(() => {
		if (!editing) return '';
		return editing.discount_type === 'percent'
			? String(editing.percent_off ?? '')
			: ((editing.amount_off_cents ?? 0) / 100).toFixed(2).replace('.', ',');
	});
	const [appliesTo, setAppliesTo] = useState<CouponAppliesTo>(
		editing?.applies_to ?? 'all',
	);
	const [duration, setDuration] = useState<CouponDuration>(
		editing?.duration ?? 'once',
	);
	const [months, setMonths] = useState(
		editing?.duration_in_months ? String(editing.duration_in_months) : '',
	);
	const [maxUses, setMaxUses] = useState(
		editing?.max_uses != null ? String(editing.max_uses) : '',
	);
	const [maxPerCustomer, setMaxPerCustomer] = useState(
		editing?.max_uses_per_customer != null
			? String(editing.max_uses_per_customer)
			: '',
	);
	const [startsAt, setStartsAt] = useState(isoToLocalInput(editing?.starts_at));
	const [expiresAt, setExpiresAt] = useState(
		isoToLocalInput(editing?.expires_at),
	);
	const [active, setActive] = useState(editing?.active ?? true);

	const pending = create.isPending || update.isPending;

	function parseOptInt(raw: string): number | undefined | 'invalid' {
		if (raw.trim() === '') return undefined;
		const n = Number(raw);
		if (!Number.isInteger(n) || n < 1) return 'invalid';
		return n;
	}

	async function handleSubmit() {
		const normCode = code.trim().toUpperCase();
		if (!normCode) {
			toast.error('Informe o código do cupom');
			return;
		}

		let percentOff: number | undefined;
		let amountOffCents: number | undefined;
		if (discountType === 'percent') {
			const n = Number(value);
			if (!Number.isInteger(n) || n < 1 || n > 100) {
				toast.error('Percentual deve ser um inteiro de 1 a 100');
				return;
			}
			percentOff = n;
		} else {
			const reais = Number(value.replace(',', '.'));
			if (!Number.isFinite(reais) || reais <= 0) {
				toast.error('Informe um valor de desconto em reais maior que zero');
				return;
			}
			amountOffCents = Math.round(reais * 100);
		}

		let durationInMonths: number | undefined;
		if (duration === 'repeating') {
			const n = Number(months);
			if (!Number.isInteger(n) || n < 1) {
				toast.error('Informe por quantos meses o desconto se repete (≥ 1)');
				return;
			}
			durationInMonths = n;
		}

		const mu = parseOptInt(maxUses);
		if (mu === 'invalid') {
			toast.error('Máximo de usos deve ser um inteiro ≥ 1 (ou vazio = ∞)');
			return;
		}
		const mupc = parseOptInt(maxPerCustomer);
		if (mupc === 'invalid') {
			toast.error('Máximo por cliente deve ser um inteiro ≥ 1 (ou vazio = ∞)');
			return;
		}

		const payload: CreateCouponPayload = {
			code: normCode,
			discount_type: discountType,
			percent_off: percentOff,
			amount_off_cents: amountOffCents,
			applies_to: appliesTo,
			duration,
			duration_in_months: durationInMonths,
			max_uses: mu,
			max_uses_per_customer: mupc,
			starts_at: localInputToIso(startsAt),
			expires_at: localInputToIso(expiresAt),
			active,
		};

		try {
			if (isEdit && editing) {
				await update.mutateAsync({ id: editing.id, payload });
				toast.success('Cupom atualizado');
			} else {
				await create.mutateAsync(payload);
				toast.success('Cupom criado');
			}
			onClose();
		} catch (err) {
			const msg =
				(err as { response?: { data?: { message?: string } } })?.response?.data
					?.message === 'code_taken'
					? 'Já existe um cupom com esse código'
					: 'Erro ao salvar o cupom';
			toast.error(msg);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<button
				type="button"
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
				onKeyDown={(e) => {
					if (e.key === 'Escape') onClose();
				}}
			>
				<span className="sr-only">Fechar modal</span>
			</button>

			<div className="relative bg-[#1a1a1d] border border-gray-800 rounded-2xl w-full max-w-lg mx-4 p-6 shadow-2xl text-white max-h-[92vh] overflow-y-auto">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-xl font-bold">
						{isEdit ? 'Editar cupom' : 'Novo cupom'}
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#252528]"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="space-y-5">
					{/* Código */}
					<div>
						<label
							htmlFor="coupon-code"
							className="block text-sm font-medium text-gray-300 mb-2"
						>
							Código
						</label>
						<input
							id="coupon-code"
							value={code}
							onChange={(e) => setCode(e.target.value.toUpperCase())}
							placeholder="BEMVINDO10"
							className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm font-mono tracking-wide placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
						/>
					</div>

					{/* Tipo de desconto + valor */}
					<div>
						<span className="block text-sm font-medium text-gray-300 mb-2">
							Desconto
						</span>
						<div className="flex gap-2">
							<div className="flex rounded-xl bg-[#0d0d0f] border border-gray-700 p-1">
								<button
									type="button"
									onClick={() => setDiscountType('percent')}
									className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
										discountType === 'percent'
											? 'bg-violet-600 text-white'
											: 'text-gray-400 hover:text-white'
									}`}
								>
									<Percent className="w-4 h-4" />%
								</button>
								<button
									type="button"
									onClick={() => setDiscountType('fixed')}
									className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
										discountType === 'fixed'
											? 'bg-violet-600 text-white'
											: 'text-gray-400 hover:text-white'
									}`}
								>
									<Wallet className="w-4 h-4" />
									R$
								</button>
							</div>
							<div className="relative flex-1">
								<input
									id="coupon-value"
									value={value}
									onChange={(e) => setValue(e.target.value)}
									inputMode="decimal"
									placeholder={discountType === 'percent' ? '10' : '19,90'}
									className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 pr-10 text-sm placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
								/>
								<span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
									{discountType === 'percent' ? '%' : 'R$'}
								</span>
							</div>
						</div>
					</div>

					{/* Escopo */}
					<div>
						<span className="block text-sm font-medium text-gray-300 mb-2">
							Vale para
						</span>
						<div className="grid grid-cols-3 gap-2">
							{APPLIES.map((a) => (
								<button
									key={a.value}
									type="button"
									onClick={() => setAppliesTo(a.value)}
									className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
										appliesTo === a.value
											? 'border-violet-500/60 bg-violet-500/10'
											: 'border-gray-700 bg-[#0d0d0f] hover:border-gray-600'
									}`}
								>
									<p className="text-sm font-medium">{a.label}</p>
									<p className="text-[11px] text-gray-500">{a.hint}</p>
								</button>
							))}
						</div>
					</div>

					{/* Duração (assinaturas) */}
					<div>
						<span className="block text-sm font-medium text-gray-300 mb-2">
							Duração em assinaturas
						</span>
						<div className="flex gap-2">
							<div className="flex rounded-xl bg-[#0d0d0f] border border-gray-700 p-1 flex-1">
								{DURATIONS.map((d) => (
									<button
										key={d.value}
										type="button"
										onClick={() => setDuration(d.value)}
										className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
											duration === d.value
												? 'bg-violet-600 text-white'
												: 'text-gray-400 hover:text-white'
										}`}
									>
										{d.label}
									</button>
								))}
							</div>
							{duration === 'repeating' && (
								<input
									id="coupon-months"
									type="number"
									min={1}
									value={months}
									onChange={(e) => setMonths(e.target.value)}
									placeholder="meses"
									className="w-24 bg-[#0d0d0f] border border-gray-700 rounded-xl px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
								/>
							)}
						</div>
						<p className="text-xs text-gray-500 mt-1.5">
							Só afeta assinaturas (planos). Em pacotes de voxxys o desconto é
							sempre único.
						</p>
					</div>

					{/* Limites */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label
								htmlFor="coupon-max-uses"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								Máx. de usos{' '}
								<span className="text-gray-500 font-normal">(total)</span>
							</label>
							<input
								id="coupon-max-uses"
								type="number"
								min={1}
								value={maxUses}
								onChange={(e) => setMaxUses(e.target.value)}
								placeholder="∞"
								className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
							/>
						</div>
						<div>
							<label
								htmlFor="coupon-max-per-customer"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								Máx. por cliente
							</label>
							<input
								id="coupon-max-per-customer"
								type="number"
								min={1}
								value={maxPerCustomer}
								onChange={(e) => setMaxPerCustomer(e.target.value)}
								placeholder="∞"
								className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
							/>
						</div>
					</div>

					{/* Janela */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label
								htmlFor="coupon-starts-at"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								Começa em{' '}
								<span className="text-gray-500 font-normal">(opc.)</span>
							</label>
							<input
								id="coupon-starts-at"
								type="datetime-local"
								value={startsAt}
								onChange={(e) => setStartsAt(e.target.value)}
								className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-violet-500/50 transition-colors"
							/>
						</div>
						<div>
							<label
								htmlFor="coupon-expires-at"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								Expira em{' '}
								<span className="text-gray-500 font-normal">(opc.)</span>
							</label>
							<input
								id="coupon-expires-at"
								type="datetime-local"
								value={expiresAt}
								onChange={(e) => setExpiresAt(e.target.value)}
								className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-violet-500/50 transition-colors"
							/>
						</div>
					</div>

					{/* Ativo */}
					<label className="flex items-center justify-between gap-3 cursor-pointer">
						<span className="text-sm font-medium text-gray-300">
							Cupom ativo
							<span className="block text-xs text-gray-500 font-normal">
								Inativo não pode ser aplicado no checkout.
							</span>
						</span>
						<button
							type="button"
							role="switch"
							aria-checked={active}
							onClick={() => setActive((v) => !v)}
							className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
								active ? 'bg-violet-600' : 'bg-gray-700'
							}`}
						>
							<span
								className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
									active ? 'translate-x-5' : ''
								}`}
							/>
						</button>
					</label>
				</div>

				<div className="flex items-center gap-3 mt-6">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 px-5 py-3 rounded-xl font-medium text-sm bg-[#252528] hover:bg-[#2a2a2d] transition-colors"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={handleSubmit}
						disabled={pending}
						className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm bg-violet-600 hover:bg-violet-700 transition-colors disabled:opacity-50"
					>
						{pending && <Loader2 className="w-4 h-4 animate-spin" />}
						{isEdit ? 'Salvar' : 'Criar cupom'}
					</button>
				</div>
			</div>
		</div>
	);
}
