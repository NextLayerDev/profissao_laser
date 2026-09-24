'use client';

import { Check } from 'lucide-react';
import type { CollectionFieldSpec } from '../../lib/collection-form';
import { fieldLabel } from '../../lib/collection-form';
import { type CorSugerida, normalizarCor } from '../../lib/marca';

/**
 * UMA COR DA MARCA — seletor + as cores achadas no logo.
 *
 * Substitui o campo de texto que o formulário genérico desenharia (o campo é
 * `text` na coleção, porque a coleção só tem 8 tipos e cor não é um deles).
 * Duas diferenças que importam:
 *
 *  1. **Campo vazio parece vazio.** O widget `color` do registry mostra
 *     `#000000` quando não há valor — ou seja, um campo que ninguém preencheu
 *     parece preto escolhido, e o que é salvo é NADA. Aqui, vazio diz que está
 *     vazio.
 *  2. **As cores do logo ficam a um clique.** Perguntar a cor primária em
 *     hexadecimal é a pergunta que quase ninguém sabe responder; o logo já
 *     respondeu.
 */
export function CampoCor({
	field,
	value,
	onChange,
	sugestoes,
}: {
	field: CollectionFieldSpec;
	value: unknown;
	onChange: (v: unknown) => void;
	/** Cores dominantes do logo enviado agora. Vazio = sem envio nesta sessão. */
	sugestoes: CorSugerida[];
}) {
	const id = `marca-cor-${field.name}`;
	const bruto = typeof value === 'string' ? value : '';
	const hex = normalizarCor(bruto);

	return (
		<div className="space-y-2">
			<label
				htmlFor={id}
				className="block text-sm font-medium text-slate-700 dark:text-slate-300"
			>
				{fieldLabel(field)}
			</label>

			<div className="flex items-center gap-2">
				<input
					id={id}
					type="color"
					// Sem cor escolhida o seletor precisa abrir em ALGUMA cor: abre no
					// branco e o texto ao lado continua vazio, então nada é dado como
					// escolhido enquanto o aluno não escolhe.
					value={hex ?? '#ffffff'}
					onChange={(e) => onChange(e.target.value)}
					className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-transparent p-0.5 dark:border-white/10"
				/>
				<input
					type="text"
					value={bruto}
					placeholder={field.placeholder ?? 'Escolha no quadrado ao lado'}
					onChange={(e) => onChange(e.target.value)}
					className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--screen-accent,#7c3aed)_45%,transparent)] dark:border-white/10 dark:bg-[#111] dark:text-slate-300"
				/>
				{bruto ? (
					<button
						type="button"
						onClick={() => onChange(undefined)}
						className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10"
					>
						Limpar
					</button>
				) : null}
			</div>

			{sugestoes.length ? (
				<div className="flex flex-wrap items-center gap-1.5">
					<span className="text-[11px] text-slate-500 dark:text-slate-400">
						Do seu logo:
					</span>
					{sugestoes.map((c) => {
						const ativa = hex === c.hex;
						return (
							<button
								key={c.hex}
								type="button"
								onClick={() => onChange(c.hex)}
								title={c.hex}
								aria-label={`Usar a cor ${c.hex}`}
								aria-pressed={ativa}
								className={`grid h-7 w-7 place-items-center rounded-full border transition-transform hover:scale-110 ${
									ativa
										? 'border-slate-900 dark:border-white'
										: 'border-slate-200 dark:border-white/20'
								}`}
								style={{ backgroundColor: c.hex }}
							>
								{ativa ? (
									<Check
										className="h-3.5 w-3.5"
										style={{ color: '#ffffff', mixBlendMode: 'difference' }}
									/>
								) : null}
							</button>
						);
					})}
				</div>
			) : null}

			{/* Escrever a cor por extenso é permitido pela coleção ("ou o nome
			    dela"), e o modelo entende. Quem não entende é a PRÉVIA — dizer isso
			    é melhor do que ela desenhar uma cor neutra sem explicação. */}
			{bruto && !hex ? (
				<p className="text-xs text-slate-500 dark:text-slate-400">
					Anotado. Como não é um código de cor, a prévia mostra uma cor neutra
					no lugar — clique no quadrado se quiser vê-la de verdade.
				</p>
			) : null}

			{field.hint ? (
				<p className="text-xs text-slate-500 dark:text-slate-400">
					{field.hint}
				</p>
			) : null}
		</div>
	);
}
