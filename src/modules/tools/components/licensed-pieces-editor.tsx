'use client';

import { ImagePlus, Plus, Trash2, X } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { MONO } from './licenciada-ui';

/**
 * A LISTA DE PEÇAS — o que muda de uma para a outra dentro do mesmo lote.
 *
 * Um lote uniforme são N cópias da mesma arte, cada uma com seu código: é o
 * brinde, 50 copos iguais. O que a loja de fato vende é o oposto — 30 canecas,
 * cada uma com o nome (ou a foto) de uma pessoa. Ali cada peça é uma geração
 * própria, e é por isso que a conta muda: 30 nomes são 30 chamadas ao modelo,
 * não uma cópia repetida 30 vezes.
 *
 * A tela precisa carregar essa diferença sem explicá-la num parágrafo. Ela faz
 * isso pela FORMA: o lote uniforme é um número, o lote personalizado é uma
 * lista. Quem vê a lista já entende por que ela custa por linha.
 */

export interface PecaDaLista {
	/** O que muda nesta peça: o nome, a frase. Vazio = só a foto muda. */
	tema: string;
	/** A foto desta peça. Nula = a peça usa a referência geral do formulário. */
	imagem: File | null;
}

export const pecaVazia = (): PecaDaLista => ({ tema: '', imagem: null });

const CAMPO =
	'w-full rounded-md border border-[var(--al-rule)] bg-[var(--al-ground)] px-3 py-2 text-sm text-[var(--al-ink)] outline-none placeholder:text-[var(--al-mute)] focus:border-[color-mix(in_srgb,var(--al-ink)_35%,transparent)]';

const BOTAO =
	'inline-flex items-center gap-1.5 rounded-md border border-[var(--al-rule)] bg-[var(--al-card)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--al-ink)] transition-colors hover:border-[color-mix(in_srgb,var(--al-ink)_30%,transparent)]';

export function LicensedPiecesEditor({
	pecas,
	onChange,
	max,
}: {
	pecas: PecaDaLista[];
	onChange: (p: PecaDaLista[]) => void;
	max: number;
}) {
	const [colar, setColar] = useState('');
	const colarId = useId();
	const fotosRef = useRef<HTMLInputElement>(null);

	const alterar = (i: number, patch: Partial<PecaDaLista>) =>
		onChange(pecas.map((p, j) => (j === i ? { ...p, ...patch } : p)));

	const remover = (i: number) =>
		onChange(pecas.length > 1 ? pecas.filter((_, j) => j !== i) : pecas);

	const adicionar = () =>
		pecas.length < max && onChange([...pecas, pecaVazia()]);

	/**
	 * Colar a lista é o caminho REAL: o nome das 30 pessoas já existe numa
	 * planilha, num grupo de WhatsApp, no pedido do cliente. Digitar linha a
	 * linha seria pedir que ele redigitasse o que já tem.
	 */
	const usarLista = () => {
		const nomes = colar
			.split('\n')
			.map((l) => l.trim())
			.filter(Boolean)
			.slice(0, max);
		if (nomes.length === 0) return;
		// As fotos já escolhidas ficam onde estão — a lista muda o texto, não o
		// resto do trabalho já feito.
		onChange(
			nomes.map((tema, i) => ({ tema, imagem: pecas[i]?.imagem ?? null })),
		);
		setColar('');
	};

	/** Fotos escolhidas de uma vez caem nas linhas em ordem, criando as que faltam. */
	const usarFotos = (arquivos: FileList | null) => {
		if (!arquivos || arquivos.length === 0) return;
		const fotos = Array.from(arquivos).slice(0, max);
		const proximas = [...pecas];
		fotos.forEach((f, i) => {
			if (proximas[i]) proximas[i] = { ...proximas[i], imagem: f };
			else proximas.push({ tema: '', imagem: f });
		});
		onChange(proximas.slice(0, max));
	};

	return (
		<div className="space-y-3">
			{/* Colar a lista pronta + escolher as fotos de uma vez */}
			<div className="rounded-lg border border-dashed border-[var(--al-rule)] p-3">
				<label htmlFor={colarId} className={`${MONO} text-[var(--al-mute)]`}>
					Cole a lista, um nome por linha
				</label>
				<textarea
					id={colarId}
					rows={3}
					value={colar}
					onChange={(e) => setColar(e.target.value)}
					placeholder={'Marina\nJoão\nBeatriz'}
					className={`${CAMPO} mt-1.5 resize-y`}
				/>
				<div className="mt-2 flex flex-wrap items-center gap-1.5">
					<button
						type="button"
						onClick={usarLista}
						disabled={!colar.trim()}
						className={`${BOTAO} disabled:opacity-40`}
					>
						Usar esta lista
					</button>
					<button
						type="button"
						onClick={() => fotosRef.current?.click()}
						className={BOTAO}
					>
						<ImagePlus className="h-3 w-3" />
						Escolher as fotos
					</button>
					<input
						ref={fotosRef}
						type="file"
						accept="image/*"
						multiple
						hidden
						onChange={(e) => {
							usarFotos(e.target.files);
							e.target.value = '';
						}}
					/>
				</div>
			</div>

			{/* Uma linha por peça */}
			<ul className="space-y-2">
				{pecas.map((p, i) => (
					// A posição É a identidade da peça no lote: "peça 3" é a terceira,
					// e reordenar a lista é reordenar as peças.
					<li
						key={i}
						className="flex items-center gap-2 rounded-md border border-[var(--al-rule)] bg-[var(--al-card)] p-2"
					>
						<span
							className={`${MONO} w-7 shrink-0 text-center text-[var(--al-mute)]`}
						>
							{String(i + 1).padStart(2, '0')}
						</span>
						<input
							value={p.tema}
							onChange={(e) => alterar(i, { tema: e.target.value })}
							placeholder={`Nome ou frase da peça ${i + 1}`}
							className={CAMPO}
						/>
						{p.imagem ? (
							<button
								type="button"
								onClick={() => alterar(i, { imagem: null })}
								title={`Tirar a foto da peça ${i + 1}`}
								className="flex shrink-0 items-center gap-1 rounded-md border border-[var(--al-rule)] px-2 py-1.5 text-[11px] text-[var(--al-ink)]"
							>
								<X className="h-3 w-3" />
								<span className="max-w-[9rem] truncate">{p.imagem.name}</span>
							</button>
						) : (
							<label
								className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-dashed border-[var(--al-rule)] px-2 py-1.5 text-[11px] text-[var(--al-mute)]"
								title={`Escolher a foto da peça ${i + 1}`}
							>
								<ImagePlus className="h-3 w-3" />
								Foto
								<input
									type="file"
									accept="image/*"
									hidden
									onChange={(e) => {
										const f = e.target.files?.[0];
										if (f) alterar(i, { imagem: f });
										e.target.value = '';
									}}
								/>
							</label>
						)}
						<button
							type="button"
							onClick={() => remover(i)}
							disabled={pecas.length === 1}
							title={`Tirar a peça ${i + 1} do lote`}
							className="shrink-0 rounded-md p-1.5 text-[var(--al-mute)] transition-colors hover:text-[var(--al-ink)] disabled:opacity-30"
						>
							<Trash2 className="h-3.5 w-3.5" />
						</button>
					</li>
				))}
			</ul>

			<div className="flex items-center justify-between gap-2">
				<button
					type="button"
					onClick={adicionar}
					disabled={pecas.length >= max}
					className={`${BOTAO} disabled:opacity-40`}
				>
					<Plus className="h-3 w-3" />
					Mais uma peça
				</button>
				<span className={`${MONO} text-[var(--al-mute)]`}>
					{pecas.length} de {max}
				</span>
			</div>
		</div>
	);
}
