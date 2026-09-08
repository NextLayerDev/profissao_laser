/**
 * ORÇAMENTO — a parte pura da tela: ler a definition, ler o resultado, formatar.
 *
 * ┌─ A PERGUNTA DESTA TELA MUDOU, E É POR ISSO QUE ELA EXISTE ───────────────┐
 * │ Antes, a ferramenta abria no layout `studio` genérico e perguntava a      │
 * │ OPERAÇÃO: unidade do arquivo, preço do material por quilo, largura da     │
 * │ chapa, velocidade de corte em mm/s — doze campos, mais os trinta e um do  │
 * │ perfil de custo. O dono de uma marcenaria a laser não abre isto para      │
 * │ configurar um laser. Ele abre para responder duas perguntas:              │
 * │                                                                          │
 * │        "quanto eu cobro nesta peça?"  e  "estou ganhando dinheiro?"       │
 * │                                                                          │
 * │ A operação virou consequência: o arquivo, o material, a espessura e a     │
 * │ quantidade bastam para um preço, e o resto tem padrão. É o mesmo          │
 * │ movimento que o Ateliê e a Central de Inteligência já fizeram.            │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * TIPAGEM FROUXA DE PROPÓSITO, do mesmo jeito que em `viewport/quote-viewport`:
 * o `output` do motor é JSON, e um `parse` estrito aqui transformaria "o back
 * ganhou um campo" em tela branca no meio de um orçamento. Cada leitor devolve
 * `undefined` quando o campo não veio, e a tela decide o que fazer com isso.
 *
 * NENHUM NÚMERO É CALCULADO AQUI. Nem o lucro, nem a curva, nem o piso: tudo
 * vem pronto de `quote.price` (`Profissao-Laser-API/src/tool-blocks/blocks/quote.ts`),
 * que por sua vez chama `lib/quote/pricing.ts`. Refazer qualquer conta no
 * navegador criaria uma segunda fonte de verdade para PREÇO — e a divergência
 * só apareceria quando um cliente reclamasse do valor.
 */

import type { AiToolDefinition } from '../../services/tool-definitions.service';

/* ───────────────────────────── formatação ───────────────────────────── */

const BRL = new Intl.NumberFormat('pt-BR', {
	style: 'currency',
	currency: 'BRL',
});

/** Centavos → R$. Todo dinheiro do motor é inteiro em centavos, nunca float. */
export function reais(cents: unknown): string {
	const n = Number(cents);
	return Number.isFinite(n) ? BRL.format(n / 100) : '—';
}

/** Milímetros com no máximo uma casa — ninguém lê "149,99999 mm". */
export function mm(v: unknown): string {
	const n = Number(v);
	if (!Number.isFinite(n)) return '—';
	return n >= 100 ? String(Math.round(n)) : String(Math.round(n * 10) / 10);
}

export function pct(v: unknown, casas = 1): string {
	const n = Number(v);
	return Number.isFinite(n) ? `${n.toFixed(casas).replace('.', ',')}%` : '—';
}

export function numero(v: unknown): number | undefined {
	const n = Number(v);
	return Number.isFinite(n) ? n : undefined;
}

/* ─────────────────────── o que a definition configura ─────────────────── */

export interface OrcamentoUi {
	/**
	 * Quantidades da curva de escala. Vem da definition para o admin poder
	 * ajustá-la ao público sem deploy; o motor sempre acrescenta a quantidade
	 * realmente pedida, então esta lista nunca deixa a tela sem âncora.
	 */
	curva: number[];
	/** Chips de atalho da quantidade. Digitar continua valendo. */
	atalhosQtd: number[];
	titulo?: string;
	subtitulo?: string;
}

const CURVA_PADRAO = [1, 10, 50, 100];
const ATALHOS_PADRAO = [1, 5, 10, 25, 50, 100];

function listaDeNumeros(v: unknown, teto: number): number[] | undefined {
	const bruto = Array.isArray(v)
		? v
		: typeof v === 'string'
			? v.split(/[|,;\s]+/)
			: undefined;
	if (!bruto) return undefined;
	const limpo = [
		...new Set(
			bruto
				.map((x) => Math.round(Number(String(x).trim())))
				.filter((n) => Number.isFinite(n) && n >= 1 && n <= 100_000),
		),
	].sort((a, b) => a - b);
	return limpo.length ? limpo.slice(0, teto) : undefined;
}

export function orcamentoUiDaDefinition(
	def: AiToolDefinition | undefined,
): OrcamentoUi {
	const ui = (def?.definition.ui ?? {}) as {
		orcamento?: Record<string, unknown>;
		customer?: { title?: string; subtitle?: string };
	};
	const o = ui.orcamento ?? {};
	return {
		curva: listaDeNumeros(o.curva, 6) ?? CURVA_PADRAO,
		atalhosQtd: listaDeNumeros(o.atalhos_qtd, 8) ?? ATALHOS_PADRAO,
		titulo: ui.customer?.title,
		subtitulo: ui.customer?.subtitle,
	};
}

/* ─────────────────────── o que o motor devolveu ─────────────────────── */

export interface LinhaDeCusto {
	id?: string;
	label?: string;
	cents?: number;
	detalhe?: string;
}

export interface BreakdownFrouxo {
	qty?: number;
	tempos?: Record<string, unknown>;
	material?: Record<string, unknown>;
	velocidade?: Record<string, unknown>;
	maquina?: Record<string, unknown>;
	custos?: {
		linhas?: LinhaDeCusto[];
		diretoCents?: number;
		overheadCents?: number;
		totalCents?: number;
	};
	precos?: Record<string, unknown>;
	prazoDias?: number;
	avisos?: string[];
}

/** Um ponto da curva de escala, como `quote.price` o publica. */
export interface PontoDaCurva {
	qtd: number;
	precoUnitCents: number;
	precoUnitEfetivoCents: number;
	totalCents: number;
	custoPecaCents: number;
	lucroTotalCents: number;
	margemPct: number;
	descontoPct: number;
	prazoDias: number;
	aplicouPedidoMinimo: boolean;
	atual: boolean;
}

export interface LucroDoPedido {
	porPecaCents: number;
	doPedidoCents: number;
	margemPct: number;
	/** Piso na base de TABELA (antes do desconto). Não é o que a tela mostra. */
	pisoUnitCents: number;
	/**
	 * Piso na base EFETIVA — o que o cliente paga por peça. É ESTE que a tela
	 * cita, porque a manchete dela é o preço efetivo.
	 *
	 * Misturar as duas bases fazia o mesmo cartão afirmar lucro e prejuízo ao
	 * mesmo tempo: com 40% de desconto, "cobre R$ 7,80 por peça", "sobram
	 * R$ 144,20" e "abaixo de R$ 10,45 dá prejuízo", tudo junto. Medido em 1 de
	 * cada 5 orçamentos com desconto.
	 */
	pisoUnitEfetivoCents?: number;
	abaixoDoCusto: boolean;
}

/**
 * Um aviso do motor COM PESO. `breakdown.avisos` é a mesma lista em texto puro,
 * e sem a severidade "este pedido dá prejuízo" (`erro`) saía com exatamente a
 * mesma cor de "confirme a velocidade" (`aviso`).
 */
export interface AlertaDoOrcamento {
	codigo: string;
	severidade: 'erro' | 'aviso' | 'info';
	titulo: string;
	mensagem: string;
}

export interface Orcamento {
	breakdown: BreakdownFrouxo;
	curva: PontoDaCurva[];
	lucro?: LucroDoPedido;
	/**
	 * Os avisos do NEGÓCIO com código e severidade. Chega vazio quando a
	 * definition ainda não lista `alertas` no `output` — nesse caso a tela cai em
	 * `breakdown.avisos`, que é a mesma lista sem peso. Ver `alertasDoOrcamento`.
	 */
	alertas: AlertaDoOrcamento[];
	/** SVG (data-URL) do desenho lido. */
	preview?: string;
	/** O documento do cliente final — sem custo, markup, margem nem imposto. */
	publico?: unknown;
	/** Avisos do ARQUIVO (contorno aberto, furo pequeno). */
	avisosDoArquivo: string[];
	meta: Record<string, unknown>;
}

function objeto(v: unknown): Record<string, unknown> | undefined {
	if (typeof v === 'string' && v.trim()) {
		try {
			const p = JSON.parse(v);
			return p && typeof p === 'object' && !Array.isArray(p)
				? (p as Record<string, unknown>)
				: undefined;
		} catch {
			return undefined;
		}
	}
	return v && typeof v === 'object' && !Array.isArray(v)
		? (v as Record<string, unknown>)
		: undefined;
}

function lista(v: unknown): unknown[] {
	if (Array.isArray(v)) return v;
	if (typeof v === 'string' && v.trim()) {
		try {
			const p = JSON.parse(v);
			return Array.isArray(p) ? p : [];
		} catch {
			return [];
		}
	}
	return [];
}

/**
 * Lê o `output` de um run.
 *
 * ARMADILHA QUE VALE UM COMENTÁRIO: o `output` da definition é ALLOW-LIST. Uma
 * chave que o bloco emite e a definition não lista é calculada, PAGA e
 * descartada antes de chegar aqui — some sem erro nenhum. Se `curva` ou `lucro`
 * chegarem vazios com o resto certo, o suspeito nº 1 é o `output` do seed
 * (`api-upvox/scripts/seed-central-custos.ts`), não este arquivo.
 */
export function lerOrcamento(
	output: Record<string, unknown>,
): Orcamento | null {
	const breakdown = objeto(output.breakdown);
	if (!breakdown) return null;
	const meta = objeto(output.meta) ?? {};
	return {
		breakdown: breakdown as BreakdownFrouxo,
		curva: lista(output.curva) as PontoDaCurva[],
		lucro: objeto(output.lucro) as LucroDoPedido | undefined,
		alertas: alertasDoOrcamento(output, breakdown as BreakdownFrouxo),
		preview: typeof output.preview === 'string' ? output.preview : undefined,
		publico: output.quote_public,
		// O diagnóstico do ARQUIVO. `diagnostico.warnings` é a versão do OPERADOR
		// ("o furo sai cônico, fecha de novo no acrílico ou carboniza no MDF") —
		// é ela que resolve o problema de quem está nesta tela. `public_warnings`
		// é a versão escrita para o CLIENTE FINAL, mais macia de propósito, e
		// vale como rede enquanto a definition não listar a chave nova.
		// `breakdown.avisos` fala do NEGÓCIO e não entra aqui.
		avisosDoArquivo: mensagensDoDiag(
			objeto(output.diagnostico)?.warnings ?? meta.public_warnings,
		),
		meta,
	};
}

/** Lista de diagnósticos do CAD → as frases, sem os ids internos de contorno. */
function mensagensDoDiag(v: unknown): string[] {
	return lista(v)
		.map((w) => {
			const d = objeto(w);
			return typeof d?.message === 'string' ? d.message : String(w ?? '');
		})
		.filter((s) => s.length > 0);
}

const SEVERIDADES = new Set(['erro', 'aviso', 'info']);

/**
 * Os avisos com severidade, com DEGRADAÇÃO para a lista de strings.
 *
 * `alertas` só chega quando a definition o lista no `output` (allow-list). Sem
 * ele a tela ainda precisa mostrar os avisos — mas todos com o mesmo peso, que
 * é como estavam. Preferir o rico e cair no pobre é o que evita a tela ficar
 * MUDA justo no dia em que alguém esquece de rodar o seed.
 */
function alertasDoOrcamento(
	output: Record<string, unknown>,
	breakdown: BreakdownFrouxo,
): AlertaDoOrcamento[] {
	const ricos = lista(output.alertas)
		.map((a) => objeto(a))
		.filter((a): a is Record<string, unknown> => !!a)
		.map((a) => ({
			codigo: String(a.codigo ?? ''),
			severidade: SEVERIDADES.has(String(a.severidade))
				? (String(a.severidade) as AlertaDoOrcamento['severidade'])
				: ('aviso' as const),
			titulo: String(a.titulo ?? ''),
			mensagem: String(a.mensagem ?? ''),
		}))
		.filter((a) => a.mensagem.length > 0);
	if (ricos.length > 0) return ricos;
	return (breakdown.avisos ?? []).map((mensagem) => ({
		codigo: '',
		severidade: 'aviso' as const,
		titulo: '',
		mensagem,
	}));
}

/**
 * O texto que o profissional manda ao cliente pelo WhatsApp.
 *
 * Montado a partir de `quote_public`, que é a saída que o BACK já limpou: sem
 * custo, taxa-hora, markup, margem, imposto nem pedido mínimo. Montar isto a
 * partir do `breakdown` (removendo o que não pode sair) seria uma blocklist, e
 * blocklist envelhece mal — bastaria o precificador ganhar um campo para ele
 * estrear vazando. Ver o comentário de `orcamentoPublico` na main API.
 */
export function textoParaOCliente(
	publico: unknown,
	empresa?: string,
): string | undefined {
	const p = objeto(publico);
	if (!p) return undefined;
	const peca = objeto(p.peca) ?? {};
	const linhas: string[] = [];
	if (empresa?.trim()) linhas.push(`*${empresa.trim()}*`);
	linhas.push('*Orçamento*', '');
	linhas.push(
		`Peça: ${mm(peca.largura_mm)} × ${mm(peca.altura_mm)} mm · ${p.material} ${p.espessura_mm} mm`,
	);
	linhas.push(`Quantidade: ${p.quantidade}`);
	linhas.push(`Preço por peça: ${reais(p.preco_unitario_cents)}`);
	const desconto = numero(p.desconto_pct) ?? 0;
	const total = numero(p.total_cents);
	const qtd = numero(p.quantidade);
	if (desconto > 0) linhas.push(`Desconto por quantidade: ${pct(desconto, 0)}`);
	// A CONTA TEM QUE FECHAR NO TEXTO. Com desconto, "10 peças × R$ 13,50" ao
	// lado de "Total R$ 128,25" faz o cliente somar 135,00 e achar que erraram o
	// orçamento dele. Dizer quanto sai cada peça DEPOIS do desconto fecha os dois
	// números — e é o mesmo `total ÷ qtd` que a tela do profissional estampa.
	if (desconto > 0 && total !== undefined && qtd !== undefined && qtd > 1) {
		linhas.push(
			`*Total: ${reais(total)}* (${reais(Math.ceil(total / qtd))} por peça já com o desconto)`,
		);
	} else {
		linhas.push(`*Total: ${reais(total)}*`);
	}
	if (numero(p.prazo_dias) !== undefined) {
		linhas.push(`Prazo: ${p.prazo_dias} dia(s) úteis`);
	}
	if (p.estimativa === true) {
		linhas.push(
			'',
			'Obs.: valor sujeito a confirmação após teste de corte no material.',
		);
	}
	return linhas.join('\n');
}
