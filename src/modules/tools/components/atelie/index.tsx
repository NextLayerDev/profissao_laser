'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
	AlertTriangle,
	ArrowLeft,
	ArrowRight,
	Check,
	Loader2,
	Sparkles,
	WifiOff,
} from 'lucide-react';
import {
	type CSSProperties,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { useMarcaAtiva } from '../../hooks/use-marca';
import { lerMarca } from '../../lib/marca';
import { accentForTool, resolveScreenUi } from '../../lib/screen-ui';
import { resolveToolIcon } from '../../lib/tool-icons';
import type { AiToolDefinition } from '../../services/tool-definitions.service';
import { ScreenNotice } from '../screen-notice';
import { GaleriaDoAtelie } from './galeria';
import { MesaDeCriacao } from './mesa';
import { PassoEntrega, PassoMarca, PassoProduto } from './passos';
import { ResultadoDaArte } from './resultado';
import {
	ajustesDaDefinition,
	ENTRADA_FOTO,
	ENTRADA_REFERENCIAS,
	type EstadoAtelie,
	entregasDaDefinition,
	estadoInicialDoAtelie,
	kitDaDefinition,
	todosOsTamanhosDaDefinition,
	videoDaDefinition,
} from './tipos';
import { AVISO_DESCONEXAO, useAtelieRun } from './use-atelie-run';

/**
 * O ATELIÊ — `ui.layout: 'atelie'`. A tela inteira, em quatro momentos.
 *
 *   ① os três passos   o que você vai fazer · seu produto · sua marca
 *   ② a mesa de criação  o time trabalhando, ao vivo
 *   ③ o resultado      a arte, o texto pronto e quem trabalhou nela
 *   ④ o tropeço        conexão caída / erro / sem saldo — nunca uma tela muda
 *
 * ┌─ O QUE ESTE ARQUIVO É, E O QUE ELE NÃO É ────────────────────────────────┐
 * │ Ele é o ORQUESTRADOR: guarda o `EstadoAtelie`, decide qual momento está   │
 * │ na tela, cuida da navegação e dispara o run. Ele NÃO desenha passo, não   │
 * │ desenha cartão de especialista e não desenha resultado — cada uma dessas  │
 * │ peças mora no próprio arquivo (`passos.tsx`, `mesa.tsx`, `resultado.tsx`) │
 * │ e todas recebem estado por prop. Foi assim que as quatro puderam ser      │
 * │ escritas em paralelo, e é assim que trocar uma não mexe nas outras.       │
 * │                                                                          │
 * │ O contrato com o dispatcher é o MESMO do ramo `intel`: recebe só `def` e  │
 * │ `toolKey`, e cuida do próprio billing e do próprio stream. Nada de        │
 * │ `values`/`controls`/`onRun` vindo de fora — este layout não tem           │
 * │ formulário genérico.                                                     │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─ AS REGRAS QUE ESTA TELA CARREGA (as mesmas dos arquivos irmãos) ────────┐
 * │ ① A TELA NÃO CONHECE "post" NEM "gravar" PELO NOME. Os caminhos vêm de   │
 * │    `ui.atelie.entregas[]` e o cartão clicado é COPIADO para o estado —   │
 * │    `entrega`, `entrega_frase`, `modo_geracao` e a sugestão de formato.   │
 * │                                                                          │
 * │ ② TODO ESPECIALISTA PAGO PRECISA DE PONTO DE RENDER. Quem cuida disso    │
 * │    são a mesa (ao vivo) e o resultado (depois), os dois a partir da      │
 * │    lista que o motor mandou. Aqui a obrigação correspondente é NUNCA     │
 * │    engolir um run: erro, desconexão e saldo insuficiente têm painel.     │
 * │                                                                          │
 * │ ③ `input.pedido` É JSON E O ALUNO NUNCA VÊ ISSO. Quem serializa é o hook │
 * │    do run, num lugar só; aqui trafegam duas perguntas em português.      │
 * └──────────────────────────────────────────────────────────────────────────┘
 */

/* ═══════════════════ o formato da arte ═══════════════════ */

/**
 * "16:9" → `{w:16,h:9}`. Serve para desenhar o retângulo em miniatura do
 * seletor de formato — quem não é designer reconhece a FORMA muito antes de
 * decodificar a razão escrita.
 *
 * Devolve `null` para qualquer coisa que não seja `número:número`: a lista de
 * formatos vem da definition (`input.aspect.options`), e um valor novo cadastrado
 * na Fábrica tem que continuar clicável mesmo sem desenho.
 */
function proporcao(v: string): { w: number; h: number } | null {
	const m = /^(\d+)\s*:\s*(\d+)$/.exec(v);
	if (!m) return null;
	const w = Number(m[1]);
	const h = Number(m[2]);
	if (!w || !h) return null;
	return { w, h };
}

/**
 * O NOME DE CADA FORMATO — em ONDE ELE É USADO, não em razão de aspecto.
 *
 * ┌─ POR QUE "1:1" DEIXOU DE SER A MANCHETE ─────────────────────────────────┐
 * │ A pílula trazia a razão em negrito e o apelido em cinza pequeno embaixo,  │
 * │ e a frase-resumo fechava com "…no formato 1:1". Numa ferramenta cuja      │
 * │ régua é não usar vocabulário de designer, a notação de máquina era        │
 * │ justamente o que estava em destaque.                                     │
 * │                                                                          │
 * │ Pior: os apelidos REPETIAM. `4:3` e `3:2` eram os dois "deitado"; `3:4` e │
 * │ `2:3` eram os dois "em pé". Quem não é designer não tinha como escolher   │
 * │ entre dois "deitado" a não ser decodificando a razão — exatamente o que o │
 * │ apelido existia para poupar. Agora cada um diz ONDE se usa, que é a       │
 * │ pergunta que o aluno realmente tem.                                      │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Continua sendo ENFEITE opcional, nunca a fonte da lista: um formato que não
 * estiver aqui aparece com a razão como nome e segue clicável. A lista de
 * verdade é a da definition (`input.aspect.options`).
 */
const NOME_DO_FORMATO: Record<string, string> = {
	'1:1': 'Quadrado',
	'4:3': 'Deitado',
	'3:2': 'Deitado (foto)',
	'16:9': 'Bem deitado',
	'3:4': 'Em pé',
	'2:3': 'Em pé (cartaz)',
	'9:16': 'Story',
};

/** Onde aquele formato costuma ser usado. Some quando não se sabe. */
const ONDE_SE_USA: Record<string, string> = {
	'1:1': 'feed, marketplace',
	'4:3': 'foto de produto',
	'3:2': 'foto de câmera',
	'16:9': 'capa, YouTube',
	'3:4': 'feed em pé',
	'2:3': 'impressão',
	'9:16': 'story, Reels',
};

const ACENTO = 'var(--screen-accent, #8b5cf6)';
const ACENTO_FRACO = `color-mix(in srgb, ${ACENTO} 12%, transparent)`;

function PilulaFormato({
	valor,
	escolhido,
	onEscolher,
}: {
	valor: string;
	escolhido: boolean;
	onEscolher: () => void;
}) {
	const p = proporcao(valor);
	const LADO = 20;
	const largura = p
		? p.w >= p.h
			? LADO
			: Math.round((LADO * p.w) / p.h)
		: LADO;
	const altura = p
		? p.h >= p.w
			? LADO
			: Math.round((LADO * p.h) / p.w)
		: LADO;
	const nome = NOME_DO_FORMATO[valor] ?? valor;
	const onde = ONDE_SE_USA[valor];

	return (
		<button
			type="button"
			onClick={onEscolher}
			aria-pressed={escolhido}
			/* O rótulo acessível carrega a razão, que sumiu da pintura: quem usa
			   leitor de tela (ou já sabe o que é 4:3) continua tendo o dado exato. */
			aria-label={`${nome} — proporção ${valor}${onde ? ` (${onde})` : ''}`}
			style={
				escolhido
					? { borderColor: ACENTO, backgroundColor: ACENTO_FRACO }
					: undefined
			}
			className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors ${
				escolhido
					? ''
					: 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20'
			}`}
		>
			<span
				aria-hidden="true"
				className="grid h-5 w-5 shrink-0 place-items-center"
			>
				<span
					className="rounded-[3px] border-2"
					style={{
						width: `${largura}px`,
						height: `${altura}px`,
						borderColor: escolhido ? ACENTO : 'currentColor',
						opacity: escolhido ? 1 : 0.35,
					}}
				/>
			</span>
			<span className="min-w-0">
				<span className="block text-xs font-semibold text-slate-800 dark:text-slate-100">
					{nome}
				</span>
				{onde ? (
					<span className="block text-[10px] leading-tight text-slate-500 dark:text-slate-400">
						{onde}
					</span>
				) : null}
			</span>
		</button>
	);
}

/**
 * O CARTÃO "TODOS OS TAMANHOS" — a opção que o dono pediu, ao lado das pílulas.
 *
 * Ele NÃO é uma pílula a mais, e a diferença é o ponto: as pílulas escolhem UM
 * quadro; este escolhe "me dê a arte em todos". Por isso ele ocupa a linha
 * inteira embaixo, com espaço para a frase que explica o que vai acontecer — a
 * mesma arte, entregue em quatro formatos, sem custo a mais.
 *
 * Tudo aqui vem de `ui.atelie.todos_os_tamanhos` (rótulo, frase e o quadro em
 * que a arte é gerada). Este componente não sabe o nome de nenhuma opção.
 */
function CartaoTodosOsTamanhos({
	cartao,
	escolhido,
	onEscolher,
}: {
	cartao: { label: string; hint: string; nota: string };
	escolhido: boolean;
	onEscolher: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onEscolher}
			aria-pressed={escolhido}
			style={
				escolhido
					? { borderColor: ACENTO, backgroundColor: ACENTO_FRACO }
					: undefined
			}
			className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
				escolhido
					? ''
					: 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20'
			}`}
		>
			{/* Três retângulos de proporções diferentes: a FORMA diz "vários
			    formatos" antes de qualquer palavra — mesma régua das pílulas. */}
			<span
				aria-hidden="true"
				className="mt-0.5 flex shrink-0 items-end gap-1"
				style={{ color: escolhido ? ACENTO : 'currentColor' }}
			>
				{[
					{ w: 14, h: 14 },
					{ w: 9, h: 16 },
					{ w: 18, h: 10 },
				].map((r) => (
					<span
						key={`${r.w}x${r.h}`}
						className="rounded-[3px] border-2"
						style={{
							width: `${r.w}px`,
							height: `${r.h}px`,
							opacity: escolhido ? 1 : 0.35,
						}}
					/>
				))}
			</span>
			<span className="min-w-0">
				<span className="block text-xs font-semibold text-slate-800 dark:text-slate-100">
					{cartao.label}
					{cartao.nota ? (
						<span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-white/10 dark:text-slate-400">
							{cartao.nota}
						</span>
					) : null}
				</span>
				{cartao.hint ? (
					<span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
						{cartao.hint}
					</span>
				) : null}
			</span>
		</button>
	);
}

/* ═══════════════════ as miniaturas da mesa ═══════════════════ */

/**
 * As chaves de `miniaturas` são o `entrada` do roster, e agora moram em
 * `tipos.ts`: a mesa precisa das MESMAS constantes para escolher a frase de
 * "não recebi este material" (antes ela dizia "sem foto" para quem não tinha
 * recebido REFERÊNCIAS). Ver a caixa lá.
 */

/**
 * Object URLs do que o aluno mandou, criados UMA vez por arquivo e revogados na
 * troca e no unmount.
 *
 * Sem a revogação cada foto trocada deixa um blob preso na memória da aba pelo
 * resto da sessão; e sem a identidade estável do objeto os cartões da mesa — que
 * são `memo` e comparam esta prop por identidade — repintariam o time inteiro a
 * cada evento do stream (são dezenas por run).
 */
function useMiniaturas(
	foto: File | null,
	referencias: File[],
): Record<string, string[]> {
	const [mapa, setMapa] = useState<Record<string, string[]>>({});

	useEffect(() => {
		const criadas: string[] = [];
		const proximo: Record<string, string[]> = {};
		if (foto) {
			const u = URL.createObjectURL(foto);
			criadas.push(u);
			proximo[ENTRADA_FOTO] = [u];
		}
		if (referencias.length > 0) {
			proximo[ENTRADA_REFERENCIAS] = referencias.map((f) => {
				const u = URL.createObjectURL(f);
				criadas.push(u);
				return u;
			});
		}
		setMapa(proximo);
		return () => {
			for (const u of criadas) URL.revokeObjectURL(u);
		};
	}, [foto, referencias]);

	return mapa;
}

/* ═══════════════════ os painéis de tropeço ═══════════════════ */

/**
 * A CONEXÃO CAIU — e isto NÃO é falha, é o painel mais importante desta tela.
 *
 * O socket cair não cancela nada: o run continua no servidor, já cobrado, e a
 * arte é gerada e gravada. Um painel vermelho dizendo "erro" aqui faria o aluno
 * pedir estorno de um trabalho que ele vai receber. Âmbar, com a frase que o
 * hook exporta (`AVISO_DESCONEXAO`) para ninguém inventar outra.
 */
function PainelDesconexao({
	onFechar,
	ondeAparece,
}: {
	onFechar: () => void;
	/** Onde a arte vai estar depois — a tela é quem sabe se esse lugar existe. */
	ondeAparece: string;
}) {
	return (
		<div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-500/30 dark:bg-amber-500/5">
			<WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
			<div className="min-w-0 flex-1">
				<p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
					Perdemos o acompanhamento — o trabalho não parou
				</p>
				<p className="mt-1 text-sm leading-relaxed text-amber-800 dark:text-amber-300/90">
					{AVISO_DESCONEXAO} Se ela já tiver ficado pronta, {ondeAparece}.
				</p>
			</div>
			<button
				type="button"
				onClick={onFechar}
				className="shrink-0 rounded-lg border border-amber-300/60 px-2.5 py-1 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100/60 dark:border-amber-500/30 dark:text-amber-200 dark:hover:bg-amber-500/10"
			>
				Entendi
			</button>
		</div>
	);
}

/** Erro de verdade: o time não fechou, o plano não deixa, o saldo acabou. */
function PainelErro({ mensagem }: { mensagem: string }) {
	return (
		<div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-500/30 dark:bg-rose-500/5">
			<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
			<div className="min-w-0">
				<p className="text-sm font-semibold text-rose-900 dark:text-rose-200">
					A arte não saiu desta vez
				</p>
				{/*
				 * A MENSAGEM NEM SEMPRE VEM ESCRITA PARA O ALUNO — este comentário
				 * dizia que sim, e por isso ela era renderizada crua.
				 *
				 * `res.erro(err.status, err.message)` no main API repassa literalmente o
				 * que o gate de cobrança levantou, e o gate levanta `billing_required` e
				 * `invalid_invocation`. Numa tela cujo arquivo-irmão proíbe a palavra
				 * "modelo", o aluno podia ler um slug de sistema. Quem traduz agora é
				 * `mensagemDoAluno` (no hook do run), que converte o que é de máquina e
				 * deixa passar intacto o que já é português — a maioria dos casos.
				 */}
				<p className="mt-1 text-sm leading-relaxed text-rose-800 dark:text-rose-300/90">
					{mensagem}
				</p>
				<p className="mt-2 text-xs leading-relaxed text-rose-700/80 dark:text-rose-300/70">
					O seu pedido continua preenchido aqui embaixo — é só tentar de novo.
					Quando o time não fecha, o run não é cobrado.
				</p>
			</div>
		</div>
	);
}

/* ═══════════════════ o stepper ═══════════════════ */

type Passo = 1 | 2 | 3;
const PASSOS: readonly Passo[] = [1, 2, 3] as const;

/**
 * UMA pílula do stepper.
 *
 * O rótulo é a ESCOLHA já feita ("Post para redes", "Caneca de porcelana",
 * "Laser Art"), não o título do passo: cada passo desenha o próprio `<h2>`, e
 * repetir "O que você vai fazer?" aqui em cima seria dizer a mesma coisa duas
 * vezes na mesma dobra. Sem escolha, cai em "Passo N".
 */
function Pilula({
	numero,
	rotulo,
	feito,
	ativo,
	liberado,
	onIr,
}: {
	numero: Passo;
	rotulo: string;
	feito: boolean;
	ativo: boolean;
	liberado: boolean;
	onIr: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onIr}
			disabled={!liberado}
			aria-current={ativo ? 'step' : undefined}
			style={ativo ? { borderColor: ACENTO } : undefined}
			className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
				ativo
					? 'bg-white shadow-sm dark:bg-[#1a1a1d]'
					: 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20'
			}`}
		>
			<span
				className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold"
				style={
					ativo || feito
						? { backgroundColor: ACENTO, color: '#fff' }
						: { backgroundColor: ACENTO_FRACO, color: ACENTO }
				}
			>
				{feito && !ativo ? <Check className="h-3.5 w-3.5" /> : numero}
			</span>
			<span
				className={`min-w-0 truncate text-xs font-medium ${
					ativo
						? 'text-slate-900 dark:text-white'
						: 'text-slate-500 dark:text-slate-400'
				}`}
			>
				{rotulo}
			</span>
		</button>
	);
}

/* ═══════════════════ a tela ═══════════════════ */

export interface ToolAtelieViewProps {
	def: AiToolDefinition;
	toolKey: string;
}

export function ToolAtelieView({ def, toolKey }: ToolAtelieViewProps) {
	const run = useAtelieRun(toolKey);
	const { entries, entry } = useMarcaAtiva();
	const qc = useQueryClient();

	const [passo, setPasso] = useState<Passo>(1);
	const [estado, setEstado] = useState<EstadoAtelie>(() =>
		estadoInicialDoAtelie(),
	);
	/**
	 * A escolha de marca está indo para o servidor.
	 *
	 * Sem isto, um clique em "usar esta" seguido de um clique em "Criar a arte"
	 * geraria a peça com a marca ANTIGA: o `PATCH` do `principal` ainda estaria no
	 * ar quando o pipeline lesse a coleção. É por isso que o passo 3 avisa.
	 */
	const [gravandoMarca, setGravandoMarca] = useState(false);
	/** O aluno mandou parar de acompanhar. O run continua — a tela precisa dizer. */
	const [desacompanhou, setDesacompanhou] = useState(false);

	/**
	 * PATCH-MERGE, e com identidade ESTÁVEL.
	 *
	 * Os três passos mandam pedaços (`{foto}`, `{produto}`, `{marcaId}`), nunca o
	 * estado inteiro — substituir em vez de fundir apagaria a entrega no passo 2.
	 * E a identidade precisa ser estável porque o passo 3 usa esta função dentro
	 * de um `useEffect`: uma função nova a cada render faria o efeito de sincronia
	 * da marca rodar em loop.
	 */
	const mudar = useCallback((patch: Partial<EstadoAtelie>) => {
		setEstado((s) => ({ ...s, ...patch }));
	}, []);

	const miniaturas = useMiniaturas(estado.foto, estado.referencias);

	const entregas = useMemo(() => entregasDaDefinition(def), [def]);
	const semCaminhos = entregas.length === 0;

	/**
	 * OS AJUSTES E O KIT SÃO DADO, como os caminhos do passo 1. Uma definition
	 * sem `ui.atelie.ajustes` simplesmente não desenha a seção — em vez de
	 * desenhar botões que o motor recusaria.
	 */
	const ajustes = useMemo(() => ajustesDaDefinition(def), [def]);
	const kitUi = useMemo(() => kitDaDefinition(def), [def]);
	/**
	 * O VÍDEO também é dado — mas com uma diferença que importa: aqui a ausência
	 * da chave NÃO apaga a seção. Quem manda nela é o resultado do run
	 * (`saida.video`); `ui.atelie.video` só escolhe a palavra. Um vídeo montado e
	 * escondido porque um texto faltou seriam dois segundos de CPU e um arquivo
	 * no CDN sem ninguém para ver.
	 */
	const videoUi = useMemo(() => videoDaDefinition(def), [def]);

	/**
	 * "TODOS OS TAMANHOS" também é DADO. `null` = a definition não declara o
	 * cartão, e aí a tela não desenha a opção — em vez de oferecer um botão que o
	 * pipeline não saberia honrar (o `estender` do kit sai do mesmo lugar).
	 */
	const todosUi = useMemo(() => todosOsTamanhosDaDefinition(def), [def]);

	/** Os formatos são DADO (`input.aspect.options`) — a tela não tem lista própria. */
	const formatos = useMemo(() => {
		const brutos = def.definition.input?.aspect?.options;
		return Array.isArray(brutos)
			? brutos.map((v) => String(v)).filter(Boolean)
			: [];
	}, [def]);

	/**
	 * O FORMATO ESCOLHIDO NÃO ESTÁ NA LISTA DA FERRAMENTA.
	 *
	 * Só acontece por definition desalinhada: `input.aspect` é um `enum`, e o
	 * `aspecto` de cada cartão (`ui.atelie.entregas[].aspecto`) é escrito à parte —
	 * nada obriga os dois a combinarem. Quando não combinam, o valor viaja e o
	 * motor recusa o run DEPOIS do clique, com uma mensagem de máquina.
	 *
	 * Corrigir em silêncio (trocar pelo primeiro da lista) seria pior: a arte sairia
	 * num formato que ninguém pediu. A tela diz o que está errado e deixa o aluno
	 * escolher um formato que existe — e SEGURA O BOTÃO até ele escolher.
	 *
	 * Avisar sem segurar era meio conserto: o aluno lia o aviso âmbar, clicava
	 * assim mesmo, e o motor recusava com `input 'aspect' inválido` DEPOIS do
	 * clique. Trocar um enum inválido por uma frase de máquina não é o negócio.
	 */
	const formatoForaDaLista =
		formatos.length > 0 &&
		Boolean(estado.aspecto) &&
		!formatos.includes(estado.aspecto);

	/**
	 * O MESMO DESALINHAMENTO, DO LADO DO CAMINHO — e ele não tinha guarda nenhuma.
	 *
	 * `ui.atelie.entregas[].value` e `input.entrega.options` são escritos em
	 * lugares diferentes da definition e nada obriga os dois a combinarem. Um
	 * `value` fora do enum produzia exatamente o mesmo 400 depois do clique, só
	 * que sem uma linha sequer na tela antes. É a mesma classe de falha, e estava
	 * guardada de um lado só.
	 */
	const caminhos = useMemo(() => {
		const brutos = def.definition.input?.entrega?.options;
		return Array.isArray(brutos) ? brutos.map((v) => String(v)) : [];
	}, [def]);
	const caminhoForaDaLista =
		caminhos.length > 0 &&
		Boolean(estado.entrega) &&
		!caminhos.includes(estado.entrega?.value ?? '');

	/**
	 * O interruptor da busca só aparece se a ferramenta DECLARAR o input.
	 *
	 * Uma definition sem `buscar_web` desenharia um controle cujo valor o motor
	 * descarta — controle que não faz nada é pior do que controle ausente.
	 */
	const temBuscaWeb = Boolean(def.definition.input?.buscar_web);

	const ui = def.definition.ui as
		| {
				icon?: string;
				action?: { label?: string; showCostNotice?: boolean };
				history?: { enabled?: boolean; source?: string; title?: string };
		  }
		| undefined;

	/**
	 * ONDE A ARTE APARECE DEPOIS — e por que isto virou dado.
	 *
	 * A tela prometia "fica salva em Minhas artes" em quatro lugares e não havia
	 * lugar nenhum: quem renderizava `ui.history` era o ramo `canvas`, que ficou
	 * inalcançável para esta tool quando o dispatcher passou a testar `atelie`
	 * antes. Agora quem desenha o histórico é o próprio Ateliê
	 * (`GaleriaDoAtelie`) — e a promessa só é feita quando a definition realmente
	 * declara a coleção. Uma definition sem `history` deixa de prometer um lugar,
	 * em vez de apontar para o vazio.
	 */
	const historico = ui?.history;
	const colecaoDoHistorico =
		historico?.enabled === false ? '' : (historico?.source ?? '');
	const tituloDoHistorico = historico?.title || 'Minhas artes';
	const textoOndeAparece = colecaoDoHistorico
		? `a arte aparece em “${tituloDoHistorico}”, aqui embaixo, assim que ficar pronta`
		: 'a arte é gerada e guardada do mesmo jeito';
	const screenUi = resolveScreenUi(def, 'customer');
	const acento = accentForTool(def);
	const estilo = { '--screen-accent': acento } as CSSProperties;
	/**
	 * Tema forçado pelo admin (`ui.customer.theme`). A classe sozinha NÃO basta:
	 * `dark` liga as variantes `dark:` dos passos, e sem um fundo escuro junto a
	 * tela ficaria com texto claro sobre branco. É a mesma dupla que o renderizador
	 * genérico monta em `themedShell`.
	 */
	const fundoDoTema =
		screenUi.themeClass === 'dark'
			? 'bg-[#0d0d0f]'
			: screenUi.themeClass === 'room-light'
				? 'bg-slate-50'
				: '';
	const casca = `p-4 md:p-8 ${screenUi.themeClass} ${fundoDoTema}`.trim();
	const Icone = resolveToolIcon(ui?.icon ?? 'sparkles');
	const rotuloAcao = ui?.action?.label ?? 'Criar a arte';
	const mostrarCusto = ui?.action?.showCostNotice ?? true;

	/**
	 * A marca que vai temperar esta arte: a que o aluno acabou de escolher (ainda
	 * otimista) ou, na falta dela, a que o SERVIDOR tem como principal — que é a
	 * que o `collection.query` do pipeline vai ler de verdade.
	 */
	const marcaDaArte = useMemo(() => {
		const escolhida =
			entries.find((e) => e.id === estado.marcaId) ?? entry ?? null;
		return escolhida ? lerMarca(escolhida) : null;
	}, [entries, entry, estado.marcaId]);

	const podeAvancar = Boolean(estado.entrega);
	const { billing } = run;
	const bloqueado =
		!podeAvancar ||
		billing.insufficient ||
		billing.viewOnly ||
		billing.pending ||
		gravandoMarca ||
		semCaminhos ||
		// Definition desalinhada: o motor recusaria DEPOIS do clique, com uma
		// mensagem de máquina. Melhor não deixar clicar e dizer o porquê.
		formatoForaDaLista ||
		caminhoForaDaLista;

	const criar = () => {
		if (bloqueado) return;
		setDesacompanhou(false);
		void run.rodar(estado);
	};

	/* ═══════════ ②b o ajuste em curso ═══════════
	 *
	 * A MESA NÃO SERVE AQUI, e a diferença não é cosmética: um ajuste NÃO
	 * convoca o time de seis. A mesa desenharia "0 / — profissionais" com a
	 * barra parada, inventando uma equipe que ninguém chamou e ninguém pagou —
	 * exatamente o tipo de encenação que esta ferramenta evita em todo o resto.
	 * Um painel curto, com o nome do que está acontecendo, é a leitura honesta. */
	if (run.estado === 'rodando' && run.ajustando) {
		return (
			<div style={estilo} className={casca}>
				<div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-3xl border border-slate-200 p-10 text-center dark:border-white/10">
					<Loader2
						className="h-6 w-6 animate-spin"
						style={{ color: 'var(--screen-accent, #8b5cf6)' }}
					/>
					<p className="text-sm font-medium text-slate-800 dark:text-slate-100">
						{run.etapa}
					</p>
					<p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
						A arte original continua na sua galeria — o ajuste entra como uma
						peça nova, ligada a ela.
					</p>
				</div>
			</div>
		);
	}

	/* ═══════════ ② a mesa de criação ═══════════ */
	if (run.estado === 'rodando') {
		return (
			<div style={estilo} className={casca}>
				<div className="mx-auto max-w-5xl">
					<MesaDeCriacao
						especialistas={run.especialistas}
						fase={run.fase}
						ms={run.ms}
						etapa={run.etapa}
						miniaturas={miniaturas}
						/*
						 * O botão só existe DEPOIS que a invocação abriu (`podeParar`).
						 * Antes disso, abortar deixaria o voxxy debitado e a invocação
						 * `pending` órfã, sem ninguém ter trabalhado — ver o hook.
						 */
						onCancelar={
							run.podeParar
								? () => {
										setDesacompanhou(true);
										run.cancelar();
									}
								: undefined
						}
					/>
				</div>
			</div>
		);
	}

	/* ═══════════ ③ o resultado ═══════════
	   SEM container: a tela do resultado desenha o próprio fundo escuro e o
	   próprio respiro (é assim que ela fica legível independente do tema do app).
	   Embrulhá-la num `p-4 md:p-8` daqui produziria padding em dobro. */
	if (run.estado === 'pronto' && run.saida) {
		return (
			<div style={estilo}>
				<ResultadoDaArte
					saida={run.saida}
					toolKey={toolKey}
					ajustes={ajustes}
					kitUi={kitUi}
					videoUi={videoUi}
					ocupado={billing.pending}
					/*
					 * `ajustando` continua true depois que o ajuste termina (só volta a
					 * false num `rodar` novo), então ele diz exatamente o que a tela
					 * precisa saber aqui: a arte em cima da mesa veio de um ajuste.
					 */
					deAjuste={run.ajustando}
					semSaldo={billing.insufficient}
					custoNotice={billing.notice}
					/*
					 * O ajuste NÃO passa pelos três passos: ele age sobre a arte que já
					 * está na tela. Quem escolhe a rota (grátis × cobrada) é o hook, a
					 * partir do `custa` que a definition declarou — a tela só entrega o
					 * pedido. Depois de rodar, a galeria é invalidada porque a árvore de
					 * iterações ganhou um galho.
					 */
					onAjustar={(pedido) => {
						setDesacompanhou(false);
						void run.ajustar(pedido).then(() => {
							qc.invalidateQueries({ queryKey: ['gallery', toolKey] });
						});
					}}
					onRefazer={() => {
						/*
						 * "Criar outra arte" NÃO zera o pedido: quem acabou de receber um
						 * post costuma querer o anúncio da MESMA peça. Voltar ao passo 1
						 * com tudo preenchido é um clique até a próxima arte; zerar seria
						 * pedir a foto de novo.
						 */
						run.limpar();
						setDesacompanhou(false);
						setPasso(1);
						/*
						 * A arte que acabou de sair já está na coleção `galeria`, mas a
						 * query dela pode estar fresca (`staleTime` de 30 s) — sem esta
						 * invalidação o aluno voltaria ao passo 1 e veria "Minhas artes"
						 * SEM a peça que ele tem na tela há dois segundos, que é a maneira
						 * mais rápida de a seção nova perder a confiança dele.
						 */
						qc.invalidateQueries({ queryKey: ['gallery', toolKey] });
					}}
				/>
			</div>
		);
	}

	/* ═══════════ ① os três passos ═══════════ */
	/**
	 * O RÓTULO E O CHECK SÓ CONTAM O QUE O ALUNO JÁ FEZ NESTE FLUXO.
	 *
	 * O passo 3 nascia com o nome da marca e um check verde — porque `marcaDaArte`
	 * vem do SERVIDOR, e quem já tem marca cadastrada tem uma marca principal
	 * desde antes de abrir a ferramenta. O efeito, medido na abertura: pílula 1
	 * "Passo 1" sem check, pílula 2 "Passo 2" sem check, pílula 3 "Laser Art
	 * Marcenaria" COM check — e ela era a única desabilitada. Lia-se como "o passo
	 * 3 já está pronto e os outros não", no exato momento em que o aluno ainda não
	 * tinha feito nada.
	 *
	 * `liberado` já dependia de `podeAvancar`; agora o rótulo e o check dependem
	 * também. Uma pílula que o aluno não pode abrir não se anuncia como concluída.
	 */
	const rotulos: Record<Passo, string> = {
		1: estado.entrega?.label ?? 'Passo 1',
		2: estado.produto.trim() || (estado.foto ? 'Foto enviada' : 'Passo 2'),
		3: podeAvancar && marcaDaArte?.titulo ? marcaDaArte.titulo : 'Passo 3',
	};
	const feitos: Record<Passo, boolean> = {
		1: Boolean(estado.entrega),
		2: Boolean(estado.foto || estado.produto.trim()),
		3: podeAvancar && Boolean(marcaDaArte),
	};

	return (
		<div style={estilo} className={casca}>
			<div className="mx-auto max-w-4xl space-y-6">
				{/* ══ cabeçalho ══ */}
				<header className="flex items-start gap-3">
					<span
						className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
						style={{ backgroundColor: ACENTO_FRACO, color: ACENTO }}
					>
						<Icone className="h-5 w-5" />
					</span>
					<div className="min-w-0">
						<h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">
							{screenUi.title ?? def.title}
						</h1>
						{(screenUi.subtitle ?? def.description) ? (
							<p className="mt-0.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
								{screenUi.subtitle ?? def.description}
							</p>
						) : null}
					</div>
				</header>

				{/*
				 * O banner do admin abre a ferramenta e some depois. Ele fala de
				 * cadastrar a marca — que é exatamente o que o passo 3 diz, com mais
				 * espaço e com o botão junto. Repeti-lo nos três passos seria dizer a
				 * mesma coisa três vezes no mesmo fluxo.
				 *
				 * E ele SÓ APARECE PARA QUEM AINDA NÃO TEM MARCA. O aviso é estático da
				 * definition ("Cadastre a sua marca uma vez e toda arte já sai com a sua
				 * cara") e não olhava se já existe uma: o aluno mais adiantado abria a
				 * ferramenta e levava, como primeira frase da tela, uma instrução para
				 * fazer o que ele já tinha feito — com o nome da marca dele visível na
				 * mesma dobra, no stepper e no selo "NESTA ARTE" do passo 3.
				 */}
				{passo === 1 && screenUi.notice && !marcaDaArte ? (
					<ScreenNotice notice={screenUi.notice} />
				) : null}

				{/* ══ stepper ══
				    ┌─ `contain:inline-size` NÃO É ENFEITE: É O CONSERTO DO CELULAR ────┐
				    │ A 390 px o botão "Criar a arte" ficava FORA da tela (medido:      │
				    │ left=510, right=655) e o documento inteiro rolava de lado. A causa │
				    │ era esta linha, e não o que parecia: o `min-w-0`+`truncate` das    │
				    │ pílulas FUNCIONA — dentro de um pai de 358 px elas encolhem para   │
				    │ 114 px cada, medido. O que estourava era o `min-content` do        │
				    │ `<nav>`, de 730 px, subindo pela árvore até um item flex da casca  │
				    │ do app (`div.relative.z-10.flex-1`, `min-width:auto`) e virando a  │
				    │ largura mínima da PÁGINA. Por isso a largura acompanhava o que o   │
				    │ aluno digitava: quanto maior o nome do produto na pílula 2, mais a │
				    │ tela quebrava.                                                    │
				    │                                                                   │
				    │ Medi os candidatos antes de escolher, no DOM real:                │
				    │   nada                → min-content 730                            │
				    │   `overflow-hidden`   → 730  (não faz absolutamente nada aqui)     │
				    │   `max-w` no rótulo   → 535                                        │
				    │   `flex-wrap`         → 380  (ainda estoura os 358 disponíveis)    │
				    │   `contain:inline-size` → 0, e a pintura em 358 px fica IDÊNTICA   │
				    │                          (358 de largura, pílulas de 114, 41 de    │
				    │                          altura — os mesmos números de antes)      │
				    │                                                                   │
				    │ Ele é exato para o caso: a largura do nav passa a vir do pai (um   │
				    │ bloco), que é de onde ela sempre deveria ter vindo, e para de ser  │
				    │ ditada pelo texto que está dentro dele. Não mexo na casca do app — │
				    │ as outras páginas ficam em 390 porque nenhuma tem um filho de 730. │
				    └───────────────────────────────────────────────────────────────────┘ */}
				<nav
					aria-label="Passos"
					className="flex items-stretch gap-2 [contain:inline-size]"
				>
					{PASSOS.map((n) => (
						<Pilula
							key={n}
							numero={n}
							rotulo={rotulos[n]}
							feito={feitos[n]}
							ativo={passo === n}
							/* Os passos 2 e 3 só abrem depois do caminho escolhido: sem ele o
							   run não sabe o que pedir, e o passo 2 não teria o que dizer. */
							liberado={n === 1 || podeAvancar}
							onIr={() => setPasso(n)}
						/>
					))}
				</nav>

				{/* ══ tropeços ══ */}
				{run.estado === 'erro' && run.desconectado ? (
					<PainelDesconexao
						onFechar={() => run.limpar()}
						ondeAparece={textoOndeAparece}
					/>
				) : null}
				{run.estado === 'erro' && !run.desconectado && run.erro ? (
					<PainelErro mensagem={run.erro} />
				) : null}
				{desacompanhou && run.estado !== 'erro' ? (
					<div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
						<Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
						<p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
							Você saiu do acompanhamento e o time continua trabalhando —{' '}
							{textoOndeAparece}. Criar outra agora cobra de novo.
						</p>
					</div>
				) : null}

				{/*
				 * A MESA CONGELADA — o conserto do defeito mais caro desta tela.
				 *
				 * O ramo de cima só desenha a mesa com `estado === 'rodando'`. Quando o
				 * aluno mandava parar de acompanhar (ou o socket caía), o estado virava
				 * `parado`/`erro` e os seis cartões — que continuavam no hook — nunca
				 * mais eram desenhados. Um run JÁ COBRADO passava a não ter vestígio
				 * nenhum na tela de que alguém tinha trabalhado nele.
				 *
				 * Congelada ela continua sendo a prova de por quantos profissionais
				 * aquele voxxy pagou, e de quem chegou a entregar antes de a tela parar
				 * de escutar. Sem `onCancelar`: não há mais o que parar.
				 */}
				{run.estado !== 'pronto' && run.especialistas.length > 0 ? (
					<MesaDeCriacao
						congelada
						especialistas={run.especialistas}
						fase={run.fase}
						ms={run.ms}
						miniaturas={miniaturas}
					/>
				) : null}

				{/*
				 * OS TRÊS PASSOS FICAM MONTADOS e o que muda é a visibilidade.
				 *
				 * "Voltar um passo sem perder o que preencheu" não é só o `EstadoAtelie`,
				 * que mora aqui: é também o estado INTERNO de cada passo — o formulário
				 * de marca meio preenchido, o aviso de arquivo recusado, a marca que o
				 * passo 3 acabou de gravar. Desmontar e remontar joga tudo isso fora, e
				 * no passo 3 chega a piscar a marca errada por um instante (o efeito de
				 * sincronia nasce de novo antes de o refetch da lista chegar).
				 *
				 * O ALCANCE DISSO É O STEPPER, e só ele: entrar na mesa ou no resultado
				 * são `return`s lá em cima, que desmontam a árvore inteira. Depois de
				 * "criar outra arte" o formulário de marca meio preenchido volta zerado
				 * de qualquer jeito — o que o `EstadoAtelie` preserva (foto, textos,
				 * caminho) é o que importa, e esse mora aqui fora.
				 */}
				{/* `hidden` como ATRIBUTO, e não só como classe, para tirar o passo
				    escondido da ordem de tabulação e do leitor de tela — essa é a razão
				    boa, e é a única.

				    (Havia aqui uma segunda justificativa, sobre o `space-y-6` do pai
				    pular o elemento via `:not([hidden])`. Era Tailwind v3; este repo é
				    v4, onde `space-y-*` compila com `:not(:last-child)` — conferido no
				    `dist` do pacote. Sem efeito prático nos dois casos, já que um
				    elemento `display:none` não gera caixa nem margem, mas justificar uma
				    decisão com uma premissa falsa é como ela sobrevive a uma revisão que
				    deveria tê-la corrigido.) */}
				<div hidden={passo !== 1} className={passo === 1 ? '' : 'hidden'}>
					<PassoEntrega
						def={def}
						estado={estado}
						onMudar={mudar}
						onAvancar={() => setPasso(2)}
					/>
				</div>
				<div hidden={passo !== 2} className={passo === 2 ? '' : 'hidden'}>
					<PassoProduto estado={estado} onMudar={mudar} />
				</div>
				<div hidden={passo !== 3} className={passo === 3 ? '' : 'hidden'}>
					<PassoMarca
						estado={estado}
						onMudar={mudar}
						onGravando={setGravandoMarca}
					/>
				</div>

				{/* ══ ajustes da arte + ação (só no último passo) ══ */}
				{passo === 3 ? (
					<section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#1a1a1d]">
						{formatos.length > 0 ? (
							<div>
								<h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
									Formato da arte
								</h3>
								<p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
									{estado.entrega?.aspecto
										? `Para “${estado.entrega.label}” o normal é ${estado.entrega.aspecto} — troque se quiser.`
										: 'Escolha a proporção da peça.'}
								</p>
								<div className="mt-3 flex flex-wrap gap-2">
									{formatos.map((f) => (
										<PilulaFormato
											key={f}
											valor={f}
											/**
											 * Com "todos os tamanhos" ligado NENHUMA pílula fica
											 * acesa, mesmo que `aspecto` seja igual à do cartão: as
											 * duas coisas são a MESMA decisão, e duas escolhas
											 * acesas ao mesmo tempo diriam que dá para ter as duas.
											 */
											escolhido={
												!estado.todosOsTamanhos && estado.aspecto === f
											}
											onEscolher={() =>
												mudar({ aspecto: f, todosOsTamanhos: false })
											}
										/>
									))}
								</div>
								{todosUi ? (
									<div className="mt-2">
										<CartaoTodosOsTamanhos
											cartao={todosUi}
											escolhido={estado.todosOsTamanhos}
											onEscolher={() =>
												/**
												 * Escolher "todos" TROCA o formato da geração pelo do
												 * cartão — é dele que os outros são derivados. Clicar
												 * de novo volta para uma escolha simples, e o formato
												 * fica onde está: desfazer não pode mudar duas coisas.
												 */
												mudar(
													estado.todosOsTamanhos
														? { todosOsTamanhos: false }
														: {
																todosOsTamanhos: true,
																aspecto: todosUi.aspecto,
															},
												)
											}
										/>
									</div>
								) : null}
								{formatoForaDaLista ? (
									<p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
										<AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
										<span>
											O formato <strong>{estado.aspecto}</strong> não está entre
											os que esta ferramenta aceita. Escolha um dos de cima — se
											você não mexeu nisso, avise o suporte.
										</span>
									</p>
								) : null}
							</div>
						) : null}

						{temBuscaWeb ? (
							<label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-white/10">
								<input
									type="checkbox"
									checked={estado.buscarWeb}
									onChange={(e) => mudar({ buscarWeb: e.target.checked })}
									/* `accentColor` inline, e não a utilitária `accent-[…]`: o
									   valor é uma `var()` com fallback, e o parser de valor
									   arbitrário do Tailwind é o tipo de peça que engole isso em
									   silêncio e devolve a caixinha cinza padrão. */
									style={{ accentColor: acento }}
									className="mt-0.5 h-4 w-4 shrink-0"
								/>
								<span className="min-w-0">
									<span className="block text-sm font-medium text-slate-800 dark:text-slate-100">
										Olhar o que o mercado está fazendo
									</span>
									{/*
									 * A FRASE É MEDIDA, e é assim que ela não vira promessa: quem
									 * pesquisa é o especialista que tiver busca ligada no banco do
									 * admin, e hoje nenhum tem. Ligar aqui autoriza — não garante.
									 * Prometer "o time vai pesquisar" produziria uma espera maior
									 * e um resultado idêntico, sem ninguém entender por quê.
									 */}
									<span className="mt-0.5 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
										Autoriza o time a abrir páginas de referência antes de
										decidir a arte. Só tem efeito nos especialistas que o
										estúdio deixar pesquisar — pode demorar um pouco mais.
									</span>
								</span>
							</label>
						) : null}

						{/* O que vai acontecer quando ele clicar, em uma frase. */}
						<p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
							Vai sair{' '}
							<strong className="font-semibold text-slate-900 dark:text-white">
								{estado.entrega?.frase || estado.entrega?.label || 'a sua arte'}
							</strong>
							{/* "no formato 1:1" era a única notação de máquina que sobrava no
							    caminho principal. O nome humano vem do mesmo mapa das pílulas,
							    e um formato desconhecido cai na razão — que continua sendo
							    melhor do que nada. */}
							{/*
							 * Com "todos os tamanhos" a frase NÃO promete quatro peças: quem
							 * decide formato a formato é o portão do kit, e um formato que
							 * não sair vai aparecer com o motivo na seção do kit. Prometer
							 * "em quatro formatos" aqui viraria promessa quebrada em toda
							 * arte com detalhe até a beirada.
							 */}
							{estado.todosOsTamanhos && todosUi
								? ` em ${todosUi.label.toLowerCase()}`
								: estado.aspecto
									? ` em ${(NOME_DO_FORMATO[estado.aspecto] ?? estado.aspecto).toLowerCase()}`
									: ''}
							{marcaDaArte?.titulo ? (
								<>
									, com a marca{' '}
									<strong className="font-semibold text-slate-900 dark:text-white">
										{marcaDaArte.titulo}
									</strong>
								</>
							) : (
								', sem marca aplicada'
							)}
							.
						</p>

						{caminhoForaDaLista ? (
							<p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/5 dark:text-amber-300">
								<AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
								<span>
									O caminho <strong>{estado.entrega?.label}</strong> não está
									entre os que esta ferramenta aceita hoje. Volte ao passo 1 e
									escolha outro — se todos derem nisso, avise o suporte.
								</span>
							</p>
						) : null}

						{estado.entrega?.aviso ? (
							<p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/5 dark:text-amber-300">
								<AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
								<span>{estado.entrega.aviso}</span>
							</p>
						) : null}

						{billing.viewOnly ? (
							<p className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/5 dark:text-amber-300">
								Esta ferramenta está aberta para você conhecer. Para criar a
								arte de verdade é preciso um plano ativo.
							</p>
						) : null}
					</section>
				) : null}

				{/* ══ navegação ══ */}
				<div className="flex flex-col gap-2 border-t border-slate-200 pt-4 dark:border-white/10">
					<div className="flex items-center justify-between gap-3">
						<button
							type="button"
							onClick={() => setPasso((p) => (p === 3 ? 2 : 1))}
							disabled={passo === 1}
							className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800 disabled:invisible dark:text-slate-400 dark:hover:text-slate-100"
						>
							<ArrowLeft className="h-4 w-4" />
							Voltar
						</button>

						{passo === 3 ? (
							<button
								type="button"
								onClick={criar}
								disabled={bloqueado}
								/*
								 * DESLIGADO PRECISA PARECER DESLIGADO. Roxo saturado a 50% de
								 * opacidade sobre o fundo quase preto continuava lendo como
								 * botão ativo — o que segurava a leitura era só a linha de
								 * ajuda embaixo. Sem o fundo de acento e com o texto apagado,
								 * a diferença é visível antes de qualquer texto.
								 */
								style={bloqueado ? undefined : { backgroundColor: ACENTO }}
								className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:opacity-100 dark:disabled:bg-white/10 dark:disabled:text-slate-500"
							>
								<Sparkles className="h-4 w-4" />
								{gravandoMarca ? 'Salvando a marca…' : rotuloAcao}
							</button>
						) : (
							<button
								type="button"
								onClick={() => setPasso(passo === 1 ? 2 : 3)}
								disabled={!podeAvancar}
								/* Mesma regra do botão de criar: sem o fundo de acento quando
								   está desligado. Aqui a condição é só `podeAvancar` — avançar
								   de passo não depende de saldo nem de plano. */
								style={podeAvancar ? { backgroundColor: ACENTO } : undefined}
								className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:opacity-100 dark:disabled:bg-white/10 dark:disabled:text-slate-500"
							>
								Continuar
								<ArrowRight className="h-4 w-4" />
							</button>
						)}
					</div>

					{/*
					 * O AVISO DE CUSTO FICA COLADO NA AÇÃO, nos três passos — não só no
					 * último. Quem está subindo a foto já quer saber quanto custa; e
					 * quando falta saldo é este mesmo aviso que vira o botão de comprar
					 * voxxys, então escondê-lo nos passos 1 e 2 esconderia o motivo de o
					 * botão do fim estar desligado.
					 */}
					{mostrarCusto ? billing.notice : null}

					{passo === 1 && !podeAvancar && !semCaminhos ? (
						<p className="text-xs text-slate-500 dark:text-slate-400">
							Escolha um dos caminhos acima para continuar.
						</p>
					) : null}
				</div>

				{/*
				 * "MINHAS ARTES" — o lugar que a tela prometia e que não existia.
				 *
				 * Fica no passo 1 (a porta de entrada, para onde "Criar outra arte"
				 * volta) e sempre que houve um tropeço, que é justamente quando o aluno
				 * vem procurar uma peça já paga. Nos passos 2 e 3 ele está montando o
				 * pedido, e uma grade de artes antigas ali embaixo só disputaria a
				 * atenção com o que ele veio fazer.
				 */}
				{colecaoDoHistorico &&
				(passo === 1 || desacompanhou || run.estado === 'erro') ? (
					<GaleriaDoAtelie
						toolKey={toolKey}
						colecao={colecaoDoHistorico}
						titulo={tituloDoHistorico}
					/>
				) : null}
			</div>
		</div>
	);
}
