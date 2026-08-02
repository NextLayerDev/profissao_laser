'use client';

import { Field } from '@/components/ferramentas/builder-ui';

/**
 * Quais quantidades de variação (Passo 3) o admin oferece — ex.: [1,2,4].
 * O cliente vê toggles "1× / 2× / 4×"; o número escolhido vira `variation_count`
 * no run. Vazio = esconde o Passo 3 (tool gera 1 por default).
 *
 * `return_variations` é a allowlist; a API rejeita valores fora dela (400).
 */

const OPTIONS = [1, 2, 4];

export interface ReturnVariationsControlProps {
	value: number[];
	onChange: (value: number[] | null) => void;
	disabled?: boolean;
}

export function ReturnVariationsControl({
	value,
	onChange,
	disabled,
}: ReturnVariationsControlProps) {
	const toggle = (n: number) => {
		if (value.includes(n)) {
			// Nunca esvazia por completo — garante pelo menos 1 opção ativa.
			if (value.length === 1) return;
			onChange(value.filter((v) => v !== n));
		} else {
			onChange([...value, n].sort((a, b) => a - b));
		}
	};

	return (
		<Field
			label="Variações oferecidas (Passo 3)"
			hint="Quais quantidades de imagem o cliente pode escolher. O primeiro ativo é o default. Vazio = esconde o Passo 3."
		>
			<div className="flex flex-wrap gap-2">
				{OPTIONS.map((n) => {
					const on = value.includes(n);
					return (
						<button
							key={n}
							type="button"
							disabled={disabled}
							onClick={() => toggle(n)}
							className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-40 ${
								on
									? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
									: 'border-white/10 bg-black/30 text-slate-400 hover:text-slate-200'
							}`}
						>
							<span className="text-[15px] leading-none">{n}×</span>
							{n === 1 ? '1 imagem' : `${n} imagens`}
							{value[0] === n && on && (
								<span className="ml-1 rounded-full bg-emerald-400/20 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-emerald-200">
									default
								</span>
							)}
						</button>
					);
				})}
			</div>
		</Field>
	);
}
