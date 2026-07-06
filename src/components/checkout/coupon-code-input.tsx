'use client';

import { useMutation } from '@tanstack/react-query';
import { Check, Loader2, Tag, X } from 'lucide-react';
import { useState } from 'react';
import { validateCoupon } from '@/services/upvox-coupons';
import {
	couponReasonLabel,
	type ValidateCouponPayload,
} from '@/types/upvox-coupons';

function fmtBRL(cents: number): string {
	return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

interface CouponCodeInputProps {
	context: 'plan' | 'vox';
	planKey?: string;
	interval?: 'monthly' | 'yearly';
	voxPackageId?: string;
	/** Código validado (ou null quando removido/inválido). */
	onApplied: (code: string | null) => void;
	className?: string;
}

export function CouponCodeInput({
	context,
	planKey,
	interval,
	voxPackageId,
	onApplied,
	className,
}: CouponCodeInputProps) {
	const [code, setCode] = useState('');
	const [applied, setApplied] = useState<{
		code: string;
		discount: number;
		total: number;
		original: number;
	} | null>(null);
	const [error, setError] = useState<string | null>(null);

	const mut = useMutation({
		mutationFn: () =>
			validateCoupon({
				code: code.trim(),
				context,
				plan_key: planKey,
				interval,
				vox_package_id: voxPackageId,
			} as ValidateCouponPayload),
		onSuccess: (res) => {
			if (res.valid) {
				setApplied({
					code: code.trim().toUpperCase(),
					discount: res.discount_cents,
					total: res.discounted_total_cents,
					original: res.original_total_cents,
				});
				setError(null);
				onApplied(code.trim());
			} else {
				setError(couponReasonLabel(res.reason));
				setApplied(null);
				onApplied(null);
			}
		},
		onError: () => {
			setError('Não foi possível validar o cupom.');
			setApplied(null);
			onApplied(null);
		},
	});

	function remove() {
		setApplied(null);
		setCode('');
		setError(null);
		onApplied(null);
	}

	if (applied) {
		return (
			<div className={className}>
				<div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-3">
					<div className="flex items-center gap-2 min-w-0">
						<Check className="w-4 h-4 text-emerald-400 shrink-0" />
						<div className="min-w-0">
							<p className="text-sm font-semibold text-emerald-300 truncate">
								Cupom {applied.code} aplicado
							</p>
							<p className="text-xs text-emerald-200/80">
								−{fmtBRL(applied.discount)} · agora {fmtBRL(applied.total)}{' '}
								<span className="line-through opacity-60">
									{fmtBRL(applied.original)}
								</span>
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={remove}
						className="text-xs text-emerald-200/80 hover:text-white shrink-0"
					>
						remover
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className={className}>
			<div className="flex items-stretch gap-2">
				<div className="relative flex-1">
					<Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
					<input
						value={code}
						onChange={(e) => {
							setCode(e.target.value.toUpperCase());
							setError(null);
						}}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && code.trim()) mut.mutate();
						}}
						placeholder="Cupom de desconto"
						className="w-full rounded-xl border border-white/15 bg-white/5 pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/60"
					/>
				</div>
				<button
					type="button"
					disabled={!code.trim() || mut.isPending}
					onClick={() => mut.mutate()}
					className="px-4 rounded-xl text-sm font-semibold bg-white/10 text-white hover:bg-white/15 transition-colors disabled:opacity-50 flex items-center gap-1.5"
				>
					{mut.isPending ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						'Aplicar'
					)}
				</button>
			</div>
			{error && (
				<p className="mt-1.5 text-xs text-red-300 flex items-center gap-1">
					<X className="w-3 h-3" />
					{error}
				</p>
			)}
		</div>
	);
}
