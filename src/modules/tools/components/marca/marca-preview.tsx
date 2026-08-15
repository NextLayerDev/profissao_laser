'use client';

import { AlertCircle } from 'lucide-react';
import {
	avisosDaMarca,
	COR_PADRAO,
	fonteSegura,
	iniciais,
	type Marca,
	textoSobre,
} from '../../lib/marca';

/**
 * A PRÉVIA DA MARCA — o aluno precisa VER antes de salvar.
 *
 * Um formulário de dez campos pede cor, fonte e tom e não mostra nada; o aluno
 * só descobre o que escolheu quando a primeira arte sai errada. Aqui ele vê,
 * enquanto digita, o logo dele sobre as cores dele num exemplo de peça.
 *
 * É deliberadamente SIMPLES e honesta: não promete o layout da arte final (quem
 * decide isso é o modelo), promete as CORES, o LOGO e o TOM que vão amarrar a
 * geração. Prometer mais seria uma promessa que a geração não cumpre.
 */

const FRASE_PADRAO = 'quem valoriza um acabamento bem-feito';

export function MarcaPreview({
	marca,
	className,
}: {
	marca: Marca;
	className?: string;
}) {
	const fundo = marca.fundo ?? COR_PADRAO.fundo;
	const primaria = marca.primaria ?? COR_PADRAO.primaria;
	const secundaria = marca.secundaria ?? COR_PADRAO.secundaria;
	const nome = marca.nome || 'Sua marca';
	const fonte = fonteSegura(marca.fonte);
	const avisos = avisosDaMarca(marca);

	return (
		<div className={`space-y-3 ${className ?? ''}`}>
			<p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
				Como fica
			</p>

			<div
				className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-white/10"
				style={{ backgroundColor: fundo, fontFamily: fonte }}
			>
				<div className="flex aspect-[4/5] flex-col justify-between p-5">
					<div className="flex items-center gap-2.5">
						{marca.logo ? (
							// <img> intencional: é uma URL de CDN que muda a cada envio.
							<img
								src={marca.logo}
								alt=""
								className="h-10 w-10 shrink-0 rounded-lg object-contain"
							/>
						) : (
							<span
								className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-sm font-bold"
								style={{
									backgroundColor: primaria,
									color: textoSobre(primaria),
								}}
							>
								{iniciais(nome)}
							</span>
						)}
						<span
							className="min-w-0 truncate text-sm font-bold"
							style={{ color: primaria }}
						>
							{nome}
						</span>
					</div>

					<div className="space-y-2">
						<span
							className="block h-1 w-10 rounded-full"
							style={{ backgroundColor: secundaria }}
						/>
						{/* Recortado: "para quem você vende" aceita 20 000 caracteres, e um
						    aluno detalhista empurraria o resto da peça para fora do cartão. */}
						<p
							className="line-clamp-3 text-lg font-bold leading-tight"
							style={{ color: primaria }}
						>
							Feito para {marca.publico || FRASE_PADRAO}
						</p>
						<p
							className="line-clamp-2 text-xs leading-snug"
							style={{ color: secundaria }}
						>
							{marca.tom
								? `Uma peça no tom ${marca.tom}, com a sua identidade.`
								: 'Uma peça com a sua identidade, do jeito que você fala.'}
						</p>
					</div>

					<span
						className="inline-flex w-fit rounded-full px-3.5 py-1.5 text-xs font-semibold"
						style={{
							backgroundColor: secundaria,
							color: textoSobre(secundaria),
						}}
					>
						Fale com a gente
					</span>
				</div>
			</div>

			{marca.exemplo ? (
				<div className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-2 dark:border-white/10">
					{/* <img> intencional: endereço de uma peça que o aluno gostou. */}
					<img
						src={marca.exemplo}
						alt=""
						className="h-10 w-10 shrink-0 rounded-lg object-cover"
					/>
					<p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
						Peça de referência — a IA olha para ela ao criar.
					</p>
				</div>
			) : null}

			<p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
				Exemplo aproximado. O que a prévia garante são as cores, o logo e o tom
				— o desenho de cada arte quem faz é a ferramenta.
				{marca.fonte
					? ` A fonte “${marca.fonte}” só aparece aqui se estiver instalada neste computador; nas artes ela é pedida à IA.`
					: ''}
			</p>

			{avisos.length ? (
				<ul className="space-y-1.5">
					{avisos.map((a) => (
						<li
							key={a}
							className="flex items-start gap-1.5 text-[11px] leading-snug text-amber-700 dark:text-amber-400"
						>
							<AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
							<span>{a}</span>
						</li>
					))}
				</ul>
			) : null}
		</div>
	);
}
