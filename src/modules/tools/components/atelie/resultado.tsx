'use client';

import {
	AlertTriangle,
	Check,
	ChevronDown,
	Clapperboard,
	Copy,
	Download,
	ExternalLink,
	Hash,
	LayoutGrid,
	Lightbulb,
	RefreshCw,
	Sparkles,
	Stamp,
	Type as TypeIcon,
	Users,
} from 'lucide-react';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useEntitlements } from '@/hooks/use-entitlements';
import { downloadUrl } from '../../lib/prompt-bank';
import { resolveToolIcon } from '../../lib/tool-icons';
import {
	type AgenteDaMesa,
	type AjusteCard,
	ajusteCusta,
	type PecaDoKit,
	type SaidaDoAtelie,
	type VideoUi,
} from './tipos';
import type { PedidoDeAjuste } from './use-atelie-run';

/**
 * O RESULTADO DO ATELIÊ — a arte, e ao lado dela o texto pronto para publicar.
 *
 * O aluno chegou aqui para SAIR COM UMA PEÇA. Então esta tela entrega duas
 * coisas na mesma dobra: a arte grande (com o botão de baixar) e o texto que
 * acompanha a arte (título, chamada, legenda, hashtags), cada bloco com um
 * botão de copiar que funciona de verdade. O resto — por que a arte ficou
 * assim, quem trabalhou nela, o pedido que o time escreveu — vem DEPOIS, na
 * ordem em que a curiosidade aparece, e nunca na frente do que ele veio buscar.
 *
 * ┌─ AS QUATRO REGRAS QUE ESTA TELA CUMPRE ────────────────────────────────┐
 * │ ① TODO ESPECIALISTA PAGO PRECISA DE PONTO DE RENDER. Quem rodou está em │
 * │    `saida.agentes` — e é DE LÁ que a seção do time é desenhada, item a  │
 * │    item, sem lista de seis chumbada aqui dentro. Um sétimo especialista │
 * │    que o admin cadastrar amanhã aparece sozinho, sem deploy do front.   │
 * │    (Um especialista que roda, é cobrado e não aparece é dinheiro        │
 * │    queimado em silêncio: foi o que reprovou quatro rodadas da Central.) │
 * │                                                                        │
 * │ ② O QUE FALHOU APARECE. `falhas`, `avisos` e a arte que não entrou na   │
 * │    galeria são mostrados sem alarme e sem maquiagem — quem pagou por um │
 * │    time de seis e recebeu cinco tem direito de saber.                   │
 * │                                                                        │
 * │ ③ A TELA NÃO FALA DE MÁQUINA. Nada de "modelo", "prompt em inglês" no   │
 * │    caminho principal, "tokens" ou o custo em dólar do run. Este último   │
 * │    não é mais uma questão de não renderizar: `custo_usd` SAIU da        │
 * │    allow-list do `output` na definition, porque não renderizar não      │
 * │    protegia nada — o número chegava ao navegador do mesmo jeito e       │
 * │    qualquer devtools aberto calculava a nossa margem.                   │
 * │                                                                        │
 * │ ④ NENHUM BOTÃO QUE NÃO EXISTE — e agora os Ajustes EXISTEM. Ampliar,    │
 * │    remover fundo, vetorizar e variar são desenhados a partir de         │
 * │    `ui.atelie.ajustes` (DADO, não lista chumbada aqui), e cada um DIZ    │
 * │    se gasta voxxy antes de o aluno clicar. Um ajuste que a definition   │
 * │    não declarar simplesmente não aparece; um que ela declarar amanhã     │
 * │    aparece sem deploy do front. O que continua proibido é o contrário:   │
 * │    botão desenhado sem caminho por trás.                                │
 * │                                                                        │
 * │ ⑤ O LOGO É AFIRMAÇÃO VERIFICÁVEL. "Arte 100% com a personalidade da     │
 * │    empresa" só quer dizer alguma coisa se a tela souber responder "e o  │
 * │    logo, entrou?". `logo_aplicado` + `logo_motivo` respondem — inclusive │
 * │    quando a resposta é "não, e é por isto".                             │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * O acento vem da CSS var `--screen-accent` (o dispatcher a injeta a partir da
 * definition), com o violeta da ferramenta como padrão para o caso de este
 * componente ser montado fora daquele wrapper — cor de destaque faltando não
 * pode virar texto invisível.
 */

const ACENTO = 'var(--screen-accent, #8b5cf6)';
const ACENTO_FUNDO = { backgroundColor: ACENTO };
const ACENTO_TEXTO = { color: ACENTO };
const ACENTO_TINTA = {
	backgroundColor: `color-mix(in srgb, ${ACENTO} 10%, transparent)`,
	borderColor: `color-mix(in srgb, ${ACENTO} 28%, transparent)`,
};

/* ═══════════════════ utilidades de texto ═══════════════════ */

/**
 * A AUSÊNCIA ESCRITA — o modelo devolve `"null"`, `"N/A"` e `"não informado"`
 * como STRING com frequência, e essas strings são verdadeiras em JavaScript.
 *
 * Na Central isso já virou a pílula "null vendidos" em cima de um card. Aqui
 * seria pior: um `texto_na_arte: "null"` iria para a ÁREA DE TRANSFERÊNCIA do
 * aluno e daí para a legenda do post dele.
 */
const VAZIO = /^(null|undefined|n\/?a|nao informado|não informado|-{1,3})$/i;

function frase(v: unknown, teto = 600): string {
	const t = typeof v === 'string' ? v.trim() : '';
	if (!t || VAZIO.test(t)) return '';
	return t.length > teto ? `${t.slice(0, teto).trimEnd()}…` : t;
}

/** `cores_principais` → `Cores principais`. Rótulo de ficha sem tabela de-para. */
function humanizar(chave: string): string {
	const limpo = chave.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
	if (!limpo) return '';
	return limpo.charAt(0).toUpperCase() + limpo.slice(1);
}

/**
 * Qualquer valor de JSON → uma linha legível, sem `[object Object]` e sem
 * derrubar o render.
 *
 * O JSON de cada especialista é ditado pelo ROSTER, que é dado editável pelo
 * admin: o formato de hoje não é o de amanhã, e nenhum `as` neste arquivo
 * sobreviveria a isso. Por isso a leitura é estrutural (string / número /
 * booleano / lista / objeto raso) em vez de por nome de campo.
 *
 * A profundidade para em 2 de propósito: mais que isso não é ficha, é despejo
 * de dados — e a tela do Ateliê existe justamente para quem não quer ler.
 */
function comoTexto(v: unknown, profundidade = 0): string {
	if (typeof v === 'string') return frase(v, 400);
	if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '';
	if (typeof v === 'boolean') return v ? 'sim' : 'não';
	if (Array.isArray(v)) {
		return v
			.map((item) => comoTexto(item, profundidade + 1))
			.filter(Boolean)
			.join(' · ');
	}
	if (v && typeof v === 'object' && profundidade < 2) {
		return Object.entries(v as Record<string, unknown>)
			.map(([k, val]) => {
				const t = comoTexto(val, profundidade + 1);
				return t ? `${humanizar(k)}: ${t}` : '';
			})
			.filter(Boolean)
			.join(' · ');
	}
	return '';
}

/** Uma linha da ficha de um especialista. `rotulo` vazio = prosa corrida. */
interface LinhaDaFicha {
	rotulo: string;
	valor: string;
}

const TETO_LINHAS = 14;

/**
 * O QUE UM ESPECIALISTA ENTREGOU, em linhas — a partir do contrato genérico.
 *
 * `json` quando ele respondeu em ficha, `texto` quando respondeu em prosa (o
 * bloco só preenche um dos dois). Sem nenhum dos dois a gaveta nem abre: um
 * cartão que expande para o vazio é pior que um cartão que não expande.
 */
function linhasDoAgente(a: AgenteDaMesa): LinhaDaFicha[] {
	const j = a.json;
	if (j && typeof j === 'object' && !Array.isArray(j)) {
		const linhas: LinhaDaFicha[] = [];
		for (const [k, v] of Object.entries(j as Record<string, unknown>)) {
			const valor = comoTexto(v);
			if (!valor) continue;
			linhas.push({ rotulo: humanizar(k), valor });
			if (linhas.length >= TETO_LINHAS) break;
		}
		return linhas;
	}
	const solto = comoTexto(j) || frase(a.texto, 1_200);
	return solto ? [{ rotulo: '', valor: solto }] : [];
}

/** `#f59e0b` do roster; qualquer outra coisa vira o acento da tela. */
function corSegura(cor: string): string {
	return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(cor) ? cor : ACENTO;
}

function formatarDuracao(ms: number): string {
	if (!Number.isFinite(ms) || ms <= 0) return '';
	const s = Math.round(ms / 1_000);
	if (s < 60) return `${s} s`;
	const m = Math.floor(s / 60);
	const resto = s % 60;
	return resto ? `${m} min ${resto} s` : `${m} min`;
}

/* ═══════════════════ copiar (o botão que precisa funcionar) ═══════════════════ */

/**
 * Escreve na área de transferência, com plano B.
 *
 * `navigator.clipboard` exige contexto seguro e permissão: em HTTP local, em
 * WebView e em iframe sem `allow="clipboard-write"` ele simplesmente rejeita.
 * O `execCommand('copy')` é obsoleto e é exatamente por isso que ele está aqui
 * — é o caminho que ainda funciona onde o moderno não funciona. Falhando os
 * dois, quem chama AVISA: um botão "copiar" que não copia e não reclama é a
 * pior das três opções, porque o aluno cola o texto antigo achando que colou o
 * novo.
 */
async function escreverNaAreaDeTransferencia(texto: string): Promise<boolean> {
	try {
		if (navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(texto);
			return true;
		}
	} catch {
		// sem permissão / sem HTTPS — cai no plano B
	}
	try {
		const campo = document.createElement('textarea');
		campo.value = texto;
		campo.setAttribute('readonly', '');
		campo.style.position = 'fixed';
		campo.style.top = '0';
		campo.style.opacity = '0';
		campo.style.pointerEvents = 'none';
		document.body.appendChild(campo);
		campo.select();
		const ok = document.execCommand('copy');
		campo.remove();
		return ok;
	} catch {
		return false;
	}
}

/**
 * Um copiador para a tela inteira: só UM bloco pode estar com o selo "copiado"
 * ao mesmo tempo, que é o que faz o feedback ser lido como resposta ao último
 * clique em vez de enfeite permanente.
 */
function useCopiador() {
	const [copiado, setCopiado] = useState<string | null>(null);

	const copiar = useCallback(async (texto: string, id: string) => {
		const limpo = texto.trim();
		if (!limpo) return;
		const ok = await escreverNaAreaDeTransferencia(limpo);
		if (!ok) {
			toast.error(
				'Não consegui copiar por aqui. Selecione o texto e copie com Ctrl+C.',
			);
			return;
		}
		setCopiado(id);
		window.setTimeout(() => setCopiado(null), 1_800);
	}, []);

	return { copiado, copiar };
}

/* ═══════════════════ peças pequenas ═══════════════════ */

function BotaoCopiar({
	texto,
	id,
	copiado,
	copiar,
	rotulo = 'Copiar',
}: {
	texto: string;
	id: string;
	copiado: string | null;
	copiar: (texto: string, id: string) => void;
	rotulo?: string;
}) {
	const feito = copiado === id;
	return (
		<button
			type="button"
			onClick={() => copiar(texto, id)}
			className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 transition-colors hover:border-white/25 hover:text-white"
			aria-label={`${rotulo} — ${texto.slice(0, 40)}`}
		>
			{feito ? (
				<Check className="h-3.5 w-3.5 text-emerald-400" />
			) : (
				<Copy className="h-3.5 w-3.5" />
			)}
			{feito ? 'copiado' : rotulo}
		</button>
	);
}

/**
 * UM BLOCO DE TEXTO PRONTO PARA PUBLICAR.
 *
 * O texto fica selecionável (não é botão): quem quer só um pedaço da legenda
 * seleciona com o mouse, e quem quer tudo clica em copiar. Envolver o parágrafo
 * inteiro num `<button>` — como a Central faz com os títulos — quebra a seleção
 * com o mouse, e aqui a legenda tem cinco linhas.
 */
function BlocoDeTexto({
	rotulo,
	texto,
	id,
	copiado,
	copiar,
	destaque,
}: {
	rotulo: string;
	texto: string;
	id: string;
	copiado: string | null;
	copiar: (texto: string, id: string) => void;
	/** O título da peça: corpo maior, porque é o que o aluno lê primeiro. */
	destaque?: boolean;
}) {
	if (!texto) return null;
	return (
		<div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
			<div className="mb-2 flex items-center justify-between gap-3">
				<span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
					{rotulo}
				</span>
				<BotaoCopiar texto={texto} id={id} copiado={copiado} copiar={copiar} />
			</div>
			<p
				className={
					destaque
						? 'whitespace-pre-wrap text-[17px] font-semibold leading-snug text-slate-100'
						: 'whitespace-pre-wrap text-[14px] leading-relaxed text-slate-300'
				}
			>
				{texto}
			</p>
		</div>
	);
}

/** Painel de aviso — âmbar, sem ícone de erro: ressalva não é falha. */
function Ressalva({
	titulo,
	children,
}: {
	titulo: string;
	children: ReactNode;
}) {
	return (
		<div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-4">
			<div className="mb-2 flex items-center gap-2">
				<AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
				<h3 className="text-[13px] font-semibold text-amber-200">{titulo}</h3>
			</div>
			<div className="text-[13px] leading-relaxed text-amber-100/70">
				{children}
			</div>
		</div>
	);
}

/* ═══════════════════ a arte ═══════════════════ */

/** `data:` já pronto, URL do CDN, ou base64 cru vindo do bloco de imagem. */
function comoFonteDeImagem(v: string): string {
	if (!v) return '';
	if (/^(data:|blob:|https?:\/\/|\/)/i.test(v)) return v;
	return `data:image/png;base64,${v}`;
}

/**
 * Nome do arquivo que o aluno vai encontrar na pasta de downloads.
 *
 * O título da peça vira o nome porque é assim que ele reconhece a arte três
 * dias depois; `toolKey` é o fallback para quando o Redator não entregou
 * título. A extensão sai da URL — o caminho "arte para gravar" pode terminar
 * em `.svg`, e um `.png` mentiroso no nome quebra o programa que abre.
 */
function nomeDoArquivo(saida: SaidaDoAtelie, toolKey: string): string {
	const base =
		frase(saida.titulo, 60)
			.toLowerCase()
			.normalize('NFD')
			// os acentos já separados pelo NFD acima — o nome do arquivo sai ASCII
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 48) || toolKey.replace(/[^a-z0-9]+/gi, '-');
	const alvo = saida.url ?? '';
	const ext = /\.(svg|jpe?g|webp|png)(?:\?|#|$)/i.exec(alvo)?.[1] ?? 'png';
	return `${base || 'arte'}.${ext.toLowerCase()}`;
}

/* ═══════════════════ o cartão de um especialista ═══════════════════ */

function CartaoDoEspecialista({ a }: { a: AgenteDaMesa }) {
	const [aberto, setAberto] = useState(false);
	const Icone = resolveToolIcon(a.icone);
	const cor = corSegura(a.cor);
	const linhas = useMemo(() => linhasDoAgente(a), [a]);
	const duracao = formatarDuracao(a.ms);
	const podeAbrir = linhas.length > 0;

	return (
		<li
			className={`rounded-2xl border bg-white/[0.02] transition-colors ${
				a.ok ? 'border-white/8' : 'border-amber-500/25'
			}`}
		>
			<button
				type="button"
				onClick={() => podeAbrir && setAberto((v) => !v)}
				aria-expanded={podeAbrir ? aberto : undefined}
				className={`flex w-full items-center gap-3 p-3.5 text-left ${
					podeAbrir ? '' : 'cursor-default'
				}`}
			>
				<span
					className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
					style={{
						backgroundColor: `color-mix(in srgb, ${cor} 14%, transparent)`,
					}}
				>
					<Icone className="h-4 w-4" style={{ color: cor }} />
				</span>

				<span className="min-w-0 flex-1">
					<span className="block truncate text-[14px] font-semibold text-slate-100">
						{a.nome}
					</span>
					<span className="block truncate text-[12px] text-slate-500">
						{a.ok
							? [
									'entregou',
									duracao,
									// Páginas abertas só existem quando o aluno liga "olhar o
									// que o mercado faz". Zero não vira "0 fontes" na cara
									// dele: o padrão do roster é busca desligada, e um zero
									// ali leria como falha do especialista.
									a.nFontes > 0
										? `${a.nFontes} página${a.nFontes === 1 ? '' : 's'}`
										: '',
								]
									.filter(Boolean)
									.join(' · ')
							: /* O `erro` que o bloco emite já é a frase PARA O ALUNO. */
								frase(a.erro, 140) || 'não entregou desta vez'}
					</span>
				</span>

				{podeAbrir ? (
					<ChevronDown
						className={`h-4 w-4 shrink-0 text-slate-600 transition-transform ${
							aberto ? 'rotate-180' : ''
						}`}
					/>
				) : null}
			</button>

			{aberto && podeAbrir ? (
				<dl className="space-y-2 border-t border-white/5 px-3.5 py-3">
					{linhas.map((l) => (
						<div key={`${a.chave}-${l.rotulo}-${l.valor.slice(0, 24)}`}>
							{l.rotulo ? (
								<dt className="text-[11px] uppercase tracking-wider text-slate-600">
									{l.rotulo}
								</dt>
							) : null}
							<dd className="text-[13px] leading-relaxed text-slate-300">
								{l.valor}
							</dd>
						</div>
					))}
				</dl>
			) : null}
		</li>
	);
}

/* ═══════════════════ os ajustes ═══════════════════ */

/**
 * OS AJUSTES SOBRE A ARTE PRONTA.
 *
 * ┌─ O QUE ESTA SEÇÃO PROMETE, E POR QUE ELA PODE PROMETER ─────────────────┐
 * │ Cada botão diz, ANTES do clique, se gasta voxxy — porque `custa` vem da  │
 * │ definition e é a MESMA informação que decide a rota no servidor          │
 * │ (`/preview` não cobrada × run cobrado). Um "grátis" escrito aqui e       │
 * │ cobrado lá seria a pior mentira possível desta tela.                     │
 * │                                                                          │
 * │ E o botão de confirmar só aparece DEPOIS de o aluno escolher o ajuste:   │
 * │ os que pedem texto (variar, vetorizar) precisam do campo preenchido,     │
 * │ senão o motor recusa o run — no caminho cobrado, DEPOIS do débito.       │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * `origemId` ausente = a arte não chegou à galeria (o `save_gallery` falhou).
 * Sem registro não há `parent_id` e o servidor não tem o que buscar, então a
 * seção some e a ressalva de "não entrou na sua galeria" (acima) explica.
 */
/**
 * Os fatores de ampliação que o SERVIDOR aceita.
 *
 * Espelha `FATORES_DE_AMPLIACAO` do `image-studio.ts` (main API). Aqui estava
 * `['2','3','4']`, apoiado num comentário do seed que dizia que o bloco
 * aceitava três — não aceita, e o 3× errava 100% das vezes, com o agravante de
 * a mensagem de erro mandar "tentar de novo em instantes".
 */
const FATORES = ['2', '4'] as const;

function Ajustes({
	ajustes,
	origemId,
	ocupado,
	semSaldo,
	custoNotice,
	onAjustar,
}: {
	ajustes: AjusteCard[];
	origemId: string;
	ocupado: boolean;
	/** Falta voxxy para o ajuste COBRADO — o botão pago fica desligado e explicado. */
	semSaldo: boolean;
	/** O aviso de preço + saldo da tool (o mesmo do passo 3). */
	custoNotice?: ReactNode;
	onAjustar: (p: PedidoDeAjuste) => void;
}) {
	const [escolhido, setEscolhido] = useState<AjusteCard | null>(null);
	const [texto, setTexto] = useState('');
	const [fator, setFator] = useState('2');

	if (ajustes.length === 0 || !origemId) return null;

	const cobra = escolhido ? ajusteCusta(escolhido) : false;
	const faltaTexto = Boolean(escolhido?.pede_texto) && !texto.trim();

	return (
		<section className="rounded-3xl border border-white/8 bg-white/[0.02] p-5">
			<div className="mb-1 flex items-center gap-2">
				<Sparkles className="h-4 w-4" style={ACENTO_TEXTO} />
				<h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-300">
					Ajustar esta arte
				</h2>
			</div>
			<p className="mb-4 text-[12px] leading-relaxed text-slate-500">
				O resultado do ajuste vira uma arte nova na sua galeria, ligada a esta.
			</p>

			<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
				{ajustes.map((a) => {
					const Icone = resolveToolIcon(a.icon);
					const ativo = escolhido?.value === a.value;
					const pago = ajusteCusta(a);
					return (
						<button
							key={a.value}
							type="button"
							disabled={ocupado}
							onClick={() => {
								setEscolhido(ativo ? null : a);
								setTexto('');
							}}
							aria-pressed={ativo}
							className={`rounded-2xl border p-3.5 text-left transition-colors disabled:opacity-50 ${
								ativo
									? 'border-white/30 bg-white/[0.06]'
									: 'border-white/8 hover:border-white/20'
							}`}
						>
							<span className="mb-1.5 flex items-center gap-2">
								<Icone className="h-4 w-4 shrink-0" style={ACENTO_TEXTO} />
								<span className="text-[13px] font-semibold text-slate-100">
									{a.label}
								</span>
							</span>
							<span className="block text-[11px] leading-relaxed text-slate-500">
								{a.hint}
							</span>
							{/*
							 * O PREÇO, ANTES DO CLIQUE. "não gasta voxxy" é uma afirmação
							 * forte e ela é verdadeira por construção: o ajuste local roda
							 * pela rota de preview, que não tem invocação nenhuma.
							 */}
							<span
								className={`mt-2 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
									pago
										? 'bg-white/[0.06] text-slate-400'
										: 'bg-emerald-500/10 text-emerald-300'
								}`}
							>
								{pago ? 'gasta voxxy' : 'não gasta voxxy'}
							</span>
						</button>
					);
				})}
			</div>

			{escolhido ? (
				<div className="mt-4 space-y-3 border-t border-white/5 pt-4">
					{escolhido.pede_texto ? (
						<label className="block">
							<span className="mb-1.5 block text-[12px] font-medium text-slate-300">
								O que você quer mudar?
							</span>
							<textarea
								value={texto}
								onChange={(e) => setTexto(e.target.value)}
								rows={2}
								placeholder={escolhido.placeholder ?? 'Descreva a mudança'}
								className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] text-slate-100 placeholder:text-slate-600 focus:border-white/25 focus:outline-none"
							/>
						</label>
					) : null}

					{/*
					 * O fator só existe no ampliar — é o único ajuste com um número que
					 * o aluno escolhe, e o bloco valida um enum de strings.
					 */}
					{escolhido.value === 'ampliar' ? (
						<div className="flex items-center gap-2">
							<span className="text-[12px] text-slate-400">
								Quantas vezes maior?
							</span>
							{FATORES.map((f) => (
								<button
									key={f}
									type="button"
									onClick={() => setFator(f)}
									aria-pressed={fator === f}
									className={`rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors ${
										fator === f
											? 'border-white/30 bg-white/[0.06] text-white'
											: 'border-white/10 text-slate-400 hover:border-white/25'
									}`}
								>
									{f}×
								</button>
							))}
						</div>
					) : null}

					<div className="flex flex-wrap items-center gap-3">
						{/*
						 * `cobra && semSaldo` DESLIGA o botão — antes ele continuava
						 * clicável e o hook fazia `if (cobra && insufficient) return;`
						 * sem toast, sem erro e sem nada: o aluno escrevia o texto,
						 * clicava e a tela não reagia. Botão que não faz nada é pior do
						 * que botão ausente.
						 */}
						<button
							type="button"
							disabled={ocupado || faltaTexto || (cobra && semSaldo)}
							onClick={() =>
								onAjustar({
									origemId,
									ajuste: escolhido,
									texto,
									...(escolhido.value === 'ampliar' ? { fator } : {}),
								})
							}
							style={ACENTO_FUNDO}
							className="rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
						>
							{escolhido.label}
						</button>
						<span className="text-[12px] text-slate-500">
							{faltaTexto
								? 'Escreva o que você quer mudar para continuar.'
								: cobra && semSaldo
									? 'Seus voxxys não cobrem este ajuste.'
									: cobra
										? 'Este ajuste cria uma arte nova e gasta voxxy.'
										: 'Este ajuste é feito aqui no servidor e não gasta voxxy.'}
						</span>
					</div>

					{/*
					 * O PREÇO E O SALDO, onde a decisão acontece.
					 *
					 * O `billing.notice` (o único lugar da tela com quanto custa e
					 * quanto o aluno tem) só era renderizado no passo 3. Aqui o aluno
					 * escolhia entre "Criar uma variação" e "Deixar pronta para gravar"
					 * lendo apenas "gasta voxxy" — sem número e sem saldo. Só aparece no
					 * ajuste COBRADO: no grátis não há o que avisar.
					 */}
					{cobra && custoNotice ? <div>{custoNotice}</div> : null}
				</div>
			) : null}
		</section>
	);
}

/* ═══════════════════ o kit ═══════════════════ */

/** Nome de arquivo por peça: `<base>-story-9x16.png`. */
function nomeDaPeca(base: string, p: PecaDoKit): string {
	const sufixo = p.formato.replace(/[^a-z0-9]+/gi, '-');
	return `${base.replace(/\.[a-z0-9]+$/i, '')}-${sufixo}.png`;
}

/**
 * O KIT — a mesma arte em vários formatos, e os que NÃO saíram.
 *
 * ┌─ AS RECUSAS SÃO PARTE DA ENTREGA ───────────────────────────────────────┐
 * │ Um kit que volta com duas peças em vez de quatro, sem explicação, lê-se  │
 * │ como defeito. Com o motivo — "neste formato o recorte cortaria o texto   │
 * │ ao meio" —, lê-se como critério, que é o que ele é: nas seis derivações  │
 * │ medidas com o enquadramento antigo, ZERO saíram limpas (o título saía    │
 * │ "ua lembranç"). Entregar isso seria pior do que entregar menos.          │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
function Kit({
	saida,
	titulo,
	nota,
	nomeBase,
}: {
	saida: SaidaDoAtelie;
	titulo: string;
	nota: string;
	nomeBase: string;
}) {
	const pecas = saida.kit ?? [];
	const recusados = saida.kit_recusados ?? [];
	if (pecas.length === 0 && recusados.length === 0) return null;

	return (
		<section className="space-y-3">
			<div className="flex flex-wrap items-baseline justify-between gap-3">
				<h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-slate-400">
					<LayoutGrid className="h-4 w-4" />
					{titulo}
				</h2>
				{saida.kit_resumo ? (
					<span className="text-[12px] text-slate-500">{saida.kit_resumo}</span>
				) : null}
			</div>
			{nota ? <p className="text-[12px] text-slate-500">{nota}</p> : null}

			{pecas.length > 0 ? (
				<ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{pecas.map((p) => (
						<li
							key={p.formato}
							className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02]"
						>
							{/* <img> cru: data URL vinda do bloco, fora do otimizador do Next. */}
							<img
								src={p.pngBase64}
								alt={p.rotulo}
								loading="lazy"
								className="max-h-56 w-full bg-black/20 object-contain"
							/>
							<div className="space-y-1.5 p-3">
								<div className="flex items-baseline justify-between gap-2">
									<span className="truncate text-[12px] font-semibold text-slate-200">
										{p.rotulo}
									</span>
									<span className="shrink-0 text-[11px] text-slate-500">
										{p.largura} × {p.altura}
									</span>
								</div>
								{/*
								 * A PEÇA ESTENDIDA SE ANUNCIA. Em "todos os tamanhos" o kit
								 * completa a beirada quando o recorte cortaria o produto ao
								 * meio — a arte fica inteira, mas aquela faixa não foi
								 * composta pelo time. Sem esta linha o aluno descobriria
								 * olhando de perto, que é a pior forma de descobrir.
								 */}
								{p.origem_da_peca === 'extensao' ? (
									<p className="text-[11px] leading-relaxed text-slate-500">
										Bordas completadas para caber neste formato — nada da arte
										foi cortado.
									</p>
								) : null}
								{/*
								 * O LOGO POR PEÇA, e não só na arte grande. O recorte é a
								 * primeira coisa que come o canto reservado: dizer aqui é o
								 * que evita o aluno publicar um Story achando que a marca
								 * dele está lá.
								 */}
								{!p.logo_aplicado && p.logo_motivo ? (
									<p className="text-[11px] leading-relaxed text-amber-200/70">
										{p.logo_motivo}
									</p>
								) : null}
								<button
									type="button"
									onClick={() =>
										downloadUrl(p.pngBase64, nomeDaPeca(nomeBase, p))
									}
									className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 py-1.5 text-[11px] font-medium text-slate-300 transition-colors hover:border-white/25 hover:text-white"
								>
									<Download className="h-3 w-3" />
									Baixar
								</button>
							</div>
						</li>
					))}
				</ul>
			) : null}

			{recusados.length > 0 ? (
				<ul className="space-y-1.5">
					{recusados.map((r) => (
						<li
							key={r.formato}
							className="rounded-xl border border-white/8 bg-white/[0.01] px-3 py-2 text-[12px] leading-relaxed text-slate-500"
						>
							<strong className="font-semibold text-slate-400">
								{r.rotulo}
							</strong>{' '}
							— {r.motivo}
						</li>
					))}
				</ul>
			) : null}
		</section>
	);
}

/* ═══════════════════ o anúncio em vídeo ═══════════════════ */

/**
 * A chave da tool do VÍDEO GERADO POR IA — compra separada, preço próprio.
 *
 * Literal e não `ui` da definition de propósito: é o endereço de OUTRA
 * ferramenta, e uma chave errada aqui produz um link para uma página que não
 * existe. Se um dia ela virar configurável, o lugar é `ui.atelie.video.tool` —
 * mas configurar hoje seria configurar por configurar.
 */
const TOOL_DO_VIDEO_IA = 'estudio_video';

/** `1345678` → `1,3 MB`. Quem vai publicar precisa saber o peso do arquivo. */
function tamanho(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes <= 0) return '';
	const mb = bytes / 1_048_576;
	if (mb >= 1) return `${mb.toFixed(1).replace('.', ',')} MB`;
	return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * O ANÚNCIO EM VÍDEO — a mesma arte, com a câmera andando por cima dela.
 *
 * ┌─ POR QUE ELE É SEÇÃO PRÓPRIA, E NÃO A QUINTA CÉLULA DO KIT ─────────────┐
 * │ ① O kit é uma grade de COISAS PARA BAIXAR, todas do mesmo tipo, todas    │
 * │    lidas de relance. O vídeo é UMA coisa PARA ASSISTIR: ele tem duração, │
 * │    tem controles e só se avalia vendo rodar. Numa célula de 1/4 de       │
 * │    largura ninguém aperta o play.                                        │
 * │ ② A promessa escrita do kit é "todas saem da mesma arte, ajustadas por   │
 * │    aqui" — um MP4 no meio faria essa frase ficar falsa para uma das      │
 * │    células, e a nota de preço teria de virar duas notas.                 │
 * │ ③ Ele é o pedido do dono ("pequenos vídeos nesses anúncios"). Embaixo de │
 * │    uma grade de quatro miniaturas, seria a coisa mais nova da tela no    │
 * │    lugar em que menos gente olha.                                        │
 * │                                                                          │
 * │ Fica ANTES do kit e depois da dobra principal, e continua ANTES dos      │
 * │ Ajustes pela mesma regra que já valia para o kit: nada que o aluno possa │
 * │ COMPRAR aparece antes do que ele JÁ GANHOU nesta mesma geração.          │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─ O PLAYER, ATRIBUTO POR ATRIBUTO — nenhum é decoração ──────────────────┐
 * │ `controls`   ele TOCA na página; não é um link para um arquivo.          │
 * │ `muted`      não há faixa de áudio (o vídeo é mudo de propósito) e um    │
 * │              player que se anuncia com som teria um botão que não faz    │
 * │              nada. Também é o que permite o `autoPlay` de um dia.        │
 * │ `loop`       cinco segundos acabam antes de o olho terminar; sem laço, o │
 * │              anúncio vira um quadro congelado no fim.                    │
 * │ `playsInline` no iPhone, sem ele o Safari SEQUESTRA o vídeo para tela    │
 * │              cheia ao apertar play — e o aluno perde a página.           │
 * │ `preload="metadata"` baixa só o cabeçalho: a página não puxa 1 MB por    │
 * │              conta própria, mas a barra de tempo já nasce com a duração  │
 * │              certa em vez de "0:00".                                     │
 * │ `poster`     sem ele o player é um retângulo PRETO até alguém clicar, e  │
 * │              retângulo preto no meio da página lê-se como coisa          │
 * │              quebrada.                                                    │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
/**
 * ┌─ O DEGRAU DE CIMA, OFERECIDO ONDE O DE BAIXO ACABA ──────────────────────┐
 * │ O aluno acabou de assistir ao clipe que veio de graça com a arte. É o     │
 * │ único instante da jornada em que ele tem a comparação fresca na cabeça —  │
 * │ e portanto o único lugar honesto para oferecer o vídeo GERADO, que custa  │
 * │ à parte. Oferecer antes seria vender no escuro.                           │
 * │                                                                          │
 * │ ⚠ E ELE SÓ APARECE QUANDO PODE FUNCIONAR. Três portões, cada um contra    │
 * │ um botão morto que esta ferramenta já teve:                              │
 * │   ① sem `arte_id` a peça não está arquivada na galeria, e a tela do vídeo │
 * │      não teria de onde baixá-la — o run morreria em 404 DEPOIS de cobrar; │
 * │   ② sem linha de catálogo (a tool ainda é rascunho para quem não é        │
 * │      testador) o `/invoke` responde 404: melhor não existir do que abrir  │
 * │      uma página que recusa;                                              │
 * │   ③ SEM SALDO ele continua aparecendo, mas dizendo o preço e o saldo, com │
 * │      o caminho de comprar voxxys. Sumir com a oferta seria esconder do    │
 * │      aluno o motivo pelo qual ela não está lá.                            │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
function ConviteParaVideoIA({ arteId }: { arteId: string }) {
	const { toolFor, voxBalance } = useEntitlements();
	const tool = toolFor(TOOL_DO_VIDEO_IA);

	// ① e ②: sem arte arquivada, ou sem a tool no catálogo, não há oferta.
	if (!arteId || !tool?.entitled) return null;

	const custo = tool.vox_cost ?? 0;
	const semSaldo = custo > 0 && voxBalance < custo;
	const unidade = custo === 1 ? 'voxxy' : 'voxxys';

	return (
		<div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-500/30 bg-violet-500/[0.04] p-4">
			<div className="min-w-[220px] flex-1">
				<p className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-100">
					<Sparkles className="h-3.5 w-3.5 text-violet-400" />
					Quer o produto se MEXENDO de verdade?
				</p>
				<p className="mt-1 text-[12px] leading-relaxed text-slate-400">
					O vídeo acima é a câmera passeando sobre a sua arte parada — e é seu,
					de graça. O vídeo gerado por IA faz a peça girar e a luz correr pela
					gravação, em 8 segundos com áudio. Custa à parte.
				</p>
			</div>

			{semSaldo ? (
				/*
				 * ③ SEM SALDO: o preço e o saldo aparecem, e o botão leva para COMPRAR
				 * — não para uma tela que vai recusar. Um botão que dispara e falha em
				 * 402 é exatamente o defeito que já aconteceu nesta ferramenta.
				 */
				<div className="flex shrink-0 flex-col items-end gap-1">
					<span className="text-[11px] text-amber-300">
						Custa {custo} {unidade} · você tem {voxBalance}
					</span>
					<a
						href="/course/voxes"
						className="rounded-xl bg-violet-600 px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-violet-500"
					>
						Comprar voxxys
					</a>
				</div>
			) : (
				<a
					href={`/course/t/${TOOL_DO_VIDEO_IA}?arte=${encodeURIComponent(arteId)}`}
					className="flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-violet-500"
				>
					<Clapperboard className="h-4 w-4" />
					{/*
					 * O PREÇO ESTÁ NO BOTÃO, e vem do catálogo (`vox_cost` da linha de
					 * `public.tools`) — nunca de uma constante escrita aqui. Uma segunda
					 * fonte de verdade divergiria do que o servidor debita no dia em que
					 * o admin mudasse o preço, e a tela mentiria com convicção.
					 */}
					Gerar vídeo com IA — {custo} {unidade}
				</a>
			)}
		</div>
	);
}

function AnuncioEmVideo({
	saida,
	ui,
	nomeBase,
}: {
	saida: SaidaDoAtelie;
	ui: VideoUi;
	nomeBase: string;
}) {
	const v = saida.video;
	/**
	 * A CHAVE INTEIRA AUSENTE = A SEÇÃO NÃO EXISTE, sem uma palavra.
	 *
	 * É o caso do fluxo `ajustar` (que não tem o nó) e de uma definition ainda
	 * não re-semeada. "Não houve vídeo aqui" é diferente de "o vídeo falhou", e
	 * só o segundo merece explicação — anunciar a ausência do primeiro seria
	 * inventar um defeito na tela de quem acabou de ampliar uma arte.
	 */
	if (!v) return null;

	const nome = `${nomeBase.replace(/\.[a-z0-9]+$/i, '')}-anuncio.mp4`;
	const peso = tamanho(v.bytes);
	const duracao = v.duracaoS > 0 ? `${v.duracaoS}s` : '';
	const medida =
		v.largura > 0 && v.altura > 0 ? `${v.largura} × ${v.altura}` : '';

	return (
		<section className="space-y-3">
			<div className="flex flex-wrap items-baseline justify-between gap-3">
				<h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-slate-400">
					<Clapperboard className="h-4 w-4" />
					{ui.titulo}
				</h2>
				{v.ok && v.rotulo ? (
					<span className="text-[12px] text-slate-500">{v.rotulo}</span>
				) : null}
			</div>

			{v.ok ? (
				<div className="grid gap-5 rounded-3xl border border-white/8 bg-white/[0.02] p-4 sm:grid-cols-[minmax(0,260px)_1fr] sm:p-5">
					{/*
					 * `<video>` cru, fora de qualquer wrapper do Next: a fonte é uma URL
					 * de CDN e não passa por otimizador nenhum. `max-h-[70vh]` porque
					 * 9:16 é ALTO — sem teto, o player empurra o resto da página para
					 * fora da tela num monitor comum.
					 */}
					{/*
					 * Sem `<track>` de legenda: o vídeo não tem faixa de áudio e não
					 * tem fala — não há o que legendar, e uma trilha vazia só serviria
					 * para calar um verificador.
					 */}
					<video
						src={v.url}
						poster={v.posterUrl || undefined}
						controls
						muted
						loop
						playsInline
						preload="metadata"
						className="max-h-[70vh] w-full rounded-2xl bg-black object-contain"
					/>

					<div className="flex flex-col gap-3">
						{ui.nota ? (
							<p className="text-[13px] leading-relaxed text-slate-300">
								{ui.nota}
							</p>
						) : null}
						{ui.ajuda ? (
							<p className="text-[12px] leading-relaxed text-slate-500">
								{ui.ajuda}
							</p>
						) : null}

						{/*
						 * A FICHA DO ARQUIVO. Quem vai publicar precisa saber o que está
						 * mandando: proporção, duração e PESO — o limite do Instagram é
						 * 100 MB por vídeo, e é o tipo de coisa que só se descobre na
						 * hora errada.
						 */}
						<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
							{medida ? <span>{medida} px</span> : null}
							{duracao ? <span>{duracao}</span> : null}
							{peso ? <span>{peso}</span> : null}
							<span>MP4</span>
						</div>

						<div className="flex flex-wrap items-center gap-2">
							<button
								type="button"
								onClick={() => downloadUrl(v.url, nome)}
								className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-[13px] font-medium text-slate-200 transition-colors hover:border-white/25 hover:text-white"
							>
								<Download className="h-4 w-4" />
								Baixar o vídeo
							</button>
							<a
								href={v.url}
								target="_blank"
								rel="noreferrer"
								className="flex items-center gap-1 text-[12px] text-slate-500 transition-colors hover:text-white"
							>
								Abrir em outra aba
								<ExternalLink className="h-3 w-3" />
							</a>
						</div>

						{/*
						 * Um vídeo que SAIU e ainda tem ressalva (uma borda que estriou,
						 * por exemplo). Não é erro: é o mesmo padrão do `logo_motivo`.
						 */}
						{v.motivo ? (
							<p className="text-[12px] leading-relaxed text-amber-200/70">
								{v.motivo}
							</p>
						) : null}
					</div>
				</div>
			) : (
				/*
				 * NÃO SAIU — e a tela DIZ, em vez de mostrar um player vazio.
				 *
				 * O caso mais comum é o servidor sem `ffmpeg` (a máquina de
				 * desenvolvimento). Nada aqui foi perdido nem cobrado a mais: o vídeo
				 * é montado da arte que já existe, sem chamar fornecedor nenhum. Por
				 * isso o tom é de recado, não de alarme — a peça está pronta logo
				 * acima.
				 */
				<div className="rounded-2xl border border-white/8 bg-white/[0.01] p-4">
					<p className="text-[13px] leading-relaxed text-slate-400">
						O vídeo não foi montado desta vez. A sua arte está pronta e completa
						logo acima — o vídeo é um extra que sai dela.
					</p>
					{v.motivo ? (
						<p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">
							{v.motivo}
						</p>
					) : null}
				</div>
			)}
		</section>
	);
}

/* ═══════════════════ a tela ═══════════════════ */

export interface ResultadoDaArteProps {
	saida: SaidaDoAtelie;
	/** Só para nomear o arquivo baixado quando a peça não tem título. */
	toolKey: string;
	/** Volta para o começo. Quem liga decide se refaz o pedido ou zera tudo. */
	onRefazer: () => void;
	/** Os ajustes declarados na definition (`ui.atelie.ajustes`). Vazio = seção some. */
	ajustes?: AjusteCard[];
	/** Textos do cabeçalho do kit (`ui.atelie.kit`). */
	kitUi?: { titulo: string; nota: string };
	/**
	 * Textos da seção do vídeo (`ui.atelie.video`).
	 *
	 * Ausente NÃO esconde a seção — quem decide se ela existe é `saida.video`.
	 * Aqui a ausência só faz cair no título padrão: um vídeo entregue e não
	 * mostrado seria dois segundos de CPU e um arquivo no CDN sem leitor.
	 */
	videoUi?: VideoUi;
	/** Roda um ajuste. Ausente = a seção não aparece (nada de botão sem caminho). */
	onAjustar?: (p: PedidoDeAjuste) => void;
	/** Um run está em andamento — segura os botões. */
	ocupado?: boolean;
	/**
	 * Esta arte veio de um AJUSTE, não da criação.
	 *
	 * Muda o que a tela tem direito de afirmar sobre a marca: o fluxo `ajustar`
	 * não tem o nó `time`, então `marca_usada` chega `undefined` e o cabeçalho
	 * dizia "Feita sem marca — cadastre a sua" para quem acabou de ampliar uma
	 * arte que saiu assinada. A informação não existe neste fluxo; então a tela
	 * não fala dela, em vez de chutar a pior das duas hipóteses.
	 */
	deAjuste?: boolean;
	/** Falta saldo para o ajuste cobrado. */
	semSaldo?: boolean;
	/** O aviso de preço + saldo (o `billing.notice` do passo 3). */
	custoNotice?: ReactNode;
}

export function ResultadoDaArte({
	saida,
	toolKey,
	onRefazer,
	ajustes = [],
	kitUi,
	videoUi,
	onAjustar,
	ocupado = false,
	deAjuste = false,
	semSaldo = false,
	custoNotice,
}: ResultadoDaArteProps) {
	const { copiado, copiar } = useCopiador();
	const [verPedido, setVerPedido] = useState(false);

	const titulo = frase(saida.titulo, 160);
	const chamada = frase(saida.chamada, 300);
	const legenda = frase(saida.legenda, 2_000);
	const hashtags = useMemo(
		() =>
			(saida.hashtags ?? [])
				.map((h) => frase(h, 40))
				.filter(Boolean)
				.map((h) => (h.startsWith('#') ? h : `#${h}`)),
		[saida.hashtags],
	);
	const textoNaArte = frase(saida.texto_na_arte, 300);
	const porQue = frase(saida.por_que_assim, 1_200);
	const marca = frase(saida.marca_usada, 120);
	const logoMotivo = frase(saida.logo_motivo, 300);
	/** O `escala_real` × `escala_pedida` do ajuste — ver `SaidaDoAtelie.ajuste`. */
	const ajusteMeta = saida.ajuste ?? {};
	const escalaPedida = Number(ajusteMeta.escala_pedida);
	const escalaReal = Number(ajusteMeta.escala_real);
	const ampliouMenos =
		Number.isFinite(escalaPedida) &&
		Number.isFinite(escalaReal) &&
		escalaReal > 0 &&
		escalaReal < escalaPedida - 0.01;
	const promptFinal = frase(saida.prompt_final, 4_000);
	const promptNegativo = frase(saida.prompt_negativo, 800);
	const avisos = saida.avisos ?? [];
	const falhas = saida.falhas ?? [];
	const agentes = saida.agentes;

	/**
	 * A imagem que APARECE é o base64 (`preview`), não a URL: ele chega junto com
	 * a resposta e não espera o CDN propagar. A URL é a que serve para BAIXAR e
	 * para abrir em tamanho real.
	 */
	const mostrada = comoFonteDeImagem(saida.preview ?? saida.url ?? '');
	const paraBaixar = saida.url ?? saida.preview ?? '';

	const meta = saida.meta ?? {};
	const largura = Number(meta.width);
	const altura = Number(meta.height);
	const dimensoes =
		Number.isFinite(largura) && Number.isFinite(altura) && largura > 0
			? `${largura} × ${altura}`
			: '';
	const prontaParaVetor = meta.vectorReady === true;
	/**
	 * A GALERIA RECUSOU — e isto é urgente, não decorativo.
	 *
	 * `saved: false` (ou um `save_error`) quer dizer que esta arte NÃO está em
	 * "Minhas artes": fechar a aba a perde para sempre. O aviso mora colado no
	 * botão de baixar, não no rodapé com as ressalvas.
	 */
	const naoSalvou =
		meta.saved === false || Boolean(frase(meta.save_error, 200));

	const temCopy = Boolean(titulo || chamada || legenda || hashtags.length);
	/** O post inteiro em um clique — é assim que ele vai para o Instagram. */
	const tudo = useMemo(
		() =>
			[titulo, chamada, legenda, hashtags.join(' ')]
				.filter(Boolean)
				.join('\n\n'),
		[titulo, chamada, legenda, hashtags],
	);

	const entregaram = agentes.filter((a) => a.ok).length;
	const tempoDoTime = formatarDuracao(Number(saida.tempo_ms));

	return (
		<div className="min-h-full bg-[#08080a] px-4 py-8 md:px-8">
			<div className="mx-auto max-w-6xl space-y-6">
				{/* ── cabeçalho: o que ficou pronto, de quem é, e o que fazer com isso ── */}
				<header className="flex flex-wrap items-start justify-between gap-4">
					<div className="min-w-0">
						<p
							className="text-[11px] font-semibold uppercase tracking-[0.24em]"
							style={ACENTO_TEXTO}
						>
							Ateliê
						</p>
						<h1 className="font-display mt-1.5 text-2xl font-bold text-slate-50 md:text-3xl">
							A sua arte ficou pronta
						</h1>
						{/*
						 * A PROVA DE QUE SAIU COM A CARA DA EMPRESA DELE.
						 *
						 * Marca vazia não é erro nem silêncio: é o estado normal de quem
						 * ainda não cadastrou, e dizer isso em voz alta é o que separa
						 * "não tem marca" de "a marca existe e não chegou" — dois casos
						 * que produzem a MESMA arte e um deles é defeito nosso.
						 */}
						<p className="mt-2 flex items-center gap-1.5 text-[13px] text-slate-400">
							<Stamp className="h-3.5 w-3.5 shrink-0 text-slate-500" />
							{marca ? (
								<>
									Feita com a identidade de{' '}
									<strong className="font-semibold text-slate-200">
										{marca}
									</strong>
									{saida.logo_aplicado ? ', com o logo aplicado' : ''}
								</>
							) : deAjuste ? (
								<>Ajuste feito a partir da arte anterior.</>
							) : (
								<>
									Feita sem marca — com a sua cadastrada, as próximas saem na
									sua cor e na sua letra.
								</>
							)}
						</p>
						{/*
						 * O LOGO NÃO ENTROU — e o MOTIVO é a informação inteira.
						 *
						 * "Sem logo porque o aluno não cadastrou" e "sem logo porque o
						 * arquivo dele viraria uma mancha no preto e branco da peça de
						 * corte" produzem a MESMA imagem. Sem esta linha, o aluno não tem
						 * como saber se falta ele fazer alguma coisa — e a promessa de
						 * "arte com a personalidade da empresa" vira uma frase que
						 * ninguém consegue verificar.
						 */}
						{!saida.logo_aplicado && logoMotivo ? (
							<p className="mt-1 max-w-xl pl-5 text-[12px] leading-relaxed text-slate-500">
								{logoMotivo}
							</p>
						) : null}
					</div>

					<div className="flex shrink-0 flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={onRefazer}
							className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-[13px] font-medium text-slate-300 transition-colors hover:border-white/25 hover:text-white"
						>
							<RefreshCw className="h-4 w-4" />
							Criar outra arte
						</button>
						{paraBaixar ? (
							<button
								type="button"
								onClick={() =>
									downloadUrl(paraBaixar, nomeDoArquivo(saida, toolKey))
								}
								style={ACENTO_FUNDO}
								className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
							>
								<Download className="h-4 w-4" />
								Baixar a arte
							</button>
						) : null}
					</div>
				</header>

				{/* ── a dobra que importa: a arte grande + o texto pronto ── */}
				<div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
					<div className="space-y-3">
						{mostrada ? (
							<figure className="overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03]">
								<img
									src={mostrada}
									alt={titulo || 'A arte gerada'}
									className="max-h-[68vh] w-full object-contain"
								/>
							</figure>
						) : (
							<div className="rounded-3xl border border-white/8 bg-white/[0.02] p-8 text-center text-[13px] text-slate-400">
								A imagem não voltou nesta execução — mas o texto do time está
								aqui do lado.
							</div>
						)}

						<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1 text-[12px] text-slate-500">
							{dimensoes ? <span>{dimensoes} px</span> : null}
							{prontaParaVetor ? (
								<span>Traço preto e branco, do jeito que a máquina corta</span>
							) : null}
							{saida.url ? (
								<a
									href={saida.url}
									target="_blank"
									rel="noreferrer"
									className="ml-auto flex items-center gap-1 text-slate-400 transition-colors hover:text-white"
								>
									Ver em tamanho real
									<ExternalLink className="h-3 w-3" />
								</a>
							) : null}
						</div>

						{naoSalvou ? (
							<Ressalva titulo="Esta arte não entrou na sua galeria">
								Guarde o arquivo agora pelo botão “Baixar a arte”: ela não vai
								aparecer em “Minhas artes”, e sem estar lá ela também não pode
								ser ajustada.
							</Ressalva>
						) : null}

						{/*
						 * AMPLIOU MENOS DO QUE FOI PEDIDO — e isto acontecia MUDO.
						 *
						 * O ampliar tem teto (4096 px de lado), então um "4×" pedido em
						 * cima de uma arte já ampliada vira ~1,55×. O aluno pedia quatro
						 * vezes maior, recebia uma vez e meia e não tinha como saber.
						 */}
						{ampliouMenos ? (
							<Ressalva titulo="Esta arte já estava perto do tamanho máximo">
								Você pediu {escalaPedida}× e deu para ampliar{' '}
								{escalaReal.toFixed(2).replace('.', ',')}×. Acima disso o
								arquivo passa do limite da ferramenta.
							</Ressalva>
						) : null}
					</div>

					<div className="space-y-3">
						{temCopy ? (
							<div className="flex items-center justify-between gap-3">
								<h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-400">
									Texto pronto para publicar
								</h2>
								<BotaoCopiar
									texto={tudo}
									id="tudo"
									copiado={copiado}
									copiar={copiar}
									rotulo="Copiar tudo"
								/>
							</div>
						) : null}

						<BlocoDeTexto
							rotulo="Título"
							texto={titulo}
							id="titulo"
							copiado={copiado}
							copiar={copiar}
							destaque
						/>
						<BlocoDeTexto
							rotulo="Chamada"
							texto={chamada}
							id="chamada"
							copiado={copiado}
							copiar={copiar}
						/>
						<BlocoDeTexto
							rotulo="Legenda"
							texto={legenda}
							id="legenda"
							copiado={copiado}
							copiar={copiar}
						/>

						{hashtags.length > 0 ? (
							<div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
								<div className="mb-2.5 flex items-center justify-between gap-3">
									<span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
										<Hash className="h-3 w-3" />
										Hashtags
									</span>
									<BotaoCopiar
										texto={hashtags.join(' ')}
										id="hashtags"
										copiado={copiado}
										copiar={copiar}
									/>
								</div>
								<div className="flex flex-wrap gap-1.5">
									{hashtags.map((h) => (
										<span
											key={h}
											className="rounded-lg border border-white/8 px-2 py-1 text-[12px] text-slate-300"
										>
											{h}
										</span>
									))}
								</div>
							</div>
						) : null}

						{/*
						 * O TEXTO QUE O TIME PEDIU PARA ESCREVER DENTRO DA ARTE.
						 *
						 * Gerador de imagem erra letra — medido: o pedido era "Presente
						 * único como sua história" e a arte saiu "Presente único como
						 * história". Mostrar o pretendido AO LADO da imagem é o que
						 * permite conferir em dois segundos, em vez de descobrir depois
						 * de publicar. Vazio é resposta legítima (arte sem texto é melhor
						 * que arte com letra torta), e aí o bloco inteiro some.
						 */}
						{textoNaArte ? (
							<div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
								<div className="mb-2 flex items-center justify-between gap-3">
									<span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
										<TypeIcon className="h-3 w-3" />
										Texto pedido dentro da arte
									</span>
									<BotaoCopiar
										texto={textoNaArte}
										id="texto-na-arte"
										copiado={copiado}
										copiar={copiar}
									/>
								</div>
								<p className="text-[14px] font-medium leading-snug text-slate-200">
									“{textoNaArte}”
								</p>
								<p className="mt-2 text-[12px] leading-relaxed text-slate-500">
									Confira letra por letra na imagem: às vezes sai uma palavra a
									menos. Se não bateu, é só criar outra.
								</p>
							</div>
						) : null}
					</div>
				</div>

				{/*
				 * O VÍDEO vem antes do kit: é a única coisa que se MEXE na página e a
				 * única que precisa ser vista rodando para ser acreditada. Embaixo da
				 * grade de quatro miniaturas, ele seria a novidade da tela no lugar em
				 * que menos gente olha. Ver a caixa de `AnuncioEmVideo`.
				 */}
				<AnuncioEmVideo
					saida={saida}
					ui={videoUi ?? { titulo: 'O anúncio em vídeo', nota: '', ajuda: '' }}
					nomeBase={nomeDoArquivo(saida, toolKey)}
				/>

				{/*
				 * O CONVITE PARA O DEGRAU DE CIMA, logo depois do clipe grátis — o
				 * único ponto da jornada em que a comparação está fresca. Ele se
				 * esconde sozinho quando não pode funcionar (arte não arquivada, tool
				 * fora do catálogo) e vira "comprar voxxys" quando falta saldo. Ver a
				 * caixa de `ConviteParaVideoIA`.
				 */}
				<ConviteParaVideoIA arteId={saida.entry_id ?? ''} />

				{/*
				 * O KIT vem ANTES dos Ajustes de propósito: são as peças que o aluno
				 * já ganhou nesta mesma geração. Oferecer "ampliar" antes de ele ver
				 * que já tem o Story pronto venderia de volta o que já é dele.
				 */}
				<Kit
					saida={saida}
					titulo={kitUi?.titulo ?? 'O kit desta arte'}
					nota={kitUi?.nota ?? ''}
					nomeBase={nomeDoArquivo(saida, toolKey)}
				/>

				{onAjustar ? (
					<Ajustes
						ajustes={ajustes}
						origemId={saida.entry_id ?? ''}
						ocupado={ocupado}
						semSaldo={semSaldo}
						custoNotice={custoNotice}
						onAjustar={onAjustar}
					/>
				) : null}

				{/*
				 * POR QUE A ARTE FICOU ASSIM — em destaque, e não numa gaveta.
				 *
				 * É o que transforma "a IA cuspiu isso" em "o time decidiu isso por
				 * este motivo", e é o único ponto de render, no caminho principal, do
				 * especialista que fecha o pedido da arte. Sem ele, o trabalho visível
				 * dele seria um parágrafo de prompt em inglês de máquina — que é
				 * exatamente o que esta tela existe para não mostrar.
				 */}
				{porQue ? (
					<section className="rounded-3xl border p-6" style={ACENTO_TINTA}>
						<div className="mb-2.5 flex items-center gap-2">
							<Lightbulb className="h-4 w-4" style={ACENTO_TEXTO} />
							<h2 className="text-[12px] font-semibold uppercase tracking-wider text-slate-300">
								Por que a arte ficou assim
							</h2>
						</div>
						<p className="max-w-3xl whitespace-pre-wrap text-[15px] leading-relaxed text-slate-200">
							{porQue}
						</p>
					</section>
				) : null}

				{/* ── o que não saiu como devia (sem alarme, sem esconder) ── */}
				{avisos.length > 0 || falhas.length > 0 ? (
					<Ressalva titulo="O que vale saber sobre esta execução">
						<ul className="space-y-1">
							{falhas.map((f) => (
								<li key={`falha-${f.chave || f.nome}`}>
									<strong className="font-semibold">{f.nome}</strong> não
									entregou
									{frase(f.erro, 200) ? `: ${frase(f.erro, 200)}` : '.'} A arte
									saiu com o trabalho de quem entregou.
								</li>
							))}
							{avisos.map((a) => (
								<li key={`aviso-${a}`}>{a}</li>
							))}
						</ul>
					</Ressalva>
				) : null}

				{/*
				 * QUEM TRABALHOU NESTA ARTE — desenhado a partir de `agentes`, item a
				 * item. É a regra ① do topo em código: nenhuma lista de seis nomes
				 * chumbada aqui, nenhum `if (chave === 'redator')`. Um especialista
				 * novo no roster nasce com cartão, com ficha e com lugar na tela.
				 */}
				{agentes.length > 0 ? (
					<section className="space-y-3">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-slate-400">
								<Users className="h-4 w-4" />
								Quem trabalhou nesta arte
							</h2>
							<span className="text-[12px] text-slate-500">
								{entregaram} de {agentes.length} entregaram
								{tempoDoTime ? ` · ${tempoDoTime}` : ''}
							</span>
						</div>
						<ul className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
							{agentes.map((a) => (
								<CartaoDoEspecialista key={a.chave} a={a} />
							))}
						</ul>
					</section>
				) : Number(saida.ok_count) > 0 ? (
					/*
					 * Gente trabalhou (o `ok_count` prova) e a lista não chegou. A
					 * suspeita número 1 é a allow-list de `output` na definition, que
					 * descarta em silêncio qualquer chave que ela não liste. Dizer isso
					 * é melhor que uma seção que some sozinha — sumir é justamente como
					 * o defeito passou despercebido nas primeiras rodadas da Central.
					 */
					<p className="text-[12px] text-slate-600">
						A lista de quem trabalhou não veio nesta resposta.
					</p>
				) : null}

				{/*
				 * O PEDIDO ESCRITO PELO TIME — fechado por padrão, e essa é a decisão.
				 *
				 * O aluno veio buscar UMA ARTE e não quer ler; mas quem quiser entender
				 * (ou pedir a mesma coisa de novo) tem direito ao texto exato que gerou
				 * a imagem. Fechado, ele não pesa na tela; aberto, é auditoria.
				 */}
				{promptFinal || promptNegativo ? (
					<section className="rounded-2xl border border-white/8 bg-white/[0.02]">
						<button
							type="button"
							onClick={() => setVerPedido((v) => !v)}
							aria-expanded={verPedido}
							className="flex w-full items-center justify-between gap-3 p-4 text-left"
						>
							<span className="text-[13px] font-medium text-slate-300">
								Ver o pedido que o time escreveu para a arte
							</span>
							<ChevronDown
								className={`h-4 w-4 shrink-0 text-slate-600 transition-transform ${
									verPedido ? 'rotate-180' : ''
								}`}
							/>
						</button>

						{verPedido ? (
							<div className="space-y-3 border-t border-white/5 p-4">
								{promptFinal ? (
									<div>
										<div className="mb-2 flex items-center justify-between gap-3">
											<span className="text-[11px] uppercase tracking-wider text-slate-600">
												O pedido
											</span>
											<BotaoCopiar
												texto={promptFinal}
												id="prompt"
												copiado={copiado}
												copiar={copiar}
											/>
										</div>
										<p className="whitespace-pre-wrap text-[12px] leading-relaxed text-slate-400">
											{promptFinal}
										</p>
									</div>
								) : null}
								{promptNegativo ? (
									<div>
										<p className="mb-1.5 text-[11px] uppercase tracking-wider text-slate-600">
											O que pedimos para NÃO aparecer
										</p>
										<p className="whitespace-pre-wrap text-[12px] leading-relaxed text-slate-400">
											{promptNegativo}
										</p>
									</div>
								) : null}
							</div>
						) : null}
					</section>
				) : null}
			</div>
		</div>
	);
}
