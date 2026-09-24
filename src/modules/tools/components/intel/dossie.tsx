'use client';

import {
	AlertTriangle,
	ArrowRight,
	BarChart3,
	Boxes,
	CalendarCheck,
	CalendarDays,
	Check,
	Copy,
	Crown,
	DoorOpen,
	ExternalLink,
	Handshake,
	Images,
	ListChecks,
	type LucideIcon,
	PenLine,
	Printer,
	RefreshCw,
	Rocket,
	Search,
	ShoppingBag,
	Star,
	Store,
	Swords,
	Tag,
	Target,
	ThumbsDown,
	TrendingUp,
	Truck,
	UsersRound,
	Wallet,
	Warehouse,
} from 'lucide-react';
import { motion } from 'motion/react';
import { type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { resolveToolIcon } from '../../lib/tool-icons';
import { CaixaPerguntas } from './caixa-perguntas';

/**
 * DOSSIÊ — o resultado, em largura total.
 *
 * Duas regras de honestidade governam esta tela, e valem mais que qualquer
 * escolha visual:
 *
 *   1. O preço de mercado só aparece como PREÇO quando o backend diz que a
 *      amostra sustenta (`preco_confiavel`). Abaixo disso a tela diz que não
 *      achou — e pede ao aluno o que ele viu. Falhar visível é melhor que
 *      mentir bonito, porque quem lê vai precificar trabalho de verdade.
 *   2. Todo número de mercado tem a fonte do lado, clicável. O dossiê é
 *      verificável por construção.
 *
 * E uma regra de leitura, que veio do primeiro teste com o dono do produto: a
 * ORDEM da página é a ordem da decisão do aluno — veredito, números que
 * decidem, por que a nota, o que fazer, as provas e só então as ressalvas.
 * Uma pilha vertical de seções do mesmo tamanho não tem hierarquia nenhuma, e
 * quem abre não sabe onde olhar primeiro nem quanto falta.
 */

const BRL = new Intl.NumberFormat('pt-BR', {
	style: 'currency',
	currency: 'BRL',
});
const money = (cents: unknown) => {
	const n = Number(cents);
	return Number.isFinite(n) ? BRL.format(n / 100) : '—';
};

/**
 * Número vindo de LLM em português.
 *
 * `Number("89,90")` é NaN, e `Number("R$ 89,90")` também. Com o preço promovido
 * a herói do card (corpo 2xl), um NaN vira um "—" gigante onde deveria estar a
 * informação mais importante — enquanto o dado chegou certo, só noutro formato.
 */
function paraNumero(v: unknown): number {
	if (typeof v === 'number') return v;
	if (typeof v !== 'string') return Number.NaN;
	const limpo = v
		.replace(/[R$\s]/gi, '')
		.replace(/\.(?=\d{3}(\D|$))/g, '')
		.replace(',', '.');
	return Number(limpo);
}

/**
 * "500+ vendidos" é o formato que o marketplace usa na página, e o especialista
 * copia verbatim. Concatenar " vendidos" dava "500+ vendidos vendidos"; e um
 * inteiro 1 dava "1 vendidos".
 */
function rotuloVendidos(v: unknown): string {
	// `frase` e não `String()`: `vendidos: "null"` virava a pílula verde
	// "null vendidos" em cima da foto do anúncio. Ver `frase` e `SEM_DADO`.
	const txt = frase(v, 40);
	if (!txt) return '';
	if (/vendid/i.test(txt)) return txt;
	const n = Number(txt);
	return Number.isFinite(n)
		? `${n} vendido${n === 1 ? '' : 's'}`
		: `${txt} vendidos`;
}

/**
 * Chave estável da grade. `??` NÃO cai para o próximo quando `url` é string
 * VAZIA — e LLM que não achou o link devolve `url: ""` com frequência, o que
 * dava duas linhas com a mesma chave e re-render errado no React.
 */
/**
 * Qualquer coisa vinda do modelo → lista segura de percorrer.
 *
 * O contrato pede array em todo campo de lista, e o modelo cumpre quase sempre.
 * Quando NÃO cumpre — `riscos: "nenhum risco relevante"` em vez de `[]`, ou um
 * `null` no meio do array —, o `.map` estoura no render e o aluno vê tela
 * branca no lugar de um dossiê que ele já pagou. Isso já derrubou esta tela uma
 * vez (em `produtos`), e a guarda tinha ficado só naquele campo.
 *
 * Texto solto não é descartado: vira uma lista de um item, porque "não
 * identifiquei riscos" é informação, não erro.
 */
function comoLista(v: unknown): unknown[] {
	if (Array.isArray(v)) return v.filter((x) => x !== null && x !== undefined);
	if (typeof v === 'string' && v.trim()) return [v.trim()];
	return [];
}

/**
 * O TETO DA PROSA — o parágrafo do especialista, inteiro.
 *
 * `campo` corta em 300 caracteres, que é teto de RÓTULO (nome de loja, faixa de
 * preço, o que o canal exige). Prosa não cabe nisso: medido nos 8 runs frios
 * gravados, o `por_que` do preço sugerido chega a 649 caracteres e o
 * `resumo_simples` do Estrategista a 581 — passar os dois por `campo` cortava o
 * parágrafo no meio da frase dentro de um dossiê pago (e a legenda do Instagram
 * é COPIADA pelo aluno, então cortada ela vai cortada para o post dele).
 *
 * Continua sendo teto, e por isso tem número: 2.000 é ~3× o maior já medido, e
 * existe para o dia em que o modelo despejar um capítulo dentro de um card.
 */
const TETO_PROSA = 2_000;

/**
 * Só os textos de uma lista que deveria ser de strings.
 *
 * Passa por `frase` e não por `String()`: o `String()` cru imprimia
 * `[object Object]` no bullet de um anúncio pago quando o modelo devolvia
 * `{texto:"…"}` em vez da string, e imprimia `null` quando ele escrevia a
 * ausência por extenso dentro do array. Ver `frase` e `SEM_DADO`.
 */
function comoTextos(v: unknown): string[] {
	return comoLista(v)
		.map((x) => frase(x, TETO_PROSA))
		.filter(Boolean);
}

/**
 * Um campo de TEXTO vindo do modelo, em qualquer das formas que ele usa.
 *
 * É a mesma armadilha de `comoLista`, pelo outro lado: o contrato pede FRASE e o
 * modelo às vezes manda lista (`publico: ["RH","eventos"]`) ou objeto. `String()`
 * cru imprime `RH,eventos` sem separador e `[object Object]` — dentro do card da
 * primeira seção de um dossiê PAGO. Aqui lista vira "a; b" (o mesmo separador
 * que o backend usa em `texto()`, para as duas telas lerem igual), objeto
 * entrega só os valores de texto que tem dentro, e o que não dá para ler vira
 * vazio: o campo SOME do card em vez de imprimir lixo.
 *
 * Vale para todo campo de prosa desta tela, inclusive os que hoje chegam
 * normalizados do servidor — o dossiê também é lido de volta do cache e de
 * `agentes[].json` cru, onde ninguém normalizou nada.
 *
 * E É AQUI QUE A AUSÊNCIA ESCRITA MORRE, num lugar só.
 *
 * `ausencia`/`SEM_DADO` (definidos mais abaixo, junto do vocabulário que eles
 * descrevem) começaram morando dentro de `campo`, e por isso só valiam para o
 * campo que passasse por `campo`. Todo o resto da tela — `frase(b.produto)` nas
 * brechas, `observacaoDe`, o subtítulo do herói — lia o mesmo modelo pelo
 * mesmo caminho e não tinha guarda nenhuma. O defeito reproduzido: o modelo de
 * visão devolveu `material_provavel: "null"` como STRING, e a primeira linha
 * que o aluno lia depois de pagar era `Brinde corporativo · null`.
 *
 * Guardar em `campo` era instrução ("lembre de usar `campo`"); guardar em
 * `frase` é mecanismo — não existe prosa nesta tela que não passe por aqui, e
 * quem escrever a próxima seção herda a regra sem saber que ela existe. `campo`
 * continua fazendo a escolha ENTRE nomes de campo, que é outra coisa.
 *
 * Só some o campo cujo conteúdo É a ausência inteira: "não achei preço nesta
 * página, mas o catálogo cita R$ 12" continua na tela. Ver `SEM_DADO`.
 *
 * E É AQUI TAMBÉM QUE A LINGUAGEM DE MÁQUINA MORRE — ver `semMaquina`.
 */
function frase(v: unknown, limite = 600): string {
	if (typeof v === 'string') {
		const t = semMaquina(v.trim().slice(0, limite));
		return ausencia(t) ? '' : t;
	}
	if (typeof v === 'number' && Number.isFinite(v)) return String(v);
	if (Array.isArray(v)) {
		return v
			.map((x) => frase(x, limite))
			.filter(Boolean)
			.join('; ')
			.slice(0, limite);
	}
	if (v && typeof v === 'object') {
		return Object.values(v as Record<string, unknown>)
			.filter(
				(x): x is string =>
					typeof x === 'string' && x.trim().length > 0 && !ausencia(x),
			)
			.join(' — ')
			.slice(0, limite);
	}
	return '';
}

function chaveProduto(p: Record<string, unknown> | null, i: number): string {
	if (!p) return `produto-${i}`;
	const url = typeof p.url === 'string' ? p.url.trim() : '';
	if (url) return url;
	const nome =
		typeof p.titulo_anuncio === 'string' && p.titulo_anuncio.trim()
			? p.titulo_anuncio.trim()
			: typeof p.nome === 'string'
				? p.nome.trim()
				: '';
	return nome ? `${nome}-${i}` : `produto-${i}`;
}

function dominio(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return url;
	}
}

/**
 * A MESMA chave de página que o servidor usa (`oportunidade.ts`, `chaveUrl`).
 *
 * O backend decide o que vira número comparando o link que o modelo ESCREVEU
 * com as páginas que o run de fato CITOU (`output.fontes`). Onde a tela precisa
 * do mesmo julgamento, ela tem que normalizar igual — senão as duas discordam
 * sobre o mesmo link, e foi assim que a mesma página apareceu reprovada num card
 * ("faltou preço ou custo com fonte") e aprovada logo abaixo, no bloco do custo,
 * na mesma tela paga. Protocolo, `www.`, query, hash e barra final não são
 * identidade de página.
 */
function chaveDeUrl(u: unknown): string {
	return String(u ?? '')
		.trim()
		.toLowerCase()
		.replace(/^https?:\/\//, '')
		.replace(/^www\./, '')
		.replace(/[#?].*$/, '')
		.replace(/\/+$/, '');
}

/** As páginas que este dossiê registrou — o conjunto contra o qual se confere. */
function urlsCitadas(fontes: { url?: string }[]): Set<string> {
	const s = new Set<string>();
	for (const f of fontes) {
		const k = chaveDeUrl(f?.url);
		if (k) s.add(k);
	}
	return s;
}

/** O dossiê é gravado pela própria tool; é nele que as perguntas se penduram. */
const COLECAO_DOSSIES = 'dossies';

/**
 * O ponto de render de cada especialista que devolve LISTA.
 *
 * Saiu do meio do JSX porque é dado, não layout — e porque é ela que decide se
 * a etapa "O que o time apurou" existe.
 *
 * QUEM ENTRA É DECIDIDO POR QUEM RESPONDEU (`output.agentes`), NUNCA PELO MODO.
 * O gate antigo era `modo === 'profundo'`, e ele apagava dois profissionais no
 * caminho PADRÃO da ferramenta: `demanda` e `concorrencia` são `modo: 'ambos'`
 * no roster, entram nos cinco de `produto+rápido` (o que a tela abre por
 * padrão), gastam duas das quatro buscas do run, aparecem trabalhando na sala
 * de guerra com frase própria — e o que apuravam não tinha uma linha na tela. O
 * aluno pagava por cinco especialistas e lia a análise de três. É a mesma classe
 * do Pesquisador de Tendências, que já custou uma rodada.
 *
 * Filtrar por chave presente não faz nenhum bloco novo aparecer no profundo:
 * `producao`, `riscos` e `tendencias` são `modo: 'profundo'` no roster, não
 * rodam no rápido, não têm json — e somem sozinhos, sem gate nenhum. E é a
 * única regra que continua certa quando alguém mudar o `modo` de um
 * especialista pela Fábrica, que é dado editável sem deploy.
 */
const BLOCOS_DO_TIME = [
	{
		chave: 'concorrencia',
		titulo: 'Quem já vende',
		icone: 'users',
		cor: '#8b5cf6',
		campo: 'vendedores',
	},
	{
		/**
		 * Estava faltando: o Pesquisador de Tendências roda em 7 de cada 8
		 * execuções do modo profundo, é cobrado como todo mundo, e não tinha
		 * nenhuma linha na tela. As chaves `canais` e `nichos` que ocupavam este
		 * lugar eram de agentes que não existem mais — viraram `marketplaces` e
		 * `radar_oportunidades`, e os dois já têm seção própria mais acima.
		 */
		chave: 'tendencias',
		titulo: 'O que está em alta',
		icone: 'compass',
		cor: '#ec4899',
		campo: 'tendencias',
	},
	{
		chave: 'producao',
		titulo: 'Como fazer',
		icone: 'wrench',
		cor: '#64748b',
		campo: 'passos',
	},
	{
		chave: 'riscos',
		titulo: 'Riscos',
		icone: 'shield-alert',
		cor: '#ef4444',
		campo: 'riscos',
	},
	{
		chave: 'demanda',
		titulo: 'Demanda',
		icone: 'trending-up',
		cor: '#10b981',
		campo: 'evidencias',
	},
];

export interface DossieProps {
	output: Record<string, unknown>;
	/**
	 * O modo em que o run foi pedido. Continua no contrato porque é a tela quem
	 * o conhece — mas NENHUMA seção desta página é decidida por ele: o dossiê é
	 * montado por QUEM RESPONDEU (`output.agentes`). Era o gate de
	 * `BLOCOS_DO_TIME`, e nesse papel ele apagava dois especialistas pagos no
	 * caminho padrão da ferramenta.
	 */
	modo: 'rapido' | 'profundo';
	/**
	 * O escopo em que o run foi pedido: `produto` = veredito de uma peça,
	 * `mercado` = ranking do ramo.
	 *
	 * Vale para ele a MESMA regra do `modo`, e por já ter custado uma rodada:
	 * nenhuma seção desta página é decidida por ele. Ele gateava `RamoECanais` e
	 * a lista do Curador, e nesse papel apagava o Especialista em Marketplaces
	 * inteiro em `produto+profundo` — `escopo: 'ambos'` no roster, dez de dez
	 * profissionais, e uma palavra na tela. Hoje ele só escolhe TEXTO: as
	 * perguntas sugeridas da caixa ("este produto" × "este mercado").
	 */
	tipo?: 'produto' | 'mercado';
	/** Sem a chave da tool não há endereço para perguntar — a caixa some. */
	toolKey?: string;
	onNovaAnalise: () => void;
	onAtualizarPesquisa?: () => void;
	/** Leva para o Orçamento, onde o número deixa de ser estimativa. */
	onOrcamentoExato?: () => void;
}

/* ─────────────────────────── peças ─────────────────────────── */

interface Celula {
	rot: string;
	valor: string;
	sub?: string;
	icone: LucideIcon;
	/** Nome de canal não é número: sai do mono e vai para a display. */
	texto?: boolean;
	tom?: 'accent' | 'aviso';
}

/**
 * O PAINEL — os números que decidem, antes de qualquer parágrafo.
 *
 * O dossiê inteiro estava certo e mesmo assim ninguém sabia onde olhar
 * primeiro: a resposta que o aluno veio buscar ("cobro quanto, o mercado está
 * onde, começo por qual canal") ficava espalhada em três seções distantes uma
 * da outra. Aqui elas ficam lado a lado — sem virar fonte nova: cada célula é o
 * mesmo dado que a seção correspondente detalha mais abaixo.
 *
 * A faixa de mercado é a única célula com direito a recusar número. Sem
 * `preco_confiavel` ela continua âmbar e diz que não apurou, porque a regra
 * nº 1 desta tela vale igual em corpo 12 e em corpo 24.
 */
function PainelNumeros({ celulas }: { celulas: Celula[] }) {
	if (!celulas.length) return null;
	const cols =
		celulas.length >= 4
			? 'lg:grid-cols-4'
			: celulas.length === 3
				? 'lg:grid-cols-3'
				: 'lg:grid-cols-2';

	return (
		<div className={`mb-6 grid gap-3 sm:grid-cols-2 ${cols}`}>
			{celulas.map((c, i) => {
				const Icon = c.icone;
				const tamanho = c.texto
					? 'font-display text-lg font-bold leading-tight'
					: c.valor.length > 11
						? 'font-mono text-xl font-bold tabular-nums'
						: 'font-mono text-2xl font-bold tabular-nums';
				return (
					<motion.div
						key={c.rot}
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.25, delay: i * 0.05 }}
						className={`rounded-2xl border p-4 ${
							c.tom === 'aviso'
								? 'border-amber-500/30 bg-amber-500/[0.06]'
								: 'border-white/8 bg-white/[0.02]'
						}`}
					>
						<div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500">
							<Icon className="h-3.5 w-3.5" />
							{c.rot}
						</div>
						<p
							className={`mt-2 ${tamanho} ${
								c.tom === 'aviso'
									? 'text-amber-300'
									: c.tom === 'accent'
										? 'text-[var(--screen-accent)]'
										: 'text-slate-50'
							}`}
						>
							{c.valor}
						</p>
						{c.sub ? (
							<p className="mt-1.5 text-[11px] leading-snug text-slate-500">
								{c.sub}
							</p>
						) : null}
					</motion.div>
				);
			})}
		</div>
	);
}

/**
 * O índice. Numa página desta altura, saber quanto falta é parte de entender.
 *
 * `fixed`, e NÃO `sticky`.
 *
 * O shell do curso põe `overflow-x: hidden` no `<main>` (layout.tsx), e pelo
 * CSS isso faz o `overflow-y` computar `auto`: o `<main>` vira o scroller mais
 * próximo, mas quem rola de verdade é o documento — então nada gruda ali
 * dentro. Medido: a barra ia para `top: -772px` depois de rolar 900. `fixed`
 * não depende do scroller ancestral e é o que entrega a intenção.
 *
 * Some na impressão: no papel a rolagem não existe e a barra viraria lixo.
 */
/**
 * QUAL SEÇÃO ESTÁ SENDO LIDA AGORA.
 *
 * O índice em pé só vira navegação de verdade quando diz ONDE o aluno está —
 * num dossiê de catorze paradas, uma lista sem marcação é um menu, não um
 * mapa. Observa as âncoras e devolve a última que já passou pela linha de
 * leitura (30% do topo da janela): é a que o olho está lendo, e não a que
 * acabou de entrar pela borda de baixo.
 *
 * Recalcula por medição, não pelo que o observador entrega: o `IntersectionObserver`
 * dispara com o que MUDOU, e a seção ativa costuma ser justamente a que não
 * mudou nada nesse instante.
 */
function useSecaoAtiva(ids: string[]): string {
	const [ativo, setAtivo] = useState('');
	const chave = ids.join('|');
	useEffect(() => {
		if (typeof IntersectionObserver === 'undefined') return;
		const alvos = chave
			.split('|')
			.map((id) => document.getElementById(id))
			.filter((el): el is HTMLElement => !!el);
		if (alvos.length === 0) return;

		const recalcular = () => {
			const linha = window.innerHeight * 0.3;
			let atual = alvos[0]?.id ?? '';
			for (const el of alvos) {
				if (el.getBoundingClientRect().top <= linha) atual = el.id;
			}
			setAtivo(atual);
		};

		const obs = new IntersectionObserver(recalcular, {
			threshold: [0, 0.25, 0.5, 1],
		});
		for (const el of alvos) obs.observe(el);
		// A rolagem entre duas âncoras distantes não cruza limiar nenhum, e sem
		// isto a marcação congelaria no meio de uma seção longa.
		window.addEventListener('scroll', recalcular, { passive: true });
		recalcular();
		return () => {
			obs.disconnect();
			window.removeEventListener('scroll', recalcular);
		};
	}, [chave]);
	return ativo;
}

function Indice({ itens }: { itens: { id: string; curto: string }[] }) {
	const ativo = useSecaoAtiva(itens.map((i) => i.id));
	// `document` não existe no render do servidor; o portal só depois de montar.
	const [montado, setMontado] = useState(false);
	useEffect(() => setMontado(true), []);
	if (itens.length < 3) return null;
	return (
		<>
			{/* No celular a barra flutuante taparia conteúdo: entra estática, logo
			    abaixo do veredito, como mapa do que vem pela frente. */}
			<nav
				aria-label="Seções do dossiê"
				className="mb-6 -mx-4 overflow-x-auto border-y border-white/8 bg-white/[0.02] px-4 py-2 print:hidden lg:hidden"
			>
				<ul className="flex min-w-max items-center gap-1">
					{itens.map((i) => (
						<li key={i.id}>
							<a
								href={`#${i.id}`}
								className="block rounded-lg px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-slate-500 transition-colors hover:bg-white/5 hover:text-[var(--screen-accent)]"
							>
								{i.curto}
							</a>
						</li>
					))}
				</ul>
			</nav>
			{/* A BARRA QUEBRA EM DUAS LINHAS — e não rola.
			    O dossiê do Profundo tem o dobro de etapas: medido em 1280 px, as
			    catorze paradas somam ~1.260 px e as últimas (Fontes, Ressalvas,
			    Perguntar) ficavam fora da tela. Rolagem horizontal resolve no
			    celular, onde o dedo já arrasta e a barra estática deixa isso óbvio —
			    no desktop ela esconde item de navegação atrás de um gesto sem
			    affordance nenhuma, num elemento cuja única razão de existir é dizer
			    o que a página tem. Com `flex-wrap` nada fica escondido; a barra vira
			    um retângulo de cantos arredondados quando passa de uma linha, e o
			    `lg:pb-28` do container reserva a altura para ela não cobrir os
			    botões do rodapé. */}
			{/* ═══ O ÍNDICE EM PÉ, NA MARGEM DIREITA ═══
			    Era uma barra flutuante embaixo, e com catorze paradas ela quebrava
			    em duas linhas ocupando o rodapé inteiro — justamente onde ficam os
			    botões de ação. Em pé, cada parada ganha uma linha, a lista se lê
			    como sumário (que é o que ela é) e nasce visível: o aluno vê TUDO o
			    que o dossiê tem antes de rolar o primeiro centímetro.

			    Mora na margem que já existia. O conteúdo tem `max-w-[1400px]`
			    centralizado, então numa tela de 1536 px sobram ~68 px de cada lado
			    — pouco para a barra, e por isso o container ganhou `xl:pr-40`: o
			    texto encolhe o suficiente para nada passar por baixo dela. */}
			{/* ANCORADO NO TOPO, sem moldura — e FORA DA ÁRVORE DO DOSSIÊ.
			    Centralizado na vertical ele parecia "no meio da rolagem"; colado
			    abaixo do cabeçalho lê como sumário do documento. Sem borda, fundo
			    ou sombra: aqui não é um painel, é texto de apoio na margem.

			    O PORTAL é o que faz o `fixed` funcionar. `position: fixed` deixa de
			    se referir à janela quando QUALQUER ancestral tem `transform`,
			    `filter`, `backdrop-filter`, `perspective` ou `contain` — e o shell
			    do curso tem barras com `backdrop-blur`. O sintoma é exatamente o
			    que apareceu: a barra "acompanhava" a rolagem e ficava presa no
			    topo, porque o bloco de contenção dela era um elemento da página,
			    não a janela. Saindo para o `body`, não há ancestral que a capture —
			    e a correção vale para qualquer wrapper que venha a existir depois. */}
			{montado
				? createPortal(
						<nav
							aria-label="Seções do dossiê"
							className="fixed right-5 top-24 z-30 hidden max-h-[calc(100vh-8rem)] overflow-y-auto print:hidden xl:block"
						>
							<ul className="flex flex-col gap-0.5">
								{itens.map((i) => {
									const aqui = i.id === ativo;
									return (
										<li key={i.id}>
											<a
												href={`#${i.id}`}
												aria-current={aqui ? 'true' : undefined}
												className={`block rounded-lg px-2 py-1.5 text-right text-[13px] font-semibold uppercase tracking-wider transition-colors ${
													aqui
														? 'text-[var(--screen-accent)]'
														: 'text-slate-500 hover:text-slate-300'
												}`}
											>
												{i.curto}
											</a>
										</li>
									);
								})}
							</ul>
						</nav>,
						document.body,
					)
				: null}

			{/* Entre 1024 e 1279 px não há margem que caiba a barra em pé: a de
			    baixo continua sendo a saída, e ali as catorze paradas cabem porque
			    a largura é a da janela inteira. */}
			<nav
				aria-label="Seções do dossiê"
				/* `inset-x-0 + mx-auto + w-fit`, e NÃO `left-1/2 + -translate-x-1/2`.
				   Com `left: 50%` a largura disponível de um elemento `fixed` é só
				   METADE da janela (o resto começa depois do offset), e o
				   shrink-to-fit trava aí: medido em 1280 px, a barra parava em 640 e
				   quebrava em três linhas mesmo com `max-w` de 1100. A translação só
				   move depois que a largura já foi decidida. */
				className="fixed inset-x-0 bottom-6 z-30 mx-auto hidden w-fit max-w-[min(92vw,1100px)] rounded-3xl border border-white/10 bg-[#0d0d10]/90 px-2 py-1.5 shadow-2xl shadow-black/50 backdrop-blur print:hidden lg:block xl:hidden"
			>
				<ul className="flex flex-wrap items-center justify-center gap-1">
					{itens.map((i) => (
						<li key={i.id}>
							<a
								href={`#${i.id}`}
								className="block rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-slate-400 transition-colors hover:bg-white/8 hover:text-[var(--screen-accent)]"
							>
								{i.curto}
							</a>
						</li>
					))}
				</ul>
			</nav>

			{/* ═══ O MESMO ÍNDICE, NO CELULAR — em botão, não em barra ═══
			    A barra estática lá em cima é o mapa do que vem pela frente, e é
			    ótima nos primeiros dez centímetros de rolagem. Depois disso ela sai
			    da tela e não volta: medido nos runs gravados, o dossiê do Profundo
			    tem cerca de 30.000 px de altura num celular de 390 — trinta e seis
			    telas —, e a partir da segunda o aluno não tinha COMO chegar a uma
			    seção sem arrastar a página inteira de volta ao topo. O desktop nunca
			    teve esse problema, porque a barra flutuante existe lá desde o começo;
			    o celular simplesmente não tinha índice depois da primeira tela.

			    A objeção original a uma barra flutuante no celular continua de pé
			    ("taparia conteúdo") e é ela que decide a FORMA: uma pastilha de um
			    dedo no canto, que só vira lista quando o aluno pede. Fechada, ocupa
			    um canto; aberta, some assim que ele escolhe a seção.

			    `<details>`, e não estado em React: abrir e fechar uma lista é o que
			    o elemento faz nativamente, com teclado e leitor de tela de graça.

			    O fechar-ao-escolher mora em CADA LINK, e não num `onClick` no
			    `<details>` inteiro: ali ele seria um clique pendurado num elemento
			    que não é botão, e a regra de acessibilidade cobraria — com razão —
			    um atalho de teclado equivalente. No link não há o que cobrar: âncora
			    já dispara `click` no Enter, então dedo e teclado fecham a lista pelo
			    mesmo caminho. */}
			<details className="fixed bottom-4 right-4 z-30 print:hidden lg:hidden">
				<summary className="flex list-none items-center gap-1.5 rounded-full border border-white/10 bg-[#0d0d10]/95 px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-300 shadow-2xl shadow-black/60 backdrop-blur [&::-webkit-details-marker]:hidden">
					<ListChecks className="h-4 w-4 text-[var(--screen-accent)]" />
					Seções
				</summary>
				<nav
					aria-label="Seções do dossiê"
					className="absolute bottom-full right-0 mb-2 max-h-[65vh] w-56 overflow-y-auto rounded-2xl border border-white/10 bg-[#0d0d10] p-1.5 shadow-2xl shadow-black/60"
				>
					<ul>
						{itens.map((i) => (
							<li key={i.id}>
								<a
									href={`#${i.id}`}
									onClick={(e) =>
										e.currentTarget.closest('details')?.removeAttribute('open')
									}
									className="block rounded-xl px-3 py-2 text-[12px] font-medium text-slate-300 transition-colors hover:bg-white/8 hover:text-[var(--screen-accent)]"
								>
									{i.curto}
								</a>
							</li>
						))}
					</ul>
				</nav>
			</details>
		</>
	);
}

/**
 * Uma etapa da leitura. O número não é enfeite: é a promessa de que a página
 * acaba, e de que a ordem em que ela está escrita é a ordem da decisão do
 * aluno — por que a nota, o que fazer, com que prova, com que ressalva.
 */
function Etapa({
	id,
	n,
	titulo,
	sub,
	children,
}: {
	id: string;
	n: number;
	titulo: string;
	sub?: string;
	children: ReactNode;
}) {
	// O `scroll-mt` limpa o cabeçalho fixo do curso MAIS o índice grudado —
	// sem ele o título da etapa ancorada para embaixo da barra.
	return (
		<section id={id} className="mb-8 scroll-mt-24">
			<div className="mb-3 flex items-center gap-3">
				<span className="font-mono text-[11px] tabular-nums text-[var(--screen-accent)]">
					{String(n).padStart(2, '0')}
				</span>
				<h2 className="font-display text-[15px] font-bold text-slate-100">
					{titulo}
				</h2>
				<span className="h-px flex-1 bg-white/8" />
				{sub ? (
					<span className="shrink-0 text-[11px] text-slate-500">{sub}</span>
				) : null}
			</div>
			<div className="space-y-4">{children}</div>
		</section>
	);
}

function Bloco({
	titulo,
	icone,
	cor,
	children,
	largo,
}: {
	titulo: string;
	icone?: string;
	cor?: string;
	children: ReactNode;
	largo?: boolean;
}) {
	const Icon = icone ? resolveToolIcon(icone) : null;
	return (
		<section
			className={`rounded-2xl border border-white/8 bg-white/[0.02] p-5 ${largo ? 'lg:col-span-2' : ''}`}
		>
			<div className="mb-3 flex items-center gap-2">
				{Icon ? (
					<span
						className="flex h-6 w-6 items-center justify-center rounded-lg"
						style={{ backgroundColor: `${cor ?? '#f59e0b'}1f`, color: cor }}
					>
						<Icon className="h-3.5 w-3.5" />
					</span>
				) : null}
				<h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
					{titulo}
				</h3>
			</div>
			{children}
		</section>
	);
}

/**
 * A lista simples de um especialista.
 *
 * `comoTextos` e não `comoLista` cru: o item que não era string caía num
 * `JSON.stringify` e o aluno lia `{"ponto":"…","peso":2}` — chaves de um objeto
 * de máquina — no meio de "A favor"/"Contra" de um dossiê pago; e o item que
 * era a ausência escrita imprimia `null` como se fosse um argumento. Os dois
 * somem no mesmo funil de prosa que o resto da tela usa. Ver `frase`.
 */
function Lista({ itens, tom }: { itens: unknown; tom?: 'bom' | 'ruim' }) {
	const lista = comoTextos(itens);
	if (!lista.length) {
		return <p className="text-[13px] text-slate-500">não apurado</p>;
	}
	return (
		<ul className="space-y-1.5">
			{lista.slice(0, 8).map((x, i) => (
				<li
					key={`${x.slice(0, 24)}-${i}`}
					className="flex gap-2 text-[13px] leading-snug text-slate-300"
				>
					<span
						className={
							tom === 'bom'
								? 'text-emerald-400'
								: tom === 'ruim'
									? 'text-amber-400'
									: 'text-slate-600'
						}
					>
						{tom === 'bom' ? '+' : tom === 'ruim' ? '−' : '·'}
					</span>
					<span className="min-w-0">{x}</span>
				</li>
			))}
		</ul>
	);
}

/**
 * A lista de um especialista, com a página do lado quando ela existe.
 *
 * O texto de cada item continua sendo os dois primeiros campos de TEXTO do
 * objeto unidos por " — ", como o modo profundo já mostrava (só o endereço
 * saiu de lá — último parágrafo): mudar a leitura de cinco blocos de uma vez
 * não é conserto, é regressão disfarçada.
 *
 * O que muda é o link: `demanda` devolve `url` em cada evidência,
 * `concorrencia` em cada vendedor e `tendencias` em `evidencia_url`, e nada
 * disso chegava à tela — o item virava afirmação sem prova, na etapa cujo nome
 * é "O que o time apurou". O link só aparece quando a página está na lista de
 * fontes do dossiê: endereço escrito por modelo que ninguém abriu não é fonte,
 * é texto plausível, e um `<a>` clicável em cima dele é a mentira mais barata
 * desta tela.
 *
 * E o endereço sai do TEXTO. Medido numa execução real gravada: as evidências
 * do Analista de Demanda vinham `{titulo, vendidos: null, avaliacoes: null,
 * url}`, então "os dois primeiros campos de texto" era o título MAIS a URL
 * inteira e percent-encoded — 250 caracteres de `%C3%A9` no meio da frase, numa
 * coluna de um terço de largura. Agora o endereço mora no selo de fonte, que é
 * o lugar dele.
 *
 * Item que não sobra nenhum texto legível (um objeto só de números, por
 * exemplo) sai da lista em vez de virar um marcador vazio; se nenhum sobrar, o
 * bloco cai no "não apurado" de sempre.
 */
function ListaApurada({
	itens,
	citadas,
}: {
	itens: unknown;
	citadas: Set<string>;
}) {
	const linhas = comoLista(itens)
		.map((x, i) => {
			if (typeof x === 'string')
				return { texto: x, link: '', chave: `${x}-${i}` };
			const o = x as Record<string, unknown>;
			const texto = Object.values(o)
				.filter(
					(v): v is string =>
						typeof v === 'string' &&
						v.trim().length > 0 &&
						!/^https?:\/\//i.test(v.trim()) &&
						// Ausência escrita não é um dos "dois primeiros campos de texto":
						// `{titulo:"Caneca", vendidos:"nao_apurado"}` imprimia
						// "Caneca — nao_apurado". Ver `SEM_DADO`.
						!ausencia(v),
				)
				.slice(0, 2)
				.join(' — ')
				// Guarda contra o modelo devolver um parágrafo onde o contrato pede
				// um rótulo: o bloco é uma lista de relance, não um relatório.
				.slice(0, 300);
			const bruto = [o.url, o.evidencia_url].find(
				(u) => typeof u === 'string' && /^https?:\/\//.test(u),
			) as string | undefined;
			const link = bruto && citadas.has(chaveDeUrl(bruto)) ? bruto : '';
			return { texto, link, chave: `${texto.slice(0, 24)}-${i}` };
		})
		.filter((l) => l.texto.trim().length > 0);

	if (!linhas.length) {
		return <p className="text-[13px] text-slate-500">não apurado</p>;
	}
	return (
		<ul className="space-y-1.5">
			{linhas.slice(0, 8).map((l) => (
				<li
					key={l.chave}
					className="flex gap-2 text-[13px] leading-snug text-slate-300"
				>
					<span className="text-slate-600">·</span>
					<span className="min-w-0">
						{l.texto}
						{l.link ? (
							<a
								href={l.link}
								target="_blank"
								rel="noopener noreferrer"
								className="ml-1.5 inline-flex items-center gap-1 whitespace-nowrap text-[11px] text-slate-500 transition-colors hover:text-[var(--screen-accent)]"
							>
								{dominio(l.link)}
								<ExternalLink className="h-3 w-3" />
							</a>
						) : null}
					</span>
				</li>
			))}
		</ul>
	);
}

/**
 * A escada de preço: onde o mercado está e onde o aluno pode entrar.
 *
 * Mostra a DISPERSÃO (min → p25 → mediana → p75 → max) em vez de um número
 * único, porque a dispersão é a informação: "todo mundo cobra R$ 48" e "cada um
 * cobra o que quer" pedem decisões opostas, e a mediana sozinha esconde isso.
 */
function EscadaPreco({ ps }: { ps: Record<string, number> }) {
	const min = ps.minCents;
	const max = ps.maxCents;
	const span = Math.max(1, max - min);
	const pos = (c: number) => `${((c - min) / span) * 100}%`;

	/**
	 * AS TRÊS BARRAS GANHAM CONTORNO NA IMPRESSÃO, e é o que mantém a escada de
	 * pé no papel. A folha zera todo `background` (globals.css — sem isso o
	 * dossiê sai branco no branco), e junto com o fundo iam a régua, a faixa do
	 * meio e o traço da mediana: sobravam três valores soltos, R$ 12,90 num
	 * canto, R$ 199,00 no outro e R$ 35,00 pairando entre eles, sem nada dizendo
	 * que um está DENTRO dos outros — que é a única coisa que esta escada existe
	 * para mostrar. Borda não é background e sobrevive.
	 *
	 * Sem classe de cor, de propósito: a mesma folha crava `border-color` em todo
	 * elemento do dossiê, e uma cor aqui seria letra morta. Na tela `print:` não
	 * existe e nada muda.
	 */
	return (
		<div className="pt-2">
			<div className="relative h-12">
				{/* faixa entre p25 e p75 — onde a maioria dos anúncios está */}
				<div className="absolute inset-x-0 top-5 h-2 rounded-full bg-white/5 print:border" />
				<div
					className="absolute top-5 h-2 rounded-full print:border"
					style={{
						left: pos(ps.p25Cents),
						right: `${100 - Number.parseFloat(pos(ps.p75Cents))}%`,
						background:
							'linear-gradient(90deg, color-mix(in srgb, var(--screen-accent) 45%, transparent), var(--screen-accent))',
					}}
				/>
				{/* mediana */}
				<div
					className="absolute top-3 h-6 w-0.5 rounded bg-white print:border-l"
					style={{ left: pos(ps.medianaCents) }}
				/>
				<div
					className="absolute top-0 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] tabular-nums text-white"
					style={{ left: pos(ps.medianaCents) }}
				>
					{money(ps.medianaCents)}
				</div>
			</div>
			<div className="flex justify-between font-mono text-[11px] tabular-nums text-slate-500">
				<span>{money(min)}</span>
				<span>{money(max)}</span>
			</div>
		</div>
	);
}

/**
 * Foto do anúncio concorrente.
 *
 * Vale mais que enfeite: ver a foto que o concorrente usa é metade do trabalho
 * de descobrir por que o anúncio dele vende. Falha em silêncio (`onError`)
 * porque marketplace bloqueia hotlink com frequência — e um quadrado quebrado
 * seria pior que nenhuma foto.
 *
 * O tamanho vem de fora porque a mesma foto serve a dois pesos opostos:
 * miniatura ao lado do preço na lista de anúncios, e vitrine no ranking do ramo.
 *
 * NÃO EXISTE `fallback`, E A AUSÊNCIA DA PROP É O CONSERTO. Ele existiu, e era
 * por ele que entravam a sigla do canal em corpo 4xl ("ML", "SP") e o ícone de
 * pacote cinza — dois desenhos do tamanho de uma foto, cinzas, no lugar de uma
 * foto, que é a definição visual de "a imagem não carregou". Foi essa a tela que
 * o dono do produto reprovou. Quem chama decide se DESENHA A MOLDURA (ver
 * `CardProduto` e `MiniProduto`, que se remontam em forma de ficha); aqui, sem
 * foto significa nada na tela, e não um substituto para ela.
 *
 * ┌─ TODA FOTO DECLARA DE QUAL PÁGINA CITADA ELA SAIU ────────────────────────┐
 * │ `pagina` é OBRIGATÓRIA e vazia significa "não há foto": sem ela nada é    │
 * │ desenhado, mesmo com `url` cheia. Não é validação de formulário — é a     │
 * │ única guarda que sobrevive a uma seção nova.                              │
 * │                                                                           │
 * │ A rodada passada guardava a regra num COMENTÁRIO (ver `fotoDoItem`, onde  │
 * │ ela agora é mecanismo): "só leia `imagem_url` onde quem escreveu foi o    │
 * │ motor". Quem escreveu a seção seguinte leu o campo e pronto — duas portas │
 * │ ficaram abertas (o ranking do radar e a vitrine do concorrente) e foi por │
 * │ elas que os 404 e o GIF cinza de "imagem indisponível" chegaram à tela do │
 * │ dono do produto. Instrução não se herda; assinatura de função sim.        │
 * │                                                                           │
 * │ O tipo não sabe se a string que chega é uma página citada — quem sabe é   │
 * │ `fotoDoItem`, que devolve o par `{foto, pagina}` já conferido e é o único │
 * │ lugar desta tela que produz os dois. O que a assinatura garante é que     │
 * │ ninguém desenha uma foto sem NOMEAR a página de onde ela veio, e nomear   │
 * │ obriga a ir buscar — que é onde a conferência mora.                       │
 * └───────────────────────────────────────────────────────────────────────────┘
 */
function Foto({
	url,
	pagina,
	className = 'h-12 w-12 shrink-0 rounded-lg object-cover',
	onErro,
}: {
	url: unknown;
	/** A página citada de onde esta foto saiu. Vazia = sem foto. */
	pagina: string;
	className?: string;
	/**
	 * A FOTO MORREU NO CARREGAMENTO — e quem desenha a MOLDURA precisa saber.
	 *
	 * Marketplace bloqueia hotlink e página velha some, então isto acontece de
	 * verdade. Enquanto a moldura vinha sempre, sumir em silêncio bastava. Agora
	 * que o card só desenha o quadro 4:3 quando TEM foto, sumir em silêncio deixa
	 * o quadro montado e vazio — que é o retângulo cinza que reprovou esta tela.
	 * Com o aviso, o card se remonta na forma de ficha, a mesma de quem nunca
	 * teve foto.
	 */
	onErro?: () => void;
}) {
	const [erro, setErro] = useState(false);
	const src = typeof url === 'string' && /^https?:\/\//.test(url) ? url : '';
	if (!pagina || !src || erro) return null;
	return (
		// biome-ignore lint/performance/noImgElement: imagem de terceiro, fora do otimizador
		<img
			src={src}
			alt=""
			loading="lazy"
			onError={() => {
				setErro(true);
				onErro?.();
			}}
			className={className}
		/>
	);
}

/**
 * O ANÚNCIO PRONTO — título, bullets, legenda e o que fotografar.
 *
 * Foi pedido depois do primeiro teste do modo mercado: "a ideia era dar fontes,
 * links de anúncios e imagens, já com ideia de copy". Saber que vende não
 * resolve nada se a pessoa trava na hora de escrever o anúncio.
 *
 * O Redator recebe os TÍTULOS que mais vendem e as RECLAMAÇÕES dos clientes:
 * o primeiro ensina o que funciona naquele marketplace, o segundo vira promessa
 * ao contrário ("reclamam que a gravação apaga" → "gravação que não apaga").
 */
function CopyPronto({ c }: { c: Record<string, unknown> }) {
	const [copiado, setCopiado] = useState<string | null>(null);
	const titulos = comoTextos(c.titulos);
	const bullets = comoTextos(c.bullets);
	const fotos = comoTextos(c.fotos_tirar);
	const chaves = comoTextos(c.palavras_chave);
	// Passa por `campo` como todo o resto: aqui a ausência escrita não só
	// apareceria na tela, ela iria PARA A ÁREA DE TRANSFERÊNCIA do aluno e daí
	// para a legenda do post dele.
	const legenda = frase(c.legenda_instagram, TETO_PROSA);

	const copiar = async (texto: string, id: string) => {
		try {
			await navigator.clipboard.writeText(texto);
			setCopiado(id);
			setTimeout(() => setCopiado(null), 1500);
		} catch {
			// área de transferência bloqueada — o texto continua selecionável
		}
	};

	if (!titulos.length && !bullets.length) return null;

	return (
		<section className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.03] p-5">
			<div className="mb-4 flex items-center gap-2">
				<PenLine className="h-4 w-4 text-purple-400" />
				<h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
					Anúncio pronto para publicar
				</h3>
			</div>

			{titulos.length > 0 ? (
				<div className="mb-4">
					<p className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">
						Títulos — escolha um
					</p>
					<div className="space-y-1.5">
						{titulos.slice(0, 4).map((t) => (
							<button
								key={t}
								type="button"
								onClick={() => copiar(t, t)}
								className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3 text-left transition-colors hover:border-purple-500/30"
							>
								<span className="text-[13px] text-slate-200">{t}</span>
								<span className="shrink-0 text-[11px] text-slate-500">
									{copiado === t ? 'copiado' : `${t.length} car.`}
								</span>
							</button>
						))}
					</div>
				</div>
			) : null}

			<div className="grid gap-4 md:grid-cols-2">
				{bullets.length > 0 ? (
					<div>
						<p className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">
							Descrição em tópicos
						</p>
						<ul className="space-y-1">
							{bullets.slice(0, 6).map((b) => (
								<li key={b} className="text-[13px] leading-snug text-slate-300">
									• {b}
								</li>
							))}
						</ul>
					</div>
				) : null}

				{fotos.length > 0 ? (
					<div>
						<p className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">
							Fotos que você precisa tirar
						</p>
						<ul className="space-y-1">
							{fotos.slice(0, 6).map((f) => (
								<li key={f} className="text-[13px] leading-snug text-slate-300">
									📷 {f}
								</li>
							))}
						</ul>
					</div>
				) : null}
			</div>

			{legenda ? (
				<div className="mt-4">
					<p className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">
						Legenda para o Instagram
					</p>
					<button
						type="button"
						onClick={() => copiar(legenda, 'insta')}
						className="w-full rounded-xl border border-white/8 bg-white/[0.02] p-3 text-left text-[13px] leading-relaxed text-slate-300 transition-colors hover:border-purple-500/30"
					>
						{legenda}
						<span className="mt-2 block text-[11px] text-slate-500">
							{copiado === 'insta' ? 'copiado' : 'clique para copiar'}
						</span>
					</button>
				</div>
			) : null}

			{chaves.length > 0 ? (
				<div className="mt-4 flex flex-wrap gap-1.5">
					{chaves.slice(0, 12).map((k) => (
						<span
							key={k}
							className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-400"
						>
							{k}
						</span>
					))}
				</div>
			) : null}
		</section>
	);
}

/**
 * POR QUANTO VOCÊ DEVE VENDER — três degraus, não um número.
 *
 * Um preço único vira ordem ("cobre R$ 48"); três degraus viram decisão. E o
 * degrau premium só existe se vier acompanhado do que precisa ser entregue
 * para justificá-lo — senão é só um número maior.
 */
function PrecoSugerido({ p }: { p: Record<string, unknown> }) {
	const degraus = [
		{
			k: 'entrada_brl',
			rot: 'Entrada',
			sub: 'para ganhar os primeiros clientes',
		},
		{
			k: 'justo_brl',
			rot: 'Justo',
			sub: 'o que recomendamos cobrar',
			destaque: true,
		},
		{
			k: 'premium_brl',
			rot: 'Premium',
			sub: 'exige acabamento ou prazo melhor',
		},
	];
	const tem = degraus.some((d) => Number(p[d.k]) > 0);
	if (!tem) return null;
	const porQue = frase(p.por_que, TETO_PROSA);

	return (
		<section className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
			<h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
				Por quanto você deve vender
			</h3>
			<div className="grid gap-3 sm:grid-cols-3">
				{degraus.map((d) => {
					const v = Number(p[d.k]);
					return (
						<div
							key={d.k}
							className={`rounded-xl border p-4 ${
								d.destaque
									? 'border-amber-500/35 bg-amber-500/[0.06]'
									: 'border-white/8 bg-white/[0.02]'
							}`}
						>
							<p className="text-[11px] uppercase tracking-wider text-slate-500">
								{d.rot}
							</p>
							<p
								className={`mt-1 font-mono tabular-nums ${
									d.destaque
										? 'text-2xl font-bold text-amber-300'
										: 'text-xl text-slate-200'
								}`}
							>
								{Number.isFinite(v) && v > 0 ? BRL.format(v) : '—'}
							</p>
							<p className="mt-1 text-[11px] leading-snug text-slate-500">
								{d.sub}
							</p>
						</div>
					);
				})}
			</div>
			{porQue ? (
				<p className="mt-3 text-[13px] leading-relaxed text-slate-400">
					{porQue}
				</p>
			) : null}
		</section>
	);
}

/**
 * Cada marketplace com a cor da própria marca.
 *
 * O aluno reconhece o amarelo do Mercado Livre e o laranja da Shopee antes de
 * ler o nome — é o que deixa a grade ser lida de relance em vez de item por
 * item. A sigla existe para o card sem foto: melhor um selo do canal do que um
 * retângulo vazio.
 */
const SELOS: { teste: RegExp; rot: string; cor: string; sigla: string }[] = [
	{
		teste: /mercado\s*livre|mercadolivre|meli/i,
		rot: 'Mercado Livre',
		cor: '#ffe600',
		sigla: 'ML',
	},
	{ teste: /shopee/i, rot: 'Shopee', cor: '#ee4d2d', sigla: 'SP' },
	{ teste: /amazon/i, rot: 'Amazon', cor: '#ff9900', sigla: 'AMZ' },
	{ teste: /tiktok/i, rot: 'TikTok Shop', cor: '#25f4ee', sigla: 'TT' },
	{ teste: /elo7/i, rot: 'Elo7', cor: '#f97316', sigla: 'E7' },
	{ teste: /etsy/i, rot: 'Etsy', cor: '#f56400', sigla: 'ET' },
];

/**
 * A GRADE DOS CARDS DE ANÚNCIO — ladrilho de tamanho fixo, como a das fotos.
 *
 * `lg:grid-cols-3` divide a linha em três fatias sempre, tenha a seção doze
 * cards ou um. E "um" agora é caso comum: desde que o cartão de anúncio exige
 * página citada, a seção "O que está vendendo neste ramo" pode ficar com um
 * único item — que num terço de linha vira um card solto com dois terços de
 * preto do lado, exatamente a leitura de "quebrou" que esta rodada existe para
 * matar. `auto-fill` cria as faixas mesmo vazias: um card fica do tamanho de
 * sempre, doze também. É a mesma decisão, e o mesmo motivo, de `GRADE_DE_FOTOS`.
 */
const GRADE_DE_ANUNCIOS =
	'grid-cols-[repeat(auto-fill,minmax(300px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(340px,1fr))]';

/** Cai no domínio do anúncio quando o especialista não nomeou o canal. */
function seloDe(p: Record<string, unknown>) {
	const url = typeof p.url === 'string' ? p.url : '';
	// `campo` e não `String()`: `marketplace: "nao_apurado"` desenhava o selo
	// cinza "NAO" em cima da foto e o rótulo "nao_apurado" ao lado. Sem nome, o
	// domínio do anúncio responde — e sem nem isso, o selo some. Ver `SEM_DADO`.
	const marca = campo(p, 'marketplace');
	const achado = SELOS.find((s) => s.teste.test(`${marca} ${url}`));
	if (achado) return achado;
	const nome = marca || (url ? dominio(url) : '');
	return { rot: nome, cor: '#94a3b8', sigla: nome.slice(0, 3).toUpperCase() };
}

/**
 * Um produto que vende, em formato de vitrine.
 *
 * Era uma lista de linhas finas e voltou do dono do produto como "faltou trazer
 * mais objetivo os produtos com fotos e anúncios exemplos": quem decide o que
 * fabricar decide pela foto e pelo preço, não lendo. Por isso a foto ocupa o
 * topo inteiro e o preço vem em corpo grande, e só depois o texto.
 *
 * O título aparece rotulado e copiável porque ele não é legenda — é o anúncio
 * REAL que está vendendo, e serve de modelo de copy para o aluno.
 *
 * O link cobre o card por cima (`absolute inset-0`) em vez de o card ser um
 * `<a>`: assim o botão de copiar convive com ele sem aninhar dois clicáveis.
 *
 * ┌─ CARTÃO DE ANÚNCIO SÓ EXISTE COM PÁGINA CITADA ──────────────────────────┐
 * │ Este card diz, por escrito na seção acima dele, "anúncios reais que já    │
 * │ estão no ar". Ele desenha um título em negrito, um preço em corpo 2xl e   │
 * │ uma pílula verde "5.000 vendidos" — três afirmações de fato, numa tela    │
 * │ paga. Medido: no escopo mercado o especialista escreveu SEIS anúncios     │
 * │ cujas URLs não estavam entre as dez citações que ele mesmo trouxe;        │
 * │ testadas na mão, `MLB-1845623145` e três ids sequenciais de Shopee não    │
 * │ abrem. Os "vendidos" e o preço vinham do mesmo lugar que o endereço.      │
 * │                                                                           │
 * │ Sem a página citada o card continua na tela — o produto em si é uma ideia │
 * │ de mercado e foi pago —, mas para de fingir que é um anúncio: sem link,   │
 * │ sem foto, sem "vendidos", e o preço vira a mesma tarja âmbar que o resto  │
 * │ do dossiê já usa ("preço sem link que comprove", ver `MiniProduto`).      │
 * │ Quem promete menos entrega o que promete. Ver `RamoECanais`, que separa   │
 * │ os dois grupos e escreve o texto certo para cada um.                      │
 * └───────────────────────────────────────────────────────────────────────────┘
 */
function CardProduto({
	p,
	pos,
	citadas,
}: {
	p: Record<string, unknown>;
	pos: number;
	citadas: Set<string>;
}) {
	const [copiado, setCopiado] = useState(false);
	/**
	 * Foto que existia e não carregou = card SEM foto, e não card com buraco.
	 * Ver `Foto.onErro`: a moldura 4:3 só é montada quando há foto de pé.
	 */
	const [fotoMorreu, setFotoMorreu] = useState(false);
	const selo = seloDe(p);
	// `campo` faz a mesma escolha entre os dois nomes que o `||` fazia, e de
	// quebra não deixa a ausência escrita virar "Título real do anúncio: null"
	// — que é o texto que o aluno COPIA daqui para o anúncio dele.
	const titulo = campo(p, 'titulo_anuncio', 'nome');
	const porQueVende = frase(p.por_que_vende, TETO_PROSA);
	/** A foto e o link são a MESMA prova: ou os dois existem, ou nenhum. */
	const { foto, pagina: url } = fotoDoItem(p, citadas);
	const temFoto = Boolean(foto) && !fotoMorreu;
	// Número de venda é fato, e fato sem página conferida não entra: era a
	// pílula verde "5.000 vendidos" em cima de um anúncio que não abre.
	const vendidos = url ? rotuloVendidos(p.vendidos) : '';
	const preco = url ? paraNumero(p.preco_brl) : Number.NaN;

	const copiar = async () => {
		try {
			await navigator.clipboard.writeText(titulo);
			setCopiado(true);
			setTimeout(() => setCopiado(false), 1500);
		} catch {
			// área de transferência bloqueada — o título continua na tela
		}
	};

	return (
		<motion.article
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25, delay: Math.min(pos, 12) * 0.03 }}
			className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] transition-colors hover:border-white/20"
		>
			{url ? (
				<a
					href={url}
					target="_blank"
					rel="noopener noreferrer"
					className="absolute inset-0 z-[1]"
				>
					<span className="sr-only">
						Abrir anúncio{titulo ? `: ${titulo}` : ''}
					</span>
				</a>
			) : null}

			{/* ═══ A MOLDURA DA FOTO SÓ EXISTE QUANDO EXISTE FOTO ═══
			    O `fallback` daqui desenhava a SIGLA DO CANAL ("ML", "SP", "E-C") em
			    corpo 4xl dentro de um retângulo 4:3 vazio, e foi essa tela que o dono
			    do produto leu como "fica faltando só mostrar as imagens ali,
			    realmente o que não está acontecendo". Ele estava certo: um quadro do
			    tamanho de uma foto, cinza, com duas letras no meio, é a forma visual
			    de uma imagem que não carregou — não a de um card que nunca teve foto.
			    Sem foto o card se reorganiza: a mesma numeração e o mesmo selo do
			    canal viram uma faixa de uma linha no topo, o texto sobe, e o cartão
			    fica com cara de ficha, que é o que ele é. */}
			{temFoto ? (
				<div className="relative aspect-[4/3] w-full overflow-hidden bg-white/[0.03]">
					<Foto
						url={foto}
						pagina={url}
						onErro={() => setFotoMorreu(true)}
						className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
					/>

					<div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
						<span className="rounded-md bg-black/55 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-white/70 backdrop-blur-sm">
							{String(pos).padStart(2, '0')}
						</span>
						{selo.rot ? (
							<span
								className="truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm"
								style={{
									background: `color-mix(in srgb, ${selo.cor} 16%, rgba(8,8,10,0.82))`,
									borderColor: `${selo.cor}59`,
									color: selo.cor,
								}}
							>
								{selo.rot}
							</span>
						) : null}
					</div>

					{vendidos ? (
						<div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2.5 pt-10">
							<span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-emerald-300 ring-1 ring-emerald-500/30">
								<TrendingUp className="h-3 w-3" />
								{vendidos}
							</span>
						</div>
					) : null}
				</div>
			) : (
				<div className="flex items-center gap-2 border-b border-white/8 px-4 py-2.5">
					<span className="font-mono text-[10px] tabular-nums text-slate-600">
						{String(pos).padStart(2, '0')}
					</span>
					{selo.rot ? (
						<span
							className="truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold"
							style={{
								background: `color-mix(in srgb, ${selo.cor} 12%, transparent)`,
								borderColor: `${selo.cor}45`,
								color: selo.cor,
							}}
						>
							{selo.rot}
						</span>
					) : (
						<Store className="h-3.5 w-3.5 text-slate-700" strokeWidth={1.5} />
					)}
				</div>
			)}

			<div className="flex flex-1 flex-col gap-2.5 p-4">
				{/* A LINHA DO PREÇO SÓ EXISTE DO LADO PROVADO, e some inteira do outro.
				    Ela chegou a virar uma tarja âmbar "preço sem link que comprove" em
				    cada card, como no resto da tela — e renderizada, era uma coluna de
				    sete avisos amarelos, a cor mais forte do card gritando a informação
				    menos importante dele, logo abaixo de uma intro que já diz "não têm
				    preço nem número de vendas aqui". A tarja continua certa onde a
				    ausência é EXCEÇÃO no meio de itens com preço (`MiniProduto`); aqui
				    a ausência é a regra da seção inteira, e quem explica é a seção. */}
				{url || p.da_para_fazer_a_laser === false ? (
					<div className="flex items-start justify-between gap-2">
						{url ? (
							<p
								className={`font-mono font-bold leading-none tabular-nums ${
									preco > 0
										? 'text-2xl text-slate-50'
										: 'text-lg text-slate-600'
								}`}
							>
								{preco > 0 ? BRL.format(preco) : '—'}
							</p>
						) : null}
						{/* Sem `ml-auto`: quando o preço não existe, o selo é o único filho
						    da linha e ficava encostado na direita, solto, parecendo sobra de
						    um layout que perdeu a peça da esquerda. */}
						{p.da_para_fazer_a_laser === false ? (
							<span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400 ring-1 ring-amber-500/25">
								não é a laser
							</span>
						) : null}
					</div>
				) : null}

				{titulo ? (
					<div className="rounded-xl border border-white/8 bg-white/[0.03] p-2.5">
						<div className="mb-1 flex items-center justify-between gap-2">
							{/* "Real" é uma afirmação, e ela vale só do lado provado. */}
							<span className="text-[10px] uppercase tracking-wider text-slate-500">
								{url
									? 'Título real do anúncio'
									: 'Título, como o time descreveu'}
							</span>
							<button
								type="button"
								onClick={copiar}
								className="relative z-[2] flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-100"
							>
								{copiado ? (
									<Check className="h-3 w-3 text-emerald-400" />
								) : (
									<Copy className="h-3 w-3" />
								)}
								{copiado ? 'copiado' : 'copiar'}
							</button>
						</div>
						<p className="line-clamp-2 text-[13px] leading-snug text-slate-200">
							{titulo}
						</p>
					</div>
				) : null}

				{porQueVende ? (
					<p className="line-clamp-3 text-[12px] leading-snug text-slate-500">
						{porQueVende}
					</p>
				) : null}

				{url ? (
					<span className="mt-auto flex items-center gap-1 pt-1 text-[11px] text-slate-600 transition-colors group-hover:text-[var(--screen-accent)]">
						ver anúncio em {dominio(url)}
						<ExternalLink className="h-3 w-3" />
					</span>
				) : null}
			</div>
		</motion.article>
	);
}

/**
 * A comissão como NÚMERO, para a barra ter comprimento.
 *
 * O especialista quase nunca devolve escalar: nas execuções reais vêm faixas
 * ("10–19%", "10-15%", "5 a 8%"), com meia-risca ou hífen. `Number("10–19")` é
 * NaN, e por causa disso a tira de barras não desenhava em nenhum dossiê. Com
 * faixa usamos o MEIO — é o que posiciona a barra de forma justa entre canais —
 * e o rótulo continua mostrando o texto original, que é o dado que o
 * especialista realmente apurou.
 */
function pct(v: unknown): number {
	if (typeof v === 'number') return Number.isFinite(v) ? v : Number.NaN;
	const txt = String(v ?? '').replace(/%/g, '');
	const numeros = txt
		.replace(/,/g, '.')
		.match(/\d+(?:\.\d+)?/g)
		?.map(Number)
		.filter((n) => Number.isFinite(n));
	if (!numeros?.length) return Number.NaN;
	if (numeros.length === 1) return numeros[0] as number;
	// Mais de dois números não é faixa, é frase — fica com os dois primeiros.
	return (((numeros[0] as number) + (numeros[1] as number)) / 2) as number;
}

/**
 * O texto que o especialista escreveu, normalizado só no sinal de %.
 *
 * `frase` e não `String()`: `comissao_pct: "nao_apurado"` saía como
 * "nao_apurado% de comissão" no card do canal. Sem texto legível sobra o número
 * que `pct` extraiu — e quando não há número nenhum, quem chama já não desenha
 * a linha (`Number.isFinite`). Ver `SEM_DADO`.
 */
function rotuloPct(v: unknown, meio: number): string {
	const txt = frase(v, 40);
	if (!txt) return `${meio}%`;
	return txt.includes('%') ? txt : `${txt}%`;
}

/**
 * A comissão dos canais, em barras na mesma régua.
 *
 * Em texto, "12% de comissão" num card e "20% de comissão" noutro é uma conta
 * que o aluno precisa fazer de cabeça, card a card. Empilhadas contra o mesmo
 * eixo, a diferença vira geometria: a barra mais longa é o canal que fica com
 * mais dinheiro do aluno — daí a legenda, porque aqui barra maior é notícia
 * pior, e o contrário do que a leitura de gráfico costuma sugerir.
 */
function BarrasComissao({
	canais,
	comecarPor,
}: {
	canais: Record<string, unknown>[];
	comecarPor: string;
}) {
	const linhas = canais
		.map((c) => {
			const valor = pct(c.comissao_pct);
			return {
				// `campo`: canal sem nome legível já era descartado pelo `.filter`
				// abaixo, e a ausência escrita passava por ele desenhando uma barra
				// rotulada "null" na régua de comissões. Ver `SEM_DADO`.
				nome: campo(c, 'canal'),
				valor,
				rotulo: rotuloPct(c.comissao_pct, valor),
				cor: seloDe({ marketplace: c.canal }).cor,
			};
		})
		.filter((l) => l.nome && Number.isFinite(l.valor) && l.valor > 0);

	if (linhas.length < 2) return null;
	const maior = Math.max(...linhas.map((l) => l.valor));

	return (
		<div className="mb-4 rounded-xl border border-white/8 bg-white/[0.02] p-4">
			<div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
				<p className="text-[11px] uppercase tracking-wider text-slate-500">
					Quanto o canal fica
				</p>
				<span className="text-[11px] text-slate-600">
					barra maior = comissão maior
				</span>
			</div>
			<ul className="space-y-2">
				{linhas.map((l) => {
					const recomendado =
						!!comecarPor && l.nome.toLowerCase() === comecarPor.toLowerCase();
					return (
						<li key={l.nome} className="flex items-center gap-3">
							<span
								className={`w-28 shrink-0 truncate text-[12px] sm:w-40 ${
									recomendado
										? 'font-semibold text-slate-100'
										: 'text-slate-400'
								}`}
							>
								{l.nome}
							</span>
							{/* Contorno na impressão pelo mesmo motivo de `EscadaPreco`: a
							    folha zera todo `background` e as barras sumiam — sobrava a
							    legenda "barra maior = comissão maior" apontando para barra
							    nenhuma, que é a tela descrevendo no papel algo que o papel
							    não tem. Com a borda, cada canal volta a ter comprimento e a
							    legenda volta a ser verdade. */}
							<span className="h-2 flex-1 overflow-hidden rounded-full bg-white/5 print:border">
								<span
									className="block h-full rounded-full print:border"
									style={{
										width: `${Math.max(6, (l.valor / maior) * 100)}%`,
										background: `linear-gradient(90deg, ${l.cor}55, ${l.cor})`,
									}}
								/>
							</span>
							<span className="w-16 shrink-0 text-right font-mono text-[12px] tabular-nums text-slate-300">
								{l.rotulo}
							</span>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

/* ─────────── ONDE FALTA GENTE VENDENDO (Caçador de Brechas) ─────────── */

/**
 * O que o especialista viu, em português.
 *
 * O campo `sinal` é um enum de máquina (`sem_personalizado`) e ia para a tela
 * assim, sublinhado e tudo. Valor fora da lista não vira chip: melhor um card
 * sem etiqueta do que uma etiqueta que o aluno não sabe ler.
 */
const SINAL_BRECHA: Record<string, string> = {
	poucos_vendedores: 'poucos vendedores',
	anuncio_fraco: 'anúncio fraco',
	nota_baixa: 'nota baixa',
	sem_personalizado: 'ninguém faz personalizado',
	variacao_orfa: 'variação que quase ninguém vende',
};

/** Força é a leitura do especialista, não medição: entra como texto, sem selo. */
const FORCA_BRECHA: Record<string, string> = {
	forte: 'sinal forte',
	media: 'sinal médio',
	fraca: 'sinal fraco',
};

/**
 * O Caçador de Brechas tem um lugar na tela.
 *
 * Ele roda, gasta duas buscas, é cobrado como todo mundo e aparece trabalhando
 * na sala de guerra — e até aqui o que ele apurava só alimentava o Curador por
 * dentro. O aluno via dez profissionais e lia o resultado de oito. E é ele quem
 * responde a segunda metade do pedido do dono do produto: "os que estão no
 * mercado sem competitividade, e a pessoa vai poder ganhar".
 *
 * Duas regras de honestidade aqui:
 *
 *   1. Brecha sem link é opinião. Ela CONTINUA na lista (saber que o time achou
 *      um flanco é informação), mas dita como opinião e sem preço — porque um
 *      número ao lado de um texto afirmativo é lido como conferido.
 *   2. "Não achei brecha" é resposta, não vazio. O papel do especialista pede
 *      que ele diga quando o ramo está bem servido, e essa frase evita que o
 *      aluno compre material para brigar de igual com quem está lá há dois anos.
 *
 * ┌─ POR QUE O LINK DAQUI PASSA POR `provaDe`, E O DO CARD DO RANKING NÃO ────┐
 * │ Este `<a>` diz, com todas as letras, "a prova em mercadolivre.com.br".    │
 * │ Prova é uma AFIRMAÇÃO sobre a página, e o arquivo inteiro fixa em         │
 * │ `provaDe` o que ela custa: link escrito por modelo que ninguém abriu não  │
 * │ é fonte, é texto plausível. A exigência antiga parava no FORMATO          │
 * │ (`^https?://`), e num run frio de mercado dois dos endereços impressos    │
 * │ como "a prova" — uma busca do Shopee e uma listagem do Mercado Livre —    │
 * │ não estavam entre as páginas que este dossiê registrou. Eram buscas       │
 * │ montadas pelo modelo, e a palavra em cima delas era "prova".              │
 * │                                                                          │
 * │ ESCOLHA FEITA, entre as duas que existiam: conferir, e NÃO tirar a        │
 * │ palavra. A brecha sem página conferida já tem para onde ir — cai no       │
 * │ mesmo ramo de sempre, "sem link que comprove — é leitura do               │
 * │ especialista", que mantém o item na tela, sem clique e sem preço. Custo   │
 * │ medido em 8 runs frios: 0 a 2 links por dossiê deixam de ser clicáveis.   │
 * │                                                                          │
 * │ O card do ranking (`CardProduto`) continua lendo `p.url` sem conferir, e  │
 * │ a diferença não é de rigor, é do que está escrito embaixo do link: lá se  │
 * │ lê "ver anúncio em X", que é um convite a olhar, não uma afirmação sobre  │
 * │ o que a página contém — e é a mesma página de onde o MOTOR baixou a       │
 * │ `og:image` que está no card (ver `imagemDe`), ou seja alguém a abriu.     │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
function Brechas({
	j,
	citadas,
}: {
	j: Record<string, unknown> | null;
	citadas: Set<string>;
}) {
	if (!j) return null;

	const itens = comoObjetos(j.brechas)
		.map((b) => {
			const link = provaDe(b, citadas, 'url', 'evidencia_url', 'link');
			const preco = paraNumero(b.preco_visto_brl);
			return {
				produto: frase(b.produto, 120),
				falta: frase(b.o_que_falta, 300),
				ganhar: frase(b.por_que_da_para_ganhar, 300),
				sinal: SINAL_BRECHA[classe(b.sinal)] ?? '',
				forca: FORCA_BRECHA[classe(b.forca)] ?? '',
				link,
				// Preço só com a página que o comprova: sem link conferido, o número
				// não aparece de jeito nenhum.
				preco: link && Number.isFinite(preco) && preco > 0 ? preco : null,
			};
		})
		.filter((b) => b.produto);

	const bemServido = j.mercado_bem_servido === true;
	const observacao = frase(j.observacao, 400);
	if (!itens.length && !bemServido && !observacao) return null;

	return (
		<section className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
			<div className="mb-4">
				<h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
					Onde ainda falta gente vendendo bem
				</h3>
				<p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-slate-500">
					O ranking acima mostra o que vende mais — que é, por definição, onde
					tem mais gente disputando. Aqui é o contrário: os flancos que o time
					achou abertos. Quando a página que comprova o flanco está entre as
					fontes deste dossiê, ela vem junto; quando não está, o card diz isso
					em letra e o preço não aparece.
				</p>
			</div>

			{bemServido ? (
				<p className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-[12.5px] leading-relaxed text-amber-200/90">
					O time olhou e disse que este ramo já está bem servido: quem está lá
					atende bem. Dá para entrar — mas contando com disputa de preço, não
					com uma vaga aberta.
				</p>
			) : null}

			{itens.length > 0 ? (
				<ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{itens.map((b, i) => (
						<li
							key={`${b.produto}-${i}`}
							className="flex flex-col gap-2 rounded-xl border border-white/8 bg-white/[0.02] p-4"
						>
							<div>
								<p className="text-[14px] font-semibold leading-snug text-slate-100">
									{b.produto}
								</p>
								<div className="mt-1.5 flex flex-wrap items-center gap-1.5">
									{b.sinal ? (
										<Selo tom={b.link ? 'bom' : 'aviso'} icone={DoorOpen}>
											{b.sinal}
										</Selo>
									) : null}
									{b.forca ? (
										<span className="text-[11px] text-slate-500">
											· {b.forca}
										</span>
									) : null}
								</div>
							</div>

							{b.falta ? (
								<p className="text-[12.5px] leading-snug text-slate-400">
									<span className="text-slate-600">Falta ali: </span>
									{b.falta}
								</p>
							) : null}
							{b.ganhar ? (
								<p className="text-[12.5px] leading-snug text-emerald-200/85">
									{b.ganhar}
								</p>
							) : null}

							{b.link ? (
								<div className="mt-auto flex flex-wrap items-baseline justify-between gap-2 pt-1">
									{b.preco !== null ? (
										<span className="font-mono text-[13px] font-bold tabular-nums text-slate-100">
											{reais(b.preco)}
										</span>
									) : null}
									<a
										href={b.link}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-1 text-[11px] text-slate-500 transition-colors hover:text-[var(--screen-accent)]"
									>
										a prova em {dominio(b.link)}
										<ExternalLink className="h-3 w-3" />
									</a>
								</div>
							) : (
								/* Sem a página que comprova, isto é leitura do especialista —
								   e leitura não recebe número nem tom de fato. */
								<p className="mt-auto pt-1 text-[11px] leading-snug text-amber-300/80">
									sem link que comprove — é leitura do especialista
								</p>
							)}
						</li>
					))}
				</ul>
			) : null}

			{observacao ? (
				<p className="mt-4 text-[12px] leading-relaxed text-slate-500">
					{observacao}
				</p>
			) : null}
		</section>
	);
}

/**
 * O RANKING do ramo, as brechas e a comparação de canais.
 *
 * Foi o pedido que veio depois do primeiro teste: "aceitar sobre o mercado
 * inteiro do que vender, e em qual está vendendo mais — Amazon, TikTok Shop,
 * Shopee e Mercado Livre".
 *
 * QUEM ENTRA É DECIDIDO POR QUEM RESPONDEU, NUNCA PELO ESCOPO DO RUN. É a mesma
 * regra de `BLOCOS_DO_TIME`, e ela chegou aqui pelo mesmo caminho: o grupo
 * inteiro ficava atrás de `tipo === 'mercado'`, e o Especialista em
 * Marketplaces é `escopo: 'ambos'` no roster — ele entra nos DEZ de
 * `produto+profundo`, gasta as duas buscas mais caras do modo, aparece
 * trabalhando na sala de guerra, e o cartão do modo promete por escrito
 * "Comparação dos canais: comissão, público e por onde começar". Do trabalho
 * inteiro dele chegava à tela UMA palavra, a célula "Comece por" do painel:
 * sumiam a tabela "Onde vender", as comissões, o que cada canal exige e o
 * `por_que`. Reproduzido por render nas quatro combinações.
 *
 * Não faz nenhum bloco novo aparecer no escopo produto: `radar_oportunidades` e
 * `brechas` são `escopo: 'mercado'` no roster, não rodam ali, não têm json — e
 * somem sozinhos, cada um pela sua própria guarda de dado. E é a única regra que
 * continua certa quando alguém mudar o `escopo` de um especialista pela Fábrica,
 * que é dado editável sem deploy.
 */
function RamoECanais({
	jsonDe,
	citadas,
}: {
	jsonDe: (k: string) => Record<string, unknown> | null;
	citadas: Set<string>;
}) {
	const radar = jsonDe('radar_oportunidades');
	const mkt = jsonDe('marketplaces');
	/**
	 * `comoObjetos`, e não `Array.isArray`: o cast passava em duas coisas que o
	 * modelo devolve de verdade. `produtos: "nenhum encontrado"` (string em campo
	 * de lista) já derrubou esta tela uma vez, e o `Array.isArray` cobriu isso —
	 * mas `canais: [null]` continuava passando, e `String(c.canal)` estourava com
	 * "Cannot read properties of null". Reproduzido por render: tela branca no
	 * lugar de um dossiê pago. `comoObjetos` cobre os dois: só objeto de verdade
	 * entra na lista, o resto é descartado em silêncio.
	 */
	const produtos = comoObjetos(radar?.produtos);
	/**
	 * A SEÇÃO SE PARTE EM DUAS PELA PROVA, e é isso que faz o texto dela poder
	 * ser verdade.
	 *
	 * "Anúncios reais que já estão no ar. Clique no card para abrir" é a promessa
	 * impressa aqui, e ela estava sendo feita em cima de anúncio inventado —
	 * medido: das 8 linhas do Radar, entre 0 e 3 tinham a página entre as
	 * citações reais do run, e as outras eram ids sequenciais que não abrem.
	 *
	 * Encolher é a resposta certa, e encolher não é apagar: o produto continua
	 * sendo uma ideia de mercado que o aluno pagou para receber. O que muda é o
	 * que a tela AFIRMA sobre ele — na primeira lista, anúncio com link, foto e
	 * número de vendas; na segunda, ideia sem anúncio conferido, e dito com essas
	 * palavras. Ver o cabeçalho de `CardProduto`.
	 */
	const comAnuncio = produtos.filter(
		(p) => provaDe(p, citadas, ...CAMPOS_DE_PAGINA) !== '',
	);
	const semAnuncio = produtos.filter(
		(p) => provaDe(p, citadas, ...CAMPOS_DE_PAGINA) === '',
	);
	const canais = comoObjetos(mkt?.canais);
	// Tudo o que sai daqui para a tela passa pelo funil de prosa: o canal que
	// chega como a ausência escrita não vira "comece por null" nem um card
	// intitulado "null". Ver `frase` e `SEM_DADO`.
	const comecarPor = mkt ? campo(mkt, 'comecar_por') : '';
	const porQueCanais = frase(mkt?.por_que, TETO_PROSA);

	return (
		<>
			{comAnuncio.length > 0 ? (
				<section className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
					<div className="mb-4">
						<h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
							O que está vendendo neste ramo
						</h3>
						<p className="mt-1 text-[12px] text-slate-500">
							Anúncios reais que já estão no ar — cada um com a página que o
							time abriu. Clique no card para abrir, ou copie o título para usar
							de modelo no seu.
						</p>
					</div>
					<div className={`grid gap-4 ${GRADE_DE_ANUNCIOS}`}>
						{comAnuncio.slice(0, 12).map((p, i) => (
							<CardProduto
								key={chaveProduto(p, i)}
								p={p}
								pos={i + 1}
								citadas={citadas}
							/>
						))}
					</div>
				</section>
			) : null}

			{semAnuncio.length > 0 ? (
				<section className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
					<div className="mb-4">
						<h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
							Ideias que o time levantou neste ramo
						</h3>
						<p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-slate-500">
							Produtos que apareceram na pesquisa, mas sem um anúncio que dê
							para abrir e conferir. Servem para você saber o que existe e o que
							procurar — não são anúncios que já estão no ar, e por isso não têm
							preço nem número de vendas aqui.
						</p>
					</div>
					<div className={`grid gap-4 ${GRADE_DE_ANUNCIOS}`}>
						{semAnuncio.slice(0, 12).map((p, i) => (
							<CardProduto
								key={chaveProduto(p, i)}
								p={p}
								pos={comAnuncio.length + i + 1}
								citadas={citadas}
							/>
						))}
					</div>
				</section>
			) : null}

			{/* O contrapeso do ranking, logo abaixo dele: o que vende mais e onde
			    ainda falta gente são a mesma pergunta vista dos dois lados. */}
			<Brechas j={jsonDe('brechas')} citadas={citadas} />

			{canais.length > 0 ? (
				<section className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
					<div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
						<h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
							Onde vender
						</h3>
						{comecarPor ? (
							<span className="text-[12px] text-amber-300">
								comece por {comecarPor}
							</span>
						) : null}
					</div>
					<BarrasComissao
						canais={canais}
						comecarPor={comecarPor.slice(0, 40)}
					/>
					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
						{canais.slice(0, 6).map((c, i) => (
							<div
								key={`${campo(c, 'canal')}-${i}`}
								className="rounded-xl border border-white/8 bg-white/[0.02] p-4"
							>
								<div className="flex items-baseline justify-between gap-2">
									<span className="text-[14px] font-semibold text-slate-100">
										{campo(c, 'canal')}
									</span>
									{c.comissao_pct !== null && c.comissao_pct !== undefined ? (
										/**
										 * `rotuloPct`, e não `String(...)` + `%`: nas execuções reais
										 * o especialista devolve a comissão como FAIXA e já com o
										 * sinal ("10–19%"), e a concatenação imprimia "10–19%% de
										 * comissão" — dois por cento colados, no card de um dossiê
										 * pago. Reproduzido por screenshot do dossiê gravado
										 * `m4.json`. É a mesma função que a tira de barras logo acima
										 * usa no rótulo, então os dois passam a dizer a mesma coisa
										 * do mesmo jeito.
										 */
										<span className="font-mono text-[12px] tabular-nums text-slate-400">
											{rotuloPct(c.comissao_pct, pct(c.comissao_pct))} de
											comissão
										</span>
									) : null}
								</div>
								<dl className="mt-2 space-y-1 text-[12px] leading-snug">
									{(
										[
											['Público', campo(c, 'publico')],
											['Preço que funciona', campo(c, 'faixa_preco')],
											['Exige', campo(c, 'exige')],
											['Cuidado', campo(c, 'cuidado')],
										] as [string, string][]
									).map(([rot, val]) =>
										val ? (
											<div key={rot} className="flex gap-2">
												<dt className="shrink-0 text-slate-600">{rot}:</dt>
												<dd className="text-slate-400">{val}</dd>
											</div>
										) : null,
									)}
								</dl>
							</div>
						))}
					</div>
					{porQueCanais ? (
						<p className="mt-3 text-[13px] leading-relaxed text-slate-400">
							{porQueCanais}
						</p>
					) : null}
				</section>
			) : null}
		</>
	);
}

/* ──────────── COMECE POR ESTES PRODUTOS (o Curador) ──────────── */

/**
 * A resposta que o aluno veio buscar quando pesquisa um RAMO.
 *
 * Veio literal do dono do produto olhando um dossiê de "brindes corporativos":
 * "eu quero que traga os produtos pra pessoa já começar — os que hoje estão numa
 * margem essencial de lucro ou os que estão no mercado sem competitividade".
 * O resto do dossiê descreve o ramo; esta seção diz o que fabricar segunda-feira.
 *
 * Duas coisas NÃO acontecem aqui, e por escolha:
 *
 *   1. Não se reordena. O backend já ordena por margem CALCULADA em TypeScript
 *      × concorrência baixa, com quem tem número na frente de quem não tem.
 *      Uma segunda ordenação no front faria a tela discordar da única conta que
 *      tem fonte.
 *   2. Não se recalcula margem. `margem_pct` nasce da divisão feita no servidor
 *      a partir de preço e custo com fonte; quando um dos dois falta ele vem
 *      `null` — e `null` aqui vira âmbar "não apurado", nunca 0% nem "—".
 */

/** Só o que dá para ler como produto: objeto. String solta não é ficha. */
function comoObjetos(v: unknown): Record<string, unknown>[] {
	return comoLista(v).filter(
		(x): x is Record<string, unknown> =>
			typeof x === 'object' && x !== null && !Array.isArray(x),
	);
}

/**
 * O contrato com o bloco: a lista vem como ARRAY PURO em
 * `output.produtos_para_comecar` e a ressalva do Curador vem na chave IRMÃ
 * `output.produtos_observacao` — nunca dentro do objeto.
 *
 * Ler só `observacao` de dentro do objeto era o mesmo que jogá-la fora: o bloco
 * normaliza a saída do Curador para array e a frase caía no chão em silêncio.
 * Era justamente a frase que EXPLICA os "não apurado" do card ("não achei custo
 * de insumo com fonte para nenhum destes") — o aluno via cinco cards em âmbar e
 * nenhum motivo, com o motivo escrito e pago.
 *
 * A forma antiga `{produtos, observacao}` continua aceita porque dossiê gravado
 * antes desta seção existir, e replay de cache, chegam assim — e o `.produtos`
 * de um array é `undefined`, o que faria a seção sumir sem erro nenhum. Quando
 * as duas existem, a chave irmã ganha: é a que o bloco escreve hoje.
 */
function paraComecarDe(
	v: unknown,
	observacaoIrma: unknown,
): {
	itens: Record<string, unknown>[];
	observacao: string;
} {
	const o =
		v && typeof v === 'object' && !Array.isArray(v)
			? (v as Record<string, unknown>)
			: null;
	// Sem nome não há o que fabricar: o card viraria uma ficha anônima com preço.
	const itens = comoObjetos(o ? o.produtos : v).filter((x) =>
		frase(x.nome, 120),
	);
	const observacao =
		frase(observacaoIrma, 1_000) || (o ? frase(o.observacao, 1_000) : '');
	return { itens, observacao };
}

type Tom = 'bom' | 'ok' | 'ruim' | 'aviso';

const TOM_SELO: Record<Tom, string> = {
	bom: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
	ok: 'bg-white/5 text-slate-300 ring-white/10',
	ruim: 'bg-rose-500/10 text-rose-300 ring-rose-500/25',
	aviso: 'bg-amber-500/10 text-amber-300 ring-amber-500/30',
};

/** "Média", "MEDIA" e "media" são a mesma classe — o enum do contrato é um acordo, não uma garantia. */
const classe = (v: unknown) =>
	String(v ?? '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim()
		.toLowerCase();

/**
 * A confiança do Revisor de Dados, em português.
 *
 * `confianca_geral` é um enum do contrato (`alta`/`media`/`baixa`) e ia para a
 * tela verbatim: o aluno lia "Confiança geral apurada pelo Auditor: media", sem
 * acento, porque aquilo é o valor de máquina e não a palavra. É o mesmo
 * tratamento que `SINAL_BRECHA` e `FORCA_BRECHA` já davam aos enums deles.
 *
 * Valor fora das três classes não vira frase — a linha some. "Confiança geral:
 * <coisa que o modelo inventou>" dá peso de apuração a um campo que ninguém
 * apurou, e é a mesma regra do `_SEM` logo abaixo.
 */
const CONFIANCA: Record<string, string> = {
	alta: 'alta',
	media: 'média',
	baixa: 'baixa',
};

/**
 * As classes que valem — e o que acontece com tudo o que não está aqui.
 *
 * `nao_apurado` (e qualquer valor fora do contrato) cai no par `_SEM`, âmbar,
 * dizendo em letra que não apurou. NUNCA vira selo cinza, traço ou zero: um
 * chip neutro ao lado de um preço é lido como dado conferido, e este dossiê
 * inteiro existe para não fazer isso.
 */
/**
 * O selo da margem tem DOIS estados, e a diferença entre eles é a regra que
 * sustenta a tela inteira.
 *
 * `margem_pct` só existe quando o servidor dividiu preço por custo COM FONTE —
 * é conta de TypeScript sobre número apurado. Sem esse número, "margem alta" é a
 * CLASSIFICAÇÃO que o especialista escreveu: informação útil, mas opinião. As
 * duas coisas não podem usar o mesmo selo verde, porque verde ao lado de "Sobra
 * para você: não apurado" faz o card se contradizer sozinho — e foi exatamente
 * assim que o produto sobre o qual nada tinha sido apurado passou a ganhar o
 * destaque máximo da seção.
 */
const MARGEM: Record<string, { rot: string; tom: Tom }> = {
	alta: { rot: 'margem alta', tom: 'bom' },
	media: { rot: 'margem média', tom: 'ok' },
	baixa: { rot: 'margem apertada', tom: 'ruim' },
};
/**
 * A mesma classe, sem conta por trás: âmbar, e dizendo de quem é a opinião.
 *
 * Ela vem de `margem_declarada`, e NÃO de `margem_faixa`. O servidor separou os
 * dois campos de propósito (`oportunidade.ts`: `margem_faixa: pct !== null ?
 * faixa : 'nao_apurado'`): `margem_faixa` é a faixa DA CONTA e vale
 * `nao_apurado` sempre que não houve conta — exatamente o ramo em que este mapa
 * é consultado. Lendo o campo errado, ele nunca era alcançado: o selo caía
 * sempre em `MARGEM_SEM`, e a classificação que o Curador produziu e que o
 * backend guardou ia para o lixo com os dois lados escrevendo que estava
 * coberto.
 */
const MARGEM_PALPITE: Record<string, { rot: string; tom: Tom }> = {
	alta: { rot: 'margem alta — palpite do time', tom: 'aviso' },
	media: { rot: 'margem média — palpite do time', tom: 'aviso' },
	baixa: { rot: 'margem apertada — palpite do time', tom: 'aviso' },
};
const MARGEM_SEM: { rot: string; tom: Tom } = {
	rot: 'margem não apurada',
	tom: 'aviso',
};

/**
 * Os mesmos cortes do servidor (`oportunidade.ts`: 60% e 35%), repetidos aqui
 * SÓ para o caso de a conta ter vindo e a classe não — aí quem manda é o número,
 * nunca o contrário. Não é um segundo cálculo: `margem_pct` continua sendo o
 * único lugar onde a divisão acontece.
 */
function faixaDoNumero(pct: number): 'alta' | 'media' | 'baixa' {
	if (pct >= 60) return 'alta';
	if (pct >= 35) return 'media';
	return 'baixa';
}

const BRIGA: Record<string, { rot: string; tom: Tom }> = {
	baixa: { rot: 'pouca briga', tom: 'bom' },
	media: { rot: 'briga média', tom: 'ok' },
	alta: { rot: 'muita briga', tom: 'ruim' },
};
const BRIGA_SEM: { rot: string; tom: Tom } = {
	rot: 'briga não apurada',
	tom: 'aviso',
};

const ESFORCO: Record<string, string> = {
	facil: 'fácil de fazer',
	medio: 'dá algum trabalho',
	dificil: 'exige prática',
};

function Selo({
	tom,
	icone: Icon,
	children,
}: {
	tom: Tom;
	icone?: LucideIcon;
	children: ReactNode;
}) {
	return (
		<span
			className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${TOM_SELO[tom]}`}
		>
			{Icon ? <Icon className="h-3 w-3" /> : null}
			{children}
		</span>
	);
}

/**
 * Dinheiro sem centavo quando o valor é redondo.
 *
 * Uma faixa são dois valores lado a lado numa coluna de meio card:
 * "R$ 30,00 – R$ 60,00" quebra a linha, e os quatro zeros não decidem nada.
 * Só some quando o número é inteiro — arredondar preço apurado seria inventar.
 */
const BRL_CHEIO = new Intl.NumberFormat('pt-BR', {
	style: 'currency',
	currency: 'BRL',
	maximumFractionDigits: 0,
});
const reais = (n: number) =>
	Number.isInteger(n) ? BRL_CHEIO.format(n) : BRL.format(n);

/**
 * A faixa de venda em texto.
 *
 * O contrato pede `{min, max}`, e os dois podem vir `null` — ou como
 * `"R$ 64,90"`, que é o desvio que já derrubou esta tela antes (daí
 * `paraNumero`). Um escalar no lugar do objeto vira faixa de um ponto só.
 */
function faixaVenda(v: unknown): string {
	const escalar =
		typeof v === 'number' || typeof v === 'string' ? paraNumero(v) : Number.NaN;
	const o =
		v && typeof v === 'object' && !Array.isArray(v)
			? (v as Record<string, unknown>)
			: {};
	const min = Number.isFinite(escalar) ? escalar : paraNumero(o.min);
	const max = Number.isFinite(escalar) ? escalar : paraNumero(o.max);
	const temMin = Number.isFinite(min) && min > 0;
	const temMax = Number.isFinite(max) && max > 0;
	if (temMin && temMax) {
		return min === max ? reais(min) : `${reais(min)} – ${reais(max)}`;
	}
	if (temMin) return `a partir de ${reais(min)}`;
	if (temMax) return `até ${reais(max)}`;
	return '';
}

/**
 * A REGRA DO REALCE, num lugar só.
 *
 * O card a usa para se pintar e a seção a usa para explicar o que o verde
 * significa. Escrita duas vezes, as duas discordariam no primeiro ajuste — e uma
 * legenda que descreve um critério diferente do aplicado é pior que legenda
 * nenhuma.
 *
 * `margem_pct` numérica é condição de entrada: sem a conta do servidor, "margem
 * alta" e "pouca briga" são as duas classificações do modelo, e o realce estaria
 * apontando para o produto sobre o qual nada foi apurado.
 */
function ehDestaque(p: Record<string, unknown>): boolean {
	const sobra = paraNumero(p.margem_pct);
	if (!Number.isFinite(sobra)) return false;
	const margem = MARGEM[faixaDoNumero(sobra)] ?? MARGEM_SEM;
	const briga = BRIGA[classe(p.concorrencia)] ?? BRIGA_SEM;
	return margem.tom === 'bom' && briga.tom === 'bom';
}

/**
 * Um produto por onde começar.
 *
 * O card responde, na ordem, o que o aluno perguntaria em voz alta: o que é ·
 * por que agora · quanto cobra · quanto sobra · quanta briga tem · qual o
 * primeiro passo. Nada aqui exige que ele cruze duas seções de cabeça.
 */
function CardOportunidade({
	p,
	pos,
	citadas,
}: {
	p: Record<string, unknown>;
	pos: number;
	citadas: Set<string>;
}) {
	/** Ver `Foto.onErro` e o mesmo estado em `CardProduto`. */
	const [fotoMorreu, setFotoMorreu] = useState(false);
	const nome = frase(p.nome, 120);
	const briga = BRIGA[classe(p.concorrencia)] ?? BRIGA_SEM;
	const esforco = ESFORCO[classe(p.esforco)];
	const venda = faixaVenda(p.preco_venda_brl);
	const custo = paraNumero(p.custo_estimado_brl);
	const temCusto = Number.isFinite(custo) && custo > 0;
	const sobra = paraNumero(p.margem_pct);
	const temSobra = Number.isFinite(sobra);
	/**
	 * Com conta, a conta manda; sem conta, o selo assume que é palpite.
	 *
	 * O `?? p.margem_faixa` é para dossiê gerado ANTES de `margem_declarada`
	 * existir: lá `margem_faixa` ainda carregava a classe do modelo, e é a mesma
	 * informação sob outro nome. Em payload novo esse ramo já recebeu
	 * `nao_apurado` do servidor, então o fallback nunca muda o resultado — só
	 * evita que o histórico antigo perca o selo.
	 */
	const margem = temSobra
		? (MARGEM[faixaDoNumero(sobra)] ?? MARGEM_SEM)
		: (MARGEM_PALPITE[classe(p.margem_declarada ?? p.margem_faixa)] ??
			MARGEM_SEM);
	/**
	 * A foto e o link vêm da mesma prova, e o link continua sendo `url_exemplo`
	 * já conferido pelo servidor (`oportunidade.ts` zera o que não foi citado).
	 * Passar pelo mesmo funil das outras seções não muda o resultado aqui — muda
	 * quem responde pela regra: ela deixa de depender de o servidor lembrar.
	 */
	const { foto, pagina: url } = fotoDoItem(p, citadas);
	const temFoto = Boolean(foto) && !fotoMorreu;
	// Prosa do modelo: `frase` e não `String()`. Lista virando string e objeto no
	// lugar de frase já derrubaram esta tela num dossiê pago (ver `comoLista`).
	const porQueAgora = frase(p.por_que_agora);
	const porQuePoucaBriga = frase(p.por_que_pouca_concorrencia);
	const passo = frase(p.primeiro_passo);
	const linhas: [string, string][] = [
		['Para quem', frase(p.publico, 200)],
		['Material', frase(p.material, 200)],
		['Onde vender', frase(p.onde_vender, 200)],
	];

	/**
	 * A combinação que o aluno veio buscar: sobra dinheiro E tem pouca gente
	 * disputando. É a única que ganha borda e brilho — e agora ela EXIGE A CONTA.
	 *
	 * Foi reproduzido por render: um produto com preço, custo e 45% medidos saía
	 * como card comum, enquanto o produto ao lado — sem preço, sem custo, "margem
	 * alta" declarada pelo modelo — ganhava o realce esmeralda e, dentro dele,
	 * "Você cobra: não apurado / Sobra para você: não apurado". O realce é lido
	 * como "comece por este": ele não pode apontar para o produto sobre o qual
	 * nada foi apurado, ainda mais quando o backend o colocou depois de propósito.
	 */
	const destaque = ehDestaque(p);

	return (
		<motion.article
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25, delay: Math.min(pos, 12) * 0.04 }}
			className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-colors ${
				destaque
					? 'border-emerald-500/40 bg-emerald-500/[0.045] shadow-[0_18px_44px_-26px_rgba(16,185,129,0.65)]'
					: 'border-white/8 bg-white/[0.02] hover:border-white/20'
			}`}
		>
			{/* ═══ SEM FOTO, SEM MOLDURA ═══
			    Medido em treze runs gravados: `produtos_para_comecar` veio com foto
			    em ZERO deles — o servidor não empresta ao Curador a `og:image` de
			    página que ele não provou ter aberto. Ou seja, este retângulo 16:10
			    com um ícone de pacote cinza no meio era o estado NORMAL do card, em
			    todo dossiê de mercado, e é a "caixa cinza com ícone de pacote" que o
			    dono do produto leu como imagem faltando. Com foto (um dia haverá) a
			    vitrine volta inteira; sem foto o número da posição vira uma pastilha
			    ao lado do nome e o card começa pelo que ele tem de melhor, que é o
			    nome do produto. */}
			{temFoto ? (
				<div className="relative aspect-[16/10] w-full overflow-hidden bg-white/[0.03]">
					<Foto
						url={foto}
						pagina={url}
						onErro={() => setFotoMorreu(true)}
						className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
					/>
					<span className="pointer-events-none absolute left-2.5 top-2.5 rounded-md bg-black/55 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-white/70 backdrop-blur-sm">
						{String(pos).padStart(2, '0')}
					</span>
				</div>
			) : null}

			<div className="flex flex-1 flex-col gap-3 p-4">
				<div>
					<h4 className="flex items-baseline gap-2 font-display text-[15px] font-bold leading-snug text-slate-50">
						{temFoto ? null : (
							<span className="shrink-0 font-mono text-[11px] font-normal tabular-nums text-slate-600">
								{String(pos).padStart(2, '0')}
							</span>
						)}
						<span className="min-w-0">{nome}</span>
					</h4>
					<div className="mt-2 flex flex-wrap items-center gap-1.5">
						<Selo tom={margem.tom} icone={Wallet}>
							{margem.rot}
						</Selo>
						<Selo tom={briga.tom} icone={Swords}>
							{briga.rot}
						</Selo>
						{esforco ? (
							<span className="text-[11px] text-slate-500">· {esforco}</span>
						) : null}
					</div>
				</div>

				{porQueAgora ? (
					<p className="text-[12.5px] leading-snug text-slate-400">
						{porQueAgora}
					</p>
				) : null}

				<div className="grid grid-cols-2 gap-2">
					<div className="rounded-xl border border-white/8 bg-white/[0.02] p-2.5">
						<p className="text-[10px] uppercase tracking-wider text-slate-500">
							Você cobra
						</p>
						{venda ? (
							<p className="mt-1 font-mono text-[15px] font-bold leading-tight tabular-nums text-slate-50">
								{venda}
							</p>
						) : (
							<p className="mt-1 text-[12px] font-semibold leading-tight text-amber-300">
								não apurado
							</p>
						)}
						{/* Quando a sobra saiu, o servidor TINHA os dois números: dizer
						    "custo sem fonte" logo ao lado de uma porcentagem calculada
						    faria o card se contradizer sozinho. */}
						{temCusto || !temSobra ? (
							<p className="mt-1 text-[11px] leading-snug text-slate-500">
								{temCusto
									? `material ≈ ${reais(custo)}`
									: 'custo do material sem fonte'}
							</p>
						) : null}
					</div>

					{/* A célula que mais tenta virar mentira: sem os dois números com
					    fonte, ela diz que não apurou — e fica âmbar para que ninguém a
					    leia de relance como se fosse porcentagem. */}
					<div
						className={`rounded-xl border p-2.5 ${
							temSobra
								? 'border-white/8 bg-white/[0.02]'
								: 'border-amber-500/25 bg-amber-500/[0.05]'
						}`}
					>
						<p className="text-[10px] uppercase tracking-wider text-slate-500">
							Sobra para você
						</p>
						{temSobra ? (
							<p
								className={`mt-1 font-mono text-[15px] font-bold leading-tight tabular-nums ${
									sobra > 0 ? 'text-emerald-300' : 'text-rose-300'
								}`}
							>
								{Math.round(sobra)}%
							</p>
						) : (
							<p className="mt-1 text-[12px] font-semibold leading-tight text-amber-300">
								não apurado
							</p>
						)}
						<p className="mt-1 text-[11px] leading-snug text-slate-500">
							{temSobra
								? 'calculado do preço e do custo achados'
								: 'faltou preço ou custo com fonte'}
						</p>
					</div>
				</div>

				{/* "Pouca briga" sem o motivo é opinião. Com o motivo do lado, o aluno
				    consegue conferir se a brecha continua aberta quando for vender. */}
				{briga.tom === 'bom' && porQuePoucaBriga ? (
					<p className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-2.5 text-[12px] leading-snug text-emerald-200/90">
						{porQuePoucaBriga}
					</p>
				) : null}

				<dl className="space-y-1 text-[12px] leading-snug">
					{linhas.map(([rot, val]) =>
						val ? (
							<div key={rot} className="flex gap-2">
								<dt className="shrink-0 text-slate-600">{rot}:</dt>
								<dd className="min-w-0 text-slate-400">{val}</dd>
							</div>
						) : null,
					)}
				</dl>

				{url ? (
					<a
						href={url}
						target="_blank"
						rel="noopener noreferrer"
						className="mt-auto flex items-center gap-1 pt-1 text-[11px] text-slate-500 transition-colors hover:text-[var(--screen-accent)]"
					>
						ver exemplo em {dominio(url)}
						<ExternalLink className="h-3 w-3" />
					</a>
				) : null}
			</div>

			{/* O primeiro passo fica no rodapé, atravessando o card inteiro: é a única
			    linha que pede AÇÃO, e ela não pode disputar espaço com o preço. */}
			{passo ? (
				<div className="flex items-start gap-2 border-t border-white/8 bg-white/[0.03] p-3.5">
					<Rocket
						className="mt-0.5 h-3.5 w-3.5 shrink-0"
						style={{ color: 'var(--screen-accent)' }}
					/>
					<p className="text-[12px] leading-snug text-slate-300">
						<span className="text-slate-500">Primeiro passo: </span>
						{passo}
					</p>
				</div>
			) : null}
		</motion.article>
	);
}

function ComecePorEstes({
	itens,
	observacao,
	citadas,
}: {
	itens: Record<string, unknown>[];
	observacao: string;
	citadas: Set<string>;
}) {
	// A legenda do verde só aparece quando existe verde na tela: explicar um
	// realce que não está ali manda o aluno procurar o que não tem.
	const destacados = itens.filter(ehDestaque).length;
	return (
		<section className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
			<div className="mb-4">
				<h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
					O que dá para fabricar e vender já
				</h3>
				<p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-slate-500">
					Escolhidos pelo time entre tudo o que a pesquisa achou, por dois
					critérios: o que deixa margem de verdade e o que ainda tem pouca gente
					disputando. Na ordem — o primeiro é a melhor combinação dos dois.
				</p>
				{destacados > 0 ? (
					<p className="mt-1.5 max-w-3xl text-[12px] leading-relaxed text-emerald-300/80">
						{destacados === 1
							? 'Em verde, o produto que tem'
							: `Em verde, os ${destacados} produtos que têm`}{' '}
						margem CALCULADA a partir de preço e custo com fonte — e ainda pouca
						briga. Nos outros, ou a conta não fechou, ou já tem mais gente
						disputando.
					</p>
				) : null}
			</div>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{itens.slice(0, 12).map((p, i) => (
					<CardOportunidade
						// `frase` e não `String`: nome vindo como objeto gerava a chave
						// "[object Object]-0" para todos, e duas chaves iguais fazem o
						// React reaproveitar o card errado.
						key={`${frase(p.nome, 60)}-${i}`}
						p={p}
						pos={i + 1}
						citadas={citadas}
					/>
				))}
			</div>
			{observacao ? (
				<p className="mt-4 text-[12px] leading-relaxed text-slate-500">
					{observacao}
				</p>
			) : null}
		</section>
	);
}

/**
 * O canal por onde começar, para o painel de números.
 *
 * O Especialista em Marketplaces crava um em `comecar_por` — mas ele é
 * `modo: 'profundo'` no roster (come duas das buscas do rápido), então nas duas
 * combinações RÁPIDAS ele não existe. Quem responde a mesma pergunta nas QUATRO
 * é o Estrategista, em `onde_comecar.canal`: ele roda em todas, é essencial e é
 * de síntese.
 *
 * O fallback anterior lia `jsonDe('canais')` — chave de um especialista MORTO,
 * que virou `marketplaces` faz duas rodadas. Resultado medido: em
 * `mercado+rápido` a célula "Comece por" simplesmente sumia do painel, e o aluno
 * que paga 2 voxxys perdia a resposta de "por onde eu começo a vender" que o
 * time já tinha escrito e cobrado. (A tabela "Onde vender", com a comparação de
 * comissão, é entrega do profundo porque o ROSTER o diz — nas duas combinações
 * rápidas o Especialista em Marketplaces não roda e não devolve json, e o bloco
 * dela some sozinho. A tela não decide isso; ver `RamoECanais`.)
 *
 * A poda existe porque o campo é livre e o modelo às vezes escreve
 * "Shopee — comissão menor". Corta em travessão, dois-pontos e no hífen COM
 * espaço dos dois lados; um hífen colado é parte do nome ("e-commerce local").
 */
function canalDeEntrada(
	jsonDe: (k: string) => Record<string, unknown> | null,
): string {
	const mkt = jsonDe('marketplaces');
	/**
	 * `frase` na PRIMEIRA opção também, e não só na segunda: o teste antigo era
	 * `typeof === 'string' && .trim()`, e a string `"null"` passa nos dois. Ela
	 * ganhava do Estrategista (que talvez tivesse a resposta certa) e ia parar na
	 * célula "Comece por" do painel dos números, em corpo grande, ao lado de
	 * "canal recomendado pelo time". Reproduzido por render com payload hostil.
	 * Com o funil, a ausência escrita vale zero e o fallback assume. Ver `frase`.
	 */
	const bruto =
		frase(mkt?.comecar_por, 60) ||
		(() => {
			const oc = jsonDe('estrategista')?.onde_comecar;
			// O contrato pede `{canal, por_que}`; escalar acontece e vale igual.
			return oc && typeof oc === 'object' && !Array.isArray(oc)
				? frase((oc as Record<string, unknown>).canal, 60)
				: frase(oc, 60);
		})();
	/**
	 * O corte em 28 é de largura de célula, não de sentido — e por isso a sobra
	 * de pontuação sai junto. Sem isso o painel imprimiu, em corpo 18 e no
	 * caminho já aprovado do Rápido, `Venda direta para empresas (` — o parêntese
	 * aberto de "(RH, marketing)" ficou pendurado no fim da célula "Comece por",
	 * como se a frase tivesse sido interrompida no meio. Ver `PainelNumeros`.
	 */
	return (bruto.split(/[—–:]|\s-\s/)[0] ?? '')
		.trim()
		.slice(0, 28)
		.replace(/[-\s,;.([{/+&]+$/, '');
}

/* ──────────── QUANTO CUSTA O MATERIAL (Analista de Margem) ──────────── */

/**
 * O Analista de Margem tem um lugar na tela.
 *
 * Ele roda nos DOIS escopos e nos dois modos, é cobrado como todo mundo e
 * aparece trabalhando na sala de guerra — e até aqui o que ele apurava só
 * alimentava o Curador por dentro: o aluno via dez profissionais e lia o
 * resultado de oito. O custo do insumo é, junto com o preço de venda, o número
 * que decide se vale a pena fabricar. Ele merece a mesma vitrine que a faixa de
 * mercado, e explica de onde saiu (ou por que faltou) a "sobra para você" dos
 * cards lá em cima.
 *
 * A regra aqui é a MAIS ESTRITA da tela, em duas cláusulas que só apertam:
 *
 *   1. PISO, para todo preço de insumo — ele só vira número quando o link que o
 *      especialista escreveu está entre as páginas que este dossiê registrou.
 *      Sem isso o item continua na lista (saber que a embalagem entra no custo é
 *      informação), mas sem número e sem link.
 *   2. TETO, para o custo por peça — que é o ÚNICO número desta tela que o
 *      servidor também julga, porque é dele que sai a "sobra para você" dos
 *      cards lá em cima. Onde o servidor já se pronunciou, a tela repete o
 *      veredito dele em vez de julgar de novo por um critério mais frouxo: era
 *      assim que a mesma página saía reprovada no card ("Sobra para você: não
 *      apurado") e aprovada aqui ("R$ 79,90", com link), na mesma rolagem.
 */
function CustoDoMaterial({
	a,
	citadas,
	usadosNaConta,
	titulo = 'Quanto custa o material',
	intro = 'O outro lado da conta da margem: o que o time achou de preço de insumo em loja e fornecedor, com o link de cada um.',
}: {
	a: Record<string, unknown> | null;
	citadas: Set<string>;
	/**
	 * As páginas que ESTE dossiê usou como custo na conta da sobra impressa nos
	 * cards — ou `null` quando ele não imprimiu card nenhum. Ver `custosUsados`
	 * em `Dossie`, que é onde o conjunto é montado e onde a fronteira está
	 * explicada.
	 */
	usadosNaConta: Set<string> | null;
	/**
	 * O bloco passou a servir DOIS especialistas, e por isso ganhou cabeçalho
	 * parametrizado.
	 *
	 * O Analista de Margem (`margem`) procura o custo do insumo do ramo em
	 * abstrato, na onda 1. O Especialista em Custo dos Produtos
	 * (`custo_dos_produtos`) é da onda 2 e procura o custo DAQUELES produtos que a
	 * onda 1 achou — mesmo contrato de saída (`insumos`, `custo_peca_brl`), mesma
	 * proibição de dividir, mesma regra de conferência. Um bloco só para os dois
	 * seria mentira de rótulo ("Quanto custa o material" para uma lista que fala
	 * de produtos específicos); dois blocos com código duplicado envelheceriam em
	 * direções diferentes. Fica o mesmo componente, com o cabeçalho de cada um.
	 *
	 * O TETO (`usadosNaConta`) vale igual para os dois, e de propósito: hoje o
	 * servidor calcula a sobra dos cards a partir do Analista de Margem
	 * (`CHAVE_MARGEM` em ai-research-team.ts). Se amanhã ele passar a usar o
	 * custo da onda 2, o teto continua certo sem tocar aqui — quem não sustentou a
	 * conta impressa nos cards fica sem número, seja qual for o especialista.
	 */
	titulo?: string;
	intro?: string;
}) {
	const j = (a?.json ?? null) as Record<string, unknown> | null;
	if (!j) return null;

	/**
	 * Especialista que rodou sem abrir NENHUMA página.
	 *
	 * Quando o teto de buscas do modo o deixa cego, ele não fica em silêncio:
	 * foi reproduzido ao vivo que 2 de 2 chamadas sem busca devolveram loja,
	 * preço e URL inventados. Nesse estado, nenhum número dele pode virar fato na
	 * tela — nem o link, que também é escrito pelo modelo.
	 *
	 * Vale IGUAL para quem veio do cache, e isso mudou: o payload do cache passou
	 * a gravar `n_fontes` por especialista, e um pesquisador sem citação não entra
	 * mais nele (`ok && compartilhavel && (!pesquisador || fontes.length > 0)`).
	 * Zero aqui é "não sei quantas páginas ele abriu" — linha antiga, gravada
	 * antes desse campo existir —, e "não sei" cai para o lado seguro, como o
	 * próprio bloco do servidor documenta. Essas linhas expiram em 7 dias.
	 */
	const cego = Number(a?.n_fontes ?? 0) === 0;
	const doCache = a?.do_cache === true;

	/**
	 * DE QUEM É ESTE BOX — lido da ficha do profissional, nunca chumbado.
	 *
	 * O cabeçalho já era parametrizado para servir dois especialistas, mas as três
	 * frases de estado continuavam dizendo "o Analista de Margem". No Profundo os
	 * dois rodam: o box do Analista de Custo dos Produtos acusava de ter falhado um
	 * profissional que não é ele — e que tem box PRÓPRIO dois dedos acima, podendo
	 * estar mostrando R$ e link normalmente. Acusar o inocente é pior que não
	 * explicar.
	 *
	 * O nome vem de `output.agentes[].nome`, que é o mesmo `title` do registro dele
	 * na coleção — editável pela Fábrica sem deploy, como todo o resto do time.
	 */
	const nome = frase(a?.nome, 60);
	const quem = nome ? `o ${nome}` : 'o especialista deste levantamento';
	const Quem = quem.charAt(0).toUpperCase() + quem.slice(1);

	const custoPeca = paraNumero(j.custo_peca_brl);
	const temCustoPecaEscrito = Number.isFinite(custoPeca) && custoPeca > 0;
	/** O mesmo arredondamento que o servidor tolera (`mesmoValor`, o Curador COPIA). */
	const mesmoValor = (x: number, y: number) =>
		Math.abs(x - y) <= Math.max(0.01, y * 0.02);

	const insumos = comoObjetos(j.insumos)
		.map((i) => {
			const link =
				typeof i.url === 'string' && /^https?:\/\//.test(i.url) ? i.url : '';
			/**
			 * A PÁGINA, e não a contagem nem a idade, é o que sustenta o preço.
			 *
			 * `do_cache` nunca foi prova de apuração, e hoje não é nem indício:
			 * quem volta do cache carrega a contagem real de páginas de quando
			 * rodou. O que resta conferir é a PÁGINA — se o link que o modelo
			 * escreveu está entre as que este dossiê registrou. O cache não perde
			 * nada legítimo por isso: as fontes do run reaproveitado entram na união
			 * de `output.fontes`, que é a mesma lista impressa em "Todas as fontes".
			 */
			const naUniao = !!link && citadas.has(chaveDeUrl(link));
			const preco = paraNumero(i.preco_brl);
			const rende = paraNumero(i.rende_pecas);
			/**
			 * Este insumo é candidato a SER o custo por peça?
			 *
			 * É a condição que o servidor usa em `custoComFonte`: o custo por peça
			 * só vale quando ele é o preço de um insumo que tem página — nunca uma
			 * conta que o Analista fez de cabeça. Insumo com preço diferente
			 * (embalagem, verniz) nunca foi candidato, e o servidor nunca o julgou.
			 */
			const candidato =
				temCustoPecaEscrito &&
				Number.isFinite(preco) &&
				mesmoValor(custoPeca, preco);
			/**
			 * ONDE O SERVIDOR JÁ SE PRONUNCIOU, A TELA REPETE — NÃO JULGA DE NOVO.
			 *
			 * Aqui morava a divergência: o comentário antigo dizia que esta
			 * conferência era "o MESMO teste" do servidor, e não era. O servidor
			 * confere o custo por peça contra as citações DO PRÓPRIO Analista de
			 * Margem quando ele rodou agora (`conjuntoDeUrls(resMargem.fontes)`), e
			 * só cai na união do run quando o custo vem do cache. A tela usa sempre
			 * a união, que é um conjunto MAIOR — ou seja, o lado frouxo. Reproduzido:
			 * o Analista cita um blog, escreve um insumo cuja página OUTRO
			 * especialista citou, o servidor devolve `null` e o card sai "Sobra para
			 * você: não apurado" — e este bloco estampava "R$ 79,90" com link, na
			 * mesma rolagem.
			 *
			 * O conjunto exato do servidor não está no payload (`output.fontes` é a
			 * união, e por agente só chega a CONTAGEM `n_fontes`), então a tela não
			 * tem como refazer o teste. O que ela tem é o RESULTADO dele: quando o
			 * dossiê imprimiu cards com sobra, o custo que sustentou aquela conta
			 * chega em `custo_fonte_url`. Então, para os candidatos a custo por peça
			 * — os únicos que o servidor julga —, a tela exige a MESMA página.
			 * Onde não há card nenhum (escopo produto de hoje, ou Curador sem lista),
			 * o servidor não afirma nada na tela, não há o que contradizer, e vale a
			 * conferência que a tela consegue provar sozinha: a página está entre as
			 * fontes deste dossiê.
			 */
			const usadoNaConta =
				usadosNaConta === null ||
				!candidato ||
				(!!link && usadosNaConta.has(chaveDeUrl(link)));
			const conferido = naUniao && usadoNaConta;
			const temPreco =
				!cego && conferido && Number.isFinite(preco) && preco > 0;
			const temRende = Number.isFinite(rende) && rende > 0;
			return {
				item: frase(i.item, 120),
				/**
				 * De QUAL produto é esta peça em branco.
				 *
				 * Só o Especialista em Custo dos Produtos preenche: ele é da onda 2 e
				 * sabe o nome dos produtos que a onda 1 achou, então "copo térmico
				 * 500 ml" e "tábua de bambu" viram custos separados na mesma lista. No
				 * Analista de Margem o campo não existe e a linha some sozinha — que é
				 * o certo, porque lá o insumo é do ramo, não de uma peça.
				 */
				produto: frase(i.produto ?? i.para_produto ?? i.aplica_em, 90),
				unidade: frase(i.unidade_compra, 90),
				loja: frase(i.loja, 60),
				link: cego || !conferido ? '' : link,
				preco: temPreco ? preco : null,
				rende: temRende ? Math.round(rende) : null,
				candidato,
				/** Passou na união e caiu só na conferência contra a conta do dossiê. */
				barradoPelaConta: !cego && candidato && naUniao && !usadoNaConta,
			};
		})
		.filter((i) => i.item);

	const comFonte = insumos.filter((i) => i.preco !== null);
	/**
	 * Custo por peça só é NÚMERO quando ele É o preço de um insumo com página
	 * conferida — a condição 3 de `custoComFonte` no servidor. Sem ela o número
	 * mais visível do bloco seria uma conta que ninguém consegue refazer, e era
	 * por ela que a tela aprovava soma e divisão que o servidor recusa.
	 */
	const sustentaCustoPeca = insumos.some(
		(i) => i.candidato && i.preco !== null,
	);
	const temCustoPeca = temCustoPecaEscrito && sustentaCustoPeca;
	const oQueEncarece = frase(j.o_que_encarece, 400);
	const observacao = frase(j.observacao, 400);

	/**
	 * Por que o bloco está sem número — dito, e não deixado no ar.
	 *
	 * Um bloco chamado "Quanto custa o material" com dez itens marcados "sem
	 * preço com fonte" e um "não apurado" no canto parece ferramenta quebrada.
	 * São motivos diferentes e o aluno tem direito a saber qual é o dele: o
	 * especialista não abriu página nenhuma; o custo por peça não é o que o
	 * dossiê usou na conta da sobra; nenhuma das páginas está entre as fontes; ou
	 * o custo por peça é conta dele, não preço de página.
	 */
	const barrados = insumos.filter((i) => i.barradoPelaConta).length;
	const motivoSemNumero = cego
		? doCache
			? `A pesquisa reaproveitada não registrou nenhuma página para ${quem}. Sem saber que página ele leu, nenhum preço dele vira número aqui — é também o motivo de a sobra dos produtos acima aparecer como não apurada.`
			: `${Quem} não conseguiu abrir nenhuma página nesta execução. O que ele escreveu de preço não está conferido e por isso não vira número aqui — é também o motivo de a sobra dos produtos acima aparecer como não apurada.`
		: barrados > 0
			? `A sobra dos produtos acima foi calculada sem este custo: a página que ${quem} apontou para ele não é a que sustentou aquela conta. Um número só, um veredito só — por isso ele fica aqui sem valor em vez de contradizer os cards.`
			: insumos.length > 0 && comFonte.length === 0
				? 'Nenhum destes preços veio de uma página que este dossiê registrou como fonte, então nenhum deles vira número aqui — é a mesma regra que deixa a sobra dos produtos acima como não apurada. Os links conferidos estão todos em "Todas as fontes".'
				: temCustoPecaEscrito && !temCustoPeca
					? `O custo por peça que ${quem} escreveu não é o preço de nenhuma destas páginas — é conta dele, e conta não tem fonte. Os preços de insumo que têm página continuam abaixo, com o link de cada um.`
					: '';

	if (!insumos.length && !temCustoPeca && !oQueEncarece && !observacao) {
		return null;
	}

	return (
		<section className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
			<div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
				<div>
					<h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
						{titulo}
					</h3>
					<p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-slate-500">
						{intro}
					</p>
				</div>
				<div
					className={`rounded-xl border px-3 py-2 ${
						temCustoPeca
							? 'border-white/8 bg-white/[0.02]'
							: 'border-amber-500/25 bg-amber-500/[0.05]'
					}`}
				>
					<p className="text-[10px] uppercase tracking-wider text-slate-500">
						Material por peça
					</p>
					{temCustoPeca ? (
						<p className="mt-0.5 font-mono text-[17px] font-bold tabular-nums text-slate-50">
							{reais(custoPeca)}
						</p>
					) : (
						<p className="mt-0.5 text-[12px] font-semibold text-amber-300">
							não apurado
						</p>
					)}
				</div>
			</div>

			{motivoSemNumero ? (
				<p className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-[12.5px] leading-relaxed text-amber-200/90">
					<AlertTriangle className="mr-1.5 inline h-3.5 w-3.5 align-[-2px]" />
					{motivoSemNumero}
				</p>
			) : null}

			{insumos.length > 0 ? (
				<ul className="grid gap-2 sm:grid-cols-2">
					{insumos.slice(0, 10).map((i, n) => (
						<li
							key={`${i.item}-${n}`}
							className="rounded-xl border border-white/8 bg-white/[0.02] p-3"
						>
							{i.produto ? (
								<p className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">
									para {i.produto}
								</p>
							) : null}
							<div className="flex items-baseline justify-between gap-2">
								<span className="min-w-0 text-[13px] font-semibold leading-snug text-slate-100">
									{i.item}
								</span>
								{i.preco !== null ? (
									<span className="shrink-0 font-mono text-[13px] font-bold tabular-nums text-slate-50">
										{reais(i.preco)}
									</span>
								) : (
									<span className="shrink-0 text-[11px] font-semibold text-amber-300">
										sem preço com fonte
									</span>
								)}
							</div>
							{i.unidade ? (
								<p className="mt-1 text-[11.5px] leading-snug text-slate-500">
									vendido em {i.unidade}
									{i.rende !== null
										? ` · rende ${i.rende} peça${i.rende === 1 ? '' : 's'}`
										: ''}
								</p>
							) : i.rende !== null ? (
								<p className="mt-1 text-[11.5px] leading-snug text-slate-500">
									rende {i.rende} peça{i.rende === 1 ? '' : 's'}
								</p>
							) : null}
							{i.link ? (
								<a
									href={i.link}
									target="_blank"
									rel="noopener noreferrer"
									className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 transition-colors hover:text-[var(--screen-accent)]"
								>
									{i.loja || dominio(i.link)}
									<ExternalLink className="h-3 w-3" />
								</a>
							) : null}
						</li>
					))}
				</ul>
			) : null}

			{oQueEncarece ? (
				<p className="mt-3 text-[12.5px] leading-relaxed text-slate-400">
					<span className="text-slate-600">O que encarece: </span>
					{oQueEncarece}
				</p>
			) : null}
			{observacao ? (
				<p className="mt-2 text-[12px] leading-relaxed text-slate-500">
					{observacao}
				</p>
			) : null}
		</section>
	);
}

/* ═══════════════ OS BOXES DA BUSCA PROFUNDA ═══════════════
 *
 * Nove especialistas novos entraram no time do Profundo, e cada um chega aqui
 * com UM ponto de render próprio. Não é gentileza de layout: especialista que
 * roda, gasta busca, é cobrado do aluno e aparece trabalhando na sala de guerra
 * sem ter uma linha na tela é dinheiro do aluno jogado fora — o defeito que já
 * reprovou três rodadas desta feature, em três eixos diferentes (por modo, por
 * escopo, por caminho padrão).
 *
 * Por isso TODA seção daqui para baixo é decidida pela MESMA pergunta: este
 * especialista respondeu alguma coisa? Nunca por `modo`, nunca por `tipo`. Se
 * amanhã alguém mudar `modo`/`escopo` de um deles pela Fábrica — que é dado
 * editável sem deploy —, a tela continua certa sozinha.
 *
 * As quatro regras de honestidade da tela valem inteiras aqui:
 *
 *   1. Número só existe com a PÁGINA que o sustenta, e a página precisa estar
 *      entre as que este dossiê registrou (`output.fontes`). Estes boxes são
 *      prova NOVA — prova nova nasce conferida ou não nasce.
 *   2. Item sem página continua na lista (saber que o time achou aquele
 *      concorrente é informação), mas sem número e dito como leitura do
 *      especialista, em âmbar. É a mesma regra do Caçador de Brechas.
 *   3. Seção sem dado não é montada — nem entra no índice.
 *   4. A palavra "agente" não aparece: são profissionais e especialistas.
 */

/**
 * A LISTA principal de um especialista, sem depender do nome exato do campo.
 *
 * O contrato de saída de cada profissional é DADO — mora no `saida` do registro
 * dele na coleção `agentes`, e é editável pela Fábrica sem deploy. Amarrar o
 * box a um único nome de campo é o mesmo defeito de amarrá-lo ao modo: alguém
 * renomeia `concorrentes` para `lojas` numa tarde e o especialista continua
 * sendo cobrado, continua aparecendo na sala de guerra, e some da tela em
 * silêncio.
 *
 * Por isso: primeiro os nomes que o contrato usa, na ordem; depois, se nenhum
 * casar, a MAIOR lista de objetos que o JSON tiver. O último recurso erra para
 * o lado de mostrar demais, que é o lado certo aqui — um box com o campo errado
 * é um bug visível em dez segundos; um box que não existe é invisível para
 * sempre.
 *
 * Objeto solto no lugar da lista vira lista de um: o modelo devolve
 * `{"perfil":{...}}` quando só achou um, e um único concorrente é resposta.
 */
function listaDe(
	j: Record<string, unknown> | null,
	...campos: string[]
): Record<string, unknown>[] {
	if (!j) return [];
	for (const c of campos) {
		const lista = comoObjetos(j[c]);
		if (lista.length) return lista;
		const um = j[c];
		if (um && typeof um === 'object' && !Array.isArray(um)) {
			return [um as Record<string, unknown>];
		}
	}
	let melhor: Record<string, unknown>[] = [];
	for (const v of Object.values(j)) {
		const lista = comoObjetos(v);
		if (lista.length > melhor.length) melhor = lista;
	}
	return melhor;
}

/**
 * Só o que É string numa lista que deveria ser de strings.
 *
 * A diferença para `comoTextos` é o que fazer com OBJETO no meio da lista:
 * `comoTextos` aproveita a prosa de dentro dele (via `frase`), e aqui o item é
 * DESCARTADO. É deliberado e vale para o caso que chega de verdade — o modelo
 * devolve `palavras_chave: [{termo:"…", volume:"…"}]` num campo que o contrato
 * pede como lista de frases, e emendar "termo — volume" numa chip de busca
 * inventa um termo que ninguém procura. Quem sabe ler o objeto inteiro, com
 * cada campo no seu lugar, é `listaDe`.
 */
function apenasTextos(v: unknown): string[] {
	return comoLista(v)
		.filter((x): x is string => typeof x === 'string')
		.map((s) => s.trim())
		.filter(Boolean);
}

/**
 * AUSÊNCIA ESCRITA — as formas em que "não sei" chega como se fosse texto.
 *
 * `nao_apurado` é vocabulário do PROTOCOLO interno: `margem_faixa` e
 * `concorrencia` nascem com ele no servidor (`oportunidade.ts`), e a onda 2
 * recebe o digest com o JSON CRU da onda 1, onde o token está escrito. O modelo
 * copia — e o token saía IMPRESSO na tela paga, dentro do Calendário do Ano
 * ("Comece a produzir: nao_apurado") e do cartão do fornecedor ("Pedido mínimo:
 * nao_apurado"). O aluno lia um identificador de máquina no meio do dossiê.
 *
 * Casa a frase INTEIRA, nunca por prefixo, e é isso que separa esta guarda de um
 * filtro cego: "não achei preço nesta página, mas o catálogo cita R$ 12" é
 * resposta e continua na tela. Some só o campo cujo conteúdo É a ausência.
 *
 * E some DE VEZ: não vira traço, não vira zero, não vira selo. Traço e zero são
 * afirmações, e a regra desta tela é que nada sem fonte apareça como fato.
 */
const SEM_DADO =
	/^(nao[\s_-]*(apurad\w*|informad\w*|identificad\w*|encontrad\w*|especificad\w*|declarad\w*|divulgad\w*|disponivel|consta|se aplica|aplicavel|ha dados?)|indisponivel|indefinid\w*|desconhecid\w*|sem[\s_-]*(informacao|informacoes|dados?|resposta|registro)|n\/?a|null|undefined|none|[-–—?]+)[.!]*$/;

/** O texto é só a ausência escrita por extenso? Ver `SEM_DADO`. */
function ausencia(t: unknown): boolean {
	const s = classe(t);
	return s.length > 0 && SEM_DADO.test(s);
}

/**
 * LINGUAGEM DE MÁQUINA DENTRO DE UMA FRASE que por fora é português.
 *
 * `SEM_DADO` resolve o campo cujo conteúdo É o token ("Pedido mínimo:
 * nao_apurado"). Não resolve — e nunca resolveu — o outro caso, que é o que o
 * aluno mais lê: o especialista escrevendo um PARÁGRAFO em português e citando
 * dentro dele o nome do campo do contrato. Medido nos oito runs frios gravados,
 * um por combinação e por rodada:
 *
 *   · rápido+mercado  "Por isso, `custo_estimado_brl` está `null` em todos os
 *                      produtos."            ← na etapa 01, a primeira que se lê
 *   · profundo+produto "Onde o campo está null, a informação não estava
 *                      disponível na página."
 *   · profundo+produto "Datas como 'Formatura' não foram listadas no JSON pois
 *                      as fontes não forneceram prazos."
 *   · profundo+mercado "Faltou a informação de 'vendidos' e 'imagem_url' em
 *                      todos os anúncios consultados."
 *
 * Cinco dos oito runs tinham pelo menos uma. Um deles é o modo RÁPIDO, que é o
 * caminho já aprovado — ou seja, isto não é dívida do Profundo, é um furo que
 * atravessa a tela inteira desde sempre.
 *
 * A frase inteira SAI, e não só o token. Apagar `null` do meio de "então deixei
 * null" devolve "então deixei", e remendo de gramática em cima de texto de
 * modelo é como se escreve um novo defeito: a saída fica imprevisível e ninguém
 * revisa oito variantes de português quebrado. Frase é a menor unidade que dá
 * para tirar deixando o resto do parágrafo de pé — e o que essas frases dizem
 * ("não achei") a tela já diz com as palavras dela, em "não apurado", "sem link
 * que comprove" e nas ressalvas do Revisor.
 *
 * O que conta como máquina, e por quê:
 *   · qualquer coisa entre crases — é assim que o modelo cita código;
 *   · `algo_com_underscore` — nome de campo do contrato; português não tem
 *     underscore no meio de palavra;
 *   · `null`/`undefined`/`NaN` soltos — os três valores que o contrato usa para
 *     a ausência, e que a regra nº 4 desta tela proíbe mostrar;
 *   · JSON, payload, schema, endpoint, parse, token, prompt, timeout, fallback,
 *     boolean, cache, HTTP — o vocabulário de dentro do motor. `cache` entrou
 *     medido: em `produto+profundo` a galeria trazia "a URL da imagem principal
 *     é dinâmica e pode variar conforme o cache", que além de máquina é a tela
 *     contando ao aluno como ela funciona por dentro.
 *
 * O QUE NÃO CONTA, de propósito: "agente". A palavra é banida como sinônimo de
 * profissional, mas nos runs de produto ela aparece SEMPRE no sentido químico —
 * "agente de contraste para laser", "o calor fundirá o agente químico ao esmalte
 * da porcelana" —, que é o passo a passo de gravar em porcelana e é exatamente o
 * que o aluno pagou para ler. Quem garante que nenhum profissional é chamado de
 * agente é o texto FIXO desta tela, que não usa a palavra em lugar nenhum.
 *
 * Os endereços saem da conta antes do teste: `.../mdf_cru_3mm` tem underscore e
 * não é nome de campo — é a loja onde se compra a chapa.
 */
const MAQUINA = new RegExp(
	[
		'`[^`]*`',
		'\\b[a-zA-Z][a-zA-Z0-9]*(?:_[a-zA-Z0-9]+)+\\b',
		'(?<![\\wÀ-ÿ])(?:null|undefined|NaN)(?![\\wÀ-ÿ])',
		'\\b(?:JSON|payload|schema|endpoint|parser?|tokens?|prompt|timeout|fallback|boolean|cache|HTTP)\\b',
	].join('|'),
	'i',
);

/** Onde uma frase termina. Vírgula decimal e "R$ 1.000" não abrem frase nova. */
const FIM_DE_FRASE = /(?<=[.!?])\s+/;

/**
 * O parágrafo do especialista sem as frases que falam de máquina.
 *
 * Devolve o texto intacto no caso comum (nenhuma frase suja), e por isso pode
 * morar dentro de `frase` sem custo: é um `test` por frase, não uma reescrita.
 */
function semMaquina(t: string): string {
	if (!t) return t;
	const semEndereco = t.replace(/https?:\/\/\S+/g, ' ');
	if (!MAQUINA.test(semEndereco)) return t;
	return t
		.split(FIM_DE_FRASE)
		.filter((f) => !MAQUINA.test(f.replace(/https?:\/\/\S+/g, ' ')))
		.join(' ')
		.trim();
}

/**
 * O primeiro campo de TEXTO que existir, entre os nomes possíveis.
 *
 * Quem descarta a ausência escrita é `frase`, e é por isso que este laço testa
 * só se sobrou texto: um `nao_apurado` em `preco` já volta vazio daqui e o
 * próximo nome ainda pode ter resposta. Ver `frase` e `SEM_DADO`.
 */
function campo(o: Record<string, unknown>, ...nomes: string[]): string {
	for (const n of nomes) {
		const t = frase(o[n], 300);
		if (t) return t;
	}
	return '';
}

/**
 * O primeiro campo NUMÉRICO que existir — passando por `paraNumero`, porque o
 * modelo escreve "R$ 64,90" e "1.240" em campo que o contrato pede como número.
 */
function numeroDe(
	o: Record<string, unknown>,
	...nomes: string[]
): number | null {
	for (const n of nomes) {
		const v = paraNumero(o[n]);
		if (Number.isFinite(v)) return v;
	}
	return null;
}

/**
 * O LINK QUE PROVA — e nada além dele.
 *
 * Só devolve endereço que esteja entre as páginas que este dossiê registrou
 * (`output.fontes`). É a regra que o cabeçalho de `citadas` já fixou para prova
 * nova: link escrito por modelo que ninguém abriu não é fonte, é texto
 * plausível, e um `<a>` clicável em cima dele é a mentira mais barata desta
 * tela.
 */
function provaDe(
	o: Record<string, unknown>,
	citadas: Set<string>,
	...nomes: string[]
): string {
	for (const n of nomes) {
		const v = o[n];
		if (typeof v === 'string' && /^https?:\/\//i.test(v.trim())) {
			const u = v.trim();
			if (citadas.has(chaveDeUrl(u))) return u;
		}
	}
	return '';
}

/** O primeiro endereço http(s) que existir, SEM conferir contra as fontes. */
function urlDe(o: Record<string, unknown>, ...nomes: string[]): string {
	for (const n of nomes) {
		const v = o[n];
		if (typeof v === 'string' && /^https?:\/\//i.test(v.trim()))
			return v.trim();
	}
	return '';
}

/**
 * ONDE UM ITEM GUARDA A PÁGINA DELE — todos os nomes, e não só `url`.
 *
 * É a cópia da mesma lista do motor (`ai-research-team.ts`, `CAMPOS_DE_PAGINA`),
 * e tem que continuar sendo um SUPERCONJUNTO dela: lá a lista decide de qual
 * campo o servidor lê a página para ir buscar a `og:image`; aqui ela decide de
 * qual campo a tela lê a página para CONFERIR aquela foto. Se um nome existir só
 * lá, o motor captura uma foto que a tela nunca mostra — e o defeito aparece
 * como "sumiu a imagem", que é o mais caro de diagnosticar.
 *
 * A lista é longa porque o `saida` de cada especialista é DADO editável pela
 * Fábrica: o Radar chama de `url`, o Curador de `url_exemplo`, quem cataloga
 * portfólio de `url_anuncio`. Chumbar um nome só significaria que a seção do
 * vizinho nasce sem foto e ninguém descobre por quê.
 */
const CAMPOS_DE_PAGINA = [
	'url',
	'pagina_url',
	'url_pagina',
	'url_anuncio',
	'anuncio_url',
	'url_exemplo',
	'link',
];

/** Onde um item guarda a foto que o MOTOR capturou da página dele. */
const CAMPOS_DE_FOTO = ['imagem_url', 'foto_url', 'imagem'];

/**
 * A FOTO DE UM ITEM E A PÁGINA CITADA DE ONDE ELA SAIU — juntas, sempre.
 *
 * ┌─ A REGRA, EM UMA LINHA: SEM PÁGINA CITADA, SEM FOTO ─────────────────────┐
 * │ Não interessa quem escreveu `imagem_url` nem o que o arquivo responde.    │
 * │ Se a PÁGINA do item não está entre as que este dossiê citou               │
 * │ (`output.fontes`), o item não tem foto nesta tela. Ponto.                 │
 * └───────────────────────────────────────────────────────────────────────────┘
 *
 * POR QUE ESTE É O TESTE CERTO, e não "quem escreveu o campo". A versão
 * anterior desta função era um `const imagemDe = urlDe` com um comentário longo
 * explicando em QUAIS seções o campo podia ser lido, porque em cinco runs o
 * especialista tinha devolvido `imagem_url` vazia naquelas seções. O
 * comentário envelheceu junto com o modelo: medido em nove runs frios do escopo
 * MERCADO, o Radar e o Curador de Imagens passaram a INVENTAR o campo, e a
 * fronteira "por autor" virou uma lista de exceções que ninguém consegue manter
 * — foi exatamente por duas seções fora da lista que o lixo chegou à tela.
 *
 * A conferência por página não envelhece porque não depende do comportamento do
 * modelo, e sim de uma implicação do MOTOR: ele só busca `og:image` de página
 * que a busca citou (`abrirPaginas`). Logo, foto de verdade ⟹ página citada; e
 * a contrapositiva é o que esta função aplica — página não citada ⟹ o que
 * estiver em `imagem_url` é invenção, seja de quem for.
 *
 * O CUSTO DISSO, MEDIDO nos runs gravados, item a item: no escopo `produto`,
 * TODAS as fotos que existem hoje vêm de item com página citada
 * (11/11, 14/14, 8/8, 5/5, 4/4, 3/3, 2/2) — a trava não apaga nenhuma. No
 * escopo `mercado` ela apaga as 22 que existiam em dois runs, e essas 22 eram o
 * defeito: quatro delas o MESMO GIF cinza de "imagem indisponível" do Mercado
 * Livre (8.456 B, 500×500, md5 fe20176f49) servido com HTTP 200, o resto 404.
 *
 * Por que `pagina` sai junto e não em outra chamada: é a mesma prova. A foto e
 * o link do card sustentam um ao outro, e devolvê-los separados era o convite
 * para a próxima seção conferir um e esquecer o outro — que é a forma exata do
 * defeito que esta rodada está consertando. Ver `Foto`, que exige as duas.
 *
 * O QUE ESTA TRAVA NÃO PEGA, dito porque o dia em que alguém descobrir sozinho
 * vai custar uma rodada: um dossiê GRAVADO ANTES de o motor passar a apagar a
 * `imagem_url` do modelo pode trazer uma foto inventada pendurada numa página
 * que É citada. Medido: 2 casos em nove runs, os dois numa página de CATEGORIA
 * (que o motor nunca fotografa, porque a `og:image` dela é o logotipo da loja).
 * Esses arquivos respondem 404 e o `onError` do `<img>` desfaz o ladrilho — a
 * última rede, nunca a conferência. O que a trava PEGA é a classe perigosa, a
 * que o `onError` não vê: o GIF cinza servido com HTTP 200. Nos nove runs, 100%
 * dos placeholders do Mercado Livre estavam em páginas não citadas.
 *
 * Quem fecha o resto é o motor, na entrada (`semFotoDoModelo`): lá o campo é
 * apagado antes de qualquer leitura, e o que sobra é foto que nós buscamos.
 * Esta função é a segunda tranca, e existe porque a primeira mora num arquivo
 * que esta tela não controla — e porque o dossiê também é lido do cache.
 */
function fotoDoItem(
	o: Record<string, unknown>,
	citadas: Set<string>,
): { foto: string; pagina: string } {
	const pagina = provaDe(o, citadas, ...CAMPOS_DE_PAGINA);
	return { foto: pagina ? urlDe(o, ...CAMPOS_DE_FOTO) : '', pagina };
}

/** A ressalva que o especialista escreveu, em qualquer das duas grafias. */
function observacaoDe(j: Record<string, unknown> | null): string {
	if (!j) return '';
	return frase(j.observacao ?? j.observacoes ?? j.nota_final, 600);
}

/** "sim"/"não"/true/false — o contrato pede booleano e o modelo escreve texto. */
function booleanoDe(v: unknown): boolean | null {
	if (typeof v === 'boolean') return v;
	const t = classe(v);
	if (!t) return null;
	/**
	 * "NÃO SEI" NÃO É "NÃO" — e a diferença estampava um selo AFIRMATIVO.
	 *
	 * Os testes abaixo casam por PREFIXO (é o que faz "não atende pessoa física"
	 * virar `false`), e `nao_apurado` começa com "nao". Resultado reproduzido: o
	 * cartão do fornecedor imprimia "só para CNPJ" em cima de um campo que o
	 * especialista declarou NÃO ter apurado, e o aluno riscava da lista quem
	 * talvez vendesse para ele.
	 *
	 * Ausência é `null`, e `null` não desenha selo nenhum — que é o único estado
	 * honesto quando ninguém apurou. Por isso este teste vem ANTES dos outros dois.
	 */
	if (ausencia(t)) return null;
	if (/^(sim|true|1|vende|aceita)/.test(t)) return true;
	if (/^(nao|false|0|so cnpj|somente cnpj)/.test(t)) return false;
	return null;
}

/**
 * A nota de reputação, nas DUAS escalas que os canais usam.
 *
 * Mercado Livre e Shopee mostram 0–5; a reputação de vendedor do ML também
 * aparece como "98% de avaliações positivas". As duas chegam no mesmo campo, e
 * imprimir "98,0" numa régua de cinco estrelas seria absurdo. Acima de 100 não é
 * nota nenhuma: o modelo pôs ali outra coisa, e o selo some.
 */
function notaDe(v: number | null): { texto: string; frac: number } | null {
	if (v === null || !Number.isFinite(v) || v <= 0) return null;
	if (v <= 5) return { texto: v.toFixed(1).replace('.', ','), frac: v / 5 };
	if (v <= 100) return { texto: `${Math.round(v)}%`, frac: v / 100 };
	return null;
}

/** Contagem legível: 1.240 anúncios, e não "1240". */
const INT = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const inteiro = (n: number) => INT.format(Math.round(n));

/**
 * A caixa padrão destes boxes — mesmo cartão, mesmo cabeçalho, mesma intro.
 *
 * Nove seções novas escritas à mão divergiriam no primeiro ajuste de padding, e
 * um dossiê que muda de régua no meio da rolagem parece remendo. Aqui o
 * ÍCONE COLORIDO é o que dá identidade a cada uma sem quebrar a régua.
 */
function Caixa({
	titulo,
	intro,
	icone: Icon,
	cor,
	children,
}: {
	titulo: string;
	intro?: string;
	icone: LucideIcon;
	cor: string;
	children: ReactNode;
}) {
	return (
		<section className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
			<div className="mb-4 flex items-start gap-2.5">
				<span
					className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
					style={{ backgroundColor: `${cor}1f`, color: cor }}
				>
					<Icon className="h-3.5 w-3.5" />
				</span>
				<div className="min-w-0">
					<h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
						{titulo}
					</h3>
					{intro ? (
						<p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-slate-500">
							{intro}
						</p>
					) : null}
				</div>
			</div>
			{children}
		</section>
	);
}

/** A ressalva do especialista, no pé da caixa. */
function Rodape({ texto }: { texto: string }) {
	if (!texto) return null;
	return (
		<p className="mt-4 text-[12px] leading-relaxed text-slate-500">{texto}</p>
	);
}

/**
 * O aviso de item sem página — a mesma frase do Caçador de Brechas, de propósito.
 *
 * O aluno aprende UMA vez o que a tarja âmbar significa e ela vale em toda a
 * página. Dizer a mesma coisa com sete redações diferentes faria cada seção
 * parecer um caso especial.
 */
function SemProva() {
	return (
		<p className="mt-auto pt-1 text-[11px] leading-snug text-amber-300/80">
			sem link que comprove — é leitura do especialista
		</p>
	);
}

/** O link de prova, no pé de um cartão. */
function LinkProva({ url, rot = 'a prova em' }: { url: string; rot?: string }) {
	if (!url) return null;
	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			className="mt-auto flex items-center gap-1 pt-1 text-[11px] text-slate-500 transition-colors hover:text-[var(--screen-accent)]"
		>
			{rot} {dominio(url)}
			<ExternalLink className="h-3 w-3" />
		</a>
	);
}

/* ───────────── QUEM SÃO SEUS CONCORRENTES (Analista de Perfil) ───────────── */

interface Concorrente {
	loja: string;
	canal: string;
	posicionamento: string;
	reputacao: string;
	tempo: string;
	anuncios: number | null;
	nota: { texto: string; frac: number } | null;
	avaliacoes: number | null;
	link: string;
	chave: string;
}

/**
 * Quem está do outro lado — com nome, e não "a concorrência é acirrada".
 *
 * Pedido literal do dono do produto: "mais quem são meus concorrentes". O
 * Analista de Concorrência da onda 1 já dizia COMO eles se posicionam; este
 * especialista é da onda 2 e vai atrás de QUEM: nome da loja, reputação, tempo
 * de mercado, quantos anúncios, nota.
 *
 * Todo número aqui exige a página da loja entre as fontes do dossiê. Nota e
 * quantidade de anúncios são exatamente o tipo de dado que um modelo preenche
 * com plausibilidade quando não achou — e nota inventada ao lado do nome de uma
 * loja REAL é a pior combinação possível desta tela.
 */
function lerConcorrentes(
	j: Record<string, unknown> | null,
	citadas: Set<string>,
): { itens: Concorrente[]; observacao: string } {
	const itens = listaDe(j, 'concorrentes', 'lojas', 'vendedores', 'perfis')
		.map((c, i) => {
			const link = provaDe(
				c,
				citadas,
				'url',
				'loja_url',
				'perfil_url',
				'link',
				'evidencia_url',
			);
			const loja = campo(c, 'loja', 'nome', 'vendedor', 'nome_loja', 'seller');
			return {
				loja,
				canal: campo(c, 'marketplace', 'canal', 'onde_vende', 'plataforma'),
				posicionamento: campo(
					c,
					'posicionamento',
					'como_se_posiciona',
					'estrategia',
					'diferencial',
				),
				reputacao: campo(c, 'reputacao', 'selo', 'nivel', 'status'),
				tempo: campo(c, 'tempo_mercado', 'tempo_de_mercado', 'desde', 'idade'),
				anuncios: link
					? numeroDe(c, 'anuncios', 'qtd_anuncios', 'n_anuncios', 'produtos')
					: null,
				nota: link
					? notaDe(numeroDe(c, 'nota', 'nota_media', 'avaliacao_media'))
					: null,
				avaliacoes: link
					? numeroDe(c, 'avaliacoes', 'n_avaliacoes', 'reviews')
					: null,
				link,
				chave: `${loja.slice(0, 24)}-${i}`,
			};
		})
		.filter((c) => c.loja);
	return { itens, observacao: observacaoDe(j) };
}

function CardConcorrente({ c }: { c: Concorrente }) {
	const selo = seloDe({ marketplace: c.canal, url: c.link });
	const linhas: [string, string][] = [
		['Reputação', c.reputacao],
		['No mercado há', c.tempo],
	];

	return (
		<li className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
			<div className="flex items-start gap-3">
				<span
					className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-[12px] font-black"
					style={{
						background: `color-mix(in srgb, ${selo.cor} 18%, transparent)`,
						color: selo.cor,
					}}
				>
					{selo.sigla || <Store className="h-4 w-4" />}
				</span>
				<div className="min-w-0 flex-1">
					<p className="text-[14px] font-semibold leading-snug text-slate-100">
						{c.loja}
					</p>
					{selo.rot ? (
						<p className="mt-0.5 text-[11px] text-slate-500">{selo.rot}</p>
					) : null}
				</div>
			</div>

			{/* A régua de reputação: nota e volume de avaliações lado a lado. Só
			    existe com a página da loja — ver `lerConcorrentes`. */}
			{c.nota || c.anuncios !== null || c.avaliacoes !== null ? (
				<div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
					{c.nota ? (
						<span className="inline-flex items-center gap-1.5">
							<Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
							<span className="font-mono text-[14px] font-bold tabular-nums text-slate-50">
								{c.nota.texto}
							</span>
							<span className="h-1.5 w-14 overflow-hidden rounded-full bg-white/8">
								<span
									className="block h-full rounded-full bg-amber-400"
									style={{ width: `${Math.round(c.nota.frac * 100)}%` }}
								/>
							</span>
						</span>
					) : null}
					{c.avaliacoes !== null ? (
						<span className="font-mono text-[11px] tabular-nums text-slate-500">
							{inteiro(c.avaliacoes)} avaliações
						</span>
					) : null}
					{c.anuncios !== null ? (
						<span className="inline-flex items-center gap-1 font-mono text-[11px] tabular-nums text-slate-400">
							<Boxes className="h-3.5 w-3.5 text-slate-600" />
							{inteiro(c.anuncios)} anúncios
						</span>
					) : null}
				</div>
			) : null}

			{c.posicionamento ? (
				<p className="text-[12.5px] leading-snug text-slate-400">
					{c.posicionamento}
				</p>
			) : null}

			<dl className="space-y-1 text-[12px] leading-snug">
				{linhas.map(([rot, val]) =>
					val ? (
						<div key={rot} className="flex gap-2">
							<dt className="shrink-0 text-slate-600">{rot}:</dt>
							<dd className="min-w-0 text-slate-400">{val}</dd>
						</div>
					) : null,
				)}
			</dl>

			{c.link ? <LinkProva url={c.link} rot="ver a loja em" /> : <SemProva />}
		</li>
	);
}

/* ───────── O QUE ELES MAIS VENDEM (Analista de Portfólio) ───────── */

interface Campeao {
	loja: string;
	produto: string;
	titulo: string;
	canal: string;
	preco: number | null;
	vendidos: string;
	imagem: string;
	link: string;
	chave: string;
}

/**
 * O que cada concorrente MAIS VENDE, e por quanto. Pedido literal.
 *
 * Preço só com a página do anúncio entre as fontes: é o mesmo critério do
 * Caçador de Brechas, e pela mesma razão — um número ao lado de um texto
 * afirmativo é lido como conferido.
 */
function lerCampeoes(
	j: Record<string, unknown> | null,
	citadas: Set<string>,
): { itens: Campeao[]; observacao: string } {
	const itens = listaDe(j, 'campeoes', 'produtos', 'mais_vendidos', 'itens')
		.map((p, i) => {
			const link = provaDe(p, citadas, 'url', 'anuncio_url', 'link');
			const preco = numeroDe(p, 'preco_brl', 'preco', 'valor_brl');
			const produto = campo(p, 'produto', 'nome', 'item');
			const titulo = campo(p, 'titulo_anuncio', 'titulo');
			return {
				loja: campo(p, 'loja', 'vendedor', 'concorrente', 'nome_loja'),
				produto: produto || titulo,
				titulo,
				canal: campo(p, 'marketplace', 'canal'),
				preco: link && preco !== null && preco > 0 ? preco : null,
				// Mesmo critério do preço, e pela mesma razão: "1.000 vendidos" ao
				// lado de um texto afirmativo é lido como conferido.
				vendidos: link
					? rotuloVendidos(p.vendidos ?? p.unidades_vendidas ?? '')
					: '',
				imagem: fotoDoItem(p, citadas).foto,
				link,
				chave: `${(link || produto || titulo).slice(0, 40)}-${i}`,
			};
		})
		.filter((p) => p.produto);
	return { itens, observacao: observacaoDe(j) };
}

/**
 * Agrupado POR LOJA, e não numa lista corrida.
 *
 * "O que eles mais vendem" é uma pergunta sobre CADA concorrente — ler os
 * campeões embaralhados obrigaria o aluno a cruzar nome de loja de cabeça, que
 * é justamente o trabalho que este dossiê existe para poupar. Campeão sem loja
 * identificada não é descartado: vira um grupo próprio, porque o produto em si
 * continua sendo informação de mercado.
 */
function agruparPorLoja(
	itens: Campeao[],
): { loja: string; itens: Campeao[] }[] {
	const mapa = new Map<string, { loja: string; itens: Campeao[] }>();
	for (const c of itens) {
		const k = classe(c.loja) || '__sem_loja__';
		const g = mapa.get(k);
		if (g) g.itens.push(c);
		else mapa.set(k, { loja: c.loja, itens: [c] });
	}
	return [...mapa.values()];
}

/**
 * O campeão de venda de um concorrente — em vitrine quando há foto, em ficha
 * quando não há.
 *
 * O ladrilho quadrado com a SIGLA do canal no meio ("SP", "ML") era o estado
 * comum desta lista no escopo mercado, e é a mesma leitura errada de sempre:
 * quadrado do tamanho de uma foto + cinza = imagem que não carregou. Sem foto o
 * item vira uma ficha de uma linha e meia — selo do canal, título, preço — que
 * ocupa o espaço que merece e não promete uma imagem que não existe.
 */
function MiniProduto({ p }: { p: Campeao }) {
	/** Ver `Foto.onErro`: sem isto o ladrilho quadrado ficava montado e vazio. */
	const [fotoMorreu, setFotoMorreu] = useState(false);
	const selo = seloDe({ marketplace: p.canal, url: p.link });
	const corpo =
		p.imagem && !fotoMorreu ? (
			<>
				<div className="relative aspect-square w-full overflow-hidden rounded-xl bg-white/[0.03]">
					<Foto
						url={p.imagem}
						pagina={p.link}
						onErro={() => setFotoMorreu(true)}
						className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
					/>
					{p.vendidos ? (
						<span className="pointer-events-none absolute inset-x-1.5 bottom-1.5 truncate rounded-full bg-black/70 px-2 py-0.5 text-center font-mono text-[10px] font-semibold tabular-nums text-emerald-300 backdrop-blur-sm">
							{p.vendidos}
						</span>
					) : null}
				</div>
				<p className="mt-2 line-clamp-2 text-[12px] leading-snug text-slate-300">
					{p.titulo || p.produto}
				</p>
				{p.preco !== null ? (
					<p className="mt-1 font-mono text-[14px] font-bold tabular-nums text-slate-50">
						{reais(p.preco)}
					</p>
				) : (
					<p className="mt-1 text-[11px] font-semibold text-amber-300">
						preço sem link que comprove
					</p>
				)}
			</>
		) : (
			<div className="flex h-full flex-col gap-1.5 rounded-xl border border-white/8 bg-white/[0.02] p-3 transition-colors group-hover:border-white/20">
				<div className="flex items-center gap-1.5">
					{selo.rot ? (
						<span
							className="truncate rounded-full border px-1.5 py-0.5 text-[10px] font-semibold"
							style={{
								background: `color-mix(in srgb, ${selo.cor} 12%, transparent)`,
								borderColor: `${selo.cor}45`,
								color: selo.cor,
							}}
						>
							{selo.rot}
						</span>
					) : null}
					{p.vendidos ? (
						<span className="shrink-0 font-mono text-[10px] font-semibold tabular-nums text-emerald-300">
							{p.vendidos}
						</span>
					) : null}
				</div>
				<p className="line-clamp-2 text-[12px] leading-snug text-slate-300">
					{p.titulo || p.produto}
				</p>
				{p.preco !== null ? (
					<p className="mt-auto font-mono text-[14px] font-bold tabular-nums text-slate-50">
						{reais(p.preco)}
					</p>
				) : (
					<p className="mt-auto text-[11px] font-semibold text-amber-300">
						preço sem link que comprove
					</p>
				)}
			</div>
		);

	return p.link ? (
		<a
			href={p.link}
			target="_blank"
			rel="noopener noreferrer"
			className="group block min-w-0"
		>
			{corpo}
		</a>
	) : (
		<div className="group block min-w-0">{corpo}</div>
	);
}

function OQueElesVendem({
	grupos,
}: {
	grupos: { loja: string; itens: Campeao[] }[];
}) {
	/**
	 * SEÇÃO SEM NENHUMA FOTO NÃO É GALERIA — e não pode usar a grade de galeria.
	 *
	 * `GRADE_DE_FOTOS` existe para ladrilho quadrado de 140–215 px: com fotos,
	 * lê-se como vitrine. Sem nenhuma foto, aquelas mesmas colunas estreitas
	 * viram uma fileira de retângulos com duas linhas de texto espremidas e muito
	 * ar em volta — a forma da galeria sem o conteúdo dela, que é exatamente o
	 * que o dono do produto apontou. Quando não há uma foto sequer, a seção
	 * assume que é uma LISTA e usa colunas largas.
	 */
	const temFoto = grupos.some((g) => g.itens.some((i) => i.imagem));
	const grade = temFoto ? GRADE_DE_FOTOS : 'sm:grid-cols-2 xl:grid-cols-3';
	return (
		<div className="space-y-5">
			{grupos.map((g) => (
				<div key={g.loja || '__sem_loja__'}>
					<div className="mb-2.5 flex items-center gap-2">
						<Crown className="h-3.5 w-3.5 text-amber-400" />
						<p className="text-[12px] font-semibold text-slate-200">
							{g.loja || 'Campeões do ramo, sem loja identificada'}
						</p>
						<span className="h-px flex-1 bg-white/8" />
						<span className="shrink-0 text-[11px] text-slate-600">
							{g.itens.length} produto{g.itens.length === 1 ? '' : 's'}
						</span>
					</div>
					{/* Mesma grade da galeria, pela mesma razão e com mais força: aqui
					    cada LOJA ganha uma linha própria, e loja com um campeão só é o
					    caso comum — cinco colunas fixas transformavam "1 produto" num
					    ladrilho solto com quatro buracos do lado. Ver `GRADE_DE_FOTOS`. */}
					<div className={`grid gap-3 ${grade}`}>
						{g.itens.slice(0, 10).map((p) => (
							<MiniProduto key={p.chave} p={p} />
						))}
					</div>
				</div>
			))}
		</div>
	);
}

/* ─────────────── GALERIA DE REFERÊNCIAS ─────────────── */

/**
 * A GRADE DE FOTOS — ladrilho de tamanho FIXO, e não fração da linha.
 *
 * `lg:grid-cols-5` divide a linha em cinco fatias sempre, tenha o dossiê vinte
 * fotos ou duas. Com vinte fica bom; com duas o aluno vê dois ladrilhos de
 * 265 px encostados na esquerda e mil e cem pixels de preto do lado — e isso não
 * lê como "a pesquisa achou duas fotos", lê como página quebrada. Acontece de
 * verdade: nos runs gravados de `mercado+profundo` a galeria veio com DUAS
 * imagens (o resto das páginas não tinha foto de produto para capturar), e a
 * mesma tela em `produto+profundo` veio com vinte.
 *
 * `auto-fill` + `minmax` inverte a conta: o ladrilho tem tamanho e a linha cabe
 * quantos couber. Duas fotos viram duas fotos do tamanho de sempre; vinte viram
 * vinte do mesmo tamanho. A grade deixa de mudar de escala com a sorte da
 * pesquisa, que é o que faz uma galeria parecer galeria.
 */
const GRADE_DE_FOTOS =
	'grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(215px,1fr))]';

interface Referencia {
	imagem: string;
	pagina: string;
	legenda: string;
	fonte: string;
}

/**
 * Uma foto da galeria, que SOME quando o arquivo não carrega.
 *
 * Nas outras seções a foto mora dentro de um card que continua fazendo sentido
 * sem ela (o preço, o título e o link estão ali), e lá o card se remonta em
 * forma de ficha. Numa GRADE de referências não existe card em volta: um
 * marcador cinza no lugar da foto é o buraco, não o conserto, e o ladrilho sai
 * inteiro. Marketplace bloqueia hotlink com frequência, então isso acontece de
 * verdade — a grade se refaz sozinha, e quando o último ladrilho cai a caixa
 * inteira sai junto (ver `galeriaViva`).
 *
 * O `onError` é a última rede, NUNCA a conferência: URL inventada no CDN do
 * Mercado Livre responde HTTP 200 com um GIF cinza de "foto não disponível", o
 * `onError` não dispara e o ladrilho fica na tela como se fosse produto. Quem
 * decide se uma foto pode entrar é o AUTOR do campo, lá em cima — ver `imagemDe`
 * e o cabeçalho de `lerGaleria`.
 */
function Referencia({ r, onMorreu }: { r: Referencia; onMorreu: () => void }) {
	const [erro, setErro] = useState(false);
	if (erro) return null;

	const corpo = (
		<>
			{/* `<img>` cru, como em `Foto`: imagem de terceiro, fora do otimizador do
			    Next — o domínio do CDN do marketplace muda a cada anúncio e não tem
			    como estar no `remotePatterns`. */}
			<img
				src={r.imagem}
				alt=""
				loading="lazy"
				onError={() => {
					setErro(true);
					// A GRADE precisa saber, e não só o ladrilho: quando a ÚLTIMA foto
					// morre, o que sobra é uma caixa com título, legenda e nada dentro —
					// uma galeria fingindo ser galeria. Ver `galeriaViva`.
					onMorreu();
				}}
				className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
			/>
			<div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2.5 pt-8 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
				{r.legenda ? (
					<p className="line-clamp-2 text-[11px] leading-snug text-white/90">
						{r.legenda}
					</p>
				) : null}
				<p className="mt-0.5 flex items-center gap-1 text-[10px] text-white/60">
					{dominio(r.pagina)} <ExternalLink className="h-2.5 w-2.5" />
				</p>
			</div>
		</>
	);

	// `estilo`, e não `classe`: o módulo já tem uma função `classe()` (a que
	// normaliza enum de LLM), e sombrear o nome dentro de um componente é o tipo
	// de armadilha que só aparece quando alguém for usar a função aqui dentro.
	const estilo =
		'group relative aspect-square overflow-hidden rounded-xl border border-white/8 bg-white/[0.03]';

	/**
	 * SEMPRE `<a>`: não existe mais ladrilho sem página nesta grade.
	 *
	 * O ramo `<div>` era para a foto cuja origem a tela não conseguia provar — e
	 * essa foto agora simplesmente não entra (ver `lerGaleria` e `fotoDoItem`).
	 * A promessa impressa na seção é "clique em qualquer uma para abrir a página
	 * de onde ela saiu", e um ladrilho não clicável no meio da grade era ela
	 * sendo quebrada em silêncio.
	 */
	return (
		<a
			href={r.pagina}
			target="_blank"
			rel="noopener noreferrer"
			className={estilo}
		>
			{corpo}
			<span className="sr-only">
				Abrir a página desta referência{r.legenda ? `: ${r.legenda}` : ''}
			</span>
		</a>
	);
}

/**
 * TODAS as fotos que este dossiê CAPTUROU, num lugar só. "Mais imagens" foi
 * pedido com essas palavras.
 *
 * Junta o ranking do ramo, os campeões dos concorrentes, os produtos que o
 * Curador escolheu e os anúncios com preço — porque quem decide o que fabricar
 * decide pela foto, e ver vinte de uma vez é uma leitura diferente de ver quatro
 * por seção.
 *
 * ┌─ UMA REGRA PARA AS QUATRO ENTRADAS, E PARA A QUINTA QUE ALGUÉM VAI ABRIR ─┐
 * │ Toda foto desta grade sai de `fotoDoItem`: existe se — e só se — a PÁGINA │
 * │ daquele item está entre as que este dossiê citou. Não há mais "esta seção │
 * │ pode ler `imagem_url`, aquela não".                                       │
 * │                                                                           │
 * │ A rodada passada fechou UMA porta (o Curador de Imagens) com um comentário│
 * │ dizendo em quais seções o campo era confiável, e a lista estava certa no  │
 * │ dia em que foi escrita. Duas seções ficaram de fora — o ranking do Radar  │
 * │ e a vitrine do concorrente — e foi por elas que a grade encheu de 404 e   │
 * │ do GIF cinza de "imagem indisponível" do Mercado Livre (o mesmo arquivo   │
 * │ de 8.456 B servido com HTTP 200 para quatro URLs diferentes, que o        │
 * │ `onError` do `<img>` nunca pega). Quatro rodadas desta feature morreram   │
 * │ numa variação disso: fechar porta a porta é combinar de esquecer a        │
 * │ próxima.                                                                  │
 * │                                                                           │
 * │ Medido nos runs gravados: no escopo `produto` a regra não apaga nenhuma   │
 * │ das fotos que já existiam (31 de 31 vinham de item com página citada); no │
 * │ escopo `mercado` ela apaga as 22 que existiam, e as 22 eram o defeito.    │
 * │                                                                           │
 * │ O Curador de Imagens segue fora da grade pelo MESMO teste, agora aplicado │
 * │ e não declarado: as páginas que ele escreve não são as que ele citou. O   │
 * │ que ele apurou de verdade — qual produto olhar e o que olhar nele — tem   │
 * │ ponto de render próprio; ver `lerReferenciasDeProduto`.                   │
 * └───────────────────────────────────────────────────────────────────────────┘
 *
 * Sem repetir a mesma URL: `chaveDeUrl` normaliza protocolo, `www.`, query e
 * barra final, então o mesmo arquivo servido com um `?w=640` no fim não entra
 * duas vezes.
 *
 * O LINK de cada foto é a página de onde ela saiu — a mesma que o card daquela
 * seção mostra alguns centímetros acima, porque agora as duas passam pelo mesmo
 * funil. A incoerência entre duas seções do mesmo dossiê é o defeito que esta
 * tela mais cara pagou para corrigir, e ela desaparece quando a regra é uma só.
 */
function lerGaleria(
	jsonDe: (k: string) => Record<string, unknown> | null,
	citadas: Set<string>,
	curados: Record<string, unknown>[],
	anuncios: { url?: string; title?: string; imagem_url?: string }[],
	/** O json de CADA especialista, para a varredura do fim. */
	porEspecialista: Record<string, unknown>,
): { itens: Referencia[] } {
	const vistas = new Set<string>();
	const itens: Referencia[] = [];
	/**
	 * A ÚNICA porta de entrada da grade, e ela pede o ITEM — nunca uma URL solta.
	 *
	 * Quem escrever a quinta origem não escolhe se confere: para pôr uma foto
	 * aqui é preciso entregar o objeto do item, e a conferência acontece dentro.
	 */
	const por = (
		item: Record<string, unknown>,
		legenda: string,
		fonte: string,
	) => {
		const { foto, pagina } = fotoDoItem(item, citadas);
		if (!foto || !pagina) return;
		const k = chaveDeUrl(foto);
		if (!k || vistas.has(k)) return;
		vistas.add(k);
		itens.push({ imagem: foto, pagina, legenda, fonte });
	};

	for (const p of comoObjetos(jsonDe('radar_oportunidades')?.produtos)) {
		por(p, frase(p.titulo_anuncio || p.nome, 140), 'radar');
	}

	for (const p of listaDe(
		jsonDe('concorrente_portfolio'),
		'campeoes',
		'produtos',
		'mais_vendidos',
		'itens',
	)) {
		por(p, frase(p.titulo_anuncio || p.produto || p.nome, 140), 'portfolio');
	}

	for (const p of curados) {
		por(p, frase(p.nome, 140), 'curadoria');
	}

	for (const o of anuncios) {
		por(o as Record<string, unknown>, frase(o?.title, 140), 'anuncios');
	}

	/**
	 * E TODO O RESTO DO TIME — a varredura que dobrou a grade sem uma linha de
	 * rede a mais.
	 *
	 * As quatro origens acima eram as únicas lidas, e o servidor entrega foto
	 * conferida em muito mais lugares: preço de mercado, concorrência, público,
	 * perfil do concorrente, reclamações, frete, Curador de Imagens. Medido num
	 * run de produto+profundo: 8 fotos verificadas no payload, 4 na tela. O
	 * Curador de Imagens é o caso mais caro — ele é pago, gasta duas buscas, tem
	 * a foto capturada pelo motor e descartada pela tela.
	 *
	 * Só é seguro varrer porque a regra mudou na origem: `imagem_url` deixou de
	 * ser campo que o modelo escreve. Hoje ela é escrita SÓ pelo motor, é a
	 * `og:image` de uma página que o time abriu, e passou por conferência de
	 * bytes (content-type, tamanho, dimensão e md5 de placeholder conhecido).
	 * Antes disso a única saída honesta era não ler o campo — e era o que esta
	 * função fazia, com razão.
	 *
	 * `por()` continua sendo o funil: quem não tiver página citada não entra,
	 * venha de onde vier.
	 */
	for (const j of Object.values(porEspecialista)) {
		visitarObjetos(j, (item) => {
			if (typeof item.imagem_url !== 'string' || !item.imagem_url) return;
			por(
				item,
				frase(item.titulo_anuncio || item.nome || item.produto, 140),
				'time',
			);
		});
	}

	return { itens };
}

/**
 * Percorre um JSON de especialista e entrega cada OBJETO que ele contém.
 *
 * Genérico de propósito: os contratos variam (`produtos`, `campeoes`,
 * `referencias`, `anuncios`, `concorrentes`…) e uma lista de nomes de campo
 * nasceria incompleta — foi assim que quatro origens de foto viraram quatro
 * portas independentes, três delas sem portão.
 */
function visitarObjetos(
	raiz: unknown,
	ver: (item: Record<string, unknown>) => void,
	nivel = 0,
): void {
	if (nivel > 4 || !raiz || typeof raiz !== 'object') return;
	if (Array.isArray(raiz)) {
		for (const item of raiz) visitarObjetos(item, ver, nivel + 1);
		return;
	}
	const o = raiz as Record<string, unknown>;
	ver(o);
	for (const valor of Object.values(o)) visitarObjetos(valor, ver, nivel + 1);
}

/* ───── PRODUTOS DE REFERÊNCIA (Curador de Imagens) ───── */

interface ProdutoDeReferencia {
	produto: string;
	oQueE: string;
	link: string;
	chave: string;
}

/**
 * O PONTO DE RENDER DO CURADOR DE IMAGENS — o que ele apurou que É conferível.
 *
 * Ele roda no Profundo, gasta busca, é cobrado e aparece trabalhando na sala de
 * guerra. A `imagem_url` que ele escreve não pode virar foto na tela (ver o
 * cabeçalho de `lerGaleria`), mas o resto do que ele traz é resposta de verdade:
 * QUAL produto vale olhar e O QUE olhar nele — o ângulo, o acabamento, a
 * embalagem, a peça em uso. Isso muda a foto que o aluno tira, que é para o que
 * a seção existe.
 *
 * A página passa por `provaDe` como toda prova nova desta tela; sem ela o item
 * fica com a tarja âmbar de sempre em vez de um link que ninguém abriu.
 */
function lerReferenciasDeProduto(
	j: Record<string, unknown> | null,
	citadas: Set<string>,
): { itens: ProdutoDeReferencia[]; observacao: string } {
	const itens = listaDe(j, 'referencias', 'imagens', 'fotos', 'itens')
		.map((r, i) => {
			const produto = campo(r, 'produto', 'nome', 'item', 'titulo');
			const oQueE = campo(r, 'o_que_e', 'legenda', 'descricao', 'detalhe');
			return {
				produto,
				oQueE,
				link: provaDe(
					r,
					citadas,
					'url',
					'pagina_url',
					'anuncio_url',
					'origem_url',
					'link',
				),
				chave: `${(produto || oQueE).slice(0, 28)}-${i}`,
			};
		})
		.filter((r) => r.produto || r.oQueE);
	return { itens, observacao: observacaoDe(j) };
}

function ProdutosDeReferencia({ itens }: { itens: ProdutoDeReferencia[] }) {
	return (
		<ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
			{itens.slice(0, 12).map((r) => (
				<li
					key={r.chave}
					className="flex flex-col gap-2 rounded-xl border border-white/8 bg-white/[0.02] p-4"
				>
					{r.produto ? (
						<p className="text-[14px] font-semibold leading-snug text-slate-100">
							{r.produto}
						</p>
					) : null}
					{r.oQueE ? (
						<p className="text-[12.5px] leading-snug text-slate-400">
							{r.oQueE}
						</p>
					) : null}
					{r.link ? <LinkProva url={r.link} rot="ver em" /> : <SemProva />}
				</li>
			))}
		</ul>
	);
}

/* ─────────────── PARA QUEM VENDER (Analista de Público) ─────────────── */

interface Perfil {
	quem: string;
	ocasiao: string;
	decide: string;
	onde: string;
	ticket: number | null;
	link: string;
	chave: string;
}

function lerPublico(
	j: Record<string, unknown> | null,
	citadas: Set<string>,
): { itens: Perfil[]; observacao: string } {
	const itens = listaDe(j, 'perfis', 'publicos', 'publico', 'itens')
		.map((p, i) => {
			const link = provaDe(p, citadas, 'url', 'evidencia_url', 'link');
			const ticket = numeroDe(p, 'ticket_brl', 'ticket_medio_brl', 'ticket');
			const quem = campo(p, 'quem', 'publico', 'perfil', 'nome', 'segmento');
			return {
				quem,
				ocasiao: campo(
					p,
					'ocasiao',
					'ocasiao_compra',
					'quando_compra',
					'motivo',
				),
				decide: campo(p, 'o_que_decide', 'decide', 'gatilho', 'o_que_importa'),
				onde: campo(p, 'onde_encontrar', 'onde', 'canal', 'onde_achar'),
				// Ticket é dinheiro: sem página, não vira número. Ver `provaDe`.
				ticket: link && ticket !== null && ticket > 0 ? ticket : null,
				link,
				chave: `${quem.slice(0, 24)}-${i}`,
			};
		})
		.filter((p) => p.quem);
	return { itens, observacao: observacaoDe(j) };
}

function ParaQuemVender({ itens }: { itens: Perfil[] }) {
	return (
		<ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
			{itens.slice(0, 9).map((p) => (
				<li
					key={p.chave}
					className="flex flex-col gap-2 rounded-xl border border-white/8 bg-white/[0.02] p-4"
				>
					<div className="flex items-start justify-between gap-2">
						<p className="min-w-0 text-[14px] font-semibold leading-snug text-slate-100">
							{p.quem}
						</p>
						{p.ticket !== null ? (
							<span className="shrink-0 rounded-lg bg-white/5 px-2 py-0.5 font-mono text-[12px] font-bold tabular-nums text-slate-100">
								{reais(p.ticket)}
							</span>
						) : null}
					</div>
					{p.ocasiao ? (
						<p className="text-[12.5px] leading-snug text-slate-400">
							<span className="text-slate-600">Compra quando: </span>
							{p.ocasiao}
						</p>
					) : null}
					{p.decide ? (
						<p className="text-[12.5px] leading-snug text-emerald-200/85">
							{p.decide}
						</p>
					) : null}
					{p.onde ? (
						<p className="text-[12px] leading-snug text-slate-500">
							<span className="text-slate-600">Onde achar: </span>
							{p.onde}
						</p>
					) : null}
					{p.link ? <LinkProva url={p.link} /> : <SemProva />}
				</li>
			))}
		</ul>
	);
}

/* ───── QUEM COMPRA EM QUANTIDADE (Analista de Venda Direta) ───── */

interface Comprador {
	tipo: string;
	porQue: string;
	pedido: string;
	exige: string;
	comoChegar: string;
	link: string;
	chave: string;
}

/**
 * O 22º PROFISSIONAL DO TIME — e o quarto capítulo da mesma regra.
 *
 * O Analista de Venda Direta roda no Profundo nos DOIS escopos, gasta busca, é
 * cobrado dentro dos voxxys e aparece animando na sala de guerra como um dos 22
 * cartões. Até aqui ele não tinha UMA linha nesta tela: `grep venda_direta` no
 * front devolvia zero, e o dossiê é montado por leitores explícitos mais uma
 * allowlist (`BLOCOS_DO_TIME`) — não existe caminho genérico que pegue quem
 * ficou de fora. Em run frio real ele entregou de 3 a 4 perfis de comprador com
 * 2,1 a 3,1 mil caracteres de conteúdo bom, e o aluno lia 21 de 22.
 *
 * É EXATAMENTE o defeito que já reprovou esta feature em três eixos diferentes
 * (por modo, por escopo, por caminho padrão), agora pelo quarto: especialista
 * novo entrando no roster sem leitor. O antídoto continua sendo o mesmo — o
 * ponto de render existe por CHAVE do especialista, nunca por modo nem por
 * escopo, e some sozinho quando ele não responde.
 *
 * O que ele responde é a outra metade de "para quem vender": o Analista de
 * Público acha quem compra UMA peça; este acha quem compra CEM, fora do
 * marketplace — empresa, escola, buffet, papelaria, imobiliária, agência de
 * brindes. Por isso os dois dividem a mesma etapa.
 *
 * Campos verbatim do contrato dele na coleção `agentes` (`tipo`,
 * `por_que_compra`, `pedido_tipico`, `exige`, `como_chegar`, `url`), com os
 * apelidos de sempre: o `saida` é DADO editável pela Fábrica, e amarrar o box a
 * um nome só é combinar de sumir da tela numa tarde. O link passa por `provaDe`,
 * como toda prova nova.
 */
function lerCompradores(
	j: Record<string, unknown> | null,
	citadas: Set<string>,
): { itens: Comprador[]; observacao: string } {
	const itens = listaDe(j, 'compradores', 'clientes', 'canais', 'itens')
		.map((c, i) => {
			const tipo = campo(c, 'tipo', 'comprador', 'quem', 'segmento', 'nome');
			return {
				tipo,
				porQue: campo(
					c,
					'por_que_compra',
					'por_que',
					'motivo',
					'necessidade',
					'o_que_busca',
				),
				pedido: campo(
					c,
					'pedido_tipico',
					'pedido',
					'volume',
					'quantidade',
					'tamanho_pedido',
				),
				exige: campo(c, 'exige', 'exigencias', 'requisitos', 'o_que_exige'),
				comoChegar: campo(
					c,
					'como_chegar',
					'como_prospectar',
					'onde_encontrar',
					'abordagem',
				),
				link: provaDe(c, citadas, 'url', 'evidencia_url', 'link', 'fonte_url'),
				chave: `${tipo.slice(0, 28)}-${i}`,
			};
		})
		.filter((c) => c.tipo);
	return { itens, observacao: observacaoDe(j) };
}

function QuemCompraEmQuantidade({ itens }: { itens: Comprador[] }) {
	return (
		<ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
			{itens.slice(0, 9).map((c) => (
				<li
					key={c.chave}
					className="flex flex-col gap-2 rounded-xl border border-white/8 bg-white/[0.02] p-4"
				>
					<p className="text-[14px] font-semibold leading-snug text-slate-100">
						{c.tipo}
					</p>
					{c.porQue ? (
						<p className="text-[12.5px] leading-snug text-slate-400">
							{c.porQue}
						</p>
					) : null}

					{/* Pedido típico é o número que decide se vale a pena atender este
					    comprador — mas ele chega como TEXTO do especialista ("100
					    unidades ou mais", "lotes de 50 a 500"), e texto não vira selo
					    numérico nesta tela. Fica em destaque de leitura, não de conta. */}
					{c.pedido ? (
						<p className="rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-1.5 text-[12px] leading-snug text-slate-200">
							<span className="text-slate-500">Pedido típico: </span>
							{c.pedido}
						</p>
					) : null}

					{/* Âmbar 300/90, o mesmo tom do "cuidado" do frete: é a linha que o
					    aluno lê ANTES de prometer prazo a uma empresa. `amber-200/85`
					    saiu mais apagado que o corpo do cartão na conferência visual. */}
					{c.exige ? (
						<p className="text-[12px] leading-snug text-amber-300/90">
							<span className="text-slate-500">Exige: </span>
							{c.exige}
						</p>
					) : null}
					{c.comoChegar ? (
						<p className="text-[12px] leading-snug text-emerald-200/85">
							<span className="text-slate-500">Como chegar: </span>
							{c.comoChegar}
						</p>
					) : null}
					{c.link ? <LinkProva url={c.link} /> : <SemProva />}
				</li>
			))}
		</ul>
	);
}

/* ─────────────── O CALENDÁRIO DO ANO (Analista de Sazonalidade) ─────────────── */

const MESES = [
	'janeiro',
	'fevereiro',
	'marco',
	'abril',
	'maio',
	'junho',
	'julho',
	'agosto',
	'setembro',
	'outubro',
	'novembro',
	'dezembro',
];

/**
 * Em que mês esta data cai — para o calendário sair EM ORDEM DE CALENDÁRIO.
 *
 * Uma lista de datas comemorativas fora de ordem não é calendário, é uma lista.
 * O especialista escreve o mês em campo próprio ou dentro do nome ("Dia das
 * Mães (maio)"), e nas duas formas o nome do mês aparece por extenso — é isso
 * que a busca aproveita. O que não dá para situar vai para o fim, sem sumir:
 * "produção para o Natal" continua sendo informação mesmo sem mês declarado.
 */
function mesDe(...textos: string[]): number {
	const t = classe(textos.join(' '));
	for (let i = 0; i < MESES.length; i++) {
		if (t.includes(MESES[i] as string)) return i;
	}
	return 99;
}

interface DataDoAno {
	nome: string;
	mes: number;
	rotuloMes: string;
	vende: string;
	antecedencia: string;
	forca: string;
	link: string;
	chave: string;
}

function lerSazonalidade(
	j: Record<string, unknown> | null,
	citadas: Set<string>,
	epocaForte: string,
): { itens: DataDoAno[]; observacao: string; epocaForte: string } {
	const itens = listaDe(j, 'datas', 'calendario', 'sazonalidade', 'itens')
		.map((d, i) => {
			const nome = campo(d, 'data', 'nome', 'evento', 'ocasiao');
			const mesTxt = campo(d, 'mes', 'periodo', 'quando');
			const mes = mesDe(mesTxt, nome);
			return {
				nome,
				mes,
				rotuloMes: mesTxt || (mes < 12 ? (MESES[mes] as string) : ''),
				vende: campo(d, 'o_que_vende', 'produtos', 'o_que_puxa', 'demanda'),
				antecedencia: campo(
					d,
					'antecedencia',
					'quando_comecar',
					'antecedencia_venda',
					'preparar_com',
				),
				forca: campo(d, 'forca', 'intensidade', 'peso'),
				link: provaDe(d, citadas, 'url', 'evidencia_url', 'link'),
				chave: `${nome.slice(0, 24)}-${i}`,
			};
		})
		.filter((d) => d.nome)
		.sort((a, b) => a.mes - b.mes);
	return { itens, observacao: observacaoDe(j), epocaForte };
}

function CalendarioDoAno({
	itens,
	epocaForte,
}: {
	itens: DataDoAno[];
	epocaForte: string;
}) {
	return (
		<>
			{/* O Analista de Demanda também apura época forte, num campo só
			    (`epoca_forte`) que até aqui não tinha uma linha na tela. Ele entra
			    como abertura do calendário: é a mesma pergunta, com outra origem.

			    E É UM CAMPO, NÃO UMA FRASE DE RESSALVA — a diferença decide o que
			    acontece no modo Rápido. Nos runs frios de produto o Analista de
			    Demanda devolveu `epoca_forte: "não identificado"`, a ausência
			    escrita, e a tela imprimia "O que o time viu de época forte: não
			    identificado" — a única linha de uma ETAPA NUMERADA inteira, porque
			    no Rápido não rodam Sazonalidade, Público nem Venda Direta. Hoje
			    `frase` descarta a ausência escrita e a etapa some junto, que é a
			    mesma regra já aplicada duas vezes neste arquivo ("uma etapa
			    numerada sem nada embaixo é pior que a ausência da etapa").
			    Ressalva ESCRITA continua na tela: "procurei e o ramo não tem data
			    forte" é uma frase, passa por `SEM_DADO` inteira e sobrevive. */}
			{epocaForte ? (
				<p className="mb-4 rounded-xl border border-white/8 bg-white/[0.02] p-3 text-[12.5px] leading-relaxed text-slate-300">
					<span className="text-slate-500">
						O que o time viu de época forte:{' '}
					</span>
					{epocaForte}
				</p>
			) : null}

			{itens.length > 0 ? (
				<ol className="space-y-2">
					{itens.map((d) => (
						<li
							key={d.chave}
							className="flex flex-col gap-2 rounded-xl border border-white/8 bg-white/[0.02] p-3 sm:flex-row sm:items-baseline sm:gap-4"
						>
							<span className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-wider text-[var(--screen-accent)]">
								{d.rotuloMes || '—'}
							</span>
							<div className="min-w-0 flex-1">
								<p className="text-[13.5px] font-semibold leading-snug text-slate-100">
									{d.nome}
									{d.forca ? (
										<span className="ml-2 text-[11px] font-normal text-slate-500">
											· {d.forca}
										</span>
									) : null}
								</p>
								{d.vende ? (
									<p className="mt-0.5 text-[12.5px] leading-snug text-slate-400">
										{d.vende}
									</p>
								) : null}
								{d.antecedencia ? (
									<p className="mt-0.5 text-[12px] leading-snug text-emerald-200/85">
										Comece a produzir: {d.antecedencia}
									</p>
								) : null}
							</div>
							{d.link ? (
								<a
									href={d.link}
									target="_blank"
									rel="noopener noreferrer"
									className="flex shrink-0 items-center gap-1 text-[11px] text-slate-500 transition-colors hover:text-[var(--screen-accent)]"
								>
									{dominio(d.link)}
									<ExternalLink className="h-3 w-3" />
								</a>
							) : null}
						</li>
					))}
				</ol>
			) : null}
		</>
	);
}

/* ─────────── COMO AS PESSOAS PROCURAM (Analista de Busca) ─────────── */

interface Termo {
	termo: string;
	volume: string;
	briga: string;
	link: string;
}

function lerTermos(
	j: Record<string, unknown> | null,
	citadas: Set<string>,
): {
	itens: Termo[];
	padrao: string;
	exemplos: string[];
	observacao: string;
} {
	const vistos = new Set<string>();
	const itens: Termo[] = [];
	const por = (t: Termo) => {
		const k = classe(t.termo);
		if (!k || vistos.has(k)) return;
		vistos.add(k);
		itens.push(t);
	};

	for (const o of listaDe(
		j,
		'termos',
		'palavras_chave',
		'keywords',
		'buscas',
	)) {
		const link = provaDe(o, citadas, 'url', 'evidencia_url', 'link');
		por({
			termo: campo(o, 'termo', 'palavra', 'busca', 'keyword', 'nome'),
			// Volume de busca é o campo que um modelo mais preenche por
			// plausibilidade: sem a página que o mostre, não aparece.
			volume: link ? campo(o, 'volume', 'buscas_mes', 'volume_busca') : '',
			briga: campo(o, 'concorrencia', 'disputa', 'dificuldade'),
			link,
		});
	}
	/**
	 * O contrato pede lista de objetos e o modelo devolve lista de FRASES com
	 * frequência — `palavras_chave: ["chaveiro personalizado", ...]`. Descartar
	 * seria jogar fora a resposta inteira do especialista por causa da forma.
	 */
	for (const c of ['termos', 'palavras_chave', 'keywords'] as const) {
		for (const t of apenasTextos(j?.[c])) {
			por({ termo: t, volume: '', briga: '', link: '' });
		}
	}

	return {
		itens: itens.filter((t) => t.termo),
		padrao: frase(
			j?.padrao_titulo ?? j?.como_escrever ?? j?.padrao ?? j?.formula_titulo,
			600,
		),
		exemplos: apenasTextos(
			j?.exemplos_titulo ?? j?.exemplos ?? j?.titulos_que_vendem,
		),
		observacao: observacaoDe(j),
	};
}

/** Termo de busca que se copia com um clique — é o que vai no título do anúncio. */
function ChipTermo({ t }: { t: Termo }) {
	const [copiado, setCopiado] = useState(false);
	const copiar = async () => {
		try {
			await navigator.clipboard.writeText(t.termo);
			setCopiado(true);
			setTimeout(() => setCopiado(false), 1500);
		} catch {
			// área de transferência bloqueada — o termo continua selecionável
		}
	};
	return (
		<button
			type="button"
			onClick={copiar}
			className="group inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-left transition-colors hover:border-[var(--screen-accent)]/40"
		>
			<Search className="h-3 w-3 shrink-0 text-slate-600" />
			<span className="text-[12.5px] text-slate-200">{t.termo}</span>
			{t.volume ? (
				<span className="font-mono text-[11px] tabular-nums text-slate-500">
					{t.volume}
				</span>
			) : null}
			{t.briga ? (
				<span className="text-[10px] uppercase tracking-wider text-slate-600">
					{t.briga}
				</span>
			) : null}
			{copiado ? (
				<Check className="h-3 w-3 shrink-0 text-emerald-400" />
			) : (
				<Copy className="h-3 w-3 shrink-0 text-slate-700 transition-colors group-hover:text-slate-400" />
			)}
		</button>
	);
}

/* ─────────── DO QUE RECLAMAM (Analista de Reclamações) ─────────── */

interface Reclamacao {
	queixa: string;
	produto: string;
	frequencia: string;
	promessa: string;
	link: string;
	chave: string;
}

/**
 * QUÃO SEGUIDO A QUEIXA APARECE, em português.
 *
 * O contrato pede um enum (`muito` | `as_vezes` | `pontual`) e a tela imprimia o
 * valor cru ao lado do nome do produto: nos runs gravados de mercado saiu
 * "Placa Pix Personalizada Acrílico Com Suporte · as_vezes". Underscore na tela
 * paga é a mesma falha de `SINAL_BRECHA`, e os outros dois valores não são
 * melhores — "Kit Brinde Ecológico · muito" não diz muito O QUÊ.
 *
 * Valor fora da lista continua passando (modelo escreve prosa em campo de enum);
 * o que não passa é token, e disso já cuida `frase`.
 */
const FREQ_RECLAMACAO: Record<string, string> = {
	muito: 'reclamação frequente',
	as_vezes: 'reclamação de vez em quando',
	pontual: 'reclamação pontual',
	raro: 'reclamação rara',
};

/**
 * A queixa do cliente do concorrente é a promessa de quem entra.
 *
 * Junta DUAS origens: o especialista de reclamações da onda 2 (que vai atrás das
 * avaliações dos produtos que a onda 1 achou) e o campo `reclamacoes_comuns` do
 * Analista de Concorrência — que existe desde o começo, é cobrado em todo run de
 * produto e nunca teve uma linha na tela, porque o bloco dele em
 * `BLOCOS_DO_TIME` só imprime `vendedores`.
 */
function lerReclamacoes(
	j: Record<string, unknown> | null,
	jConcorrencia: Record<string, unknown> | null,
	citadas: Set<string>,
): { itens: Reclamacao[]; observacao: string } {
	const vistas = new Set<string>();
	const itens: Reclamacao[] = [];
	const por = (r: Reclamacao) => {
		const k = classe(r.queixa).slice(0, 60);
		if (!k || vistas.has(k)) return;
		vistas.add(k);
		itens.push(r);
	};

	for (const [i, o] of listaDe(
		j,
		'reclamacoes',
		'queixas',
		'itens',
	).entries()) {
		const queixa = campo(
			o,
			'queixa',
			'reclamacao',
			'problema',
			'o_que_reclamam',
		);
		por({
			queixa,
			produto: campo(o, 'produto', 'item', 'sobre'),
			frequencia: (() => {
				const f = campo(o, 'frequencia', 'recorrencia', 'quantas_vezes');
				return FREQ_RECLAMACAO[classe(f)] ?? f;
			})(),
			promessa: campo(
				o,
				'o_que_prometer',
				'promessa',
				'como_ganhar',
				'oportunidade',
			),
			link: provaDe(o, citadas, 'url', 'evidencia_url', 'link'),
			chave: `${queixa.slice(0, 24)}-${i}`,
		});
	}
	for (const [i, t] of apenasTextos(j?.reclamacoes).entries()) {
		por({
			queixa: t,
			produto: '',
			frequencia: '',
			promessa: '',
			link: '',
			chave: `txt-${i}`,
		});
	}
	for (const [i, t] of apenasTextos(
		jConcorrencia?.reclamacoes_comuns,
	).entries()) {
		por({
			queixa: t,
			produto: '',
			frequencia: '',
			promessa: '',
			link: '',
			chave: `conc-${i}`,
		});
	}

	return { itens: itens.filter((r) => r.queixa), observacao: observacaoDe(j) };
}

function DoQueReclamam({ itens }: { itens: Reclamacao[] }) {
	return (
		<ul className="grid gap-3 sm:grid-cols-2">
			{itens.slice(0, 10).map((r) => (
				<li
					key={r.chave}
					className="flex flex-col gap-2 rounded-xl border border-white/8 bg-white/[0.02] p-4"
				>
					<div className="flex items-start gap-2">
						<ThumbsDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
						<p className="min-w-0 text-[13px] leading-snug text-amber-100/90">
							{r.queixa}
						</p>
					</div>
					{r.produto || r.frequencia ? (
						<p className="text-[11px] text-slate-500">
							{[r.produto, r.frequencia].filter(Boolean).join(' · ')}
						</p>
					) : null}
					{r.promessa ? (
						<p className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] p-2.5 text-[12.5px] leading-snug text-emerald-200/90">
							<ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
							<span className="min-w-0">{r.promessa}</span>
						</p>
					) : null}
					{r.link ? <LinkProva url={r.link} /> : null}
				</li>
			))}
		</ul>
	);
}

/* ─────────── QUANTO O FRETE COME (Analista de Logística) ─────────── */

interface LinhaFrete {
	produto: string;
	peso: string;
	dimensoes: string;
	fragilidade: string;
	canal: string;
	frete: number | null;
	link: string;
	chave: string;
}

/** "1200 g", "1,2 kg" ou o número puro — sai sempre legível. */
function pesoDe(o: Record<string, unknown>): string {
	const txt = campo(o, 'peso', 'peso_txt');
	if (txt) return txt;
	const g = numeroDe(o, 'peso_g', 'peso_gramas');
	if (g !== null && g > 0) {
		return g >= 1000
			? `${(g / 1000).toFixed(1).replace('.', ',')} kg`
			: `${Math.round(g)} g`;
	}
	const kg = numeroDe(o, 'peso_kg');
	return kg !== null && kg > 0 ? `${kg.toFixed(1).replace('.', ',')} kg` : '';
}

function lerFrete(
	j: Record<string, unknown> | null,
	citadas: Set<string>,
): { itens: LinhaFrete[]; observacao: string } {
	const itens = listaDe(j, 'itens', 'produtos', 'fretes', 'linhas')
		.map((o, i) => {
			const link = provaDe(o, citadas, 'url', 'evidencia_url', 'simulacao_url');
			const frete = numeroDe(o, 'frete_brl', 'custo_frete_brl', 'frete');
			const produto = campo(o, 'produto', 'item', 'nome');
			return {
				produto,
				peso: pesoDe(o),
				dimensoes: campo(o, 'dimensoes', 'medidas', 'volume', 'caixa'),
				fragilidade: campo(o, 'fragilidade', 'risco_quebra', 'cuidado'),
				canal: campo(o, 'canal', 'marketplace', 'transportadora'),
				/**
				 * O frete em reais é NÚMERO DE DECISÃO — é com ele que a pessoa
				 * desiste ou não de vender um item volumoso. Sem a página (tabela do
				 * canal, simulação) ele não aparece: a linha fica com peso, medida e
				 * fragilidade, que é o que o especialista consegue afirmar sem
				 * calculadora.
				 *
				 * ┌─ A PORCENTAGEM DO PREÇO NÃO É LIDA AQUI, E NÃO É ESQUECIMENTO ──┐
				 * │ Havia um leitor de `come_pct` e uma barrinha "do preço" ao lado  │
				 * │ do valor. O campo NUNCA chegou: nenhum `saida` do roster o pede, │
				 * │ e a pergunta do Analista de Frete não o menciona. O dono do      │
				 * │ motor decidiu que ele não vai passar a existir, e a razão é a    │
				 * │ regra nº 3 desta tela: a fatia é uma DIVISÃO (frete ÷ preço de   │
				 * │ venda), e número dividido por modelo não entra. Fazer a conta em │
				 * │ TypeScript também não fecha — o numerador é o frete DESTE item   │
				 * │ (com página) e o denominador teria que ser o preço DAQUELE       │
				 * │ produto com página, que o frete não traz; casar por nome com a   │
				 * │ faixa de outro especialista é o casamento frouxo que             │
				 * │ `custoDoProduto` recusa quando é ambíguo.                        │
				 * │ ⇒ leitor de campo que nunca chega é promessa em código morto.    │
				 * │   Se o motor um dia produzir a fatia com as duas pontas          │
				 * │   apuradas, ela volta com a barra e com a frase, juntas.         │
				 * └──────────────────────────────────────────────────────────────────┘
				 */
				frete: link && frete !== null && frete > 0 ? frete : null,
				link,
				chave: `${produto.slice(0, 24)}-${i}`,
			};
		})
		.filter((o) => o.produto || o.peso || o.dimensoes);
	return { itens, observacao: observacaoDe(j) };
}

function QuantoOFreteCome({ itens }: { itens: LinhaFrete[] }) {
	/**
	 * NENHUM valor de frete apurado é caso à parte, e é o caso COMUM.
	 *
	 * Nos runs gravados de mercado a tabela veio com oito, nove, dez linhas — e
	 * `não apurado` em TODAS elas, porque marketplace não publica frete fixo por
	 * produto (o valor depende do CEP). Repetir dez vezes a mesma etiqueta âmbar
	 * numa coluna que nunca tem número não informa, na décima vez, nada que já
	 * não tenha informado na primeira: vira ruído em cima do que a seção de fato
	 * apurou, que é PESO, DIMENSÃO e FRAGILIDADE de cada item — a informação que
	 * decide se um produto de boa margem continua bom depois de despachado.
	 *
	 * Então a coluna inteira sai e a ausência é dita UMA vez, em português, no
	 * topo. Some a repetição, não o fato: a regra nº 4 continua valendo palavra
	 * por palavra — nenhum número aparece, nada vira zero nem traço. Com um
	 * único valor apurado que seja, a coluna volta, e aí o `não apurado` das
	 * outras linhas é contraste, não refrão.
	 */
	const semNenhumFrete = itens.every((f) => f.frete === null);

	return (
		<ul className="space-y-2">
			{semNenhumFrete ? (
				<li className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-[12.5px] leading-relaxed text-amber-200/85">
					O time não achou o valor do frete de nenhum destes itens numa página
					que o mostre — nos marketplaces ele depende do CEP de quem compra. O
					que dá para usar agora é o peso e o tamanho de cada um: são eles que
					dizem quais produtos ficam caros de despachar.
				</li>
			) : null}
			{itens.slice(0, 10).map((f) => (
				<li
					key={f.chave}
					className="flex flex-col gap-2 rounded-xl border border-white/8 bg-white/[0.02] p-3 sm:flex-row sm:items-center sm:gap-4"
				>
					<div className="min-w-0 flex-1">
						<p className="text-[13.5px] font-semibold leading-snug text-slate-100">
							{f.produto || 'Item sem nome'}
						</p>
						<p className="mt-0.5 text-[11.5px] leading-snug text-slate-500">
							{[f.peso, f.dimensoes, f.canal].filter(Boolean).join(' · ') ||
								'medidas não apuradas'}
						</p>
						{f.fragilidade ? (
							<p className="mt-0.5 text-[11.5px] leading-snug text-amber-300/80">
								{f.fragilidade}
							</p>
						) : null}
					</div>

					{semNenhumFrete ? null : (
						<div className="flex shrink-0 items-center gap-4">
							<div className="text-right">
								<p className="text-[10px] uppercase tracking-wider text-slate-600">
									Frete
								</p>
								{f.frete !== null ? (
									<p className="font-mono text-[14px] font-bold tabular-nums text-slate-50">
										{reais(f.frete)}
									</p>
								) : (
									<p className="text-[11px] font-semibold text-amber-300">
										não apurado
									</p>
								)}
							</div>
						</div>
					)}

					{f.link ? (
						<a
							href={f.link}
							target="_blank"
							rel="noopener noreferrer"
							className="flex shrink-0 items-center gap-1 text-[11px] text-slate-500 transition-colors hover:text-[var(--screen-accent)]"
						>
							{dominio(f.link)}
							<ExternalLink className="h-3 w-3" />
						</a>
					) : null}
				</li>
			))}
		</ul>
	);
}

/* ─────── ONDE COMPRAR A PEÇA EM BRANCO (Analista de Fornecedores) ─────── */

interface Fornecedor {
	loja: string;
	vende: string;
	preco: number | null;
	unidade: string;
	prazo: string;
	minimo: string;
	uf: string;
	pf: boolean | null;
	link: string;
	chave: string;
}

function lerFornecedores(
	j: Record<string, unknown> | null,
	citadas: Set<string>,
): { itens: Fornecedor[]; observacao: string } {
	const itens = listaDe(j, 'fornecedores', 'lojas', 'itens')
		.map((o, i) => {
			const link = provaDe(o, citadas, 'url', 'site', 'link', 'loja_url');
			const preco = numeroDe(o, 'preco_brl', 'preco', 'a_partir_de_brl');
			const loja = campo(o, 'loja', 'nome', 'fornecedor', 'empresa');
			return {
				loja,
				vende: campo(o, 'o_que_vende', 'produtos', 'itens', 'catalogo'),
				preco: link && preco !== null && preco > 0 ? preco : null,
				unidade: campo(o, 'unidade', 'unidade_compra', 'embalagem'),
				prazo: campo(o, 'prazo', 'prazo_entrega', 'entrega'),
				minimo: campo(o, 'pedido_minimo', 'minimo', 'quantidade_minima'),
				uf: campo(o, 'uf', 'estado', 'cidade', 'onde_fica'),
				pf: booleanoDe(o.vende_pf ?? o.pessoa_fisica ?? o.atende_pf),
				link,
				chave: `${loja.slice(0, 24)}-${i}`,
			};
		})
		.filter((o) => o.loja);
	return { itens, observacao: observacaoDe(j) };
}

function OndeComprar({ itens }: { itens: Fornecedor[] }) {
	return (
		<ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
			{itens.slice(0, 9).map((f) => (
				<li
					key={f.chave}
					className="flex flex-col gap-2 rounded-xl border border-white/8 bg-white/[0.02] p-4"
				>
					<div className="flex items-start justify-between gap-2">
						<p className="min-w-0 text-[14px] font-semibold leading-snug text-slate-100">
							{f.loja}
						</p>
						{f.preco !== null ? (
							<span className="shrink-0 font-mono text-[13px] font-bold tabular-nums text-slate-50">
								{reais(f.preco)}
							</span>
						) : null}
					</div>

					{f.vende ? (
						<p className="text-[12.5px] leading-snug text-slate-400">
							{f.vende}
						</p>
					) : null}

					<div className="flex flex-wrap items-center gap-1.5">
						{f.pf === true ? (
							<Selo tom="bom">vende para pessoa física</Selo>
						) : f.pf === false ? (
							<Selo tom="aviso">só para CNPJ</Selo>
						) : null}
						{f.uf ? (
							<span className="text-[11px] text-slate-500">· {f.uf}</span>
						) : null}
					</div>

					<dl className="space-y-1 text-[12px] leading-snug">
						{(
							[
								['Vendido em', f.unidade],
								['Prazo', f.prazo],
								['Pedido mínimo', f.minimo],
							] as [string, string][]
						).map(([rot, val]) =>
							val ? (
								<div key={rot} className="flex gap-2">
									<dt className="shrink-0 text-slate-600">{rot}:</dt>
									<dd className="min-w-0 text-slate-400">{val}</dd>
								</div>
							) : null,
						)}
					</dl>

					{f.link ? (
						<LinkProva url={f.link} rot="ver em" />
					) : (
						/* Sem página, o preço já não apareceu; a loja continua porque
						   saber o NOME de quem vende a peça em branco é meio caminho. */
						<SemProva />
					)}
				</li>
			))}
		</ul>
	);
}

/* ─────────────────────────── o dossiê ─────────────────────────── */

export function Dossie({
	output,
	tipo = 'produto',
	toolKey,
	onNovaAnalise,
	onAtualizarPesquisa,
	onOrcamentoExato,
}: DossieProps) {
	const ficha = (output.ficha ?? {}) as Record<string, unknown>;
	const agentes = (output.agentes ?? []) as Record<string, unknown>[];
	// `Array.isArray` e não `??`: a lista de fontes agora é percorrida DUAS vezes
	// (a etapa "Todas as fontes" e o conjunto de conferência abaixo), e um
	// `output.fontes` que não seja array — replay de um dossiê antigo, campo
	// remapeado na Fábrica — derrubaria a página inteira em vez de uma seção.
	const fontes = (Array.isArray(output.fontes) ? output.fontes : []) as {
		url: string;
		title?: string;
	}[];
	const ps = output.price_stats as Record<string, number> | null;
	const confiavel = output.preco_confiavel === true;
	const obs = (output.observacoes ?? []) as {
		brlCents: number;
		url: string;
		title?: string;
	}[];
	const avisos = (output.avisos ?? []) as string[];
	const falhas = (output.falhas ?? []) as { nome: string; erro: string }[];

	const jsonDe = (chave: string) =>
		(agentes.find((a) => a.chave === chave)?.json ?? null) as Record<
			string,
			unknown
		> | null;
	/**
	 * A FICHA inteira do especialista, não só o JSON dele.
	 *
	 * O bloco do custo precisa saber quantas páginas aquele profissional abriu
	 * (`n_fontes`) para decidir se o que ele escreveu pode virar número na tela —
	 * é o mesmo dado que a sala de guerra usa para dizer "OK · 3 fontes". O
	 * `do_cache` já não entra nessa decisão; ele só troca a frase do aviso, porque
	 * "não abriu página nesta execução" e "a pesquisa reaproveitada não registrou
	 * quantas ele abriu" são coisas diferentes para quem lê.
	 */
	const agenteDe = (chave: string) =>
		agentes.find((a) => a.chave === chave) ?? null;
	/**
	 * AS PÁGINAS QUE ESTE DOSSIÊ REGISTROU.
	 *
	 * Vem de `output.fontes`, que o bloco monta como união das citações desta
	 * execução com as do cache reaproveitado — a mesma lista que o servidor usa
	 * para julgar os links do Curador, e a mesma que a etapa "Todas as fontes"
	 * imprime.
	 *
	 * NÃO é o conjunto com que o servidor julga o CUSTO: lá ele confere contra as
	 * citações do próprio Analista de Margem quando ele rodou agora, e a união é
	 * um conjunto maior. Onde os dois julgam o mesmo número, quem manda é o
	 * veredito do servidor — ver `custosUsados` logo abaixo e `CustoDoMaterial`.
	 *
	 * ONDE ELA MANDA, e por quê — a fronteira é deliberada:
	 *   · "Quanto custa o material": é o piso da conferência de cada preço de
	 *     insumo, o que a tela consegue provar sozinha (a página está entre as que
	 *     este dossiê registrou).
	 *   · os links de prova de "O que o time apurou": prova nova nasce conferida
	 *     ou não nasce. Link que ninguém abriu não é fonte, é texto plausível.
	 *   · as brechas: o `<a>` de lá diz "a prova em <domínio>", e a palavra
	 *     "prova" é a afirmação que obriga a conferência. Passou a valer nesta
	 *     rodada; ver o cabeçalho de `Brechas` para o que acontece com a brecha
	 *     cujo link não está entre as fontes (ela fica, sem clique e sem preço).
	 *
	 * ONDE ELA NÃO MANDA, e por quê: no card do ranking (`CardProduto`), cujo
	 * link é rotulado "ver anúncio em X" — convite a olhar, não afirmação sobre o
	 * conteúdo da página — e que é a MESMA página de onde o motor baixou a
	 * `og:image` do card (ver `imagemDe`), ou seja uma página que alguém abriu.
	 * Medido nas execuções gravadas: 60 de 64 links escritos pelos especialistas
	 * estão nas fontes do próprio run, então a conferência não é um filtro que
	 * apaga dossiê — é um filtro que apaga invenção.
	 */
	const citadas = urlsCitadas(fontes);

	const est = jsonDe('estrategista');
	const aud = jsonDe('auditor');
	const nota = Number(est?.nota);
	/**
	 * "Não tem nota" e "nota zero" são coisas diferentes na tela.
	 *
	 * O `?? 0` de antes achatava as duas: quando o Estrategista falhava — e ele
	 * falha de verdade, o JSON dele vem truncado quando estoura o teto de token —
	 * o herói estampava o selo VERMELHO "Difícil". Ou seja, um veredito negativo
	 * que nenhum agente escreveu, na maior tipografia da página, sobre um produto
	 * que talvez valha a pena. É o oposto da regra que sustenta esta tela.
	 */
	const temNota = Number.isFinite(nota);

	// Verde só acima de 65: uma nota morna pintada de verde vira recomendação.
	const tomNota = !temNota
		? { cor: '#64748b', rot: 'sem veredito' }
		: nota >= 65
			? { cor: '#10b981', rot: 'Vale a pena' }
			: nota >= 40
				? { cor: '#f59e0b', rot: 'Com ressalvas' }
				: { cor: '#ef4444', rot: 'Difícil' };

	/**
	 * O HERÓI — as três primeiras linhas que o aluno lê depois de pagar.
	 *
	 * Era o único lugar da tela que imprimia campo de modelo com `String()` cru,
	 * e a conta chegou: sem foto o modelo de visão devolve
	 * `material_provavel: "null"` como STRING, `"null"` é verdadeiro, e o
	 * subtítulo saía `Brinde corporativo · null` embaixo da nota 55/100.
	 * Reproduzido num run frio de `mercado+profundo`.
	 *
	 * Agora os três passam pelo mesmo funil do resto do dossiê (`campo`/`frase`),
	 * e a linha da ficha é montada por junção em vez de concatenação: cada pedaço
	 * que não existe simplesmente não entra, e sem nenhum pedaço a linha inteira
	 * some — em vez de sobrar um " · " órfão no começo dela.
	 */
	// `frase` com `TETO_PROSA`, e não `campo`: o que se lê aqui é o parágrafo de
	// abertura do dossiê, e o teto de rótulo de `campo` o cortaria no meio.
	const veredito = frase(est?.veredito, TETO_PROSA) || 'Análise concluída';
	const resumoDoVeredito =
		frase(est?.resumo_simples, TETO_PROSA) || frase(est?.por_que, TETO_PROSA);
	const legendaDaFicha = [
		campo(ficha, 'produto'),
		campo(ficha, 'material_provavel'),
		output.cache_quente
			? `pesquisa de mercado de ${
					typeof output.cache_idade_dias === 'number'
						? output.cache_idade_dias
						: 0
				} dia(s) atrás`
			: '',
	]
		.filter(Boolean)
		.join(' · ');

	const precoSugerido = (est?.preco_sugerido ?? null) as Record<
		string,
		unknown
	> | null;
	const redator = jsonDe('redator');
	/**
	 * O plano dos 7 dias, já como TEXTO — e sem os dias que não têm ação.
	 *
	 * Era a única lista desta tela montada com `as` e impressa crua. Duas coisas
	 * saíam disso: um objeto no lugar da string derruba o render inteiro do React
	 * dentro de um dossiê pago, e um dia com a ausência escrita virava um item
	 * numerado com nada ao lado. Agora passa pelo mesmo funil do resto (`frase`)
	 * e o dia sem ação não vira linha — que é a mesma regra das etapas.
	 */
	const plano = comoLista(est?.plano_7_dias)
		.map((p, i) => {
			const o = (p && typeof p === 'object' ? p : {}) as Record<
				string,
				unknown
			>;
			const dia = Number(o.dia);
			return {
				dia: Number.isFinite(dia) && dia > 0 ? dia : i + 1,
				acao: frase(typeof p === 'string' ? p : o.acao, TETO_PROSA),
			};
		})
		.filter((p) => p.acao);
	/**
	 * Quem respondeu, não em que modo o aluno clicou. Ver `BLOCOS_DO_TIME`: o
	 * gate por modo apagava `demanda` e `concorrencia` no caminho padrão da
	 * ferramenta, e os dois rodam e são cobrados lá.
	 */
	const apurados = BLOCOS_DO_TIME.map((b) => ({
		...b,
		j: jsonDe(b.chave),
	})).filter((b) => b.j);

	const justo = Number(precoSugerido?.justo_brl);
	const canal = canalDeEntrada(jsonDe);

	/**
	 * Por qual produto começar — a lista existe quando o CURADOR respondeu.
	 *
	 * O gate era `tipo === 'mercado'`, pela mesma razão de sempre ("no escopo
	 * produto o aluno já trouxe a peça") e com o mesmo defeito de sempre: quem
	 * decide se o Curador roda é o `escopo` dele no roster, que é dado editável
	 * pela Fábrica. Trocá-lo para `ambos` faria o trabalho dele ser cobrado e não
	 * ter uma linha na tela — foi assim com `demanda`, `concorrencia` e
	 * `marketplaces`. O servidor já não preenche `produtos_para_comecar` quando o
	 * Curador não está no time (`normalizarProdutos(undefined)` devolve `[]`), e
	 * `produtos_observacao` vem vazia pelo mesmo caminho, então a lista some
	 * sozinha no escopo produto de hoje — sem gate nenhum.
	 */
	const comecar = paraComecarDe(
		output.produtos_para_comecar,
		output.produtos_observacao,
	);

	/**
	 * O CUSTO QUE ESTE DOSSIÊ USOU NA CONTA DA SOBRA — o veredito do servidor,
	 * do jeito que ele chega à tela.
	 *
	 * `custo_fonte_url` é a página que sustentou a "sobra para você" de cada card
	 * (`normalizarProdutos` no servidor). Quando há card na tela, o custo por peça
	 * do bloco lá embaixo tem que repetir esse veredito em vez de julgar de novo
	 * por um critério mais frouxo — foi assim que a mesma página saiu reprovada no
	 * card ("Sobra para você: não apurado") e aprovada no bloco ("R$ 79,90", com
	 * link), na mesma rolagem.
	 *
	 * `null` quando não há card nenhum: aí o servidor não afirma nada na tela e
	 * não há o que contradizer. Ver `CustoDoMaterial`, onde a fronteira é aplicada
	 * só aos insumos que são candidatos a custo por peça — os únicos que o
	 * servidor julga.
	 */
	const custosUsados =
		comecar.itens.length > 0
			? new Set(
					comecar.itens
						.map((p) => chaveDeUrl(p.custo_fonte_url))
						.filter((k) => k.length > 0),
				)
			: null;

	/**
	 * OS BOXES DA BUSCA PROFUNDA — lidos AQUI, e não dentro de cada componente.
	 *
	 * A leitura precisa acontecer antes de `secoes` porque é ela que decide se a
	 * etapa existe: seção sem dado não é montada NEM entra no índice, e um
	 * cabeçalho numerado com nada embaixo é pior que a ausência da etapa. Quem
	 * julgasse isso dentro do componente devolveria `null` tarde demais — a
	 * numeração e o índice já estariam montados com uma etapa fantasma.
	 *
	 * É o mesmo desenho de `paraComecarDe`, pela mesma razão.
	 */
	const concorrentes = lerConcorrentes(jsonDe('concorrente_perfil'), citadas);
	const campeoes = lerCampeoes(jsonDe('concorrente_portfolio'), citadas);
	const gruposDeCampeoes = agruparPorLoja(campeoes.itens);
	const galeria = lerGaleria(
		jsonDe,
		citadas,
		comecar.itens,
		obs,
		Object.fromEntries(
			agentes.map((a) => [String(a.chave ?? ''), a.json]).filter(([k]) => k),
		),
	);
	/**
	 * A GALERIA DEPOIS DO CARREGAMENTO — o que de fato apareceu, e não o que foi
	 * capturado.
	 *
	 * `lerGaleria` conta o que este dossiê capturou; o navegador é quem diz o que
	 * carregou. Marketplace bloqueia hotlink e página velha sai do ar, então a
	 * diferença existe — e quando ela zera a lista, o que ficava na tela era a
	 * caixa "As fotos que o time capturou" com o parágrafo "clique em qualquer uma
	 * para abrir a página de onde ela saiu", um "2 imagens" no cabeçalho da etapa
	 * e NENHUMA foto embaixo. É a mesma leitura de "as imagens não estão
	 * aparecendo" que reprovou esta tela, agora produzida pela própria tela.
	 *
	 * O estado mora AQUI, e não dentro da grade, porque quem depende dele não é só
	 * a grade: a contagem do cabeçalho e a existência da etapa também.
	 */
	const [fotosMortas, setFotosMortas] = useState<Set<string>>(
		() => new Set<string>(),
	);
	const galeriaViva = galeria.itens.filter(
		(r) => !fotosMortas.has(chaveDeUrl(r.imagem)),
	);
	const matarFoto = (imagem: string) =>
		setFotosMortas((antes) => {
			const k = chaveDeUrl(imagem);
			if (antes.has(k)) return antes;
			const novo = new Set(antes);
			novo.add(k);
			return novo;
		});
	/**
	 * O Curador de Imagens, separado da grade — ver o cabeçalho de `lerGaleria`.
	 * A `imagem_url` dele é invenção por construção; o que ele apurou de produto e
	 * de "o que olhar na foto" é texto conferível e continua na tela.
	 */
	const refsDeProduto = lerReferenciasDeProduto(
		jsonDe('referencias_visuais'),
		citadas,
	);
	const publico = lerPublico(jsonDe('publico'), citadas);
	/** O 22º especialista. Ver `lerCompradores`: ele não tinha ponto de render. */
	const compradores = lerCompradores(jsonDe('venda_direta'), citadas);
	const calendario = lerSazonalidade(
		jsonDe('sazonalidade'),
		citadas,
		frase(jsonDe('demanda')?.epoca_forte, 300),
	);
	const busca = lerTermos(jsonDe('palavras_chave'), citadas);
	const reclamacoes = lerReclamacoes(
		jsonDe('reclamacoes'),
		jsonDe('concorrencia'),
		citadas,
	);
	const frete = lerFrete(jsonDe('frete_logistica'), citadas);
	const fornecedores = lerFornecedores(jsonDe('fornecedores'), citadas);

	/**
	 * Cada etapa existe se QUALQUER um dos especialistas dela trouxe alguma
	 * coisa — item OU a frase de ressalva.
	 *
	 * A ressalva conta de propósito: "procurei e o ramo não tem data forte" é
	 * resposta, foi paga, e some junto com a seção se o critério for só a
	 * contagem de itens. Foi assim que a única frase que sobrou do Curador quase
	 * se perdeu (ver `semProdutosPorque`).
	 */
	const temConcorrentes =
		concorrentes.itens.length > 0 ||
		campeoes.itens.length > 0 ||
		Boolean(concorrentes.observacao || campeoes.observacao);
	const temGaleria =
		galeriaViva.length > 0 ||
		refsDeProduto.itens.length > 0 ||
		Boolean(refsDeProduto.observacao);
	const temPublico =
		publico.itens.length > 0 ||
		calendario.itens.length > 0 ||
		compradores.itens.length > 0 ||
		Boolean(
			publico.observacao ||
				calendario.observacao ||
				calendario.epocaForte ||
				compradores.observacao,
		);
	const temAnuncio =
		busca.itens.length > 0 ||
		busca.exemplos.length > 0 ||
		reclamacoes.itens.length > 0 ||
		Boolean(busca.padrao || busca.observacao || reclamacoes.observacao);
	const temOperacao =
		fornecedores.itens.length > 0 ||
		frete.itens.length > 0 ||
		Boolean(fornecedores.observacao || frete.observacao);

	/**
	 * OS ANÚNCIOS QUE O ANALISTA DE PRECIFICAÇÃO ACHOU, quando o servidor não
	 * conseguiu transformá-los em amostra de preço.
	 *
	 * `output.observacoes` é a lista que o SERVIDOR extraiu (só entra anúncio com
	 * preço E link, porque é dela que sai a estatística). Quando o especialista
	 * traz anúncio sem preço, ou com o preço em formato que a extração recusou, a
	 * lista chega vazia — e o trabalho inteiro dele vira o painel âmbar "não achei
	 * anúncios suficientes", sem uma linha do que ele de fato achou. Aqui os
	 * anúncios crus entram como segunda opção — o título é informação por si só.
	 *
	 * O LINK, esse sim, passa por `provaDe`: aqui ele nasce do texto do modelo
	 * sem o servidor ter validado nada, e a regra de prova nova vale igual. Sem
	 * página citada o anúncio vira uma linha sem clique, não um `<a>` para um
	 * endereço que ninguém abriu.
	 */
	const anunciosCrus =
		obs.length === 0
			? listaDe(jsonDe('preco_mercado'), 'anuncios', 'itens')
					.map((a) => ({
						url: provaDe(a, citadas, 'url', 'link'),
						title: campo(a, 'titulo', 'nome', 'loja'),
						preco: numeroDe(a, 'preco_brl', 'preco'),
					}))
					.filter((a) => a.url || a.title)
			: [];

	/* Os números que decidem, na ordem em que o aluno pergunta por eles. */
	const celulas: Celula[] = [];
	if (Number.isFinite(justo) && justo > 0) {
		celulas.push({
			rot: 'Preço justo',
			valor: BRL.format(justo),
			// O preço sugerido é DERIVADO da faixa de mercado. Quando a faixa não se
			// sustenta, o número continua sendo o melhor palpite do time — mas não
			// pode aparecer na maior tipografia da página sem herdar a ressalva do
			// dado que o sustenta, ainda mais colado numa célula que diz "não
			// apurado".
			sub: confiavel
				? 'o que recomendamos cobrar'
				: 'palpite do time — sem faixa de mercado por trás',
			icone: Tag,
			tom: confiavel ? 'accent' : 'aviso',
		});
	}
	celulas.push(
		confiavel && ps
			? {
					rot: 'Faixa de mercado',
					valor: `${money(ps.p25Cents)} – ${money(ps.p75Cents)}`,
					sub: 'onde está a maioria dos anúncios',
					icone: BarChart3,
				}
			: {
					rot: 'Faixa de mercado',
					valor: 'não apurado',
					sub: 'amostra pequena demais para cravar preço',
					icone: AlertTriangle,
					texto: true,
					tom: 'aviso',
				},
	);
	if (canal) {
		celulas.push({
			rot: 'Comece por',
			valor: canal,
			sub: 'canal recomendado pelo time',
			icone: Store,
			texto: true,
		});
	}
	if (ps?.n) {
		celulas.push({
			rot: 'Amostra',
			valor: String(ps.n),
			sub: `anúncio${ps.n === 1 ? '' : 's'} com preço e link`,
			icone: ListChecks,
		});
	}

	const entryId = typeof output.entry_id === 'string' ? output.entry_id : '';
	// Sem `entry_id` não há registro para pendurar a conversa: a caixa some.
	const podePerguntar = Boolean(toolKey && entryId);
	const perguntasRestantes =
		typeof output.perguntas_restantes === 'number'
			? output.perguntas_restantes
			: undefined;

	/**
	 * Repete a regra de dentro de `PrecoSugerido` e `CopyPronto` de propósito:
	 * os dois se recusam a renderizar quando vêm vazios, e sem consultar isso
	 * aqui a etapa viraria um cabeçalho numerado sem nada embaixo — e uma
	 * entrada morta no índice.
	 */
	const temAcao =
		['entrada_brl', 'justo_brl', 'premium_brl'].some(
			(k) => Number(precoSugerido?.[k]) > 0,
		) ||
		(Array.isArray(redator?.titulos) && redator.titulos.length > 0) ||
		(Array.isArray(redator?.bullets) && redator.bullets.length > 0) ||
		plano.length > 0;
	/**
	 * O Curador rodou, não achou produto para indicar e ESCREVEU o motivo.
	 *
	 * A seção "Comece por estes produtos" some inteira quando a lista vem vazia
	 * (uma etapa numerada sem nada embaixo é pior que a ausência dela) — e com ela
	 * sumia a única frase que sobrou de um especialista pago, justamente a que
	 * explica por que não há lista. Ela desce para as ressalvas, que é onde este
	 * dossiê guarda o que ele NÃO conseguiu.
	 */
	const semProdutosPorque =
		comecar.itens.length === 0 ? comecar.observacao : '';

	/**
	 * O QUE O REVISOR DE DADOS APUROU — os TRÊS campos dele, não dois.
	 *
	 * `o_que_falta` está no contrato `saida` da coleção `agentes`, é pago junto
	 * com o resto do Revisor e não tinha um leitor nesta tela: a caixa lia
	 * `confianca_geral` e `sem_fonte` e descartava em silêncio justamente a
	 * lista que responde ao título dela. Provado por render com sentinela nas
	 * quatro combinações: `sem_fonte` aparecia em 4/4, `o_que_falta` em 0/4.
	 *
	 * "Sem fonte" e "falta apurar" não são a mesma frase e por isso não dividem
	 * a mesma lista: a primeira é sobre o que ESTÁ no dossiê e não se sustenta;
	 * a segunda é sobre o que NÃO está — e é a que diz ao aluno o que ele ainda
	 * precisa descobrir sozinho antes de comprar material.
	 */
	const confiancaGeral = CONFIANCA[classe(aud?.confianca_geral)] ?? '';
	const semFonte = comoTextos(aud?.sem_fonte);
	const oQueFalta = comoTextos(aud?.o_que_falta);

	const temRessalvas = Boolean(
		confiancaGeral ||
			semFonte.length > 0 ||
			oQueFalta.length > 0 ||
			falhas.length > 0 ||
			avisos.length > 0 ||
			semProdutosPorque,
	);

	/**
	 * A ordem da página é a ordem da decisão. Esta lista é a única fonte da
	 * numeração das etapas E do índice — assim os dois não têm como discordar
	 * do que está na tela quando uma seção não vem no resultado.
	 */
	const secoes = [
		/**
		 * Primeira, e antes até do "por que esta nota": num ramo, a pergunta do
		 * aluno é "então eu faço o quê?". Some por inteiro — cabeçalho e entrada no
		 * índice — quando o Curador não devolveu produto nenhum, porque uma etapa
		 * numerada sem nada embaixo é pior que a ausência da etapa.
		 */
		...(comecar.itens.length > 0
			? [
					{
						id: 'comecar',
						curto: 'Comece por',
						titulo: 'Comece por estes produtos',
					},
				]
			: []),
		...(est
			? [{ id: 'porque', curto: 'Por quê', titulo: 'Por que esta nota' }]
			: []),
		...(temAcao
			? [{ id: 'acao', curto: 'O que fazer', titulo: 'O que fazer agora' }]
			: []),
		{ id: 'provas', curto: 'Provas', titulo: 'As provas do mercado' },
		/**
		 * AS CINCO ETAPAS DA BUSCA PROFUNDA, na ordem em que a pergunta muda.
		 *
		 * Depois das provas do mercado ("existe mercado, e a que preço?") vem quem
		 * está dentro dele, o que ele parece, para quem se vende, como se anuncia e
		 * o que sai do bolso para operar. Cada uma some inteira quando o
		 * especialista dela não respondeu — nenhuma é decidida por modo ou escopo.
		 *
		 * São CINCO etapas para NOVE especialistas, e não nove etapas: o índice é o
		 * mapa da página e um mapa com dezoito paradas não orienta ninguém,
		 * principalmente no celular. Especialistas que respondem à mesma pergunta
		 * do aluno dividem a etapa e ficam em caixas próprias dentro dela — cada um
		 * continua com o seu ponto de render, que é o que a regra exige.
		 */
		...(temConcorrentes
			? [
					{
						id: 'concorrentes',
						curto: 'Concorrentes',
						titulo: 'Seus concorrentes',
					},
				]
			: []),
		...(temGaleria
			? [
					{
						id: 'galeria',
						curto: 'Referências',
						titulo: 'Galeria de referências',
					},
				]
			: []),
		...(temPublico
			? [
					{
						id: 'publico',
						curto: 'Para quem',
						titulo: 'Para quem vender, e quando',
					},
				]
			: []),
		...(temAnuncio
			? [
					{
						id: 'anuncio',
						curto: 'Como anunciar',
						titulo: 'Como anunciar para vender',
					},
				]
			: []),
		...(temOperacao
			? [
					{
						id: 'operacao',
						curto: 'Operação',
						titulo: 'O que sai do seu bolso',
					},
				]
			: []),
		...(apurados.length > 0
			? [{ id: 'apurado', curto: 'Detalhes', titulo: 'O que o time apurou' }]
			: []),
		{ id: 'fontes', curto: 'Fontes', titulo: 'Todas as fontes' },
		...(temRessalvas
			? [
					{
						id: 'ressalvas',
						curto: 'Ressalvas',
						titulo: 'O que este dossiê NÃO garante',
					},
				]
			: []),
	];
	const etapa = (id: string) => {
		const i = secoes.findIndex((s) => s.id === id);
		return { id, n: i + 1, titulo: secoes[i]?.titulo ?? '' };
	};

	return (
		<div className="dossie-impressao relative min-h-[calc(100vh-4rem)] bg-[#08080a] print:bg-white">
			{/* `lg:pb-28` abre espaço para a barra flutuante não cobrir os botões
			    de ação, que são a última coisa da página. Subiu de 24 quando a barra
			    passou a quebrar em duas linhas no dossiê longo do Profundo.
			    `pb-20` faz o mesmo no celular, agora que a pastilha "Seções" mora no
			    canto de baixo: sem ele, ela cobriria justamente o "Analisar outro
			    produto" — ver `Indice`. */}
			{/* `xl:pr-40` abre a faixa da direita para o índice em pé; `xl:pb-8`
			    devolve o rodapé, que só precisava de folga por causa da barra
			    flutuante — a partir de 1280 px ela não existe mais. */}
			<div className="mx-auto max-w-[1400px] px-4 py-8 pb-20 md:px-8 lg:pb-28 xl:pb-8 xl:pr-40">
				{/* ═══ HERÓI: o veredito e a nota ═══ */}
				<div
					id="veredito"
					className="relative mb-6 scroll-mt-24 overflow-hidden rounded-3xl border border-white/10 p-6 md:p-8"
				>
					<div
						className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full blur-3xl"
						style={{ background: `${tomNota.cor}22` }}
					/>
					<Target
						className="pointer-events-none absolute -bottom-6 -right-4 h-40 w-40 opacity-[0.04]"
						strokeWidth={1}
					/>

					<div className="relative flex flex-col gap-6 md:flex-row md:items-center">
						<div className="flex items-center gap-5">
							<div className="text-center">
								<p
									className="font-display text-6xl font-black leading-none tabular-nums"
									style={{ color: tomNota.cor }}
								>
									{temNota ? nota : '—'}
								</p>
								<p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">
									de 100
								</p>
							</div>
							<div className="h-16 w-px bg-white/10" />
						</div>

						<div className="min-w-0 flex-1">
							<span
								className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
								style={{
									backgroundColor: `${tomNota.cor}1f`,
									color: tomNota.cor,
								}}
							>
								{tomNota.rot}
							</span>
							<h1 className="font-display mt-2 text-xl font-bold leading-snug text-slate-50 md:text-2xl">
								{temNota ? veredito : 'A pesquisa saiu; o veredito não'}
							</h1>
							<p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-slate-300">
								{temNota
									? resumoDoVeredito
									: 'O especialista que dá a nota não conseguiu fechar a conclusão desta vez. Tudo o que o resto do time apurou continua abaixo, e vale — só não há nota nem veredito. Rodar de novo costuma resolver.'}
							</p>
							{legendaDaFicha ? (
								<p className="mt-3 text-[12px] text-slate-500">
									{legendaDaFicha}
								</p>
							) : null}
						</div>
					</div>
				</div>

				{/* ═══ OS NÚMEROS QUE DECIDEM ═══ */}
				<PainelNumeros celulas={celulas} />

				<Indice
					itens={[
						{ id: 'veredito', curto: 'Veredito' },
						...secoes.map((s) => ({ id: s.id, curto: s.curto })),
						...(podePerguntar ? [{ id: 'perguntas', curto: 'Perguntar' }] : []),
					]}
				/>

				{/* ═══ COMECE POR ESTES PRODUTOS ═══ */}
				{comecar.itens.length > 0 ? (
					<Etapa
						{...etapa('comecar')}
						sub={`${comecar.itens.length} produto${
							comecar.itens.length === 1 ? '' : 's'
						}`}
					>
						<ComecePorEstes
							itens={comecar.itens}
							observacao={comecar.observacao}
							citadas={citadas}
						/>
					</Etapa>
				) : null}

				{/* ═══ POR QUE ESTA NOTA ═══ */}
				{est ? (
					<Etapa {...etapa('porque')}>
						<div className="grid gap-4 lg:grid-cols-2">
							<Bloco titulo="A favor" icone="thumbs-up" cor="#10b981">
								<Lista
									itens={(est?.pontos_fortes ?? []) as unknown[]}
									tom="bom"
								/>
							</Bloco>
							<Bloco titulo="Contra" icone="thumbs-down" cor="#f59e0b">
								<Lista
									itens={(est?.pontos_fracos ?? []) as unknown[]}
									tom="ruim"
								/>
							</Bloco>
						</div>
					</Etapa>
				) : null}

				{/* ═══ O QUE FAZER AGORA ═══
				    O preço sugerido vem ANTES da faixa de mercado de propósito: a
				    pergunta do aluno é "por quanto eu vendo?", não "qual a mediana do
				    mercado?". A faixa existe para sustentar esta recomendação, e por
				    isso mora na etapa seguinte, a das provas. */}
				{temAcao ? (
					<Etapa {...etapa('acao')}>
						{precoSugerido ? <PrecoSugerido p={precoSugerido} /> : null}
						{redator ? <CopyPronto c={redator} /> : null}
						{plano.length > 0 ? (
							<section className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
								<div className="mb-4 flex items-center gap-2">
									<CalendarCheck
										className="h-4 w-4"
										style={{ color: 'var(--screen-accent)' }}
									/>
									<h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
										Próximos 7 dias
									</h3>
								</div>
								<ol className="grid gap-2 md:grid-cols-2">
									{plano.map((p, i) => (
										<li
											key={`dia-${p.dia}-${i}`}
											className="flex gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
										>
											<span
												className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono text-[11px] tabular-nums"
												style={{
													backgroundColor:
														'color-mix(in srgb, var(--screen-accent) 14%, transparent)',
													color: 'var(--screen-accent)',
												}}
											>
												{p.dia}
											</span>
											<span className="text-[13px] leading-snug text-slate-300">
												{p.acao}
											</span>
										</li>
									))}
								</ol>
							</section>
						) : null}
					</Etapa>
				) : null}

				{/* ═══ AS PROVAS: o que já está no ar, e por quanto ═══ */}
				<Etapa {...etapa('provas')}>
					{/* Sem gate por escopo: cada bloco aqui dentro só existe se o
					    especialista dele respondeu. Ver `RamoECanais`. */}
					<RamoECanais jsonDe={jsonDe} citadas={citadas} />

					{/* `min-w-0` NOS DOIS BOXES, e é o que segura a tela no celular.
					    Item de grade não encolhe abaixo do próprio min-content, e o
					    min-content daqui é um TÍTULO DE ANÚNCIO inteiro: o `truncate`
					    dos títulos da lista ao lado põe `white-space: nowrap`, e
					    "Canecas Caneca De Cerâmica, Porcelana Branco Forma Cilíndrica"
					    mede 743 px. A coluna crescia até caber a linha, os dois boxes
					    iam junto e o documento ficava com 890 px de largura num
					    aparelho de 390 — o dossiê INTEIRO cortado pela direita, não só
					    esta seção. Medido nas quatro combinações; o pior caso era
					    justamente o Rápido de produto, onde a lista de anúncios é a
					    maior. Com `min-w-0` a coluna volta a valer a largura da tela e
					    o `truncate` faz o que promete. */}
					<div className="grid gap-4 lg:grid-cols-[1fr_360px]">
						<section className="min-w-0 rounded-2xl border border-white/8 bg-white/[0.02] p-5">
							<div className="mb-1 flex items-baseline justify-between gap-2">
								<h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
									Preço de mercado
								</h3>
								{ps ? (
									<span className="text-[11px] text-slate-500">
										{ps.n} anúncio{ps.n === 1 ? '' : 's'} com link
									</span>
								) : null}
							</div>

							{confiavel && ps ? (
								<EscadaPreco ps={ps} />
							) : (
								/* A regra nº 1 desta tela, em ação. */
								<div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
									<p className="flex items-center gap-2 text-[13px] font-semibold text-amber-300">
										<AlertTriangle className="h-4 w-4" />
										Não achei anúncios suficientes para cravar um preço
									</p>
									<p className="mt-1 text-[12px] leading-relaxed text-amber-200/80">
										{ps?.motivo ??
											'A busca não trouxe anúncios com preço e link para este produto.'}{' '}
										Preferimos dizer isso a chutar um número que você usaria
										para fechar um trabalho.
									</p>
								</div>
							)}
						</section>

						{/* Cada anúncio, clicável. É o que torna o dossiê verificável. */}
						<section className="min-w-0 rounded-2xl border border-white/8 bg-white/[0.02] p-5">
							<h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
								Anúncios encontrados
							</h3>
							<div className="max-h-64 space-y-1 overflow-y-auto pr-1">
								{obs.slice(0, 20).map((o) => (
									<a
										key={o.url}
										href={o.url}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
									>
										{/* Lista montada pelo SERVIDOR a partir das citações, então a
										    página é citada por construção — e mesmo aqui ela passa pelo
										    mesmo funil: a regra desta tela é uma só, e exceção
										    "confiável" foi como as outras quatro portas ficaram
										    abertas. Ver `fotoDoItem`. */}
										<Foto
											url={(o as { imagem_url?: string }).imagem_url}
											pagina={provaDe(
												o as unknown as Record<string, unknown>,
												citadas,
												...CAMPOS_DE_PAGINA,
											)}
										/>
										<span className="min-w-0 flex-1 truncate text-[12px] text-slate-400">
											{o.title || dominio(o.url)}
										</span>
										<span className="shrink-0 font-mono text-[12px] tabular-nums text-slate-200">
											{money(o.brlCents)}
										</span>
									</a>
								))}
								{/* O que o Analista de Precificação achou e o servidor não
								    conseguiu virar amostra — ver `anunciosCrus`. Preço só quando
								    ele veio; o link é o que torna a linha verificável. */}
								{anunciosCrus.slice(0, 20).map((o, i) => {
									const conteudo = (
										<>
											{/* SEM foto, de propósito: esta linha nasce do JSON CRU do
											    Analista de Precificação, e `imagem_url` é um dos campos
											    que o contrato pede AO MODELO — o motor só abre a
											    `og:image` de quem chegou SEM ela, então o que estiver
											    escrito aqui não passou por página nenhuma. Ver
											    `imagemDe`. A `Foto` da lista de cima fica: lá o campo
											    vem da lista que o SERVIDOR monta. */}
											<span className="min-w-0 flex-1 truncate text-[12px] text-slate-400">
												{o.title || (o.url ? dominio(o.url) : 'anúncio')}
											</span>
											{o.preco !== null && o.preco > 0 ? (
												<span className="shrink-0 font-mono text-[12px] tabular-nums text-slate-200">
													{reais(o.preco)}
												</span>
											) : null}
										</>
									);
									return o.url ? (
										<a
											key={`${o.url}-${i}`}
											href={o.url}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
										>
											{conteudo}
										</a>
									) : (
										<div
											key={`${o.title}-${i}`}
											className="flex items-center gap-2.5 rounded-lg px-2 py-1.5"
										>
											{conteudo}
										</div>
									);
								})}
								{obs.length === 0 && anunciosCrus.length === 0 ? (
									<p className="py-6 text-center text-[12px] text-slate-600">
										nenhum anúncio com preço
									</p>
								) : null}
							</div>
						</section>
					</div>

					{/* O custo do insumo é prova como qualquer outra: número com o link
					    da loja do lado. Fica logo abaixo do preço de mercado porque os
					    dois juntos são a conta da margem que os cards mostram. */}
					<CustoDoMaterial
						a={agenteDe('margem')}
						citadas={citadas}
						usadosNaConta={custosUsados}
					/>
					{/* O custo da onda 2 — a peça em branco DOS PRODUTOS que a onda 1
					    achou, e não do ramo em abstrato. Mesmo componente, mesmo rigor,
					    cabeçalho próprio: ver `CustoDoMaterial`. */}
					<CustoDoMaterial
						a={agenteDe('custo_dos_produtos')}
						citadas={citadas}
						usadosNaConta={custosUsados}
						titulo="Quanto custa a peça em branco de cada produto"
						intro="O time voltou à web sabendo QUAIS produtos investigar, e foi atrás do preço da peça em branco de cada um — com a loja e o link de cada preço."
					/>
				</Etapa>

				{/* ═══ SEUS CONCORRENTES ═══ */}
				{temConcorrentes ? (
					<Etapa
						{...etapa('concorrentes')}
						sub={
							concorrentes.itens.length > 0
								? `${concorrentes.itens.length} loja${
										concorrentes.itens.length === 1 ? '' : 's'
									}`
								: undefined
						}
					>
						{concorrentes.itens.length > 0 || concorrentes.observacao ? (
							<Caixa
								titulo="Quem são seus concorrentes"
								intro="As lojas que já vendem neste ramo, com o que dá para conferir sobre cada uma: reputação, tempo de casa e tamanho do catálogo. Nota e contagem só aparecem quando a página da loja está entre as fontes deste dossiê."
								icone={UsersRound}
								cor="#8b5cf6"
							>
								{concorrentes.itens.length > 0 ? (
									<ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
										{concorrentes.itens.slice(0, 9).map((c) => (
											<CardConcorrente key={c.chave} c={c} />
										))}
									</ul>
								) : null}
								<Rodape texto={concorrentes.observacao} />
							</Caixa>
						) : null}

						{campeoes.itens.length > 0 || campeoes.observacao ? (
							<Caixa
								titulo="O que eles mais vendem"
								/* "com preço e link" era promessa fixa, e nem sempre havia link:
								   sem a página do anúncio entre as fontes o item aparece sem
								   preço e com a tarja "preço sem link que comprove". A intro
								   passa a dizer a regra em vez de prometer o caso bom. */
								intro="Os campeões de venda de cada loja. É o atalho mais curto para saber o que fabricar: alguém já provou que aquilo sai. Preço e foto só aparecem quando a página do anúncio está entre as fontes deste dossiê."
								icone={Crown}
								cor="#f59e0b"
							>
								{gruposDeCampeoes.length > 0 ? (
									<OQueElesVendem grupos={gruposDeCampeoes} />
								) : null}
								<Rodape texto={campeoes.observacao} />
							</Caixa>
						) : null}
					</Etapa>
				) : null}

				{/* ═══ GALERIA DE REFERÊNCIAS ═══ */}
				{temGaleria ? (
					<Etapa
						{...etapa('galeria')}
						sub={
							galeriaViva.length > 0
								? `${galeriaViva.length} ${
										galeriaViva.length === 1 ? 'imagem' : 'imagens'
									}`
								: refsDeProduto.itens.length > 0
									? `${refsDeProduto.itens.length} referência${
											refsDeProduto.itens.length === 1 ? '' : 's'
										}`
									: undefined
						}
					>
						{galeriaViva.length > 0 ? (
							<Caixa
								titulo="As fotos que o time capturou"
								intro="Tudo o que este dossiê fotografou das páginas que abriu, num lugar só: anúncio que vende, acabamento, embalagem, jeito de fotografar. Clique em qualquer uma para abrir a página de onde ela saiu."
								icone={Images}
								cor="#06b6d4"
							>
								<div className={`grid gap-3 ${GRADE_DE_FOTOS}`}>
									{galeriaViva.slice(0, 40).map((r) => (
										<Referencia
											key={chaveDeUrl(r.imagem)}
											r={r}
											onMorreu={() => matarFoto(r.imagem)}
										/>
									))}
								</div>
							</Caixa>
						) : null}

						{/* O Curador de Imagens, em caixa própria: a foto que ele escreve
						    não é foto (ver `lerGaleria`), mas QUAL produto olhar e O QUE
						    olhar nele é o trabalho dele, e é conferível. */}
						{refsDeProduto.itens.length > 0 || refsDeProduto.observacao ? (
							<Caixa
								titulo="Produtos de referência"
								intro="Os produtos que o time separou para você olhar antes de fabricar e antes de fotografar — o que cada um mostra de ângulo, acabamento e embalagem. Clique para abrir a página."
								icone={Boxes}
								cor="#a78bfa"
							>
								{refsDeProduto.itens.length > 0 ? (
									<ProdutosDeReferencia itens={refsDeProduto.itens} />
								) : null}
								<Rodape texto={refsDeProduto.observacao} />
							</Caixa>
						) : null}
					</Etapa>
				) : null}

				{/* ═══ PARA QUEM VENDER, E QUANDO ═══ */}
				{temPublico ? (
					<Etapa {...etapa('publico')}>
						{publico.itens.length > 0 || publico.observacao ? (
							<Caixa
								titulo="Para quem vender"
								intro="Quem compra isto, em que ocasião, quanto costuma gastar e o que faz a pessoa decidir. É o que muda o texto do anúncio e a foto que você tira."
								icone={ShoppingBag}
								cor="#22c55e"
							>
								{publico.itens.length > 0 ? (
									<ParaQuemVender itens={publico.itens} />
								) : null}
								<Rodape texto={publico.observacao} />
							</Caixa>
						) : null}

						{/* O outro lado de "para quem": quem compra CEM, fora do
						    marketplace. Ver `lerCompradores` — este especialista rodava,
						    era cobrado e não tinha ponto de render nenhum. */}
						{compradores.itens.length > 0 || compradores.observacao ? (
							<Caixa
								titulo="Quem compra em quantidade"
								intro="Fora dos marketplaces: empresa, escola, buffet, papelaria, imobiliária, agência de brindes. De cada um, por que compra, o tamanho do pedido, o que exige de você e por onde se chega até ele."
								icone={Handshake}
								cor="#14b8a6"
							>
								{compradores.itens.length > 0 ? (
									<QuemCompraEmQuantidade itens={compradores.itens} />
								) : null}
								<Rodape texto={compradores.observacao} />
							</Caixa>
						) : null}

						{calendario.itens.length > 0 ||
						calendario.epocaForte ||
						calendario.observacao ? (
							<Caixa
								titulo="O calendário do ano"
								intro="As datas que puxam este ramo e com quanta antecedência se vende. Quem produz a laser precisa começar semanas antes — este é o calendário de produção, não o de venda."
								icone={CalendarDays}
								cor="#f97316"
							>
								<CalendarioDoAno
									itens={calendario.itens}
									epocaForte={calendario.epocaForte}
								/>
								<Rodape texto={calendario.observacao} />
							</Caixa>
						) : null}
					</Etapa>
				) : null}

				{/* ═══ COMO ANUNCIAR PARA VENDER ═══ */}
				{temAnuncio ? (
					<Etapa {...etapa('anuncio')}>
						{busca.itens.length > 0 ||
						busca.padrao ||
						busca.exemplos.length > 0 ||
						busca.observacao ? (
							<Caixa
								titulo="Como as pessoas procuram"
								intro="Os termos que levam alguém até um anúncio como o seu, e o jeito como os títulos que vendem são escritos. Clique num termo para copiar."
								icone={Search}
								cor="#0ea5e9"
							>
								{busca.itens.length > 0 ? (
									<div className="flex flex-wrap gap-2">
										{busca.itens.slice(0, 24).map((t) => (
											<ChipTermo key={t.termo} t={t} />
										))}
									</div>
								) : null}
								{busca.padrao ? (
									<p className="mt-4 text-[12.5px] leading-relaxed text-slate-400">
										<span className="text-slate-600">
											Como o título que vende é escrito:{' '}
										</span>
										{busca.padrao}
									</p>
								) : null}
								{busca.exemplos.length > 0 ? (
									<ul className="mt-3 space-y-1.5">
										{busca.exemplos.slice(0, 6).map((e) => (
											<li
												key={e}
												className="rounded-lg border border-white/8 bg-white/[0.02] p-2.5 text-[12.5px] leading-snug text-slate-300"
											>
												{e}
											</li>
										))}
									</ul>
								) : null}
								<Rodape texto={busca.observacao} />
							</Caixa>
						) : null}

						{reclamacoes.itens.length > 0 || reclamacoes.observacao ? (
							<Caixa
								titulo="Do que reclamam"
								intro="O que os clientes reclamam de quem já vende. Cada queixa é uma promessa ao contrário — se reclamam que a gravação apaga, a sua não apaga, e isso vai escrito no anúncio."
								icone={ThumbsDown}
								cor="#f43f5e"
							>
								{reclamacoes.itens.length > 0 ? (
									<DoQueReclamam itens={reclamacoes.itens} />
								) : null}
								<Rodape texto={reclamacoes.observacao} />
							</Caixa>
						) : null}
					</Etapa>
				) : null}

				{/* ═══ O QUE SAI DO SEU BOLSO ═══ */}
				{temOperacao ? (
					<Etapa {...etapa('operacao')}>
						{fornecedores.itens.length > 0 || fornecedores.observacao ? (
							<Caixa
								titulo="Onde comprar a peça em branco"
								intro="Quem vende o insumo pronto para gravar: prazo, pedido mínimo e se atende pessoa física. Preço só aparece com o link da página que o mostra."
								icone={Warehouse}
								cor="#84cc16"
							>
								{fornecedores.itens.length > 0 ? (
									<OndeComprar itens={fornecedores.itens} />
								) : null}
								<Rodape texto={fornecedores.observacao} />
							</Caixa>
						) : null}

						{frete.itens.length > 0 || frete.observacao ? (
							<Caixa
								titulo="Quanto o frete come"
								intro="Peso, volume e fragilidade decidem se um produto bom de margem continua bom depois de despachado. O valor do frete só vira número com a página que o sustenta — a tabela do canal ou a simulação."
								icone={Truck}
								cor="#eab308"
							>
								{frete.itens.length > 0 ? (
									<QuantoOFreteCome itens={frete.itens} />
								) : null}
								<Rodape texto={frete.observacao} />
							</Caixa>
						) : null}
					</Etapa>
				) : null}

				{/* ═══ O QUE O TIME APUROU ═══ */}
				{apurados.length > 0 ? (
					<Etapa {...etapa('apurado')}>
						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							{apurados.map((b) => (
								<Bloco
									key={b.chave}
									titulo={b.titulo}
									icone={b.icone}
									cor={b.cor}
								>
									<ListaApurada itens={b.j?.[b.campo]} citadas={citadas} />
								</Bloco>
							))}
						</div>
					</Etapa>
				) : null}

				{/* ═══ FONTES ═══ */}
				<Etapa
					{...etapa('fontes')}
					sub={`${fontes.length} link${fontes.length === 1 ? '' : 's'}`}
				>
					<section className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
						<div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
							{fontes.map((f) => (
								/* `min-w-0` NO LINK, e não só o `truncate` no texto dentro.
								   Item de grade nasce com `min-width: auto`, que é o tamanho
								   do MENOR conteúdo indivisível — e o conteúdo aqui é um
								   título de anúncio em `white-space: nowrap`. A coluna crescia
								   até caber a linha inteira, a seção crescia junto e o
								   DOCUMENTO ia com ela: medido em 390 px, a página inteira do
								   dossiê ficava com 825 px de largura. O efeito não era um
								   título feio nas fontes — era todo o resto da tela (herói,
								   cards, calendário) cortado pela direita, no celular, nos
								   dois modos. O `truncate` só volta a funcionar quando o pai
								   tem permissão de encolher. */
								<a
									key={f.url}
									href={f.url}
									target="_blank"
									rel="noopener noreferrer"
									className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
								>
									<ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
									<span className="min-w-0 truncate">
										{f.title || dominio(f.url)}
									</span>
								</a>
							))}
							{fontes.length === 0 ? (
								<p className="py-2 text-[12px] text-slate-600">
									nenhuma fonte registrada nesta execução
								</p>
							) : null}
						</div>
					</section>
				</Etapa>

				{/* ═══ HONESTIDADE: auditoria, lacunas e avisos ═══ */}
				{temRessalvas ? (
					<Etapa {...etapa('ressalvas')}>
						<section className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
							<div className="grid gap-x-6 gap-y-2 text-[12px] leading-relaxed text-slate-400 md:grid-cols-2">
								{confiancaGeral ? (
									<p>
										Confiança geral apurada pelo Auditor:{' '}
										<strong className="text-slate-200">{confiancaGeral}</strong>
										.
									</p>
								) : null}
								{semFonte.length > 0 ? (
									<div>
										<p className="text-slate-300">Afirmações sem fonte:</p>
										<Lista itens={semFonte} />
									</div>
								) : null}
								{/* A terceira lista do Revisor: o que ele procurou e NÃO achou.
								    Fica em coluna inteira porque é a que o aluno lê como
								    tarefa — é o que sobra para ele apurar antes de comprar
								    material. Ver `oQueFalta`. */}
								{oQueFalta.length > 0 ? (
									<div className="md:col-span-2">
										<p className="text-slate-300">
											O que o time não conseguiu apurar:
										</p>
										<Lista itens={oQueFalta} />
									</div>
								) : null}
								{semProdutosPorque ? (
									<p className="md:col-span-2">
										<span className="text-slate-300">
											Sobre por quais produtos começar:{' '}
										</span>
										{semProdutosPorque}
									</p>
								) : null}
								{falhas.map((f) => (
									<p key={f.nome} className="text-amber-400/90">
										{f.nome} não respondeu desta vez.
									</p>
								))}
								{avisos.map((a) => (
									<p key={a}>{a}</p>
								))}
								<p className="text-slate-500 md:col-span-2">
									O SEU custo é estimado a partir da foto e sai em faixa. Para
									fechar um trabalho, use o Orçamento com o arquivo de corte.
								</p>
							</div>
						</section>
					</Etapa>
				) : null}

				{/* ═══ A CONVERSA DEPOIS DO DOSSIÊ ═══ */}
				{podePerguntar ? (
					<CaixaPerguntas
						toolKey={String(toolKey)}
						colecao={COLECAO_DOSSIES}
						entryId={entryId}
						tipo={tipo}
						restantesIniciais={perguntasRestantes}
					/>
				) : null}

				{/* ═══ AÇÕES ═══ */}
				<div className="flex flex-wrap gap-3 print:hidden">
					<button
						type="button"
						onClick={onNovaAnalise}
						className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
						style={{ backgroundColor: 'var(--screen-accent)' }}
					>
						Analisar outro produto
					</button>
					{onOrcamentoExato ? (
						<button
							type="button"
							onClick={onOrcamentoExato}
							className="flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5"
						>
							Quero o preço exato <ArrowRight className="h-4 w-4" />
						</button>
					) : null}
					{onAtualizarPesquisa ? (
						<button
							type="button"
							onClick={onAtualizarPesquisa}
							className="flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5"
						>
							<RefreshCw className="h-4 w-4" /> Atualizar pesquisa
						</button>
					) : null}
					<button
						type="button"
						onClick={() => window.print()}
						className="flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5"
					>
						<Printer className="h-4 w-4" /> Imprimir
					</button>
				</div>
			</div>
		</div>
	);
}
