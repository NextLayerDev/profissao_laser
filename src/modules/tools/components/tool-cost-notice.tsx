'use client';

import { useRouter } from 'next/navigation';
import { VoxxysIcon } from '@/components/ui/voxxys-icon';
import { formatVox } from '@/lib/format';

interface Props {
	/** O que ESTA rodada vai debitar, já com variações e tiragem na conta. */
	cost: number;
	/** O preço de UMA geração — o "depois, X por uso" da cota. */
	unitCost: number;
	remainingFree: number | null;
	balance: number;
	insufficient: boolean;
	/**
	 * A cota vai absorver uma geração desta rodada.
	 *
	 * Separa "grátis" de "quase grátis", e é a diferença que importa: a cota
	 * cobre a PRIMEIRA geração, então uma rodada de 10 peças com cota ainda
	 * debita 9 gerações e as licenças. Dizer só "uso grátis este mês" ali seria
	 * prometer o que a fatura não cumpre.
	 */
	cotaCobreUma: boolean;
}

/**
 * Aviso inline padrão de custo de uma ferramenta (substitui o modal de
 * confirmação). Mostra o custo por uso; sem saldo, vira aviso + botão comprar.
 * Renderize logo abaixo da ação da ferramenta.
 */
export function ToolCostNotice({
	cost,
	unitCost,
	remainingFree,
	balance,
	insufficient,
	cotaCobreUma,
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

	const forte = 'text-slate-700 dark:text-gray-200';

	/**
	 * A cota absorve a rodada inteira. É o caso comum — uma geração, sem tiragem
	 * — e continua sendo dito do jeito de sempre.
	 */
	if (cotaCobreUma && cost === 0) {
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
				<span>
					<strong className={forte}>{remainingFree}</strong> uso(s) grátis este
					mês · depois{' '}
					<strong className={forte}>
						{formatVox(unitCost)} {unitCost === 1 ? 'voxxy' : 'voxxys'}
					</strong>
					/geração
				</span>
			</p>
		);
	}

	return (
		<p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-gray-400">
			<VoxxysIcon className="h-3.5 w-3.5" />
			<span>
				{/* A cota cobre a PRIMEIRA geração. Dizer isso na frente do preço é o
				    que impede a conta de parecer errada quando ela não é. */}
				{cotaCobreUma
					? 'Primeira geração pela sua cota · esta rodada custa '
					: 'Esta rodada custa '}
				<strong className={forte}>
					{formatVox(cost)} {unit}
				</strong>{' '}
				· saldo {formatVox(balance)}
			</span>
		</p>
	);
}
