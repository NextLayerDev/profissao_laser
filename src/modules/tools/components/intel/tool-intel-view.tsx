'use client';

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useEntitlements } from '@/hooks/use-entitlements';
import { useToolBilling } from '../../hooks/use-tool-billing';
import type { AiToolDefinition } from '../../services/tool-definitions.service';
import { runToolStream } from '../../services/tool-stream.service';
import { Dossie } from './dossie';
import type {
	AlvoViva,
	Especialista,
	FonteViva,
	LinhaBusca,
	OndaViva,
} from './war-room';
import { normalizarFase, WarRoom } from './war-room';

/**
 * CENTRAL DE INTELIGÊNCIA — `ui.layout: 'intel'`.
 *
 * Por que uma tela própria, e não mais um `studio`: a crítica ao primeiro
 * desenho foi exata — "está no padrão das outras, do lado do outro, não ocupa a
 * tela". As tools existentes são todas a mesma coisa: card branco, grid de duas
 * colunas "controles | preview", botão roxo. Isso serve para ferramenta de
 * ajuste fino. Não serve para uma ferramenta cuja promessa é *um time
 * trabalhando para você*.
 *
 * Aqui a tela tem TRÊS momentos, cada um tomando a tela inteira:
 *
 *   ① ENTRADA    um campo só. Jogue a foto.
 *   ② SALA DE GUERRA   o time ao vivo, com as fontes chegando uma a uma.
 *   ③ DOSSIÊ     o resultado, em largura total, verificável.
 *
 * Nenhum dos três reaproveita o shell das outras ferramentas — de propósito.
 */

type Fase = 'entrada' | 'trabalhando' | 'dossie';
type Tipo = 'produto' | 'mercado';
type Modo = 'rapido' | 'profundo';

interface ModoSpec {
	key: Modo;
	label: string;
	variation_count: number;
	segundos: number;
	bullets: string[];
}

/**
 * Fallback de quando a definition não traz `ui.modos`.
 *
 * Os segundos são o RELÓGIO DO BLOCO, copiado sem arredondar: são os
 * `deadlineMs` de `LIMITES_PADRAO` (src/lib/research/budget.ts, main API),
 * hoje 120_000 no rápido e 300_000 no profundo — o mesmo par que a definition
 * anuncia em `ui.modos`. Este arquivo é a TERCEIRA cópia do mesmo par (as
 * outras duas são o `LIMITES_PADRAO` e o seed da definition na upvox), e já
 * ficou para trás duas vezes: primeiro em 75 s/165 s, contra um relógio de
 * 65 s que deixou de existir; depois em 95 s, quando o rápido subiu para 120 s
 * para o Estrategista caber (ele não é retriável, e o timeout dele é 502 +
 * estorno). Nas duas vezes o erro sobreviveu porque `Math.ceil(seg/60)` dá 2
 * minutos em 95 e em 120: o cartão continuava dizendo "~2 min" e ninguém via.
 *
 * Prometer menos do que o motor pode levar é o defeito caro nesta tela: a
 * ferramenta inteira se vende como honesta sobre prazo e o aluno cronometra.
 * Por isso este fallback nunca fica ABAIXO do `deadlineMs` — quem mexer em
 * `LIMITES_PADRAO` mexe aqui e no `ui.modos` da definition na mesma passada.
 * O seed da definition já TRAVA nisso (`conferirNoBanco` lança quando
 * `segundos < deadlineMs`); deste lado não há trava, e é por isso que o número
 * está escrito ao lado de onde ele mora.
 *
 * O Profundo subiu para 300 s quando virou três ondas com 22 especialistas: a
 * onda 2 só COMEÇA depois de a 1 fechar, e ela pesquisa de novo. Tempo deixou
 * de ser a restrição da ferramenta ("pode demorar mais tempo, não tem
 * importância"); entregar raso, não.
 *
 * REGRA DOS BULLETS: só prometem o que EXISTE nos dois escopos naquele modo
 * (scripts/seed-agentes.ts). Ela nasceu de um defeito real — havia um bullet
 * "Nichos e sazonalidade" quando o `nichos` estava desativado e quem cobria
 * sazonalidade só entrava no escopo mercado, então quem rodasse um produto não
 * via nada daquilo. Os bullets do Profundo hoje descrevem as entregas das três
 * ondas (concorrentes, portfólio, referências, reclamações, fornecedores,
 * frete, calendário), que o roster de 22 traz nos dois escopos; quem tirar um
 * desses especialistas do roster tira o bullet junto.
 */
const MODOS_PADRAO: ModoSpec[] = [
	{
		key: 'rapido',
		label: 'Rápido',
		variation_count: 1,
		segundos: 120,
		bullets: ['Preço de mercado', 'Seu custo e seu lucro', 'Vale a pena?'],
	},
	{
		key: 'profundo',
		label: 'Profundo',
		variation_count: 3,
		segundos: 300,
		bullets: [
			'Tudo do Rápido, em três ondas',
			'Quem são seus concorrentes e o que eles mais vendem',
			'Galeria de referências e do que os clientes reclamam',
			'Onde comprar a peça em branco, frete e calendário do ano',
		],
	},
];

/**
 * Tetos dos dois feeds ao vivo. São TETO DE TELA, não de dado: ficam
 * confortavelmente acima do que um Profundo com 22 especialistas produz
 * (`LIMITES_PADRAO.profundo.maxBuscas` no main API) para que nada de real
 * suma da prova de trabalho. Os 60/80 anteriores foram dimensionados para um
 * time de 10 e cortariam o feed no meio agora.
 */
const TETO_BUSCAS = 150;
const TETO_FONTES = 160;

export function ToolIntelView({
	def,
	toolKey,
}: {
	def: AiToolDefinition;
	toolKey: string;
}) {
	const router = useRouter();
	const { courses } = useEntitlements();
	const courseSlug = courses[0]?.slug;

	const ui = (def.definition.ui ?? {}) as {
		modos?: ModoSpec[];
		customer?: { title?: string; subtitle?: string };
	};
	const modos = ui.modos?.length ? ui.modos : MODOS_PADRAO;

	const [fase, setFase] = useState<Fase>('entrada');
	const [modo, setModo] = useState<Modo>('rapido');
	const [tipo, setTipo] = useState<Tipo>('produto');
	const [foto, setFoto] = useState<File | null>(null);
	const [preview, setPreview] = useState<string | null>(null);
	const [descricao, setDescricao] = useState('');

	const [especialistas, setEspecialistas] = useState<Especialista[]>([]);
	const [fontes, setFontes] = useState<FonteViva[]>([]);
	const [buscasLog, setBuscasLog] = useState<LinhaBusca[]>([]);
	const [onda, setOnda] = useState<OndaViva | null>(null);
	const [cacheIdadeDias, setCacheIdadeDias] = useState<number | null>(null);
	const [etapa, setEtapa] = useState('Preparando…');
	const [buscas, setBuscas] = useState(0);
	const [inicio, setInicio] = useState(Date.now());
	const [output, setOutput] = useState<Record<string, unknown> | null>(null);
	const abortRef = useRef<AbortController | null>(null);
	// Id da linha do console. Contador em ref porque o `key` do React precisa ser
	// estável entre renders e a query sozinha não serve: o mesmo especialista
	// pode repetir a mesma busca em ondas diferentes.
	const seqBusca = useRef(0);

	const modoSel = modos.find((m) => m.key === modo) ?? modos[0];
	const billing = useToolBilling(
		toolKey,
		courseSlug,
		modoSel?.variation_count ?? 1,
	);

	// No modo mercado a foto não faz sentido: a pergunta é sobre o RAMO.
	const podeRodar =
		tipo === 'mercado'
			? descricao.trim().length >= 3
			: Boolean(foto || descricao.trim());

	const escolherFoto = useCallback((f: File | null) => {
		setFoto(f);
		setPreview((antigo) => {
			if (antigo) URL.revokeObjectURL(antigo);
			return f ? URL.createObjectURL(f) : null;
		});
	}, []);

	/** Aplica um evento do stream no estado da sala de guerra. */
	const aplicar = useCallback((ev: Record<string, unknown>) => {
		const kind = String(ev.kind ?? '');

		if (kind === 'node_start') {
			const node = String(ev.node ?? '');
			setEtapa(
				node === 'visao'
					? 'Olhando a sua foto…'
					: node === 'time'
						? 'O time está pesquisando'
						: node === 'dossie'
							? 'Montando o dossiê'
							: 'Preparando…',
			);
			return;
		}

		if (kind === 'time_montado') {
			const lista = (ev.agentes ?? []) as Record<string, string>[];
			/**
			 * O time chega INTEIRO, inclusive quem não vai rodar.
			 *
			 * Com cache quente os especialistas compartilháveis não rodam, e a
			 * tela mostrava "1/3 PROFISSIONAIS" — o aluno pagava por um time
			 * inteiro e via um. Agora eles vêm com `estado: 'aproveitado'` e
			 * nascem concluídos: o contador fecha no total do time (22/22 no
			 * Profundo) e o cartão diz de onde veio o dado, em vez de fingir uma
			 * pesquisa que não aconteceu.
			 */
			setEspecialistas(
				lista.map((a) => ({
					chave: a.chave,
					nome: a.nome,
					icone: a.icone,
					cor: a.cor,
					frase: a.frase,
					// `normalizarFase` traduz o `pesquisa` antigo para `descoberta` e
					// aceita `aprofundamento`. Ela nunca devolve `undefined`: um
					// especialista com a fase corrompida cai na onda 1 e continua
					// aparecendo na mesa, porque o aluno pagou por ele.
					fase: normalizarFase(a.fase),
					status:
						a.estado === 'aproveitado'
							? ('aproveitado' as const)
							: ('aguardando' as const),
					// O cartão de cache também mostra quantas páginas ele abriu no dia
					// em que rodou — era o único do time sem contagem, e sem ela lia-se
					// como "não trouxe nada".
					nFontes: Number.isFinite(Number(a.n_fontes))
						? Number(a.n_fontes)
						: undefined,
				})),
			);
			const idade = Number(ev.cache_idade_dias);
			setCacheIdadeDias(Number.isFinite(idade) ? idade : null);
			if (ev.cache_quente) {
				setEtapa('Aproveitando a pesquisa de mercado recente');
			}
			return;
		}

		if (kind === 'busca') {
			seqBusca.current += 1;
			const linha: LinhaBusca = {
				id: `b${seqBusca.current}`,
				chave: String(ev.chave ?? ''),
				query: String(ev.query ?? ''),
				motor: String(ev.motor ?? ''),
			};
			setBuscasLog((ls) => [...ls, linha].slice(-TETO_BUSCAS));
			setBuscas((n) => n + 1);
			setEspecialistas((as) =>
				as.map((a) =>
					a.chave === linha.chave ? { ...a, buscas: (a.buscas ?? 0) + 1 } : a,
				),
			);
			return;
		}

		if (kind === 'fonte') {
			const url = String(ev.url ?? '');
			if (!url) return;
			const nova: FonteViva = {
				url,
				titulo: typeof ev.titulo === 'string' ? ev.titulo : undefined,
				agente: String(ev.chave ?? '') || undefined,
			};
			// Mais nova em cima, sem repetir: a mesma página costuma ser citada
			// por dois especialistas e contar duas vezes inflaria a prova.
			setFontes((fs) =>
				fs.some((f) => f.url === url)
					? fs
					: [nova, ...fs].slice(0, TETO_FONTES),
			);
			return;
		}

		if (kind === 'onda') {
			/**
			 * O `onda` chega uma vez POR ONDA que tenha alguém para rodar — três
			 * vezes no Profundo (descoberta, aprofundamento, síntese) e duas no
			 * Rápido, que não tem faixa do meio. `fase` é sempre a onda que está
			 * COMEÇANDO, ou seja, a de quem está em `para`.
			 *
			 * O etapa de cada uma diz o que MUDOU, não o que continua igual: a
			 * onda 2 é a novidade que justifica o Profundo demorar mais, e chamá-la
			 * de "o time está pesquisando" desperdiçaria o único lugar em que ela
			 * se explica sozinha.
			 */
			const fase = normalizarFase(ev.fase);
			setOnda({
				fase,
				de: (Array.isArray(ev.de) ? ev.de : []).map(String),
				para: (Array.isArray(ev.para) ? ev.para : []).map(String),
			});
			if (fase === 'aprofundamento')
				setEtapa('Aprofundando nos produtos e concorrentes achados');
			else if (fase === 'sintese') setEtapa('Cruzando os dados da pesquisa');
			return;
		}

		if (kind === 'fotos') {
			// Abrir as páginas dos anúncios para pegar a foto é trabalho de
			// verdade e leva segundos: sem uma linha aqui, a tela some por um
			// tempo sem explicação.
			seqBusca.current += 1;
			setBuscasLog((ls) =>
				[
					...ls,
					{
						id: `f${seqBusca.current}`,
						chave: '',
						query: `${Number(ev.n ?? 0)} foto(s) de anúncio recuperadas`,
						motor: 'páginas',
					},
				].slice(-TETO_BUSCAS),
			);
			return;
		}

		if (kind === 'agente_iniciou') {
			/**
			 * `sem_busca` é AFIRMAÇÃO DO MOTOR, não dedução da tela.
			 *
			 * O bloco decide a busca ANTES de emitir este evento e manda o
			 * veredito junto (`ai-research-team.ts`, `a.motorBusca !== 'nenhum' &&
			 * motor === 'nenhum'`): só é `true` para quem TINHA busca no papel e
			 * teve a vaga negada pelo teto da execução. Quem é `motor_busca:
			 * 'nenhum'` de fábrica — o Consultor de Produção e o Analista de
			 * Riscos, que respondem do próprio conhecimento técnico — vem `false`,
			 * porque não há nada de errado acontecendo com eles.
			 *
			 * Era essa distinção que faltava: a sala de guerra deduzia "sem busca"
			 * pela AUSÊNCIA do evento `busca` e por isso marcava os dois
			 * consultores de âmbar em todo run profundo (2 de 10 cartões).
			 */
			setEspecialistas((as) =>
				as.map((a) =>
					a.chave === ev.chave
						? { ...a, status: 'rodando', semBusca: ev.sem_busca === true }
						: a,
				),
			);
			return;
		}

		if (kind === 'agente_concluiu') {
			setEspecialistas((as) =>
				as.map((a) =>
					a.chave === ev.chave
						? {
								...a,
								status: 'ok',
								ms: Number(ev.ms ?? 0),
								nFontes: Number(ev.n_fontes ?? 0),
							}
						: a,
				),
			);
			return;
		}

		if (kind === 'agente_falhou') {
			setEspecialistas((as) =>
				as.map((a) =>
					a.chave === ev.chave
						? { ...a, status: 'falhou', erro: String(ev.erro ?? '') }
						: a,
				),
			);
			return;
		}

		if (kind === 'agente_retry') {
			/**
			 * A resposta voltou vazia e o servidor refez o trabalho por outro
			 * caminho. O cartão não pode parecer parado — mas a frase também não
			 * pode falar de máquina: "Refazendo com outro modelo…" entregava ao
			 * aluno a palavra MODELO, que é justamente o vocabulário que esta tela
			 * não usa. Quem está na mesa são profissionais; um profissional refaz o
			 * trabalho, não troca de modelo.
			 */
			setEspecialistas((as) =>
				as.map((a) =>
					a.chave === ev.chave ? { ...a, frase: 'Refazendo o trabalho…' } : a,
				),
			);
			return;
		}

		if (kind === 'time_concluido') {
			setBuscas(Number(ev.buscas ?? 0));
			setEtapa('Escrevendo o dossiê');
		}
	}, []);

	const analisar = useCallback(async () => {
		if (!podeRodar || billing.insufficient) return;

		setFase('trabalhando');
		setInicio(Date.now());
		setEspecialistas([]);
		setFontes([]);
		setBuscasLog([]);
		setOnda(null);
		setCacheIdadeDias(null);
		setBuscas(0);
		seqBusca.current = 0;
		setEtapa('Preparando…');
		setOutput(null);

		const ctrl = new AbortController();
		abortRef.current = ctrl;
		const runId =
			globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random());

		await billing.runEngine(async (invocationId) => {
			try {
				for await (const e of runToolStream({
					key: toolKey,
					runId,
					invocationId,
					signal: ctrl.signal,
					values: {
						...(tipo === 'produto' && foto ? { foto } : {}),
						...(descricao.trim() ? { descricao: descricao.trim() } : {}),
						tipo,
						modo,
					},
				})) {
					if (e.type === 'progresso') {
						aplicar(e.ev);
					} else if (e.type === 'done') {
						setOutput(e.output);
						// As fontes do resultado final completam o que chegou ao vivo —
						// mas a atribuição por especialista só existe nos eventos, então
						// ela é preservada em vez de sobrescrita pela lista final.
						const fs = (e.output.fontes ?? []) as {
							url: string;
							title?: string;
						}[];
						setFontes((vivas) => {
							const dono = new Map(vivas.map((f) => [f.url, f.agente]));
							return fs
								.map((f) => ({
									url: f.url,
									titulo: f.title,
									agente: dono.get(f.url),
								}))
								.slice(0, TETO_FONTES);
						});
						setFase('dossie');
					} else if (e.type === 'erro') {
						toast.error(e.message);
						setFase('entrada');
					}
				}
			} catch (err) {
				if ((err as Error)?.name !== 'AbortError') {
					toast.error('A conexão caiu no meio da análise.');
					setFase('entrada');
				}
			}
			return null;
		});
	}, [podeRodar, billing, toolKey, foto, descricao, modo, tipo, aplicar]);

	const custoTexto = useMemo(
		() =>
			`Custa ${billing.effectiveCost} voxxy${billing.effectiveCost === 1 ? '' : 's'} · saldo ${billing.voxBalance}`,
		[billing.effectiveCost, billing.voxBalance],
	);

	/**
	 * O núcleo da mesa mostra O QUE está sendo analisado: a foto que o aluno
	 * acabou de mandar, ou o ramo que ele digitou. Sem isso a tela é bonita e
	 * genérica; com isso é a peça DELE no centro.
	 *
	 * `useMemo` não é preciosismo: este componente re-renderiza a cada evento do
	 * stream (são centenas num Profundo), e um objeto literal novo a cada render
	 * furava o `memo` do `Nucleo` — que carrega a `<img>` da foto e três
	 * animações — em todos eles, sem nada ter mudado.
	 */
	const alvo = useMemo<AlvoViva>(
		() => ({
			escopo: tipo,
			titulo:
				descricao.trim() ||
				(tipo === 'produto' ? (foto?.name ?? 'sua peça') : 'seu ramo'),
			imagem: tipo === 'produto' ? preview : null,
		}),
		[tipo, descricao, foto, preview],
	);

	const accent = { '--screen-accent': '#f59e0b' } as React.CSSProperties;

	/* ═══════════════ ② SALA DE GUERRA ═══════════════ */
	if (fase === 'trabalhando') {
		return (
			<div style={accent}>
				<WarRoom
					especialistas={especialistas}
					fontes={fontes}
					buscasLog={buscasLog}
					etapa={etapa}
					buscas={buscas}
					inicio={inicio}
					onda={onda}
					cacheIdadeDias={cacheIdadeDias}
					alvo={alvo}
					// Só dimensiona o esqueleto do "Montando o time…": um Profundo abre
					// com 22 cartões e um Rápido com 5. O time real vem do
					// `time_montado`, que é quem manda.
					modo={modo}
				/>
			</div>
		);
	}

	/* ═══════════════ ③ DOSSIÊ ═══════════════ */
	if (fase === 'dossie' && output) {
		return (
			<div style={accent}>
				<Dossie
					output={output}
					modo={modo}
					tipo={tipo}
					toolKey={toolKey}
					onNovaAnalise={() => {
						setFase('entrada');
						escolherFoto(null);
						setDescricao('');
					}}
					onOrcamentoExato={() => router.push('/course/t/central_custos')}
				/>
			</div>
		);
	}

	/* ═══════════════ ① ENTRADA — um campo só ═══════════════ */
	return (
		<div
			style={accent}
			className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#08080a]"
		>
			<div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.05]" />
			<div
				className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[46rem] -translate-x-1/2 rounded-full blur-3xl"
				style={{
					background:
						'radial-gradient(closest-side, rgba(245,158,11,0.18), transparent)',
				}}
			/>

			<div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-3xl place-items-center px-4 py-10">
				<div className="w-full">
					<div className="mb-6 text-center">
						<p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-500/70">
							Central de Inteligência
						</p>
						<h1 className="font-display mt-2 text-3xl font-bold text-slate-50 md:text-4xl">
							{tipo === 'produto'
								? 'Tem um produto em mente?'
								: 'Não sabe o que vender?'}
						</h1>
						<p className="mt-2 text-[15px] text-slate-400">
							{tipo === 'produto'
								? 'Um time de especialistas descobre quanto vale, quem já vende e onde.'
								: 'Diga o ramo. O time descobre o que está vendendo mais em Mercado Livre, Shopee, Amazon e TikTok Shop.'}
						</p>
					</div>

					{/*
					 * DUAS PERGUNTAS, não uma. Quem já tem a peça quer saber se vale a
					 * pena; quem não tem quer saber o que fazer. Eram a mesma tela e a
					 * segunda pergunta simplesmente não existia.
					 */}
					<div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.02] p-1">
						{(
							[
								['produto', 'Tenho um produto'],
								['mercado', 'Quero descobrir o que vender'],
							] as const
						).map(([k, label]) => (
							<button
								key={k}
								type="button"
								onClick={() => setTipo(k)}
								className={`rounded-xl px-4 py-2.5 text-[13px] font-medium transition-colors ${
									tipo === k
										? 'bg-amber-500/15 text-amber-300'
										: 'text-slate-400 hover:text-slate-200'
								}`}
							>
								{label}
							</button>
						))}
					</div>

					{tipo === 'mercado' ? (
						<div>
							<input
								value={descricao}
								onChange={(e) => setDescricao(e.target.value)}
								placeholder="qual ramo? ex: brindes corporativos, decoração infantil, lembrancinha de casamento"
								className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-[15px] text-slate-200 placeholder:text-slate-600 focus:border-amber-500/40 focus:outline-none"
							/>
							<div className="mt-3 flex flex-wrap gap-2">
								{[
									'brindes corporativos',
									'lembrancinha de casamento',
									'decoração infantil',
									'presentes para pet',
									'papelaria personalizada',
									'utilidades para cozinha',
								].map((sug) => (
									<button
										key={sug}
										type="button"
										onClick={() => setDescricao(sug)}
										className="rounded-full border border-white/10 px-3 py-1.5 text-[12px] text-slate-400 transition-colors hover:border-amber-500/30 hover:text-amber-300"
									>
										{sug}
									</button>
								))}
							</div>
						</div>
					) : null}

					{/* O campo. Um só. */}
					{tipo === 'produto' ? (
						<>
							<motion.label
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								className="group relative block cursor-pointer"
							>
								<input
									type="file"
									accept="image/*"
									className="sr-only"
									onChange={(e) => escolherFoto(e.target.files?.[0] ?? null)}
								/>
								<div
									className={`grid aspect-[16/9] place-items-center overflow-hidden rounded-3xl border-2 border-dashed transition-colors ${
										foto
											? 'border-amber-500/40 bg-amber-500/[0.04]'
											: 'border-white/12 bg-white/[0.02] group-hover:border-amber-500/35'
									}`}
								>
									{preview ? (
										// biome-ignore lint/performance/noImgElement: preview local de um File, sem otimizador
										<img
											src={preview}
											alt="Produto escolhido"
											className="h-full w-full object-contain"
										/>
									) : (
										<div className="px-6 text-center">
											<div
												className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl"
												style={{ backgroundColor: 'rgba(245,158,11,0.12)' }}
											>
												<svg
													viewBox="0 0 24 24"
													fill="none"
													stroke="#f59e0b"
													strokeWidth="1.8"
													className="h-6 w-6"
													aria-hidden="true"
												>
													<path
														d="M12 16V4m0 0L8 8m4-4 4 4"
														strokeLinecap="round"
														strokeLinejoin="round"
													/>
													<path
														d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
														strokeLinecap="round"
													/>
												</svg>
											</div>
											<p className="text-[15px] font-medium text-slate-200">
												Arraste a foto aqui ou clique para escolher
											</p>
											<p className="mt-1 text-[12px] text-slate-500">
												Pode ser foto sua, de catálogo ou de um concorrente
											</p>
										</div>
									)}
								</div>
							</motion.label>

							<div className="mt-3">
								<input
									value={descricao}
									onChange={(e) => setDescricao(e.target.value)}
									placeholder="ou descreva em uma frase: copo térmico personalizado gravado a laser"
									className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[14px] text-slate-200 placeholder:text-slate-600 focus:border-amber-500/40 focus:outline-none"
								/>
							</div>
						</>
					) : null}

					{/* Profundidade: dois cartões, com prazo e custo à vista. */}
					<div className="mt-5 grid gap-3 sm:grid-cols-2">
						{modos.map((m, i) => {
							const ativo = m.key === modo;
							return (
								<motion.button
									key={m.key}
									type="button"
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.06 * i }}
									onClick={() => setModo(m.key)}
									className={`rounded-2xl border p-4 text-left transition-colors ${
										ativo
											? 'border-amber-500/50 bg-amber-500/[0.06]'
											: 'border-white/10 bg-white/[0.02] hover:border-white/20'
									}`}
								>
									<div className="flex items-baseline justify-between">
										<span className="text-[15px] font-semibold text-slate-100">
											{m.label}
										</span>
										{/*
										 * `ceil`, nunca `round` — e a razão é o que o número É, não
										 * o valor que ele tem hoje. `segundos` é o TETO do relógio
										 * do bloco; arredondar para baixo transforma o único
										 * número honesto do cartão em promessa quebrada. Aconteceu
										 * com um Profundo de 145 s, que com `round` virava "~2min"
										 * para um run que podia levar 2min25.
										 *
										 * Com os valores de hoje (120 s e 300 s) `round` e `ceil`
										 * dariam o mesmo "~2min"/"~5min" — e é exatamente por isso
										 * que a regra fica escrita aqui: ela não se defende
										 * sozinha, some da vista no dia em que os dois coincidem e
										 * volta a morder no próximo relógio quebrado.
										 */}
										<span className="font-mono text-[11px] tabular-nums text-slate-400">
											~
											{m.segundos < 60
												? `${m.segundos}s`
												: `${Math.ceil(m.segundos / 60)}min`}
											{' · '}
											{(billing.effectiveCost /
												(modoSel?.variation_count ?? 1)) *
												m.variation_count}{' '}
											voxxys
										</span>
									</div>
									<ul className="mt-2 space-y-0.5">
										{m.bullets.map((b) => (
											<li key={b} className="text-[12px] text-slate-400">
												· {b}
											</li>
										))}
									</ul>
								</motion.button>
							);
						})}
					</div>

					<button
						type="button"
						onClick={analisar}
						disabled={!podeRodar || billing.insufficient}
						className="mt-5 w-full rounded-xl px-6 py-3.5 text-[15px] font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
						style={{ backgroundColor: '#f59e0b' }}
					>
						Analisar produto
					</button>

					<p className="mt-2.5 text-center text-[12px] text-slate-500">
						{custoTexto}
					</p>
					{billing.notice}
				</div>
			</div>
		</div>
	);
}
