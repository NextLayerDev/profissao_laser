'use client';

import { Wand2 } from 'lucide-react';
import type { CorSugerida } from '../../lib/marca';

/**
 * AS CORES QUE VIERAM COM O LOGO.
 *
 * Aparece logo abaixo do envio do logo, porque é ali que o aluno acabou de dar
 * ao sistema a informação que responde a pergunta mais difícil do cadastro. A
 * paleta vem no MESMO round-trip do envio (o servidor já tinha os pixels na
 * mão) — sem endpoint novo, sem "analisar imagem", sem espera.
 *
 * Quando o logo sobe, as cores já entram nos campos vazios; este bloco mostra o
 * que foi encontrado e deixa refazer. Degrada em silêncio: back sem paleta na
 * resposta ⇒ nada é desenhado e o resto do cadastro segue igual.
 */
export function PaletaDoLogo({
	cores,
	onAplicar,
}: {
	cores: CorSugerida[];
	/** Reaplica as cores do logo, por cima do que estiver preenchido. */
	onAplicar: () => void;
}) {
	if (!cores.length) return null;

	return (
		<div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-white/10 dark:bg-white/5">
			<p className="text-sm font-medium text-slate-700 dark:text-slate-300">
				Estas são as cores do seu logo
			</p>
			<div className="mt-2 flex flex-wrap items-center gap-2">
				{cores.map((c) => (
					<span
						key={c.hex}
						className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 dark:border-white/10 dark:bg-[#111]"
					>
						<span
							className="h-5 w-5 rounded-full border border-black/10"
							style={{ backgroundColor: c.hex }}
						/>
						<span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
							{typeof c.share === 'number'
								? `${Math.round(c.share * 100)}% do logo`
								: c.hex}
						</span>
					</span>
				))}
			</div>
			<button
				type="button"
				onClick={onAplicar}
				className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[var(--screen-accent,#7c3aed)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:brightness-110"
			>
				<Wand2 className="h-3.5 w-3.5" />
				Preencher as cores com estas
			</button>
			<p className="mt-2 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
				A cor que mais aparece vira a principal e a próxima bem diferente vira a
				de apoio — já preenchidas aqui embaixo, é só conferir. A cor de fundo
				fica com você: fundo de logo costuma ser só o branco do arquivo.
			</p>
		</div>
	);
}
