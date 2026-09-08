'use client';

import { useReducedMotion } from 'motion/react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { resolveToolIcon } from '../../lib/tool-icons';

/**
 * MESA DE OPERAÇÕES — os especialistas trabalhando, ao vivo.
 *
 * A palavra "agente" foi banida desta tela de propósito. Quem espera dois
 * minutos não quer ver software processando: quer ver PROFISSIONAIS
 * trabalhando no problema dele. Cada cartão é um cargo que existe numa
 * consultoria de verdade, e a frase é o que essa pessoa estaria fazendo agora.
 *
 * A forma da tela é a forma REAL do motor, não uma encenação. O motor tem TRÊS
 * ONDAS, e a mesa é desenhada como três faixas empilhadas:
 *
 *   ONDA 1 · DESCOBERTA      os cartões ficam nos flancos, em volta do núcleo,
 *                            porque rodam TODOS EM PARALELO e não sabem nada
 *                            além do que o aluno mandou;
 *   ONDA 2 · APROFUNDAMENTO  fica embaixo do núcleo porque só começa DEPOIS:
 *                            cada um destes recebe o digest da onda 1 e
 *                            pesquisa DE NOVO, já sabendo quais produtos e
 *                            quais concorrentes investigar;
 *   ONDA 3 · SÍNTESE         fica no fim porque lê as duas ondas anteriores e
 *                            escreve o dossiê.
 *
 * O núcleo é o digest da onda 1; a JUNÇÃO (o losango do divisor da última
 * faixa) é o digest acumulado das ondas 1 e 2. São dois pontos de convergência
 * porque o motor tem duas viradas de onda — e é por isso que o "cruzando
 * dados" desta tela não é enfeite: a onda 2 de fato lê a onda 1.
 *
 * No modo Rápido só existem DUAS ondas (descoberta e síntese); a faixa do meio
 * simplesmente não é montada, a junção não existe e a síntese bebe direto do
 * núcleo — que é exatamente o desenho aprovado antes das três ondas.
 *
 * Por isso cada animação pode existir sem mentir:
 *   varredura no cartão = este especialista está rodando AGORA;
 *   feixe aceso        = este entregou (evento `agente_concluiu`);
 *   feixe tracejado    = veio do arquivo de 7 dias, não foi pesquisado agora;
 *   pacote no feixe    = está passando dado por ali NESTE instante — quem
 *                        veio do cache e quem já entregou não recebem pacote;
 *   selo SEM BUSCA     = este QUERIA pesquisar e o teto da execução negou a
 *                        vaga (`sem_busca` no evento `agente_iniciou`), então
 *                        o que ele diz não tem fonte para conferir. Quem não
 *                        pesquisa por desenho do papel não recebe o selo: não
 *                        é ressalva nenhuma, é o trabalho dele;
 *   trilho de luz      = o evento `onda` chegou e a faixa de baixo está
 *                        recebendo o material da faixa de cima;
 *   linha no console   = uma busca DE VERDADE foi disparada, com a query real.
 *
 * É a tela que justifica o produto. Sem ela, minutos de espera são
 * indistinguíveis de tela travada; com ela, a espera VIRA o produto.
 *
 * E tem uma função que não é estética: o console de buscas e a coluna de
 * fontes chegando uma a uma são a prova visível de que a pesquisa é real. É o
 * antídoto de interface contra "isso aí a IA inventou" — o aluno vê a pergunta
 * ser feita e o link aparecer antes do texto existir.
 *
 * Ocupa a tela inteira de propósito. A crítica ao primeiro desenho foi "está do
 * lado do outro, não ocupa a tela": aqui não há coluna de formulário, não há
 * card branco e não há nada do padrão das outras ferramentas.
 */

export type EspecialistaStatus =
	| 'aguardando'
	| 'rodando'
	| 'ok'
	| 'falhou'
	/** Veio do cache de 7 dias: NASCE concluído e nunca anima como se rodasse. */
	| 'aproveitado';

/**
 * A ONDA em que o especialista roda — e, por consequência, o lugar dele na mesa.
 *
 * `descoberta`     varre o ramo/produto sem saber nada além do que o aluno deu;
 * `aprofundamento` recebe o digest da descoberta e pesquisa EM CIMA dele;
 * `sintese`        lê as duas anteriores e escreve.
 */
export type FaseOnda = 'descoberta' | 'aprofundamento' | 'sintese';

/**
 * `pesquisa` é o valor ANTIGO da onda 1 e continua chegando pelo stream: está
 * gravado em todo registro da coleção `agentes` que existia antes das três
 * ondas. Traduzir aqui é o que dispensa migração — o dado velho continua
 * válido e quer dizer exatamente o que sempre quis.
 *
 * Qualquer outra coisa cai em `descoberta` de propósito: um especialista com
 * `fase` corrompida tem que aparecer na mesa mesmo assim. Sumir com quem o
 * aluno pagou para ver é o defeito mais caro desta ferramenta.
 */
export function normalizarFase(v: unknown): FaseOnda {
	if (v === 'sintese') return 'sintese';
	if (v === 'aprofundamento') return 'aprofundamento';
	return 'descoberta';
}

/** Ordem das ondas. Serve para saber quais já COMEÇARAM a partir da última. */
const ORDEM_ONDA: Record<FaseOnda, number> = {
	descoberta: 0,
	aprofundamento: 1,
	sintese: 2,
};

export interface Especialista {
	chave: string;
	nome: string;
	icone: string;
	cor: string;
	frase: string;
	/** Onda em que roda — define a faixa da mesa em que o cartão aparece. */
	fase: FaseOnda;
	status: EspecialistaStatus;
	ms?: number;
	nFontes?: number;
	/** Buscas já disparadas por ele, contadas ao vivo pelos eventos `busca`. */
	buscas?: number;
	/**
	 * TINHA busca no papel e o teto da execução negou a vaga.
	 *
	 * Vem pronto do motor, no `agente_iniciou` (`sem_busca`): é
	 * `motorBusca !== 'nenhum' && motor === 'nenhum'`, calculado onde a decisão
	 * de fato acontece. `false`/ausente não quer dizer "pesquisou" — quer dizer
	 * "não há ressalva a fazer", que é o caso tanto de quem pesquisa quanto de
	 * quem nunca teve busca (Consultor de Produção, Analista de Riscos).
	 */
	semBusca?: boolean;
	erro?: string;
}

export interface FonteViva {
	url: string;
	titulo?: string;
	/** Chave do especialista que citou — dá cor e nome à linha do feed. */
	agente?: string;
}

/** Uma busca real disparada: a query que foi ao ar, e em qual motor. */
export interface LinhaBusca {
	id: string;
	chave: string;
	query: string;
	motor: string;
}

/**
 * O evento `onda`: quem entregou (`de`) e quem vai ler o material (`para`).
 *
 * `fase` é a onda que está COMEÇANDO — quem está em `para`. Chega uma vez por
 * onda que tenha alguém para rodar, então no Profundo chega três vezes
 * (descoberta, aprofundamento, síntese) e no Rápido duas.
 */
export interface OndaViva {
	fase: FaseOnda;
	de: string[];
	para: string[];
}

/** O que está no centro da mesa: a peça fotografada ou o ramo pesquisado. */
export interface AlvoViva {
	escopo: 'produto' | 'mercado';
	titulo: string;
	imagem?: string | null;
}

/**
 * O selo do motor, na língua do aluno.
 *
 * `exa` e `perplexity` são nomes de fornecedor: dizem tudo para quem paga a
 * conta e nada para quem está esperando o dossiê — e esta tela não fala de
 * máquina. Os dois são busca na web aberta, então é isso que o selo diz. O que
 * não for reconhecido passa direto: é assim que o `páginas` do evento `fotos`
 * (abrir a página do anúncio para pegar a foto) continua se explicando sozinho,
 * e é assim que um motor novo aparece sem exigir deploy desta tela.
 */
function rotuloMotor(motor: string): string {
	return motor === 'exa' || motor === 'perplexity' ? 'web' : motor;
}

function dominio(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return url.slice(0, 40);
	}
}

/** mm:ss — o aluno precisa saber que o tempo está andando. */
function relogio(ms: number): string {
	const s = Math.max(0, Math.floor(ms / 1000));
	return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

const CONCLUIDOS: EspecialistaStatus[] = ['ok', 'falhou', 'aproveitado'];

/**
 * A partir de quantos cartões a mesa usa a variante compacta.
 *
 * Não é gosto: é o que faz 22 cartões caberem em 1440×900 sem rolagem no meio
 * da animação. O Rápido, com 5, continua com o cartão alto que o dono do
 * produto aprovou — o compacto é uma resposta ao tamanho do time, não um
 * redesenho.
 *
 * E é só metade da regra: o compacto também exige que a faixa tenha mais de uma
 * coluna (ver onde ele é calculado). Num celular o cartão ocupa a largura toda e
 * apertar a letra não ganharia um pixel de espaço.
 */
const LIMIAR_COMPACTO = 10;

/** Largura mínima de um cartão numa faixa, em px. Casa com o `minmax` do CSS. */
const LARGURA_MIN_CARTAO = 208;
/** `gap: 0.625rem` da `.intel-banda`, em px. */
const GAP_FAIXA = 10;

/**
 * Largura MÁXIMA de um cartão, em px. Existe para uma faixa com folga não
 * esticar o cartão pela mesa inteira — ver `estiloFaixa`.
 */
const LARGURA_MAX_CARTAO = 340;

/** Quantos cartões cabem lado a lado na largura medida da mesa. */
function cabemNaLinha(larguraMesa: number): number {
	return Math.max(
		1,
		Math.floor((larguraMesa + GAP_FAIXA) / (LARGURA_MIN_CARTAO + GAP_FAIXA)),
	);
}

/**
 * Quantas colunas uma faixa deve ter para as linhas ficarem CHEIAS POR IGUAL.
 *
 * O `repeat(auto-fit, minmax(...))` do CSS enche a primeira linha até não caber
 * mais e larga o resto na última: cinco sintetizadores numa mesa que comporta
 * quatro viravam 4 + 1, com o Auditor sozinho num canto. Distribuindo pelo
 * número de LINHAS (5 em 2 linhas → 3 colunas → 3 + 2) nenhuma faixa termina
 * com um cartão órfão, e o roster pode mudar de tamanho sem quebrar nada.
 *
 * Devolve `null` enquanto não há largura medida (celular, ou antes da primeira
 * medição) — aí quem decide é o `auto-fit` do CSS, que não precisa de JS.
 */
function colunasDaFaixa(n: number, larguraMesa: number): number | null {
	if (n === 0 || larguraMesa <= 0) return null;
	const cabe = cabemNaLinha(larguraMesa);
	const linhas = Math.ceil(n / Math.min(cabe, n));
	return Math.ceil(n / linhas);
}

/**
 * Estilo da faixa: colunas equilibradas quando dá para medir, CSS quando não.
 *
 * COM FOLGA NA LINHA, O CARTÃO NÃO ESTICA — ele ganha um teto e a faixa fica
 * centrada. Sem isso, a síntese do Rápido (um Estrategista só) virava uma barra
 * de 1.130 px de largura por 74 px de altura, com o ícone perdido num canto e o
 * "OK" no outro: medido no Chrome headless a 1600×1000, é o cartão mais feio da
 * tela justamente no momento em que o aluno está esperando o veredito. Quando
 * não há folga (`c === cabe`) nada muda — as faixas cheias do Profundo, e o
 * celular, continuam exatamente como estavam.
 */
function estiloFaixa(n: number, larguraMesa: number): React.CSSProperties {
	const c = colunasDaFaixa(n, larguraMesa);
	if (!c) return {};
	if (c < cabemNaLinha(larguraMesa)) {
		return {
			gridTemplateColumns: `repeat(${c}, minmax(0, ${LARGURA_MAX_CARTAO}px))`,
			justifyContent: 'center',
		};
	}
	return { gridTemplateColumns: `repeat(${c}, minmax(0, 1fr))` };
}

/* ═══════════════════════ peças pequenas do HUD ═══════════════════════ */

/**
 * Cantos de mira. É o detalhe que faz um painel escuro virar HUD — e custa
 * quatro divs, nenhuma imagem e nenhum frame de animação.
 */
function Cantos({ cor = 'rgba(255,255,255,0.18)' }: { cor?: string }) {
	return (
		<>
			{(
				[
					'left-0 top-0 border-l border-t',
					'right-0 top-0 border-r border-t',
					'left-0 bottom-0 border-l border-b',
					'right-0 bottom-0 border-r border-b',
				] as const
			).map((pos) => (
				<span
					key={pos}
					aria-hidden="true"
					className={`pointer-events-none absolute h-2.5 w-2.5 ${pos}`}
					style={{ borderColor: cor }}
				/>
			))}
		</>
	);
}

/**
 * O relógio é o ÚNICO pedaço que precisa bater de segundo em segundo.
 * Isolado num componente próprio para o tique não re-renderizar os vinte e dois
 * cartões, o console e o feed junto — era isso que a versão anterior fazia, 2×
 * por segundo, com a árvore inteira.
 */
const Relogio = memo(function Relogio({ inicio }: { inicio: number }) {
	const [agora, setAgora] = useState(() => Date.now());
	useEffect(() => {
		const t = setInterval(() => setAgora(Date.now()), 1000);
		return () => clearInterval(t);
	}, []);
	return <>{relogio(agora - inicio)}</>;
});

function Metrica({
	valor,
	rotulo,
}: {
	valor: React.ReactNode;
	rotulo: string;
}) {
	return (
		<div className="text-right">
			<p className="font-mono text-xl tabular-nums leading-none text-slate-100 md:text-2xl">
				{valor}
			</p>
			<p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-slate-500 md:text-[10px]">
				{rotulo}
			</p>
		</div>
	);
}

/* ═══════════════════════ estação (um especialista) ═══════════════════════ */

const Estacao = memo(function Estacao({
	a,
	cacheIdadeDias,
	semMovimento,
	compacto,
	refCb,
}: {
	a: Especialista;
	cacheIdadeDias: number | null;
	semMovimento: boolean;
	/** Time grande: mesmo conteúdo, menos respiro. Ver `LIMIAR_COMPACTO`. */
	compacto: boolean;
	refCb?: (el: HTMLDivElement | null) => void;
}) {
	const Icon = resolveToolIcon(a.icone);
	const rodando = a.status === 'rodando';
	const ok = a.status === 'ok';
	const falhou = a.status === 'falhou';
	const aproveitado = a.status === 'aproveitado';
	const aguardando = a.status === 'aguardando';

	/**
	 * ESTE ESPECIALISTA QUERIA PESQUISAR E NÃO PÔDE — e isso tem que aparecer.
	 *
	 * São DUAS coisas diferentes que a versão anterior tratava como uma só:
	 *
	 *   (a) o papel dele não tem busca (`motor_busca: 'nenhum'` no roster) — o
	 *       Consultor de Produção responde de conhecimento técnico, o Analista
	 *       de Riscos idem. Isso não é ressalva nenhuma: é o trabalho dele,
	 *       feito certo. Marcar de âmbar tirava 2 dos 10 cartões do verde em
	 *       TODO run profundo, sem nada ter dado errado;
	 *   (b) o papel dele tem busca e o teto da execução negou a vaga. Aí sim o
	 *       que ele escreveu não tem página para conferir, e o aluno precisa
	 *       saber antes de decidir a compra do material.
	 *
	 * A tela não distingue os dois deduzindo — o motor JÁ decidiu isso antes de
	 * despachar e manda a resposta pronta no `sem_busca` do `agente_iniciou`
	 * (`ai-research-team.ts`). Deduzir pela ausência do evento `busca` era o que
	 * confundia (a) com (b), e ainda exigia uma carência de 1,2 s em que a frase
	 * do papel ("Levantando o custo do insumo com fornecedor…") rodava sozinha.
	 * Ler o campo mata a carência junto: ele chega NO MESMO evento que acende o
	 * cartão, então o selo e a frase aparecem juntos ou não aparecem.
	 *
	 * Limite conhecido e assumido: existe um terceiro caminho no motor — a 1ª
	 * marcha do freio de `maxUsd`, que zera o motor de busca DEPOIS deste evento
	 * — para o qual não sai evento nenhum. Esse caso termina com "0 fontes" na
	 * legenda, que é verdade, mas sem o selo. Preferir o silêncio a inventar um
	 * selo que também acusaria os consultores é a troca certa: alarme falso em
	 * todo run profundo custa a credibilidade do selo inteiro.
	 */
	const semBusca = a.semBusca === true;
	const cegoAgora = rodando && semBusca;
	/** Terminou sem ter podido consultar a web. */
	const cegoFim = ok && semBusca;

	/**
	 * O cartão aproveitado é DELIBERADAMENTE morno: sem varredura, sem ponto
	 * pulsando, borda tracejada. Fingir que ele está pesquisando quando o dado
	 * veio do arquivo de 7 dias é exatamente o tipo de mentira que esta
	 * ferramenta inteira existe para não contar.
	 *
	 * E o verde de "OK" é a mesma classe de mentira para quem QUERIA pesquisar e
	 * foi barrado pelo teto: verde lê como "apurado", e o que ele escreveu não
	 * tem página nenhuma por trás. Esse vai para o âmbar — o mesmo âmbar que o
	 * dossiê usa para "não apurado". Quem nunca teve busca no papel continua
	 * verde, porque entregou exatamente o que foi contratado para entregar.
	 */
	const borda = rodando
		? 'border-white/25'
		: ok
			? cegoFim
				? 'border-amber-500/30'
				: 'border-emerald-500/30'
			: aproveitado
				? 'border-dashed border-sky-500/30'
				: falhou
					? 'border-amber-500/35'
					: 'border-white/10';

	/**
	 * Fundo OPACO, não translúcido — e a cor é exatamente a que o translúcido
	 * antigo produzia sobre o `#07070a` da mesa, então nada mudou de aparência.
	 *
	 * O que mudou foi o que passa POR TRÁS. Com três faixas, os feixes cruzam a
	 * mesa de cima a baixo: o núcleo despeja em oito cartões e oito cartões
	 * desaguam na junção. Sobre um cartão a 1,5% de branco, cada uma dessas
	 * curvas atravessava o nome do especialista e a legenda. Cartão opaco resolve
	 * sem tirar um único feixe do desenho: o feixe some atrás do cartão e
	 * reaparece do outro lado, que é como cabo passando por baixo de uma mesa.
	 */
	const fundo = rodando
		? 'bg-[#15151a]'
		: ok
			? cegoFim
				? 'bg-[#100d0a]'
				: 'bg-[#080f0f]'
			: aproveitado
				? 'bg-[#070d13]'
				: falhou
					? 'bg-[#100d0a]'
					: 'bg-[#0b0b0d]';

	const legenda = falhou
		? (a.erro ?? 'não consegui desta vez')
		: aproveitado
			? /**
				 * O CARTÃO DE CACHE MOSTRA AS FONTES QUE ELE ACHOU.
				 *
				 * Ele não rodou AGORA, mas rodou — e as páginas que abriu naquele dia
				 * estão gravadas no cache junto com o resultado. Omitir o número fazia
				 * o cartão parecer o único do time que não trouxe nada, quando na
				 * verdade é o que já tinha trazido. O "aproveitado · pesquisa de N
				 * dias" continua na frente porque é o que explica por que ele não tem
				 * relógio: a honestidade é dizer que o trabalho é reaproveitado, não
				 * esconder que ele existiu.
				 */
				`${a.nFontes ?? 0} fonte${a.nFontes === 1 ? '' : 's'} · aproveitado · pesquisa de ${cacheIdadeDias ?? 0} dia${cacheIdadeDias === 1 ? '' : 's'}`
			: ok
				? cegoFim
					? // "não pôde", não "sem": o selo agora é exclusivo de quem TINHA
						// busca e teve a vaga negada pelo teto. Quem nunca teve busca
						// cai no ramo de baixo e mostra o número de fontes como todo
						// mundo — o dele é 0, e 0 é a verdade sobre o trabalho dele.
						`não pôde consultar a web · ${((a.ms ?? 0) / 1000).toFixed(1)}s`
					: /**
						 * QUEM NÃO PESQUISA DIZ O QUE LEU, não "0 fontes".
						 *
						 * O Estrategista, o Curador, o Redator e o Revisor trabalham em
						 * cima do que os outros trouxeram — é o desenho das três ondas, e
						 * "0 fontes" descrevia isso como se eles não tivessem trabalhado.
						 * Num time de 22 em que todo mundo mostra de onde tirou, o zero
						 * lia-se como falha. O trabalho deles é real e mensurável: são as
						 * entregas do time que passaram pela mesa deles.
						 */
						a.fase === 'sintese' && !a.nFontes
						? `leu o que o time trouxe · ${((a.ms ?? 0) / 1000).toFixed(1)}s`
						: `${a.nFontes ?? 0} fonte${a.nFontes === 1 ? '' : 's'} · ${((a.ms ?? 0) / 1000).toFixed(1)}s`
				: // O selo vem ANTES da frase de propósito: a legenda tem
					// `line-clamp-2` e a frase do papel sozinha já ocupa as duas
					// linhas — o que fica cortado tem que ser a frase, nunca o aviso.
					cegoAgora
					? `sem poder pesquisar · ${a.frase}`
					: rodando && a.buscas
						? // Mesmo motivo do selo: com `line-clamp-2`, o que sobra para
							// cortar tem que ser a frase do papel. Com o contador no fim,
							// a maioria dos cartões terminava em "· 1…" — um número
							// cortado ao meio, que lê como dado corrompido.
							`${a.buscas} busca${a.buscas === 1 ? '' : 's'} · ${a.frase}`
						: a.frase;

	return (
		/*
		 * `div` puro, não `motion.div`. Duas razões medidas:
		 *
		 * 1. O `ref` de um componente `motion` só é chamado na montagem — quando
		 *    a mesa passava de estreita para larga e o `ref` deixava de ser
		 *    `undefined`, ele NUNCA era chamado. Resultado real no headless: só
		 *    5 dos 12 feixes existiam, e um flanco inteiro ficava sem ligação.
		 * 2. Entrada por keyframe CSS sempre termina. Com `initial={{opacity:0}}`
		 *    do motion, qualquer falha em animar deixa o cartão invisível para
		 *    sempre — num painel que existe para PROVAR trabalho, é o pior modo
		 *    de falha possível.
		 */
		<div
			ref={refCb}
			data-chave={a.chave}
			className={`intel-entra relative overflow-hidden rounded-lg border transition-[background-color,border-color] duration-300 ${
				compacto ? 'min-h-[62px] px-2.5 py-2' : 'h-[74px] px-3 py-2.5'
			} ${borda} ${fundo}`}
		>
			{/* Barra de identidade: a cor do especialista, sempre presente. Em
			    telas sem os feixes (celular/tablet) é ela que dá a leitura de
			    "cada um destes é uma pessoa diferente". */}
			<span
				aria-hidden="true"
				className="absolute inset-y-0 left-0 w-[2px]"
				style={{
					backgroundColor: a.cor,
					opacity: aguardando ? 0.25 : rodando ? 1 : 0.55,
				}}
			/>

			{/* Varredura: a única animação do cartão, e ela significa
			    "isto está acontecendo agora" — não "está pesquisando". Um
			    especialista sem busca continua rodando de verdade (está
			    escrevendo a resposta), então a varredura fica; o que não podia
			    ficar era a AFIRMAÇÃO de consulta à web, e essa saiu pelo selo
			    e pela legenda em âmbar. */}
			{rodando && !semMovimento ? (
				<span
					aria-hidden="true"
					className="intel-varredura pointer-events-none absolute inset-y-0 left-0 w-16"
					style={{
						background: `linear-gradient(90deg, transparent, ${a.cor}22, transparent)`,
					}}
				/>
			) : null}

			{/*
			 * O ESMAECIDO DE "AGUARDANDO" MORA AQUI DENTRO, NUNCA NO CARTÃO.
			 *
			 * Com `opacity` no cartão inteiro, o fundo opaco deixava de ser opaco: os
			 * feixes que passam por trás voltavam a aparecer POR CIMA do nome e da
			 * legenda de quem ainda não começou — e são justamente esses os cartões
			 * que o núcleo está regando de curvas na virada de onda. Medido no Chrome
			 * headless a 1440×900 na onda 2: a curva riscava "Analista de Venda
			 * Direta" como se fosse texto tachado.
			 *
			 * Esmaecendo só o conteúdo, a superfície continua tapando o feixe e o
			 * cartão continua lendo como "ainda não é a vez dele".
			 */}
			<div
				className={`flex h-full items-start ${compacto ? 'gap-2' : 'gap-2.5'}`}
				style={{ opacity: aguardando ? 0.45 : 1 }}
			>
				<span
					className={`mt-0.5 grid shrink-0 place-items-center rounded-md ${compacto ? 'h-6 w-6' : 'h-7 w-7'}`}
					style={{ backgroundColor: `${a.cor}1f`, color: a.cor }}
				>
					<Icon className={compacto ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
				</span>

				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-1.5">
						{/*
						 * No compacto o nome QUEBRA em duas linhas em vez de ser cortado.
						 * O nome do especialista é o produto — "Investigador de Co…" não é
						 * um profissional, é uma reticência. Como a altura do cartão vira
						 * `min-h`, ele cresce só na linha em que isso acontecer, e a grade
						 * iguala a altura da linha inteira.
						 */}
						<p
							className={`font-semibold leading-tight text-slate-100 ${compacto ? 'line-clamp-2 text-[11.5px]' : 'truncate text-[12.5px]'}`}
						>
							{a.nome}
						</p>
						{rodando ? (
							<span
								className={`h-1.5 w-1.5 shrink-0 rounded-full ${semMovimento ? '' : 'intel-pisca'}`}
								style={{ backgroundColor: a.cor }}
							/>
						) : null}
					</div>
					<p
						className={`line-clamp-2 ${compacto ? 'mt-0.5 text-[10px] leading-[1.3]' : 'mt-1 text-[10.5px] leading-snug'} ${
							falhou || cegoFim || cegoAgora
								? 'text-amber-400/90'
								: aproveitado
									? 'text-sky-300/80'
									: ok
										? 'text-emerald-300/80'
										: 'text-slate-400'
						}`}
					>
						{legenda}
					</p>
				</div>

				<span className="mt-0.5 shrink-0 font-mono text-[10px] leading-none">
					{/* `SEM BUSCA` vence o `OK` porque é a informação que muda a
				    decisão do aluno: este especialista PESQUISARIA, o teto da
				    execução não deixou, e o que ele respondeu ficou sem uma
				    página para conferir. */}
					{cegoFim || cegoAgora ? (
						<span className="text-[9px] text-amber-400">SEM BUSCA</span>
					) : ok ? (
						<span className="text-emerald-400">OK</span>
					) : aproveitado ? (
						<span className="text-sky-400">CACHE</span>
					) : falhou ? (
						<span className="text-amber-400">!</span>
					) : rodando ? (
						<span className="text-slate-400">···</span>
					) : (
						<span className="text-slate-600">—</span>
					)}
				</span>
			</div>
		</div>
	);
});

/* ═══════════════════════ o núcleo ═══════════════════════ */

const Nucleo = memo(function Nucleo({
	alvo,
	rotuloOnda,
	subtitulo,
	cruzando,
	semMovimento,
	orbRef,
}: {
	alvo: AlvoViva;
	/** "Onda 2 · cruzando dados" — quem manda é a WarRoom, que conhece as faixas. */
	rotuloOnda: string;
	subtitulo: string | null;
	cruzando: boolean;
	semMovimento: boolean;
	orbRef?: React.Ref<HTMLDivElement>;
}) {
	return (
		/* `relative` para o núcleo ficar ACIMA da camada de feixes: sem isso as
		   curvas riscam o nome do que está sendo analisado, que é o texto mais
		   importante da tela. */
		<div className="relative flex flex-col items-center">
			<div ref={orbRef} className="relative grid h-40 w-40 place-items-center">
				{/* Anel externo tracejado girando: enquanto a mesa está aberta, o
				    núcleo está recebendo. Para quando o aluno pede menos movimento. */}
				<span
					aria-hidden="true"
					className={`absolute inset-0 rounded-full border border-dashed ${semMovimento ? '' : 'intel-gira'}`}
					style={{
						borderColor: cruzando
							? 'rgba(56,189,248,0.45)'
							: 'color-mix(in srgb, var(--screen-accent) 40%, transparent)',
					}}
				/>
				<span
					aria-hidden="true"
					className="absolute inset-3 rounded-full"
					style={{
						background:
							'radial-gradient(closest-side, color-mix(in srgb, var(--screen-accent) 18%, transparent), transparent)',
					}}
				/>
				<span
					aria-hidden="true"
					className="absolute inset-[18px] rounded-full border"
					style={{ borderColor: 'rgba(255,255,255,0.10)' }}
				/>

				{/* O alvo de verdade: a foto que o aluno mandou, ou a inicial do ramo. */}
				<div className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-full border border-white/10 bg-black/50">
					{alvo.imagem ? (
						/* `img` cru de propósito: é um object URL de um `File` local, que
						   o otimizador do Next não consegue processar. */
						<img
							src={alvo.imagem}
							alt=""
							className="h-full w-full object-cover opacity-90"
						/>
					) : (
						<span
							className="font-display text-3xl font-bold"
							style={{ color: 'var(--screen-accent)' }}
						>
							{alvo.titulo.trim().charAt(0).toUpperCase() || '?'}
						</span>
					)}
					{!semMovimento ? (
						<span
							aria-hidden="true"
							className="intel-scanline pointer-events-none absolute inset-x-0 h-px"
							style={{
								background:
									'linear-gradient(90deg, transparent, var(--screen-accent), transparent)',
							}}
						/>
					) : null}
				</div>
			</div>

			<p className="mt-3 max-w-[15rem] truncate text-center text-[13px] font-semibold text-slate-100">
				{alvo.titulo || (alvo.escopo === 'produto' ? 'sua peça' : 'seu ramo')}
			</p>
			<p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
				{alvo.escopo === 'produto' ? 'peça em análise' : 'ramo em análise'}
			</p>

			<div
				className="mt-3 rounded-full border px-3 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.14em]"
				style={
					cruzando
						? {
								borderColor: 'rgba(56,189,248,0.35)',
								color: '#7dd3fc',
								backgroundColor: 'rgba(56,189,248,0.08)',
							}
						: {
								borderColor:
									'color-mix(in srgb, var(--screen-accent) 35%, transparent)',
								color: 'var(--screen-accent)',
								backgroundColor:
									'color-mix(in srgb, var(--screen-accent) 8%, transparent)',
							}
				}
			>
				{rotuloOnda}
			</div>

			{subtitulo ? (
				<p className="mt-2 max-w-[15rem] text-center text-[10.5px] leading-snug text-slate-500">
					{subtitulo}
				</p>
			) : null}
		</div>
	);
});

/* ═══════════════════════ divisor de faixa ═══════════════════════ */

/**
 * O divisor de onda. É ele que torna o agrupamento legível — sem um rótulo, 22
 * cartões em três blocos são só 22 cartões — e é nele que mora a JUNÇÃO, o
 * segundo ponto de convergência da mesa.
 *
 * O trilho de luz acende só na faixa VIVA (`ativo`), que é a onda em que o
 * motor está trabalhando agora — nas ondas 2 e 3 isso quer dizer, literalmente,
 * "o material da faixa de cima está descendo para cá".
 */
const Divisor = memo(function Divisor({
	numero,
	titulo,
	estado,
	ativo,
	semMovimento,
	juncaoRef,
}: {
	numero: number;
	titulo: string;
	estado: string;
	ativo: boolean;
	semMovimento: boolean;
	/**
	 * Presente só no divisor que é ORIGEM de feixes (o da síntese, quando existe
	 * onda 2 antes dela). Sem ele o losango não é desenhado — no Rápido a
	 * síntese bebe direto do núcleo e não há segunda convergência nenhuma.
	 */
	juncaoRef?: React.Ref<HTMLSpanElement>;
}) {
	return (
		/* `relative` pelo mesmo motivo das faixas: o divisor precisa pintar ACIMA
		   da camada de feixes, senão as curvas riscam o rótulo da onda. */
		<div className="relative mb-2 mt-4 flex items-center gap-2 sm:gap-3">
			<span
				className="shrink-0 text-[9.5px] font-semibold uppercase tracking-[0.2em]"
				style={{ color: ativo ? '#7dd3fc' : '#64748b' }}
			>
				Onda {numero} · {titulo}
			</span>

			{/* Trilho da esquerda some no celular: com ele, o rótulo e o estado —
			    ambos `shrink-0` — somavam mais que a largura da tela e EMPURRAVAM a
			    página inteira para fora. Medido no Chrome headless a 390 px: a mesa
			    ficava ~470 px de largura, os cartões saíam cortados pela direita e as
			    faixas ainda abriam duas colunas por causa da largura falsa. */}
			<span className="relative hidden h-px flex-1 overflow-hidden bg-white/[0.08] sm:block">
				{ativo && !semMovimento ? (
					<span
						aria-hidden="true"
						className="intel-trilho absolute inset-y-0 left-0"
						style={{
							background:
								'linear-gradient(90deg, transparent, #7dd3fc, transparent)',
						}}
					/>
				) : null}
			</span>

			{juncaoRef ? (
				<span
					ref={juncaoRef}
					aria-hidden="true"
					className={`relative grid h-3.5 w-3.5 shrink-0 rotate-45 place-items-center border ${
						ativo && !semMovimento ? 'intel-pisca' : ''
					}`}
					style={{
						borderColor: ativo
							? 'rgba(56,189,248,0.7)'
							: 'rgba(255,255,255,0.2)',
						backgroundColor: ativo
							? 'rgba(56,189,248,0.25)'
							: 'rgba(255,255,255,0.05)',
					}}
				/>
			) : null}

			<span className="relative h-px flex-1 overflow-hidden bg-white/[0.08]">
				{ativo && !semMovimento ? (
					<span
						aria-hidden="true"
						className="intel-trilho absolute inset-y-0 left-0"
						style={{
							animationDelay: '0.5s',
							background:
								'linear-gradient(90deg, transparent, #7dd3fc, transparent)',
						}}
					/>
				) : null}
			</span>

			{/* `min-w-0 truncate`, nunca `shrink-0`: este texto é o que cede quando a
			    tela é estreita. Cortar as últimas letras do estado é aceitável;
			    estourar a largura da página não é. */}
			<span className="min-w-0 truncate text-[9.5px] uppercase tracking-[0.14em] text-slate-500">
				{estado}
			</span>
		</div>
	);
});

/* ═══════════════════════ os feixes ═══════════════════════ */

/**
 * `entra`  cartão da descoberta  → núcleo    (ele alimenta o digest da onda 1)
 * `sai`    núcleo                → cartão do aprofundamento (o digest descendo)
 * `entra2` cartão do aprofundamento → junção (o que ele apurou entra no digest
 *                                            acumulado que a síntese vai ler)
 * `sai2`   junção (ou o núcleo, no Rápido) → cartão da síntese
 */
type TipoFeixe = 'entra' | 'sai' | 'entra2' | 'sai2';

interface Feixe {
	chave: string;
	d: string;
	tipo: TipoFeixe;
}

/** Curva vertical de um ponto ao outro, com as alças no meio do caminho. */
function curvaV(x1: number, y1: number, x2: number, y2: number): string {
	const meio = (y1 + y2) / 2;
	return `M ${x1} ${y1} C ${x1} ${meio}, ${x2} ${meio}, ${x2} ${y2}`;
}

/**
 * Geometria dos feixes, medida do DOM UMA VEZ por layout (montagem, troca do
 * time e resize) — nunca por frame.
 *
 * A alternativa seria calcular as posições por índice, mas isso obriga o layout
 * a ser fixo para sempre. Medir custa um `getBoundingClientRect` por cartão em
 * um punhado de eventos; o movimento em si é 100% CSS.
 */
function useFeixes(ativo: boolean, assinatura: string) {
	const mesaRef = useRef<HTMLDivElement>(null);
	/**
	 * O bloco de faixas DENTRO da mesa. A mesa é esticada pela linha da grade (é
	 * ela que dá as coordenadas dos feixes e a largura das faixas); este é o que
	 * tem a altura do CONTEÚDO, e por isso é ele quem avisa quando o conteúdo
	 * cresce sem a mesa mudar de tamanho — o subtítulo do núcleo aparecendo na
	 * virada de onda empurra tudo que está embaixo dele uns 20 px.
	 */
	const conteudoRef = useRef<HTMLDivElement>(null);
	const orbRef = useRef<HTMLDivElement>(null);
	const juncaoRef = useRef<HTMLSpanElement>(null);
	const cartoes = useRef(new Map<string, HTMLElement>());
	/** Faixa de cada cartão. Fora do `cartoes` para o ref callback ser estável. */
	const bandaDe = useRef(new Map<string, FaseOnda>());
	const callbacks = useRef(
		new Map<string, (el: HTMLDivElement | null) => void>(),
	);
	const [box, setBox] = useState({ w: 0, h: 0 });
	const [feixes, setFeixes] = useState<Feixe[]>([]);

	/**
	 * UM callback por chave, criado uma única vez e reaproveitado.
	 *
	 * A versão anterior devolvia uma closure nova a cada render, e como ela é
	 * prop do `Estacao` (que é `memo`), TODOS os cartões re-renderizavam a cada
	 * evento do stream. Com 5 cartões isso passava; com 22, um Profundo dispara
	 * dezenas de eventos e cada um custava 22 re-renders inúteis.
	 *
	 * A faixa é gravada num mapa à parte, e não capturada na closure, justamente
	 * para o callback nunca precisar ser recriado quando o cartão troca de faixa.
	 */
	const registrar = useCallback((chave: string, banda: FaseOnda) => {
		bandaDe.current.set(chave, banda);
		let cb = callbacks.current.get(chave);
		if (!cb) {
			cb = (el: HTMLDivElement | null) => {
				if (el) cartoes.current.set(chave, el);
				else cartoes.current.delete(chave);
			};
			callbacks.current.set(chave, cb);
		}
		return cb;
	}, []);

	/**
	 * `assinatura` (as chaves do time em ordem) é o gatilho de re-medição: quando
	 * o time muda, os cartões mudam de lugar e a geometria precisa ser refeita.
	 * Ela também FILTRA o mapa de refs — a limpeza do ref callback e a montagem
	 * do cartão novo não têm ordem garantida, e um cartão que já saiu do DOM
	 * ainda devolve um retângulo (zerado), o que desenharia um feixe para o
	 * canto superior esquerdo.
	 */
	useEffect(() => {
		const mesa = mesaRef.current;
		if (!mesa) return;
		const vivos = new Set(assinatura.split('|'));

		const medir = () => {
			const m = mesa.getBoundingClientRect();
			if (m.width === 0) return;

			/**
			 * A largura sai daqui MESMO SEM FEIXES, e não é sobra de código: é ela
			 * que as faixas usam para equilibrar as colunas (`estiloFaixa`). Sem
			 * medir no tablet e no celular, aquele cálculo caía no `auto-fit` do CSS
			 * e a última linha voltava a ter um cartão órfão.
			 *
			 * Só troca o estado quando o número muda — `setBox` com objeto novo a
			 * cada medição furaria o `memo` da camada de feixes de graça.
			 */
			setBox((b) =>
				b.w === m.width && b.h === m.height ? b : { w: m.width, h: m.height },
			);

			const orb = orbRef.current;
			if (!ativo || !orb) {
				setFeixes((f) => (f.length === 0 ? f : []));
				return;
			}
			const o = orb.getBoundingClientRect();
			const ox = o.left - m.left + o.width / 2;
			const oy = o.top - m.top + o.height / 2;
			const raio = o.width / 2;
			/** De onde o núcleo despeja: a borda de baixo dele. */
			const oBase = oy + raio * 0.95;

			// A junção só existe quando há onda 2 na mesa. Sem ela, a síntese
			// continua bebendo do núcleo — o desenho aprovado de duas ondas.
			const jEl = juncaoRef.current;
			const j = jEl?.isConnected ? jEl.getBoundingClientRect() : null;
			const jx = j ? j.left - m.left + j.width / 2 : null;
			const jTopo = j ? j.top - m.top : 0;
			const jBase = j ? j.bottom - m.top : 0;

			const saida: Feixe[] = [];
			for (const [chave, el] of cartoes.current) {
				if (!vivos.has(chave) || !el.isConnected) continue;
				const banda = bandaDe.current.get(chave) ?? 'descoberta';
				const r = el.getBoundingClientRect();
				const cx = r.left - m.left + r.width / 2;
				const cy = r.top - m.top + r.height / 2;
				const topo = r.top - m.top;
				const base = r.bottom - m.top;

				if (banda === 'descoberta') {
					// Pesquisador de campo: sai pela borda interna do cartão e converge
					// na lateral do núcleo — todos do mesmo flanco no mesmo ponto.
					const esquerda = cx < ox;
					const x1 = esquerda ? r.right - m.left : r.left - m.left;
					const x2 = ox + (esquerda ? -raio : raio) * 0.95;
					saida.push({
						chave,
						tipo: 'entra',
						d: `M ${x1} ${cy} Q ${(x1 + x2) / 2} ${cy}, ${x2} ${oy}`,
					});
					continue;
				}

				if (banda === 'aprofundamento') {
					// O núcleo despeja o digest da onda 1 em cada um deles…
					saida.push({ chave, tipo: 'sai', d: curvaV(ox, oBase, cx, topo) });
					// …e o que eles apurarem desce para a junção, que é o material da
					// síntese. Sem junção (Rápido) esta faixa nem existe.
					if (jx !== null) {
						saida.push({
							chave,
							tipo: 'entra2',
							d: curvaV(cx, base, jx, jTopo),
						});
					}
					continue;
				}

				const fx = jx ?? ox;
				const fy = jx !== null ? jBase : oBase;
				saida.push({ chave, tipo: 'sai2', d: curvaV(fx, fy, cx, topo) });
			}

			setFeixes(saida);
		};

		medir();
		// Segunda passada no frame seguinte: os ícones do lucide resolvem lazy e o
		// efeito roda antes do primeiro paint, então a primeira medida pode pegar
		// um layout que ainda vai assentar.
		const quadro = requestAnimationFrame(medir);

		/**
		 * TERCEIRA PASSADA, DEPOIS DAS FONTES — e ela não é zelo: sem ela os feixes
		 * saíam VISIVELMENTE fora do lugar.
		 *
		 * As fontes do app vêm do Google Fonts, então o primeiro layout usa a
		 * fallback e as caixas de texto mudam de altura quando a real chega. O
		 * núcleo tem três linhas de texto e cresce alguns pixels, o que empurra
		 * tudo que está embaixo dele. Medido no Chrome headless a 1600×1000: a
		 * junção ficava ~40 px acima de onde os feixes convergiam.
		 *
		 * Observar a mesa sozinha não pega esse caso: ela é item de grade e vem
		 * ESTICADA pela linha, então a altura externa não muda — só o conteúdo se
		 * desloca por dentro. Por isso o `ResizeObserver` observa TAMBÉM o bloco de
		 * conteúdo (`conteudoRef`, cuja altura é a do conteúdo mesmo) E esta passada
		 * existe: as duas defesas cobrem gatilhos diferentes — esta cobre a fonte
		 * que chega depois do primeiro layout, aquela cobre tudo que cresce ou
		 * encolhe durante o run (o subtítulo do núcleo na virada de onda).
		 */
		let vivo = true;
		void document.fonts?.ready.then(() => {
			if (vivo) medir();
		});

		const ro = new ResizeObserver(medir);
		ro.observe(mesa);
		if (conteudoRef.current) ro.observe(conteudoRef.current);
		return () => {
			vivo = false;
			cancelAnimationFrame(quadro);
			ro.disconnect();
		};
	}, [ativo, assinatura]);

	return { mesaRef, conteudoRef, orbRef, juncaoRef, registrar, feixes, box };
}

const CamadaFeixes = memo(function CamadaFeixes({
	feixes,
	box,
	porChave,
	onda,
	semMovimento,
}: {
	feixes: Feixe[];
	box: { w: number; h: number };
	porChave: Map<string, Especialista>;
	onda: OndaViva | null;
	semMovimento: boolean;
}) {
	if (!box.w || feixes.length === 0) return null;

	/**
	 * Que ondas JÁ COMEÇARAM, deduzido da última que chegou.
	 *
	 * As ondas são emitidas em ordem e `onda` guarda só a mais recente — então
	 * `nivel >= 1` quer dizer "o aprofundamento já foi despachado", e continua
	 * verdade depois que a síntese começa. Sem isso, o feixe do núcleo para a
	 * onda 2 sumiria no instante em que a onda 3 começasse, que é justamente
	 * quando o aluno está olhando para a mesa cheia.
	 */
	const nivel = onda ? ORDEM_ONDA[onda.fase] : -1;

	/**
	 * QUEM DE FATO VAI LER O MATERIAL desta onda — não "todo cartão da faixa".
	 *
	 * O evento `onda` traz `para` com as chaves que o motor DESPACHOU
	 * (ai-research-team.ts), e quem veio do cache nunca está lá porque não roda.
	 * Sem esta lista, a condição do pacote era só "é feixe de saída": em
	 * mercado+rápido com cache quente o Curador de Oportunidades
	 * (`compartilhavel: true` e fase de síntese) fica `aproveitado`, e a tela
	 * mostrava dados correndo pelo feixe até um cartão escrito "CACHE ·
	 * aproveitado · pesquisa de 4 dias". O cartão obedecia o contrato e o feixe
	 * mentia — e o feixe é o sinal mais forte de "está entrando dado aqui AGORA"
	 * da tela inteira.
	 */
	const vaiLer = onda ? new Set(onda.para) : null;

	return (
		/*
		 * Tamanho EXPLÍCITO em pixels, e não `inset-0 h-full w-full` com
		 * `preserveAspectRatio="none"`.
		 *
		 * Com o SVG esticado, uma medida velha não vira um deslocamento pequeno:
		 * vira ESCALA. Toda coordenada era multiplicada por (altura real / altura
		 * medida), e o erro crescia conforme descia a mesa — o que fazia os feixes
		 * da onda 2 furarem os cartões da onda 3. Casando as duas medidas, o pior
		 * caso de uma medida velha é um deslocamento de alguns pixels, uniforme.
		 */
		<svg
			aria-hidden="true"
			className="pointer-events-none absolute left-0 top-0"
			width={box.w}
			height={box.h}
			viewBox={`0 0 ${box.w} ${box.h}`}
			focusable="false"
		>
			<title>Feixes de dados entre os especialistas e o núcleo</title>
			{feixes.map((f) => {
				const a = porChave.get(f.chave);
				if (!a) return null;

				const entregou = a.status === 'ok';
				const cache = a.status === 'aproveitado';
				const rodando = a.status === 'rodando';
				const falhou = a.status === 'falhou';

				// Feixe de onda que ainda não começou não existe: antes do despacho
				// não há material nenhum viajando, e desenhá-lo seria encenação.
				if ((f.tipo === 'sai' || f.tipo === 'entra2') && nivel < 1) return null;
				if (f.tipo === 'sai2' && nivel < 2) return null;

				/**
				 * O pacote animado afirma UMA coisa: está passando dado por este
				 * feixe AGORA. Só existem dois casos verdadeiros —
				 *
				 *   · especialista rodando (feixe `entra`/`entra2`, subindo o que ele
				 *     está apurando para o ponto de convergência);
				 *   · cartão que ESTÁ nesta onda e ainda não entregou (feixe
				 *     `sai`/`sai2`, o material descendo para ele).
				 *
				 * O `aproveitado` sai fora pelos dois lados: não entra em `onda.para`
				 * (o motor só despacha quem vai rodar) e o `!cache` é o cinto de
				 * segurança caso um dia entre. E quem já concluiu para de receber —
				 * antes, como a onda continua sendo a última até o fim do run, o
				 * pacote seguia correndo para cartões que já tinham entregado, o que
				 * é o mesmo tipo de encenação.
				 */
				const descendo = f.tipo === 'sai' || f.tipo === 'sai2';
				const recebendo =
					descendo &&
					!cache &&
					vaiLer?.has(f.chave) === true &&
					(rodando || a.status === 'aguardando');

				const cor = falhou ? '#f59e0b' : a.cor;
				const opacidade =
					entregou || cache
						? 0.5
						: rodando
							? 0.3
							: falhou
								? 0.22
								: descendo
									? 0.35
									: 0.09;

				return (
					<g key={`${f.tipo}-${f.chave}`}>
						<path
							d={f.d}
							fill="none"
							stroke={
								entregou || cache || rodando || descendo ? cor : '#ffffff'
							}
							strokeWidth={entregou ? 1.4 : 1}
							strokeOpacity={opacidade}
							strokeDasharray={cache ? '3 4' : undefined}
						/>
						{/* Pacote viajando: SÓ enquanto há tráfego de verdade — o
						    especialista rodando, ou o material descendo para quem
						    de fato vai lê-lo nesta onda. */}
						{!semMovimento && (rodando || recebendo) ? (
							<path
								className="intel-pacote"
								d={f.d}
								fill="none"
								stroke={cor}
								strokeWidth={2}
								strokeLinecap="round"
								pathLength={100}
								strokeDasharray="5 95"
							/>
						) : null}
					</g>
				);
			})}
		</svg>
	);
});

/* ═══════════════════════ console e fontes ═══════════════════════ */

/**
 * `memo` nos dois: um Profundo com 22 especialistas emite centenas de eventos, e
 * `fonte` e `busca` chegam intercalados. Sem o memo, cada fonte nova
 * re-renderizava a lista inteira do console e cada busca nova re-renderizava o
 * feed de fontes inteiro (tetos de 150 e 160 linhas em `tool-intel-view`), sem
 * que uma única letra mudasse em nenhum dos dois.
 */
const Console = memo(function Console({
	buscas,
	porChave,
	semMovimento,
}: {
	buscas: LinhaBusca[];
	porChave: Map<string, Especialista>;
	semMovimento: boolean;
}) {
	const rolo = useRef<HTMLDivElement>(null);
	/**
	 * ROLA O PRÓPRIO CONSOLE, NUNCA A PÁGINA.
	 *
	 * `scrollIntoView` na última linha parecia inofensivo e era o defeito mais
	 * caro da tela em telas estreitas: abaixo de 1280 px o console fica DEPOIS da
	 * mesa, lá embaixo, então o navegador rolava a JANELA para trazer a linha
	 * nova até a vista — a cada busca disparada. Medido no Chrome headless a
	 * 390×844 num profundo: a página abria em `scrollY = 1561` de 2720, ou seja,
	 * o aluno caía no meio da onda 2 sem nunca ver o relógio, o contador de
	 * profissionais nem a foto da peça dele. A 1100×1600 o mesmo empurrão comia o
	 * topo da barra de telemetria.
	 *
	 * `scrollTo` no elemento que tem o `overflow-y` mexe só na barra dele.
	 */
	// biome-ignore lint/correctness/useExhaustiveDependencies: rolar ao chegar linha nova
	useEffect(() => {
		const el = rolo.current;
		if (!el) return;
		el.scrollTo({
			top: el.scrollHeight,
			behavior: semMovimento ? 'auto' : 'smooth',
		});
	}, [buscas.length, semMovimento]);

	return (
		<div className="relative rounded-xl border border-white/10 bg-black/40 p-3">
			<Cantos />
			<div className="mb-2 flex items-baseline justify-between">
				<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
					Buscas disparadas
				</p>
				<span className="font-mono text-[11px] tabular-nums text-slate-500">
					{buscas.length}
				</span>
			</div>

			<div
				ref={rolo}
				className="max-h-[26vh] space-y-2 overflow-y-auto pr-1 md:max-h-[30vh] xl:max-h-[34vh]"
			>
				{buscas.length === 0 ? (
					<p className="py-6 text-center font-mono text-[11px] text-slate-500">
						aguardando a primeira consulta…
					</p>
				) : null}

				{buscas.map((b) => {
					const a = porChave.get(b.chave);
					return (
						<div
							key={b.id}
							className="intel-entra font-mono text-[10.5px] leading-snug"
						>
							<p className="flex items-center gap-1.5 text-slate-500">
								<span
									className="h-1.5 w-1.5 shrink-0 rounded-full"
									style={{ backgroundColor: a?.cor ?? '#64748b' }}
								/>
								<span className="truncate">{a?.nome ?? b.chave}</span>
								<span className="ml-auto shrink-0 rounded border border-white/10 px-1 text-[9px] uppercase text-slate-500">
									{rotuloMotor(b.motor)}
								</span>
							</p>
							<p
								className="mt-0.5 break-words pl-3 text-slate-300"
								style={{
									color:
										'color-mix(in srgb, var(--screen-accent) 70%, #e2e8f0)',
								}}
							>
								<span className="text-slate-600">&gt; </span>
								{b.query}
							</p>
						</div>
					);
				})}
			</div>
		</div>
	);
});

const Fontes = memo(function Fontes({
	fontes,
	porChave,
}: {
	fontes: FonteViva[];
	porChave: Map<string, Especialista>;
}) {
	return (
		<div className="relative rounded-xl border border-white/10 bg-white/[0.02] p-3">
			<Cantos />
			<div className="mb-2 flex items-baseline justify-between">
				<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
					Fontes encontradas
				</p>
				<span className="font-mono text-[11px] tabular-nums text-slate-300">
					{fontes.length}
				</span>
			</div>

			<div className="max-h-[26vh] space-y-1 overflow-y-auto pr-1 md:max-h-[32vh] xl:max-h-[40vh]">
				{fontes.map((f) => {
					const a = f.agente ? porChave.get(f.agente) : undefined;
					return (
						<a
							key={f.url}
							href={f.url}
							target="_blank"
							rel="noopener noreferrer"
							className="intel-entra flex items-start gap-2 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-white/5"
						>
							{/* Favicon público: dá identidade à fonte sem nenhum asset
								    nosso. Falha em silêncio quando o site não tem. */}
							{/* biome-ignore lint/performance/noImgElement: favicon externo, não passa pelo otimizador */}
							<img
								src={`https://www.google.com/s2/favicons?domain=${dominio(f.url)}&sz=32`}
								alt=""
								className="mt-0.5 h-4 w-4 shrink-0 rounded"
								loading="lazy"
							/>
							<span className="min-w-0 flex-1">
								<span className="block truncate text-[11.5px] leading-tight text-slate-200">
									{f.titulo || dominio(f.url)}
								</span>
								<span className="flex items-center gap-1.5 truncate text-[9.5px] text-slate-500">
									{a ? (
										<span
											className="h-1 w-1 shrink-0 rounded-full"
											style={{ backgroundColor: a.cor }}
										/>
									) : null}
									{dominio(f.url)}
								</span>
							</span>
						</a>
					);
				})}

				{fontes.length === 0 ? (
					<p className="py-6 text-center text-[11.5px] leading-relaxed text-slate-500">
						As fontes aparecem aqui conforme
						<br />o time encontra.
					</p>
				) : null}
			</div>
		</div>
	);
});

/* ═══════════════════════ a sala ═══════════════════════ */

/**
 * Como está a faixa: é o texto da direita do divisor, e ele não pode mentir.
 *
 * Sai dos CARTÕES, não do evento `onda`. Ler o evento parecia mais direto e era
 * uma armadilha: se um dia a onda for despachada sem emitir (ou o evento se
 * perder), os cartões apareceriam rodando com o divisor escrito "aguardando".
 * O estado dos cartões é o próprio fato.
 */
function estadoDaFaixa(
	cards: Especialista[],
	fazendo: string,
	esperando: string,
): string {
	if (cards.every((a) => CONCLUIDOS.includes(a.status))) return 'concluída';
	if (cards.every((a) => a.status === 'aguardando')) return esperando;
	return fazendo;
}

export function WarRoom({
	especialistas,
	fontes,
	buscasLog,
	etapa,
	buscas,
	inicio,
	alvo,
	onda,
	cacheIdadeDias,
	modo,
	onSegundoPlano,
}: {
	especialistas: Especialista[];
	fontes: FonteViva[];
	buscasLog: LinhaBusca[];
	etapa: string;
	buscas: number;
	inicio: number;
	alvo: AlvoViva;
	onda: OndaViva | null;
	cacheIdadeDias: number | null;
	/**
	 * Só para dimensionar o esqueleto do "Montando o time…". O time real vem do
	 * `time_montado`; o esqueleto é caixa cinza e não promete contagem nenhuma —
	 * mas saltar de 6 caixas para 22 cartões é um solavanco desnecessário.
	 */
	modo?: 'rapido' | 'profundo';
	onSegundoPlano?: () => void;
}) {
	const reduzido = useReducedMotion();
	const semMovimento = reduzido === true;

	/**
	 * A mesa com feixes só existe em tela larga (≥1280px). Não é preciosismo de
	 * estética: no celular os cartões empilham em uma coluna, o núcleo vira um
	 * cabeçalho e um feixe ligando cartão a núcleo não representaria mais nada.
	 * E é também a defesa de performance — nada de SVG medido no celular.
	 */
	const [mesaLarga, setMesaLarga] = useState(false);
	useEffect(() => {
		const mq = window.matchMedia('(min-width: 1280px)');
		const aplicar = () => setMesaLarga(mq.matches);
		aplicar();
		mq.addEventListener('change', aplicar);
		return () => mq.removeEventListener('change', aplicar);
	}, []);

	/**
	 * As TRÊS FAIXAS. Um `for` só em vez de três `filter`: com 22 especialistas e
	 * um evento por segundo isso roda o tempo todo, e o que importa mesmo é a
	 * identidade estável dos arrays para os `memo` de baixo segurarem.
	 */
	const { descoberta, aprofundamento, sintese, porChave } = useMemo(() => {
		const d: Especialista[] = [];
		const ap: Especialista[] = [];
		const s: Especialista[] = [];
		const mapa = new Map<string, Especialista>();
		for (const a of especialistas) {
			mapa.set(a.chave, a);
			if (a.fase === 'sintese') s.push(a);
			else if (a.fase === 'aprofundamento') ap.push(a);
			else d.push(a);
		}
		return { descoberta: d, aprofundamento: ap, sintese: s, porChave: mapa };
	}, [especialistas]);

	const assinatura = especialistas.map((a) => a.chave).join('|');
	const { mesaRef, conteudoRef, orbRef, juncaoRef, registrar, feixes, box } =
		useFeixes(mesaLarga && especialistas.length > 0, assinatura);

	// Flancos: pares à esquerda, ímpares à direita. Mantém as duas colunas
	// equilibradas em qualquer tamanho de onda 1 (3 no Rápido, 9 no Profundo).
	const flancoEsq = descoberta.filter((_, i) => i % 2 === 0);
	const flancoDir = descoberta.filter((_, i) => i % 2 === 1);

	const concluidos = especialistas.filter((a) =>
		CONCLUIDOS.includes(a.status),
	).length;
	const pct = especialistas.length
		? (concluidos / especialistas.length) * 100
		: 0;

	const montando = especialistas.length === 0;

	/**
	 * O compacto é resposta à LARGURA DISPONÍVEL POR CARTÃO, não ao tamanho do
	 * time. Num celular a faixa tem uma coluna só e o cartão ocupa os 366 px
	 * inteiros: apertar o nome para 11,5 px e a legenda para 10 px ali não ganha
	 * espaço nenhum — só entrega ao aluno de celular, que é a maioria, a letra
	 * miúda que existia para fazer 22 cartões caberem num monitor.
	 */
	const compacto =
		especialistas.length > LIMIAR_COMPACTO &&
		!(box.w > 0 && cabemNaLinha(box.w) === 1);

	/**
	 * A NUMERAÇÃO É DINÂMICA, e tem que ser: o Rápido roda duas ondas, não três.
	 * Chamar a síntese dele de "Onda 3" com a faixa 2 inexistente seria contar
	 * uma etapa que não aconteceu.
	 */
	const temAprof = aprofundamento.length > 0;
	const nDescoberta = 1;
	const nAprof = 2;
	const nSintese = temAprof ? 3 : 2;

	const nivel = onda ? ORDEM_ONDA[onda.fase] : -1;
	const cruzando = nivel >= 1;

	const rotuloNucleo =
		nivel >= 2
			? `Onda ${nSintese} · cruzando dados`
			: nivel >= 1
				? `Onda ${nAprof} · aprofundando`
				: `Onda ${nDescoberta} · pesquisa de campo`;

	const subtituloNucleo =
		onda && nivel >= 1
			? `${onda.de.length} entrega${onda.de.length === 1 ? '' : 's'} na mesa de ${onda.para.length} especialista${onda.para.length === 1 ? '' : 's'}`
			: null;

	return (
		/*
		 * A PÁGINA fica ancorada no topo, sempre. Centralizar o conteúdo inteiro na
		 * vertical tem dois defeitos: `justify-content: center` (e o `safe center`,
		 * que o Chrome não honra aqui) DECEPA o topo quando a mesa é mais alta que a
		 * tela — medido a 390×844, a tela saía inteiramente preta —, e a margem
		 * automática, que não decepa, faz a barra de telemetria SALTAR uns 280 px
		 * para cima no instante em que o time chega e o conteúdo cresce.
		 *
		 * A folga que incomodava não era da página: era a da MESA, que no Rápido tem
		 * metade da altura da coluna de buscas e fontes ao lado. Ela é resolvida lá
		 * embaixo, dentro da linha da grade, sem mexer no topo.
		 */
		<div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#07070a]">
			<div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.045]" />
			<div
				className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[52rem] -translate-x-1/2 rounded-full blur-3xl"
				style={{
					background:
						'radial-gradient(closest-side, color-mix(in srgb, var(--screen-accent) 20%, transparent), transparent)',
				}}
			/>

			<div className="relative mx-auto w-full max-w-[1560px] px-3 py-5 md:px-7 md:py-7">
				{/* ── barra de telemetria ── */}
				<div className="relative mb-4 flex flex-wrap items-end justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
					<Cantos cor="color-mix(in srgb, var(--screen-accent) 45%, transparent)" />
					<div className="min-w-0">
						<p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
							<span
								className={`h-1.5 w-1.5 rounded-full ${semMovimento ? '' : 'intel-pisca'}`}
								style={{ backgroundColor: 'var(--screen-accent)' }}
							/>
							Mesa de operações
						</p>
						<h2 className="font-display mt-1 truncate text-xl font-bold text-slate-50 md:text-2xl">
							{etapa}
						</h2>
					</div>
					<div className="flex items-center gap-4 md:gap-7">
						<Metrica valor={<Relogio inicio={inicio} />} rotulo="decorrido" />
						<Metrica
							valor={
								<>
									{concluidos}
									<span className="text-slate-500">
										/{especialistas.length || '—'}
									</span>
								</>
							}
							rotulo="profissionais"
						/>
						<Metrica valor={buscas} rotulo="buscas" />
						<Metrica valor={fontes.length} rotulo="fontes" />
					</div>
				</div>

				{/* Barra DETERMINÍSTICA: sabemos o denominador desde o começo. Barra
				    indeterminada aqui seria preguiça — e mentira sobre o que se sabe. */}
				<div className="mb-4 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.06]">
					<div
						className="h-full rounded-full transition-[width] duration-500"
						style={{
							width: `${pct}%`,
							background:
								'linear-gradient(90deg, color-mix(in srgb, var(--screen-accent) 45%, transparent), var(--screen-accent))',
						}}
					/>
				</div>

				<div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
					{/* ══ a mesa ══ */}
					{/*
					 * A MESA OCUPA A ALTURA DA LINHA E O CONTEÚDO FICA NO MEIO DELA.
					 *
					 * No Profundo isso não muda nada: 22 cartões são mais altos que a
					 * coluna da direita, a folga é negativa e a margem automática vira
					 * zero. Quem muda é o Rápido, em que a coluna de buscas e fontes é
					 * quase o dobro da mesa: com a mesa colada no topo, 1600×1000 mostrava
					 * cinco cartões em cima e 40% de preto embaixo — "a tela está vazia",
					 * que é exatamente o que esta ferramenta não pode parecer enquanto o
					 * aluno espera.
					 *
					 * Esticar a mesa custa uma defesa a mais no medidor de feixes: com
					 * altura de linha, a mesa deixa de encolher quando o conteúdo encolhe,
					 * então o `ResizeObserver` passa a observar TAMBÉM o bloco de dentro
					 * (`conteudoRef`) — sem isso, o subtítulo que nasce no núcleo na virada
					 * de onda deslocaria os cartões sem ninguém remedir.
					 */}
					<div ref={mesaRef} className="relative flex flex-col">
						{mesaLarga ? (
							<CamadaFeixes
								feixes={feixes}
								box={box}
								porChave={porChave}
								onda={onda}
								semMovimento={semMovimento}
							/>
						) : null}

						<div ref={conteudoRef} className="my-auto">
							{montando ? (
								<div className="intel-banda relative">
									{Array.from(
										{ length: modo === 'profundo' ? 12 : 6 },
										(_, i) => i,
									).map((i) => (
										<div
											key={i}
											className={`h-[62px] rounded-lg border border-white/10 bg-white/[0.035] ${semMovimento ? '' : 'animate-pulse'}`}
										/>
									))}
									<p className="col-span-full mt-1 text-center text-[12px] text-slate-500">
										Montando o time…
									</p>
								</div>
							) : (
								<>
									{/* ══ ONDA 1 · DESCOBERTA ══
								    Flancos + núcleo. Em ≥1280 vira o anel de operações; abaixo
								    disso o núcleo sobe e os cartões viram grade simples. */}
									{descoberta.length > 0 ? (
										<Divisor
											numero={nDescoberta}
											titulo="Descoberta"
											ativo={nivel === 0}
											semMovimento={semMovimento}
											estado={estadoDaFaixa(
												descoberta,
												'varrendo o mercado',
												'preparando',
											)}
										/>
									) : null}

									<div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px_minmax(0,1fr)] xl:gap-2 2xl:grid-cols-[minmax(0,1fr)_320px_minmax(0,1fr)]">
										{/* Fora da mesa larga esta coluna guarda a onda 1 INTEIRA:
									    vira grade para o celular não virar uma fita de nove
									    cartões um embaixo do outro.
									    Classes do Tailwind, e não `.intel-banda`: o `<style>` deste
									    componente é injetado DEPOIS da folha do Tailwind, então
									    `.intel-banda { display: grid }` venceria o `xl:flex` por
									    ordem de documento — e a coluna do flanco viraria grade de
									    volta justamente na tela larga. */}
										<div className="relative order-2 grid gap-2.5 sm:grid-cols-2 xl:order-1 xl:flex xl:flex-col xl:justify-center">
											{(mesaLarga ? flancoEsq : descoberta).map((a) => (
												<Estacao
													key={a.chave}
													a={a}
													cacheIdadeDias={cacheIdadeDias}
													semMovimento={semMovimento}
													compacto={compacto}
													refCb={registrar(a.chave, 'descoberta')}
												/>
											))}
										</div>

										<div className="order-1 flex items-center justify-center py-1 xl:order-2">
											<Nucleo
												alvo={alvo}
												rotuloOnda={rotuloNucleo}
												subtitulo={subtituloNucleo}
												cruzando={cruzando}
												semMovimento={semMovimento}
												orbRef={orbRef}
											/>
										</div>

										{mesaLarga ? (
											<div className="relative order-3 flex flex-col justify-center gap-2.5">
												{flancoDir.map((a) => (
													<Estacao
														key={a.chave}
														a={a}
														cacheIdadeDias={cacheIdadeDias}
														semMovimento={semMovimento}
														compacto={compacto}
														refCb={registrar(a.chave, 'descoberta')}
													/>
												))}
											</div>
										) : null}
									</div>

									{/* ══ ONDA 2 · APROFUNDAMENTO ══
								    Embaixo do núcleo porque roda DEPOIS: cada um destes lê o
								    digest da onda 1 e pesquisa de novo, já sabendo QUAIS
								    produtos e QUAIS concorrentes investigar. A posição é o
								    próprio motor desenhado. */}
									{temAprof ? (
										<>
											<Divisor
												numero={nAprof}
												titulo="Aprofundamento"
												ativo={nivel === 1}
												semMovimento={semMovimento}
												estado={estadoDaFaixa(
													aprofundamento,
													'investigando os achados',
													'aguardando a onda 1',
												)}
											/>
											<div
												className="intel-banda relative"
												style={estiloFaixa(aprofundamento.length, box.w)}
											>
												{aprofundamento.map((a) => (
													<Estacao
														key={a.chave}
														a={a}
														cacheIdadeDias={cacheIdadeDias}
														semMovimento={semMovimento}
														compacto={compacto}
														refCb={registrar(a.chave, 'aprofundamento')}
													/>
												))}
											</div>
										</>
									) : null}

									{/* ══ ONDA 3 · SÍNTESE ══
								    Lê tudo que veio antes e escreve o dossiê. O losango do
								    divisor é a JUNÇÃO: o material acumulado das ondas
								    anteriores, de onde saem os feixes desta faixa. */}
									{sintese.length > 0 ? (
										<>
											<Divisor
												numero={nSintese}
												titulo="Síntese"
												ativo={nivel === 2}
												semMovimento={semMovimento}
												// A junção só é ponto de convergência quando há uma onda 2
												// desaguando nela. No Rápido a síntese bebe do núcleo, e
												// desenhar um losango ali seria inventar uma etapa.
												juncaoRef={
													mesaLarga && temAprof ? juncaoRef : undefined
												}
												estado={estadoDaFaixa(
													sintese,
													'escrevendo o dossiê',
													temAprof
														? 'aguardando a onda 2'
														: 'aguardando a pesquisa',
												)}
											/>
											<div
												className="intel-banda relative"
												style={estiloFaixa(sintese.length, box.w)}
											>
												{sintese.map((a) => (
													<Estacao
														key={a.chave}
														a={a}
														cacheIdadeDias={cacheIdadeDias}
														semMovimento={semMovimento}
														compacto={compacto}
														refCb={registrar(a.chave, 'sintese')}
													/>
												))}
											</div>
										</>
									) : null}
								</>
							)}
						</div>
					</div>

					{/* ══ coluna de inteligência: o que foi perguntado, o que foi achado ══ */}
					<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 xl:content-start">
						<Console
							buscas={buscasLog}
							porChave={porChave}
							semMovimento={semMovimento}
						/>
						<Fontes fontes={fontes} porChave={porChave} />
					</div>
				</div>

				{/*
				 * NÃO LIGUE ESTE BOTÃO ENQUANTO A RETOMADA NÃO EXISTIR.
				 *
				 * A promessa "você pode fechar esta aba" só é verdade pela
				 * metade hoje: o servidor grava o dossiê na coleção `dossies`
				 * antes de responder (`collection.save`, dedupe por `run_id`),
				 * mas NADA no front lê aquilo de volta —
				 * `buscarResultadoSalvo`/`aguardarResultadoSalvo`
				 * (tool-stream.service.ts) estão exportados e nunca são
				 * chamados, e o `runId` morre dentro de `analisar()`. Quem
				 * fechasse a aba confiando nesta frase perderia o dossiê que
				 * pagou. Por isso `tool-intel-view` não passa `onSegundoPlano`:
				 * o botão existe pronto, desligado, esperando a retomada.
				 */}
				{onSegundoPlano ? (
					<div className="mt-5 text-center">
						<button
							type="button"
							onClick={onSegundoPlano}
							className="text-[12px] text-slate-500 underline-offset-4 transition-colors hover:text-slate-300 hover:underline"
						>
							Deixar rodando em segundo plano
						</button>
						<p className="mt-1 text-[11px] text-slate-600">
							O resultado fica salvo — você pode fechar esta aba.
						</p>
					</div>
				) : null}
			</div>

			{/*
			 * Todo o movimento desta tela é CSS puro sobre `transform`/`opacity`/
			 * `stroke-dashoffset` — nenhum estado de React por frame. Com vinte e
			 * dois cartões, três faixas de feixes e dois feeds crescendo, é a
			 * diferença entre rodar liso no celular e derreter a bateria.
			 */}
			<style>{`
				/* A faixa de uma onda. auto-fit em vez de um número fixo de colunas
				   porque o roster é DADO editável: hoje a onda 2 tem oito cartões e a
				   3 tem cinco, e nada impede o admin de mudar isso amanhã sem deploy.
				   Colunas fixas quebrariam em silêncio; a largura mínima não. */
				.intel-banda {
					display: grid;
					gap: 0.625rem;
					grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
				}

				@keyframes intelEntra {
					from { opacity: 0; transform: translateY(6px); }
					to   { opacity: 1; transform: none; }
				}
				/* fill backwards, nunca forwards: com fill para a frente o valor final
				   do keyframe (opacity: 1) venceria o style inline do cartão e o
				   especialista que ainda não começou deixaria de aparecer apagado. */
				.intel-entra { animation: intelEntra 0.22s ease-out backwards; }

				@keyframes intelVarredura {
					0%   { transform: translateX(-4rem); }
					100% { transform: translateX(120%); }
				}
				.intel-varredura { animation: intelVarredura 2.1s linear infinite; will-change: transform; }

				@keyframes intelScanline {
					0%   { transform: translateY(0); opacity: 0; }
					10%  { opacity: 0.9; }
					90%  { opacity: 0.9; }
					100% { transform: translateY(6rem); opacity: 0; }
				}
				.intel-scanline { animation: intelScanline 2.6s ease-in-out infinite; will-change: transform; }

				@keyframes intelGira { to { transform: rotate(360deg); } }
				.intel-gira { animation: intelGira 22s linear infinite; will-change: transform; }

				@keyframes intelPisca { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }
				.intel-pisca { animation: intelPisca 1.4s ease-in-out infinite; }

				@keyframes intelPacote { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
				.intel-pacote { animation: intelPacote 1.5s linear infinite; }

				/* O trilho da virada de onda: a luz atravessando o divisor é o
				   material da faixa de cima descendo para a de baixo. Só um elemento
				   por metade do divisor, animado em transform.
				   A largura é 1/3 da metade do divisor, e o translate é em % do
				   PRÓPRIO elemento: de -100% (fora à esquerda) a 300% (fora à
				   direita) é exatamente uma travessia, em qualquer largura de tela —
				   sem precisar saber quanto mede o divisor. */
				@keyframes intelTrilho {
					from { transform: translateX(-100%); }
					to   { transform: translateX(300%); }
				}
				.intel-trilho { width: 33.333%; animation: intelTrilho 2.4s linear infinite; will-change: transform; }

				@media (prefers-reduced-motion: reduce) {
					.intel-entra, .intel-varredura, .intel-scanline,
					.intel-gira, .intel-pisca, .intel-pacote, .intel-trilho {
						animation: none;
					}
					.intel-varredura, .intel-pacote, .intel-trilho { display: none; }
				}
			`}</style>
		</div>
	);
}
