'use client';

import { useReducedMotion } from 'motion/react';
import { memo, useMemo } from 'react';
import { resolveToolIcon } from '../../lib/tool-icons';
import {
	ENTRADA_FOTO,
	ENTRADA_REFERENCIAS,
	type EspecialistaVivo,
	type FaseAtelie,
	normalizarFase,
	ORDEM_DAS_ONDAS,
} from './tipos';

/**
 * A MESA DE CRIAÇÃO — o que o aluno olha nos ~60 s em que o time trabalha.
 *
 * A palavra "agente" não aparece nesta tela, e isso é regra: quem está esperando
 * uma arte não quer ver software processando, quer ver PROFISSIONAIS trabalhando
 * na peça dele. Cada cartão é um cargo que existe num estúdio de verdade e a
 * frase é o que essa pessoa estaria fazendo agora.
 *
 * ┌─ AS TRÊS REGRAS QUE ESTE ARQUIVO EXISTE PARA SUSTENTAR ──────────────────┐
 * │ ① RENDERIZA A PARTIR DA LISTA, NUNCA DE UM ROSTER CHUMBADO. O time vem   │
 * │    do stream (`agentes`/`time_montado`), que vem do banco do admin. Um   │
 * │    sétimo especialista cadastrado amanhã tem que aparecer aqui sozinho,  │
 * │    sem deploy do front — inclusive numa onda que hoje está vazia.        │
 * │                                                                          │
 * │ ② QUEM FALHOU APARECE COMO FALHOU. Sumir com o cartão esconderia que o   │
 * │    aluno pagou por aquele especialista. Todo mundo que roda tem ponto de │
 * │    render, em qualquer estado.                                           │
 * │                                                                          │
 * │ ③ A MESA NÃO MENTE SOBRE O QUE CADA UM VIU. `n_imagens` é o único        │
 * │    gatilho da miniatura: o Leitor do Produto mostra a foto porque        │
 * │    recebeu 1 imagem; o Redator não mostra nada porque não viu nenhuma.   │
 * │    Enfeitar todo cartão com a foto seria encenação.                      │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * O PARENTESCO COM A CENTRAL DE INTELIGÊNCIA — e o limite dele. A Central
 * (`intel/war-room.tsx`) resolveu o mesmo problema e o desenho dela foi aprovado:
 * faixas por onda, cartão com barra de identidade, varredura só em quem roda de
 * verdade, movimento 100% em CSS. Isso está reaproveitado aqui.
 *
 * O que NÃO veio junto foi a densidade. Lá são 22 especialistas e vários minutos,
 * e a tela ganha um núcleo, feixes SVG medidos do DOM, console de buscas e feed
 * de fontes. Aqui são seis e ~60 s: a mesma parafernália encheria a espera de
 * coisas para ler justamente na ferramenta feita para quem NÃO quer ler. Ficaram
 * o cabeçalho, a barra de progresso, as três faixas e os cartões.
 */

/* ═══════════════════ formatação ═══════════════════ */

/** mm:ss — o aluno precisa ver que o tempo está andando, não só um giro. */
function relogio(ms: number): string {
	const s = Math.max(0, Math.floor(ms / 1000));
	return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** "4,2 s" — vírgula decimal. A tela inteira é em português, o número também. */
function segundos(ms: number): string {
	return `${(Math.max(0, ms) / 1000).toFixed(1).replace('.', ',')} s`;
}

function plural(n: number, um: string, muitos: string): string {
	return `${n} ${n === 1 ? um : muitos}`;
}

/**
 * A cor do especialista vem do BANCO DO ADMIN, então é texto livre.
 *
 * `${cor}1f` (o truque de opacidade do hex) só funciona com hex de 6 dígitos:
 * um `#abc` ou um `red` cadastrado por engano viraria `#abc1f`/`red1f`, que o
 * navegador descarta — e o cartão perde a caixa do ícone sem ninguém entender
 * por quê. Fora do formato esperado a mesa cai no acento da ferramenta, que
 * sempre existe.
 */
const HEX6 = /^#[0-9a-f]{6}$/i;
const ACENTO = 'var(--screen-accent, #d946ef)';

function tinta(cor: string): { forte: string; fraca: string } {
	return HEX6.test(cor)
		? { forte: cor, fraca: `${cor}1f` }
		: {
				forte: ACENTO,
				fraca: `color-mix(in srgb, ${ACENTO} 12%, transparent)`,
			};
}

/* ═══════════════════ as três ondas, na língua do aluno ═══════════════════ */

/** Nome da etapa no divisor. É o que torna as três faixas legíveis. */
const TITULO_DA_ONDA: Record<FaseAtelie, string> = {
	descoberta: 'Entendendo',
	aprofundamento: 'Criando',
	sintese: 'Fechando',
};

/** O que a faixa está fazendo AGORA (canto direito do divisor). */
const FAZENDO_NA_ONDA: Record<FaseAtelie, string> = {
	descoberta: 'lendo o seu material',
	aprofundamento: 'decidindo a arte',
	sintese: 'escrevendo o pedido',
};

/** O que a faixa está esperando, quando ninguém dela começou. */
const ESPERANDO_NA_ONDA: Record<FaseAtelie, string> = {
	descoberta: 'preparando',
	aprofundamento: 'aguardando a etapa anterior',
	sintese: 'aguardando a etapa anterior',
};

/**
 * A manchete quando a tela NÃO recebe `etapa` pronta.
 *
 * O hook do run já monta essa frase (ele conhece também os nós do pipeline, que
 * o stream carimba e a mesa não vê) e é ela que deve chegar por prop. Estas aqui
 * são o degrau de baixo, para a manchete nunca ficar muda se a tela que embrulha
 * a mesa não passar nada.
 */
const MANCHETE_DA_ONDA: Record<FaseAtelie, string> = {
	descoberta: 'Lendo a sua peça, a sua marca e as suas referências',
	aprofundamento: 'Decidindo a direção da arte e escrevendo o texto',
	sintese: 'Fechando o pedido da sua arte',
};

const MANCHETE_MONTANDO = 'Reunindo o seu time…';

/**
 * O TEMPO MORTO DO FIM, que é o mais perigoso da espera.
 *
 * Quando o último especialista entrega, o pipeline ainda vai desenhar a imagem —
 * e o bloco de imagem é UMA chamada só, que não emite progresso nenhum por
 * dezenas de segundos. Sem esta frase a mesa fica com seis cartões verdes e
 * nenhum movimento, e o aluno conclui que travou justamente no fim.
 */
const MANCHETE_DESENHANDO = 'Desenhando a sua arte…';

/**
 * A mesa parou de RECEBER, e não de acontecer.
 *
 * O verbo fica no presente de propósito: o trabalho segue no servidor, já pago.
 * "Parou", "cancelado" ou qualquer passado aqui seria mentira em cima de uma
 * arte que vai existir.
 */
const MANCHETE_CONGELADA = 'O time continua trabalhando';

/* ═══════════════════ um especialista ═══════════════════ */

/**
 * `memo` porque o stream dispara vários eventos por run e cada um re-renderiza a
 * mesa inteira: sem isso, um evento de um especialista repinta os seis cartões.
 */
const Cartao = memo(function Cartao({
	e,
	miniaturas,
	semMovimento,
}: {
	e: EspecialistaVivo;
	/** Object URLs do que o aluno mandou, por tipo de entrada. Ver `MesaDeCriacao`. */
	miniaturas?: Record<string, string[]>;
	semMovimento: boolean;
}) {
	const Icon = resolveToolIcon(e.icone);
	const trabalhando = e.estado === 'trabalhando';
	const ok = e.estado === 'ok';
	const falhou = e.estado === 'falhou';
	const esperando = e.estado === 'esperando';
	const { forte, fraca } = tinta(e.cor);

	/**
	 * O MATERIAL QUE ESTE ESPECIALISTA ESTÁ OLHANDO — a regra ③ em código.
	 *
	 * O gatilho é `n_imagens`, NUNCA a existência das miniaturas: enquanto o
	 * cartão está `esperando` esse número é 0 de propósito (o anúncio do time não
	 * carrega quantas imagens cada um vai receber, isso só se sabe no
	 * `agente_iniciou`), então a foto só aparece no cartão quando ele de fato
	 * começa a olhar para ela. O `slice` garante que um mapa de miniaturas maior
	 * que o número de imagens recebidas não vaze uma imagem a mais.
	 *
	 * Sem as miniaturas (a tela pode não passá-las) sobra a contagem em texto —
	 * que diz a mesma verdade sem inventar imagem nenhuma.
	 */
	const fotos =
		e.n_imagens > 0
			? (miniaturas?.[e.olhando ?? ''] ?? []).slice(0, e.n_imagens)
			: [];

	const legenda = falhou
		? e.erro || 'não consegui desta vez'
		: ok
			? e.nFontes
				? `${plural(e.nFontes, 'página', 'páginas')} · pronto em ${segundos(e.ms ?? 0)}`
				: `pronto em ${segundos(e.ms ?? 0)}`
			: trabalhando && e.nFontes
				? // O contador vem ANTES da frase porque a legenda tem `line-clamp-2`:
					// o que pode ser cortado é a frase do papel, nunca o número.
					`${plural(e.nFontes, 'página aberta', 'páginas abertas')} · ${e.frase}`
				: e.frase;

	return (
		/*
		 * `div` puro, não `motion.div`, e a entrada é keyframe CSS com
		 * `fill: backwards`. Animação de entrada por JS que falhe deixa o cartão
		 * invisível para sempre — num painel que existe para PROVAR trabalho pago,
		 * é o pior modo de falha possível.
		 */
		<div
			data-chave={e.chave}
			className={`atelie-entra relative min-h-[78px] overflow-hidden rounded-xl border px-3 py-2.5 transition-[background-color,border-color] duration-300 ${
				trabalhando
					? 'border-white/25 bg-[#15151a]'
					: ok
						? 'border-emerald-500/30 bg-[#080f0f]'
						: falhou
							? 'border-amber-500/35 bg-[#100d0a]'
							: 'border-white/10 bg-[#0b0b0d]'
			}`}
		>
			{/* Barra de identidade: a cor daquele profissional, sempre presente. É ela
			    que dá a leitura de "cada um destes é uma pessoa diferente". */}
			<span
				aria-hidden="true"
				className="absolute inset-y-0 left-0 w-[2px]"
				style={{
					backgroundColor: forte,
					opacity: esperando ? 0.25 : trabalhando ? 1 : 0.55,
				}}
			/>

			{/* A varredura é a ÚNICA animação do cartão e quer dizer uma coisa só:
			    isto está acontecendo agora. Quem espera e quem já entregou não a têm —
			    senão a mesa animaria trabalho que não está sendo feito. */}
			{trabalhando && !semMovimento ? (
				<span
					aria-hidden="true"
					className="atelie-varredura pointer-events-none absolute inset-y-0 left-0 w-16"
					style={{
						background: `linear-gradient(90deg, transparent, ${HEX6.test(e.cor) ? `${e.cor}22` : 'rgba(255,255,255,0.10)'}, transparent)`,
					}}
				/>
			) : null}

			{/* O esmaecido de "ainda não é a vez dele" mora AQUI DENTRO, nunca no
			    cartão: com `opacity` na caixa toda, a superfície deixaria de ser
			    opaca e o brilho de fundo do painel atravessaria o nome. */}
			<div
				className="flex items-start gap-2.5"
				style={{ opacity: esperando ? 0.5 : 1 }}
			>
				<span
					className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg"
					style={{ backgroundColor: fraca, color: forte }}
				>
					<Icon className="h-4 w-4" />
				</span>

				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-1.5">
						{/* O nome do especialista é o produto: ele quebra em duas linhas em
						    vez de virar reticência. "Leitor da Ma…" não é um profissional. */}
						<p className="line-clamp-2 text-[12.5px] font-semibold leading-tight text-slate-100">
							{e.nome}
						</p>
						{trabalhando ? (
							<span
								aria-hidden="true"
								className={`h-1.5 w-1.5 shrink-0 rounded-full ${semMovimento ? '' : 'atelie-pisca'}`}
								style={{ backgroundColor: forte }}
							/>
						) : null}
					</div>

					{/* `title` porque a legenda é cortada em duas linhas: o texto inteiro
					    continua acessível a quem quiser (e ao leitor de tela). */}
					<p
						title={legenda}
						className={`mt-1 line-clamp-2 text-[11px] leading-snug ${
							falhou
								? 'text-amber-400/90'
								: ok
									? 'text-emerald-300/80'
									: 'text-slate-400'
						}`}
					>
						{legenda}
					</p>

					{fotos.length > 0 ? (
						<div className="mt-1.5 flex items-center gap-1">
							{fotos.slice(0, 3).map((src) => (
								/* `img` cru de propósito: é object URL de um `File` local, que
								   o otimizador de imagem do Next não consegue processar. */
								<img
									key={src}
									src={src}
									alt=""
									className="h-7 w-7 rounded-md border border-white/10 object-cover"
								/>
							))}
							{fotos.length > 3 ? (
								<span className="text-[10px] text-slate-500">
									+{fotos.length - 3}
								</span>
							) : null}
						</div>
					) : e.n_imagens > 0 ? (
						<p className="mt-1.5 text-[10px] text-slate-500">
							olhando {plural(e.n_imagens, 'imagem', 'imagens')}
						</p>
					) : e.semFoto ? (
						/* Ele pede imagem e não recebeu nenhuma. NÃO é falha: o Leitor do
						   Produto sem foto trabalha com o que o aluno escreveu. O cartão
						   diz isso em vez de animar uma lupa sobre uma imagem inexistente.

						   A FRASE MUDA CONFORME O QUE FALTOU, e não é preciosismo: um aluno
						   que ACABOU de subir a foto do produto lia "sem foto" no cartão do
						   Leitor das Referências — que não recebeu REFERÊNCIAS — e entendia
						   que a foto dele não tinha chegado, com a miniatura dela visível no
						   cartão ao lado. O nome do material vem do `olhando` (o `entrada`
						   do roster); entrada desconhecida cai na frase neutra. */
						<p className="mt-1.5 text-[10px] text-amber-400/80">
							{e.olhando === ENTRADA_REFERENCIAS
								? 'sem anúncio de referência · vai pelo que você escreveu'
								: e.olhando === ENTRADA_FOTO
									? 'sem foto do produto · vai pelo que você escreveu'
									: 'sem material · vai pelo que você escreveu'}
						</p>
					) : null}
				</div>

				<span className="mt-0.5 shrink-0 text-[10px] font-semibold leading-none">
					{ok ? (
						<span className="text-emerald-400">pronto</span>
					) : falhou ? (
						// Quem falhou fica na mesa e diz que falhou. O aluno pagou por ele.
						<span className="text-amber-400">não saiu</span>
					) : trabalhando ? (
						<span className="text-slate-400">···</span>
					) : (
						<span className="text-slate-600">—</span>
					)}
				</span>
			</div>
		</div>
	);
});

/* ═══════════════════ o divisor de uma onda ═══════════════════ */

const Divisor = memo(function Divisor({
	numero,
	titulo,
	estado,
	ativo,
	semMovimento,
}: {
	numero: number;
	titulo: string;
	estado: string;
	ativo: boolean;
	semMovimento: boolean;
}) {
	return (
		<div className="mb-2 mt-4 flex items-center gap-2 sm:gap-3">
			<span
				className="shrink-0 text-[9.5px] font-semibold uppercase tracking-[0.2em]"
				style={{ color: ativo ? '#7dd3fc' : '#64748b' }}
			>
				{numero} · {titulo}
			</span>

			{/* O trilho de luz acende só na faixa VIVA. Nas etapas 2 e 3 ele quer
			    dizer, literalmente, que o material da faixa de cima está descendo
			    para cá — as barreiras entre as ondas são reais no motor, então isto
			    não encena nada. */}
			<span className="relative h-px flex-1 overflow-hidden bg-white/[0.08]">
				{ativo && !semMovimento ? (
					<span
						aria-hidden="true"
						className="atelie-trilho absolute inset-y-0 left-0"
						style={{
							background:
								'linear-gradient(90deg, transparent, #7dd3fc, transparent)',
						}}
					/>
				) : null}
			</span>

			{/* `min-w-0 truncate`, nunca `shrink-0`: numa tela estreita é este texto
			    que cede. Cortar o fim do estado é aceitável; estourar a largura da
			    página não é. */}
			<span className="min-w-0 truncate text-[9.5px] uppercase tracking-[0.14em] text-slate-500">
				{estado}
			</span>
		</div>
	);
});

/* ═══════════════════ a mesa ═══════════════════ */

interface FaixaDaMesa {
	fase: FaseAtelie;
	/** Posição VISÍVEL da faixa (1, 2, 3…). Ondas vazias não consomem número. */
	numero: number;
	time: EspecialistaVivo[];
}

export interface PropsMesaDeCriacao {
	/**
	 * O time inteiro, em ordem de anúncio — o contrato ABERTO. Quem está aqui
	 * aparece na tela, sempre, em qualquer estado.
	 */
	especialistas: EspecialistaVivo[];
	/** A onda que roda agora. `null` antes do primeiro evento do stream. */
	fase: FaseAtelie | null;
	/** Relógio de parede do run, em ms. Quem faz o tique é o hook. */
	ms: number;
	/**
	 * Parar de ACOMPANHAR. Não cancela nem devolve voxxys — ver o rodapé.
	 *
	 * OPCIONAL, e a ausência tem dois usos: a mesa CONGELADA (o aluno já parou de
	 * acompanhar, ou o socket caiu) não tem o que oferecer, e durante os
	 * centésimos de segundo em que a invocação ainda está sendo aberta parar
	 * deixaria uma invocação paga e órfã (ver `podeParar` no hook do run).
	 */
	onCancelar?: () => void;
	/**
	 * A MESA PAROU DE RECEBER EVENTOS, mas o trabalho continua no servidor.
	 *
	 * Ela permanece na tela exatamente como ficou. Isto não é enfeite: os cartões
	 * são a prova de por quantos profissionais o aluno pagou, e um run cobrado
	 * cuja mesa some não deixa vestígio nenhum de que aquele dinheiro comprou
	 * alguma coisa.
	 */
	congelada?: boolean;
	/**
	 * A manchete pronta (`etapa` do `useAtelieRun`). Opcional: o hook conhece
	 * também os nós do pipeline (buscar a marca, desenhar a arte, guardar na
	 * galeria), que o stream carimba e a mesa não recebe. Sem ela a manchete cai
	 * na frase da onda corrente.
	 */
	etapa?: string;
	/**
	 * As miniaturas do que o aluno mandou, indexadas pela ENTRADA declarada no
	 * roster (o `olhando` do especialista: `foto_produto`, `referencias`…).
	 *
	 * Object URLs dos `File`s que a tela já tem em mãos — a mesa não busca nada.
	 * Opcional de propósito: sem elas os cartões dizem quantas imagens cada um
	 * está olhando em texto, o que é a mesma verdade. O que a mesa nunca faz é o
	 * contrário: mostrar imagem em quem não recebeu nenhuma.
	 *
	 * Monte este objeto com `useMemo` (e crie os object URLs uma vez, revogando-os
	 * no unmount): os cartões são memoizados e comparam a prop por IDENTIDADE, então
	 * um literal novo a cada render re-renderiza o time inteiro a cada evento.
	 */
	miniaturas?: Record<string, string[]>;
}

export function MesaDeCriacao({
	especialistas,
	fase,
	ms,
	onCancelar,
	etapa,
	miniaturas,
	congelada,
}: PropsMesaDeCriacao) {
	const reduzido = useReducedMotion();
	// Congelada, nada pulsa: uma varredura correndo sobre um cartão que não vai
	// mais mudar animaria trabalho que a tela deixou de acompanhar.
	const semMovimento = reduzido === true || congelada === true;

	/**
	 * AS FAIXAS. O agrupamento é pela lista recebida, nunca por um roster fixo:
	 * uma onda sem ninguém simplesmente não é desenhada (faixa oca lê como etapa
	 * que não aconteceu), e a numeração é a posição VISÍVEL, não o índice da onda
	 * — um time sem aprofundamento mostra "1" e "2", não "1" e "3".
	 *
	 * `normalizarFase` roda de novo aqui, embora o hook já normalize: é uma linha
	 * e fecha o buraco de um especialista com a fase corrompida ficar fora das
	 * três faixas e sumir da mesa. Sumir com quem o aluno pagou para ver é o
	 * defeito mais caro desta tela.
	 */
	const faixas = useMemo<FaixaDaMesa[]>(() => {
		const porFase = new Map<FaseAtelie, EspecialistaVivo[]>();
		for (const e of especialistas) {
			const f = normalizarFase(e.fase);
			const atual = porFase.get(f);
			if (atual) atual.push(e);
			else porFase.set(f, [e]);
		}
		const out: FaixaDaMesa[] = [];
		for (const f of ORDEM_DAS_ONDAS) {
			const time = porFase.get(f);
			if (time?.length) out.push({ fase: f, numero: out.length + 1, time });
		}
		return out;
	}, [especialistas]);

	const prontos = especialistas.filter(
		(e) => e.estado === 'ok' || e.estado === 'falhou',
	).length;
	const montando = especialistas.length === 0;
	/** O time fechou e o pipeline ainda está desenhando a imagem. */
	const desenhando = !montando && prontos === especialistas.length;

	/**
	 * Barra DETERMINÍSTICA: o denominador é conhecido desde o `time_montado`.
	 * Barra indeterminada aqui seria preguiça — e mentira sobre o que se sabe.
	 * Quem falhou CONTA como concluído: o trabalho dele terminou (mal), e travar
	 * a barra por causa disso faria a espera parecer eterna.
	 */
	const pct = montando ? 0 : (prontos / especialistas.length) * 100;

	const manchete = congelada
		? MANCHETE_CONGELADA
		: etapa
			? etapa
			: montando
				? MANCHETE_MONTANDO
				: desenhando
					? MANCHETE_DESENHANDO
					: fase
						? MANCHETE_DA_ONDA[fase]
						: MANCHETE_MONTANDO;

	return (
		<div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#07070a]">
			{/* Um brilho só, atrás do cabeçalho. É o que separa "painel de espera" de
			    "caixa cinza carregando" sem custar um frame de animação. */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full blur-3xl"
				style={{
					background: `radial-gradient(closest-side, color-mix(in srgb, ${ACENTO} 18%, transparent), transparent)`,
				}}
			/>

			<div className="relative px-3 py-4 sm:px-5 sm:py-5">
				{/* ══ cabeçalho ══ */}
				<div className="flex flex-wrap items-end justify-between gap-3">
					<div className="min-w-0">
						<p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
							<span
								aria-hidden="true"
								className={`h-1.5 w-1.5 rounded-full ${semMovimento ? '' : 'atelie-pisca'}`}
								style={{ backgroundColor: ACENTO }}
							/>
							{congelada
								? 'Como a sua equipe estava'
								: 'Sua equipe está criando'}
						</p>
						{/* `aria-live` porque esta linha é o resumo falado do que está
						    acontecendo: quem usa leitor de tela acompanha o run por ela,
						    sem precisar varrer os cartões atrás do que mudou. (Sem
						    `role="status"` junto: o papel de região viva já vem do
						    `aria-live`, e o `role` transformaria o cabeçalho da mesa em
						    outra coisa só para satisfazer a regra do lint.) */}
						<h2
							aria-live="polite"
							className="font-display mt-1 text-lg font-bold leading-tight text-slate-50 sm:text-xl"
						>
							{manchete}
						</h2>
					</div>

					<div className="flex items-center gap-5">
						<div className="text-right">
							<p className="font-mono text-lg leading-none tabular-nums text-slate-100">
								{relogio(ms)}
							</p>
							<p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-slate-500">
								decorrido
							</p>
						</div>
						<div className="text-right">
							<p className="font-mono text-lg leading-none tabular-nums text-slate-100">
								{prontos}
								<span className="text-slate-500">
									/{especialistas.length || '—'}
								</span>
							</p>
							<p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-slate-500">
								profissionais
							</p>
						</div>
					</div>
				</div>

				<div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.06]">
					<div
						className="h-full rounded-full transition-[width] duration-500"
						style={{
							width: `${pct}%`,
							background: `linear-gradient(90deg, color-mix(in srgb, ${ACENTO} 45%, transparent), ${ACENTO})`,
						}}
					/>
				</div>

				{/* ══ as faixas ══ */}
				{montando ? (
					/* Enquanto o time não chega: caixas neutras, e DE PROPÓSITO em número
					   que não promete nada — o roster é dado do admin, e desenhar seis
					   silhuetas seria contar um time antes de saber o tamanho dele. */
					<div className="mt-5">
						<div className="grid grid-cols-[repeat(auto-fit,minmax(min(14rem,100%),20rem))] justify-center gap-2.5">
							{['a', 'b', 'c', 'd'].map((k) => (
								<div
									key={k}
									className={`h-[78px] rounded-xl border border-white/10 bg-white/[0.035] ${semMovimento ? '' : 'animate-pulse'}`}
								/>
							))}
						</div>
						<p className="mt-3 text-center text-[12px] text-slate-500">
							Chamando os profissionais para a mesa…
						</p>
					</div>
				) : (
					faixas.map((faixa) => {
						const algumTrabalhando = faixa.time.some(
							(e) => e.estado === 'trabalhando',
						);
						const todosProntos = faixa.time.every(
							(e) => e.estado === 'ok' || e.estado === 'falhou',
						);
						/**
						 * A FAIXA VIVA é a que tem gente trabalhando OU a que o evento
						 * `onda` acabou de anunciar (`fase`) e ainda não fechou.
						 *
						 * As duas condições existem por motivos opostos, e nenhuma delas
						 * sozinha basta:
						 *   · só `fase` deixaria a última faixa acesa para sempre — o
						 *     evento `onda` da síntese é o último que chega, e depois dele
						 *     vem a imagem, que leva dezenas de segundos;
						 *   · só "alguém trabalhando" apagaria a mesa inteira no vão entre
						 *     a onda ser anunciada e o primeiro especialista dela começar.
						 */
						const viva =
							algumTrabalhando || (fase === faixa.fase && !todosProntos);
						const estado = todosProntos
							? 'pronta'
							: viva
								? FAZENDO_NA_ONDA[faixa.fase]
								: ESPERANDO_NA_ONDA[faixa.fase];

						return (
							<div key={faixa.fase}>
								<Divisor
									numero={faixa.numero}
									titulo={TITULO_DA_ONDA[faixa.fase]}
									estado={estado}
									ativo={viva}
									semMovimento={semMovimento}
								/>
								{/* `auto-fit` porque o tamanho de cada onda é DADO editável —
								    hoje 3/2/1, amanhã outro. O teto de 20rem existe para a
								    faixa de um cartão só (o Prompt Final) não virar uma barra
								    atravessando a mesa inteira, com o ícone num canto e o
								    selo no outro. */}
								<div className="grid grid-cols-[repeat(auto-fit,minmax(min(14rem,100%),20rem))] justify-center gap-2.5">
									{faixa.time.map((e) => (
										<Cartao
											key={e.chave}
											e={e}
											miniaturas={miniaturas}
											semMovimento={semMovimento}
										/>
									))}
								</div>
							</div>
						);
					})
				)}

				{/* ══ o tempo morto do fim ══
				    Todos entregaram e a imagem ainda está sendo desenhada. Sem esta
				    faixa a mesa fica imóvel com tudo verde no minuto mais longo da
				    espera. Ela só aparece quando é verdade. */}
				{desenhando ? (
					<div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
						<span
							aria-hidden="true"
							className={`h-2 w-2 shrink-0 rounded-full ${semMovimento ? '' : 'atelie-pisca'}`}
							style={{ backgroundColor: ACENTO }}
						/>
						<p className="text-[12px] leading-snug text-slate-300">
							{/* "O pedido está fechado" só quando ele FOI fechado. Com alguém
							    da mesa fora, a frase honesta é a de cima — o time acabou, com
							    o que deu, e o cartão em âmbar continua ali dizendo quem foi. */}
							{especialistas.some((e) => e.estado === 'falhou')
								? 'O time terminou'
								: 'O pedido está fechado'}
							. Agora a sua arte está sendo desenhada — isso leva alguns
							segundos.
						</p>
					</div>
				) : null}

				{/* ══ rodapé ══
				    NUNCA "cancelar". O trabalho já foi autorizado e cobrado e o
				    servidor vai até o fim: um botão que prometesse cancelamento
				    produziria a pior reclamação possível ("cancelei e cobraram").
				    O que este botão faz é parar de ACOMPANHAR, e é isso que ele diz.

				    Sem `onCancelar` o botão SOME em vez de ficar cinza: nos dois casos
				    em que ele não vem (a mesa congelada e o instante em que a
				    invocação ainda está sendo aberta) não há nada para o aluno fazer
				    ali, e um botão desligado só levanta a pergunta.

				    A frase não cita mais o nome de um lugar — quem sabe se "Minhas
				    artes" existe é a tela, que lê `ui.history` da definition. Aqui
				    ficou só o que é verdade em qualquer caso. */}
				<div className="mt-5 text-center">
					{onCancelar ? (
						<button
							type="button"
							onClick={onCancelar}
							className="text-[12px] text-slate-500 underline-offset-4 transition-colors hover:text-slate-300 hover:underline"
						>
							Acompanhar depois
						</button>
					) : null}
					<p className="mt-1 text-[11px] text-slate-600">
						{congelada
							? 'Você não está mais acompanhando, mas o time não parou: a arte é gerada e guardada do mesmo jeito.'
							: 'O time continua trabalhando mesmo se você sair desta tela — a arte é gerada e guardada do mesmo jeito.'}
					</p>
				</div>
			</div>

			{/*
			 * Todo o movimento daqui é CSS puro sobre `transform`/`opacity` — nenhum
			 * estado de React por frame. O relógio inclusive: quem tica é o hook do
			 * run, que já precisa contar o tempo para o resto da tela.
			 *
			 * Os nomes são prefixados `atelie` porque a Central injeta as dela como
			 * `intel*` no mesmo documento sempre que as duas ferramentas passam pela
			 * mesma sessão — colidir aqui seria um bug invisível de animação.
			 */}
			<style>{`
				@keyframes atelieEntra {
					from { opacity: 0; transform: translateY(6px); }
					to   { opacity: 1; transform: none; }
				}
				/* fill backwards, nunca forwards: com fill para a frente o valor final
				   do keyframe (opacity: 1) venceria o style inline do cartão e quem
				   ainda não começou deixaria de aparecer esmaecido. */
				.atelie-entra { animation: atelieEntra 0.22s ease-out backwards; }

				@keyframes atelieVarredura {
					0%   { transform: translateX(-4rem); }
					100% { transform: translateX(120%); }
				}
				.atelie-varredura { animation: atelieVarredura 2.1s linear infinite; will-change: transform; }

				@keyframes ateliePisca { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }
				.atelie-pisca { animation: ateliePisca 1.4s ease-in-out infinite; }

				/* A luz atravessando o divisor é o material da etapa de cima descendo
				   para a de baixo. O translate é em % do PRÓPRIO elemento: de -100%
				   (fora à esquerda) a 300% (fora à direita) é exatamente uma travessia,
				   em qualquer largura de tela. */
				@keyframes atelieTrilho {
					from { transform: translateX(-100%); }
					to   { transform: translateX(300%); }
				}
				.atelie-trilho { width: 33.333%; animation: atelieTrilho 2.4s linear infinite; will-change: transform; }

				@media (prefers-reduced-motion: reduce) {
					.atelie-entra, .atelie-varredura, .atelie-pisca, .atelie-trilho { animation: none; }
					.atelie-varredura, .atelie-trilho { display: none; }
				}
			`}</style>
		</div>
	);
}
