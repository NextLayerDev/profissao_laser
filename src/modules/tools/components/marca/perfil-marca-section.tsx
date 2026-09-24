'use client';

import { Check, Loader2, Palette, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { useMarcaAtiva, useMarcaDisponivel } from '../../hooks/use-marca';
import {
	COR_PADRAO,
	iniciais,
	lerMarca,
	type Marca,
	textoSobre,
} from '../../lib/marca';
import type { CollectionEntry } from '../../services/collections.service';
import { MarcaForm } from './marca-form';

/**
 * "MINHA MARCA" DENTRO DO PERFIL — uma seção, não uma ferramenta.
 *
 * ┌─ POR QUE O CADASTRO SAIU DA FÁBRICA E VEIO PARA CÁ ─────────────────────┐
 * │ O pedido do dono foi literal: "minha marca podia ser algo que tem em     │
 * │ todos os perfis (…) não quero como ferramenta, eu quero algo como editar │
 * │ o perfil mesmo, e aparece ali configure sua marca (…) daí eu consigo     │
 * │ usar em mais ferramentas e vai ser algo universal. E isso tem que ser    │
 * │ OPCIONAL".                                                               │
 * │                                                                          │
 * │ E a razão técnica bate com a de produto: enquanto o cadastro morava      │
 * │ dentro do Estúdio de Imagens, ele herdava o ciclo de vida daquela tool — │
 * │ tool em rascunho, cadastro em 404 para todo aluno fora da allowlist.     │
 * │ Agora o dado mora num contêiner próprio (`perfil`) e a tela é este       │
 * │ cartão, na mesma pilha do avatar, do banner e da senha.                  │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─ AS DUAS REGRAS QUE NÃO PODEM SER AFROUXADAS ───────────────────────────┐
 * │ 1. OPCIONAL de verdade. Quem nunca configurar marca vê um convite, e     │
 * │    nada mais: nenhum aviso, nenhum vermelho, nenhuma pendência. Toda     │
 * │    ferramenta continua funcionando sem marca — "nenhuma" é estado        │
 * │    NORMAL do pipeline, não erro.                                         │
 * │ 2. NUNCA QUEBRADA. Se o contêiner não responde para quem está olhando    │
 * │    (é o caso enquanto ele estiver em `draft`, fora da allowlist de       │
 * │    preview), a seção simplesmente NÃO EXISTE. A página de perfil é de    │
 * │    todo aluno logado: um cartão âmbar de "não liberado" no meio dela     │
 * │    seria pior do que seção nenhuma, e um botão que leva a 404 é pior     │
 * │    ainda. Quem responde essa pergunta é `useMarcaDisponivel()`.          │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─ A MARCA QUE VALE É A DO SERVIDOR ──────────────────────────────────────┐
 * │ O selo "Em uso" sai de `useMarcaAtiva()`, a MESMA leitura que as         │
 * │ ferramentas fazem, e "Usar esta" GRAVA (`usar(id)` faz PATCH no campo    │
 * │ `principal`). Já houve a versão em que a escolha vivia só no             │
 * │ `localStorage`: a tela dizia "em uso" numa marca e a arte saía com       │
 * │ outra, sem erro e sem como desconfiar. Se esta tela voltar a calcular a  │
 * │ escolha por conta própria, o defeito volta junto.                        │
 * └──────────────────────────────────────────────────────────────────────────┘
 */

/** As classes do perfil, copiadas de lá para a seção não parecer enxerto. */
const cardClass =
	'bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl p-6';
const botaoPrimario =
	'inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-60';
const botaoNeutro =
	'inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5';

type Modo =
	| { tipo: 'lista' }
	| { tipo: 'nova' }
	| { tipo: 'editar'; entry: CollectionEntry };

/**
 * Um cartão da marca — o logo sobre a cor de fundo dela, a paleta e o selo.
 *
 * Desenha a marca do jeito que ela vai aparecer na arte, e não como uma linha
 * de formulário: o aluno reconhece a identidade dele pela cara, não pelo nome
 * do campo. É a única parte da tela antiga que sobreviveu inteira.
 */
function CartaoDaMarca({
	marca,
	emUso,
	gravando,
	onEditar,
	onUsar,
}: {
	marca: Marca;
	emUso: boolean;
	gravando: boolean;
	onEditar: () => void;
	onUsar: () => void;
}) {
	const fundo = marca.fundo ?? COR_PADRAO.fundo;
	const primaria = marca.primaria ?? COR_PADRAO.primaria;
	const cores = [marca.primaria, marca.secundaria, marca.fundo].filter(
		(c): c is string => !!c,
	);

	return (
		<article
			className={`overflow-hidden rounded-2xl border transition-shadow hover:shadow-md ${
				emUso
					? 'border-violet-400 dark:border-violet-500/60'
					: 'border-slate-200 dark:border-white/10'
			}`}
		>
			<div
				className="flex items-center gap-3 px-4 py-5"
				style={{ backgroundColor: fundo }}
			>
				{marca.logo ? (
					// <img> intencional: URL de CDN que muda a cada envio.
					<img
						src={marca.logo}
						alt=""
						className="h-11 w-11 shrink-0 rounded-lg object-contain"
					/>
				) : (
					<span
						className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-sm font-bold"
						style={{ backgroundColor: primaria, color: textoSobre(primaria) }}
					>
						{iniciais(marca.titulo)}
					</span>
				)}
				{/* O cartão mostra o TÍTULO — é por ele que o aluno reconhece o
				    cadastro na lista. `data.nome` é o nome que vai na arte. */}
				<span
					className="min-w-0 truncate text-base font-bold"
					style={{ color: primaria }}
				>
					{marca.titulo || 'Sem nome'}
				</span>
			</div>

			<div className="space-y-3 bg-slate-50 p-4 dark:bg-white/[0.03]">
				<div className="flex items-center gap-1.5">
					{cores.length ? (
						cores.map((c) => (
							<span
								key={c}
								title={c}
								className="h-4 w-4 rounded-full border border-black/10 dark:border-white/20"
								style={{ backgroundColor: c }}
							/>
						))
					) : (
						<span className="text-xs text-slate-400">Sem cores definidas</span>
					)}
					{gravando ? (
						<span className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
							<Loader2 className="h-3 w-3 animate-spin" />
							Salvando
						</span>
					) : emUso ? (
						<span className="ml-auto inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
							<Check className="h-3 w-3" />
							Em uso
						</span>
					) : null}
				</div>

				{marca.tom || marca.publico ? (
					<p className="line-clamp-2 text-xs leading-snug text-slate-500 dark:text-slate-400">
						{[marca.tom, marca.publico].filter(Boolean).join(' · ')}
					</p>
				) : null}

				<div className="flex flex-wrap gap-2">
					<button type="button" onClick={onEditar} className={botaoNeutro}>
						<Pencil className="h-3.5 w-3.5" />
						Editar
					</button>
					{emUso ? null : (
						<button
							type="button"
							onClick={onUsar}
							disabled={gravando}
							className={botaoNeutro}
						>
							<Check className="h-3.5 w-3.5" />
							Usar esta
						</button>
					)}
				</div>
			</div>
		</article>
	);
}

export function PerfilMarcaSection() {
	const { disponivel, isLoading: carregandoDef } = useMarcaDisponivel();
	const {
		entries,
		entry: emUso,
		escolhaId,
		escolher,
		usar,
		isLoading,
		isError,
	} = useMarcaAtiva();
	const [modo, setModo] = useState<Modo>({ tipo: 'lista' });
	/** O id cuja gravação de `principal` ainda está no ar (o "Salvando"). */
	const [gravandoId, setGravandoId] = useState<string | null>(null);

	/**
	 * NADA enquanto não se sabe, e NADA quando não dá.
	 *
	 * Não é um estado de erro: é a diferença entre "o perfil de quem não tem
	 * acesso continua sendo o perfil de sempre" e "todo aluno passa a ver um
	 * cartão cinza dizendo que algo não está liberado". Também não desenhamos
	 * esqueleto: um placeholder que às vezes vira nada pisca a página inteira.
	 */
	if (carregandoDef || !disponivel) return null;

	/**
	 * `entrada` só é passada por quem acabou de salvar — logo depois do cadastro
	 * o registro ainda não está na lista em cache, e sem ele `usar` desistiria
	 * calada, deixando a marca nova sem `principal`. Ver `usar` em `use-marca`.
	 */
	const trocar = async (id: string, entrada?: CollectionEntry) => {
		setGravandoId(id);
		try {
			await usar(id, entrada);
		} finally {
			setGravandoId(null);
		}
	};

	/**
	 * O formulário SUBSTITUI o conteúdo da seção, não a página.
	 *
	 * Na tela antiga o modo de edição trocava a página inteira; aqui isso
	 * apagaria avatar, banner e senha. E o formulário é grande (11 campos + a
	 * prévia lateral), então ele nunca abre sozinho: quem não quer configurar
	 * marca nunca vê mais do que o cartão resumido.
	 */
	if (modo.tipo !== 'lista') {
		return (
			<section id="marca" className="scroll-mt-24">
				<MarcaForm
					entry={modo.tipo === 'editar' ? modo.entry : null}
					onClose={() => setModo({ tipo: 'lista' })}
					onSaved={(salvo) => {
						// Quem acabou de cadastrar/editar quer USAR esta marca agora — e
						// `usar` grava isso no SERVIDOR, não só neste navegador. O registro
						// vai junto porque a lista em cache ainda não o tem.
						void trocar(salvo.id, salvo);
						setModo({ tipo: 'lista' });
					}}
					onDeleted={(id) => {
						if (escolhaId === id) escolher(null);
						setModo({ tipo: 'lista' });
					}}
				/>
			</section>
		);
	}

	return (
		<section id="marca" className={`${cardClass} scroll-mt-24`}>
			<h3 className="mb-1 flex items-center gap-2 font-display text-base font-bold text-slate-900 dark:text-white">
				<Palette className="h-4 w-4 text-violet-500" />
				Minha marca
				<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-white/10 dark:text-slate-400">
					Opcional
				</span>
			</h3>
			<p className="mb-4 text-sm text-slate-500 dark:text-gray-400">
				Configure a identidade da sua empresa e as suas artes saem com a sua
				cor, a sua letra e o seu jeito de falar. Sem isso, as ferramentas
				continuam funcionando normalmente.
			</p>

			{isError ? (
				<p className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
					Não consegui carregar a sua marca agora. Recarregue a página em
					instantes.
				</p>
			) : null}

			{isLoading ? (
				<div className="flex items-center justify-center py-6">
					<Loader2 className="h-5 w-5 animate-spin text-slate-400" />
				</div>
			) : entries.length === 0 ? (
				/**
				 * O CONVITE. Ele descreve o ganho e diz, na mesma respiração, que dá
				 * para seguir sem — porque a alternativa (um cartão que só cobra) é
				 * exatamente o que o dono pediu para não existir.
				 */
				<div className="rounded-xl border border-dashed border-slate-300 p-5 dark:border-white/15">
					<p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
						Você preenche uma vez — logo, cores, jeito de falar e o que a sua
						marca <strong className="font-semibold">não</strong> é — e todas as
						ferramentas passam a criar com a sua identidade. Suba o logo e as
						cores dele já vêm preenchidas.
					</p>
					<button
						type="button"
						onClick={() => setModo({ tipo: 'nova' })}
						className={`${botaoPrimario} mt-4`}
					>
						<Plus className="h-4 w-4" />
						Configurar minha marca
					</button>
				</div>
			) : (
				<>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						{entries.map((entry) => (
							<CartaoDaMarca
								key={entry.id}
								marca={lerMarca(entry)}
								emUso={entry.id === emUso?.id}
								gravando={gravandoId === entry.id}
								onEditar={() => setModo({ tipo: 'editar', entry })}
								onUsar={() => void trocar(entry.id)}
							/>
						))}
					</div>
					<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
						{/*
						 * A frase antiga aqui dizia "a escolha vale neste navegador" — e
						 * era mentira desde que `principal` virou campo da coleção. Foi
						 * essa mentira que produziu "a tela diz uma marca e a arte sai com
						 * outra". O texto agora afirma só o que o servidor garante.
						 */}
						<p className="max-w-xl text-xs text-slate-500 dark:text-slate-400">
							As ferramentas usam a marca marcada como{' '}
							<strong className="font-semibold text-slate-700 dark:text-slate-200">
								em uso
							</strong>
							. A escolha fica salva na sua conta e vale em qualquer aparelho.
						</p>
						<button
							type="button"
							onClick={() => setModo({ tipo: 'nova' })}
							className={botaoNeutro}
						>
							<Plus className="h-3.5 w-3.5" />
							Nova marca
						</button>
					</div>
				</>
			)}
		</section>
	);
}
