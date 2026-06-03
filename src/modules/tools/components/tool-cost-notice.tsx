'use client';

import { useRouter } from 'next/navigation';
import { VoxxysIcon } from '@/components/ui/voxxys-icon';
import { formatVox } from '@/lib/format';

interface Props {
	cost: number;
	remainingFree: number | null;
	balance: number;
	insufficient: boolean;
}

/**
 * Aviso inline padrão de custo de uma ferramenta (substitui o modal de
 * confirmação). Mostra o custo por uso; sem saldo, vira aviso + botão comprar.
 * Renderize logo abaixo da ação da ferramenta.
 */
export function ToolCostNotice({
	cost,
	remainingFree,
	balance,
	insufficient,
}: Props) {
	const router = useRouter();
	const unit = cost === 1 ? 'voxxy' : 'voxxys';

	if (insufficient) {
		return (
			<div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-2 dark:border-amber-500/30 dark:bg-amber-950/20">
				<p className="text-xs text-amber-700 dark:text-amber-300">
					Saldo insuficiente — custa{' '}
					<strong>
						{formatVox(cost)} {unit}
					</strong>{' '}
					e você tem <strong>{formatVox(balance)}</strong>.
				</p>
				<button
					type="button"
					onClick={() => router.push('/course/voxes')}
					className="shrink-0 rounded-md bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-violet-700"
				>
					Comprar voxxys
				</button>
			</div>
		);
	}

	// Cota ilimitada (incluída no plano) → nunca cobra.
	if (remainingFree === null) {
		return (
			<p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-gray-400">
				<VoxxysIcon className="h-3.5 w-3.5" />
				Incluído no seu plano — sem custo por uso.
			</p>
		);
	}

	return (
		<p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-gray-400">
			<VoxxysIcon className="h-3.5 w-3.5" />
			{remainingFree > 0 ? (
				<span>
					<strong className="text-slate-700 dark:text-gray-200">
						{remainingFree}
					</strong>{' '}
					uso(s) grátis este mês · depois{' '}
					<strong className="text-slate-700 dark:text-gray-200">
						{formatVox(cost)} {unit}
					</strong>
					/uso
				</span>
			) : (
				<span>
					Custa{' '}
					<strong className="text-slate-700 dark:text-gray-200">
						{formatVox(cost)} {unit}
					</strong>{' '}
					por uso · saldo {formatVox(balance)}
				</span>
			)}
		</p>
	);
}
