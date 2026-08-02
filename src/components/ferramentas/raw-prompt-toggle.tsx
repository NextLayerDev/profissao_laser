'use client';

import { Field } from '@/components/ferramentas/builder-ui';

/**
 * Liga/desliga o "prompt cru ao modelo" (raw_prompt). Quando ON, o motor
 * NÃO interpõe nada entre o prompt definido e o modelo: sem mensagem de system,
 * sem prefixo TEXT_LEAD, sem sufixo FORMATO OBRIGATÓRIO. Escopado aos Prompts
 * Mágicos curados — os blocos IA extras (removeBg/colorize/restoration) não
 * passam a flag e seguem com o system prompt padrão.
 */

export interface RawPromptToggleProps {
	value: boolean;
	onChange: (value: boolean | null) => void;
	disabled?: boolean;
}

export function RawPromptToggle({
	value,
	onChange,
	disabled,
}: RawPromptToggleProps) {
	return (
		<Field
			label="Prompt cru ao modelo"
			hint="Sem intermediação do sistema — o prompt curado vai direto ao modelo. Recomendado só p/ Prompts Mágicos curados."
		>
			<button
				type="button"
				disabled={disabled}
				onClick={() => onChange(!value)}
				aria-pressed={value}
				className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors disabled:opacity-40 ${
					value
						? 'border-emerald-400/40 bg-emerald-400/[0.07]'
						: 'border-white/10 bg-black/30'
				}`}
			>
				<div className="space-y-0.5">
					<p className="text-[13px] font-semibold text-slate-100">
						{value ? 'Ativado' : 'Desativado'}
					</p>
					<p className="text-[11px] text-slate-400">
						{value
							? 'O prompt curado é enviado sem system, sem lead e sem sufixo de formato.'
							: 'Usa o system prompt padrão + sufixo de formato (comportamento legado).'}
					</p>
				</div>
				<span
					className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
						value ? 'bg-emerald-400/80' : 'bg-slate-600/60'
					}`}
				>
					<span
						className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
							value ? 'translate-x-5' : 'translate-x-0.5'
						}`}
					/>
				</span>
			</button>
		</Field>
	);
}
