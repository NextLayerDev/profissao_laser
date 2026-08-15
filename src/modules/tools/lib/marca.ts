import type {
	CollectionEntry,
	PaletteColor,
} from '../services/collections.service';

/**
 * A MARCA DO ALUNO — a parte pura.
 *
 * A identidade da empresa é cadastrada UMA vez e reusada por várias ferramentas.
 * Sem ela, "arte com a personalidade da empresa" não existe: o modelo reinventa
 * a identidade a cada geração — outra cor, outro tom, outro logo.
 *
 * ┌─ ONDE ELA MORA — e por que deixou de morar dentro de uma ferramenta ────┐
 * │ A coleção `marca` era declarada na definition do Estúdio de Imagens, e   │
 * │ com isso herdava o ciclo de vida dele: com o Ateliê em `draft`, o        │
 * │ endpoint de coleção respondia 404 ANTES de tocar o banco — só a          │
 * │ allowlist de preview conseguia cadastrar marca. E arquivar/renomear o    │
 * │ Ateliê levaria junto o cadastro de identidade de todo mundo.             │
 * │                                                                          │
 * │ Agora ela mora no contêiner `perfil`: uma definition sem pipeline e sem  │
 * │ cobrança, que existe só para hospedar este cadastro (upvox,              │
 * │ `scripts/colecao-marca.ts` + `scripts/seed-perfil.ts`). A tela é uma     │
 * │ SEÇÃO da página de perfil — o cadastro da identidade não é ferramenta.   │
 * │                                                                          │
 * │ Nada disso cria tabela: continua sendo o dataset genérico das Coleções,  │
 * │ e o formulário continua sendo o `CollectionEntryForm` com uma camada de  │
 * │ carinho por cima.                                                        │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * COMO OUTRA FERRAMENTA LÊ ISTO (sem duplicar campo nenhum):
 *
 *   • na TELA: `useMarcaAtiva()` (a que vale + a lista) e `useMarcaDisponivel()`
 *     ("o cadastro funciona para quem está olhando?") — ver `hooks/use-marca.ts`.
 *     Nenhuma tela deve montar a query da coleção à mão;
 *   • no PIPELINE: o helper `noDaMarca()` do seed (upvox,
 *     `scripts/colecao-marca.ts`), que monta o `collection.query` com
 *     `tool:'perfil'`, `collection:'marca'`, `mine:true` e `optional:true`;
 *   • no SERVIDOR: `escolherMarca()` em `Profissao-Laser-API/src/lib/marca.ts`,
 *     que é onde a REGRA de qual marca vale mora — em um lugar só.
 *
 * QUAL MARCA USAR quando o aluno tem mais de uma:
 *
 *   1. a marcada como `principal` NO SERVIDOR (campo da coleção). Já foi
 *      `localStorage`, e era mentira: o servidor nunca lia, então a tela dizia
 *      "em uso" numa marca e a arte saía com outra;
 *   2. sem nenhuma principal, a MAIS RECENTE — `sort:'recent'` da coleção é
 *      `created_at desc`, ou seja, a última CRIADA, não a última editada;
 *   3. sem marca nenhuma, a ferramenta continua funcionando: ela gera sem
 *      identidade, e a tela convida a cadastrar. Marca é o que melhora o
 *      resultado, não o que destrava a ferramenta. Configurar é OPCIONAL.
 */

/**
 * O CONTÊINER da coleção. Precisa casar com `MARCA_TOOL` de
 * `Profissao-Laser-API/src/lib/marca.ts` e com `MARCA_TOOL_KEY` de
 * `api-upvox/scripts/colecao-marca.ts` — três repositórios, três constantes, e
 * nenhuma adivinha a outra: mudar uma só faz o cadastro parar de responder.
 */
export const MARCA_TOOL_KEY = 'perfil';
export const MARCA_COLLECTION = 'marca';

/**
 * Os campos declarados em `collections.marca.fields`.
 *
 * ARMADILHA: campo que não está declarado na definition é DESCARTADO EM
 * SILÊNCIO por `validateCollectionData` (main API). Renomear qualquer coisa aqui
 * sem renomear lá faz o dado sumir sem erro nenhum.
 */
export const CAMPO_MARCA = {
	nome: 'nome',
	logo: 'logo_url',
	primaria: 'cor_primaria',
	secundaria: 'cor_secundaria',
	fundo: 'cor_fundo',
	fonte: 'fonte',
	tom: 'tom_de_voz',
	publico: 'publico',
	naoUsar: 'nao_usar',
	exemplo: 'exemplo_url',
} as const;

/** Os três campos que guardam cor. */
export const CAMPOS_DE_COR: string[] = [
	CAMPO_MARCA.primaria,
	CAMPO_MARCA.secundaria,
	CAMPO_MARCA.fundo,
];

/**
 * Os que SAEM DO LOGO — e a cor de fundo não é um deles.
 *
 * A coleção diz por quê, e é uma observação boa demais para a tela ignorar:
 * fundo de logo quase sempre é o branco do arquivo, não uma escolha da marca.
 * Sugerir "sua cor de fundo é branco" a partir de um PNG transparente seria
 * inventar uma decisão que o aluno não tomou.
 */
export const CAMPOS_DE_COR_DO_LOGO: string[] = [
	CAMPO_MARCA.primaria,
	CAMPO_MARCA.secundaria,
];

/* ─────────────────────────── a marca ─────────────────────────── */

export interface Marca {
	id: string | null;
	/** `title` do registro: como o aluno ACHA este cadastro na lista dele. */
	titulo: string;
	/** `data.nome`: como o nome é ESCRITO NA PEÇA. Não são a mesma coisa. */
	nome: string;
	logo: string;
	/** Já normalizadas em `#rrggbb`, ou `null` quando o aluno não definiu. */
	primaria: string | null;
	secundaria: string | null;
	fundo: string | null;
	fonte: string;
	tom: string;
	publico: string;
	naoUsar: string;
	exemplo: string;
}

function texto(v: unknown): string {
	return typeof v === 'string' ? v.trim() : '';
}

/**
 * Lê os dados crus de um registro (ou do formulário em edição) como marca.
 *
 * `titulo` e `nome` se cobrem quando um deles falta — enquanto o aluno digita, o
 * cadastro passa por um momento em que só um dos dois existe, e a prévia não
 * pode ficar com um buraco por causa disso.
 */
export function marcaDeDados(
	data: Record<string, unknown>,
	opts: { id?: string | null; titulo?: string } = {},
): Marca {
	const titulo = opts.titulo?.trim() ?? '';
	const nome = texto(data[CAMPO_MARCA.nome]);
	return {
		id: opts.id ?? null,
		titulo: titulo || nome,
		nome: nome || titulo,
		logo: texto(data[CAMPO_MARCA.logo]),
		primaria: normalizarCor(data[CAMPO_MARCA.primaria]),
		secundaria: normalizarCor(data[CAMPO_MARCA.secundaria]),
		fundo: normalizarCor(data[CAMPO_MARCA.fundo]),
		fonte: texto(data[CAMPO_MARCA.fonte]),
		tom: texto(data[CAMPO_MARCA.tom]),
		publico: texto(data[CAMPO_MARCA.publico]),
		naoUsar: texto(data[CAMPO_MARCA.naoUsar]),
		exemplo: texto(data[CAMPO_MARCA.exemplo]),
	};
}

/** O mesmo, a partir de um registro salvo da coleção. */
export function lerMarca(entry: CollectionEntry): Marca {
	return marcaDeDados(entry.data, { id: entry.id, titulo: entry.title });
}

/* ─────────────────────────── cor ─────────────────────────── */

const HEX_CURTO = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const HEX = /^#?([0-9a-f]{6})$/i;
const RGB = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i;

/**
 * Qualquer coisa que o aluno tenha digitado → `#rrggbb`, ou `null`.
 *
 * O seletor de cor da tela sempre escreve `#rrggbb`, mas o campo é `text` na
 * coleção: um registro pode ter chegado por importação, pela API ou por alguém
 * colando `rgb(12, 30, 200)`. Devolver `null` no que não dá para entender é
 * melhor do que devolver preto — preto seria uma cor que o aluno não escolheu.
 */
export function normalizarCor(v: unknown): string | null {
	const bruto = texto(v);
	if (!bruto) return null;

	const curto = bruto.match(HEX_CURTO);
	if (curto)
		return `#${curto[1]}${curto[1]}${curto[2]}${curto[2]}${curto[3]}${curto[3]}`.toLowerCase();

	const longo = bruto.match(HEX);
	if (longo) return `#${longo[1].toLowerCase()}`;

	const rgb = bruto.match(RGB);
	if (rgb) {
		const canais = [rgb[1], rgb[2], rgb[3]].map((n) =>
			Math.max(0, Math.min(255, Number(n))),
		);
		if (canais.some((n) => !Number.isFinite(n))) return null;
		return `#${canais.map((n) => n.toString(16).padStart(2, '0')).join('')}`;
	}

	return null;
}

/** `#rrggbb` → [r, g, b] (0–255). Assume cor já normalizada. */
function canais(hex: string): [number, number, number] {
	return [
		Number.parseInt(hex.slice(1, 3), 16),
		Number.parseInt(hex.slice(3, 5), 16),
		Number.parseInt(hex.slice(5, 7), 16),
	];
}

/** Luminância relativa (WCAG) — 0 = preto, 1 = branco. */
export function luminancia(hex: string): number {
	const [r, g, b] = canais(hex).map((c) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Razão de contraste (WCAG), de 1 (idênticas) a 21 (preto no branco).
 *
 * Serve para o aviso honesto da prévia: uma marca com o texto a 1,4 de contraste
 * fica linda no seletor de cor e ilegível na arte.
 */
export function contraste(a: string, b: string): number {
	const la = luminancia(a);
	const lb = luminancia(b);
	const [claro, escuro] = la > lb ? [la, lb] : [lb, la];
	return (claro + 0.05) / (escuro + 0.05);
}

/** Preto ou branco — o que for legível SOBRE a cor dada. */
export function textoSobre(hex: string): string {
	return contraste(hex, '#111111') >= contraste(hex, '#ffffff')
		? '#111111'
		: '#ffffff';
}

/** Distância crua em RGB. Boa o bastante para "estas duas são a mesma cor?". */
function distancia(a: string, b: string): number {
	const [r1, g1, b1] = canais(a);
	const [r2, g2, b2] = canais(b);
	return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

/* ─────────────────────────── a paleta do logo ─────────────────────────── */

export interface CorSugerida {
	hex: string;
	/** Fatia de área no logo (0–1), quando o servidor mandou. */
	share?: number;
}

/**
 * As cores do logo, limpas e ordenadas por área.
 *
 * Vem do envio do logo (o endpoint já decodificou a imagem, então a paleta sai
 * no mesmo round-trip). Cor irreconhecível é descartada em vez de virar preto, e
 * repetida é descartada em vez de virar duas amostras iguais.
 */
export function coresDoLogo(
	palette: PaletteColor[] | undefined,
): CorSugerida[] {
	if (!Array.isArray(palette)) return [];
	const out: CorSugerida[] = [];
	for (const c of palette) {
		const hex = normalizarCor(c?.hex);
		if (!hex) continue;
		if (out.some((o) => o.hex === hex)) continue;
		out.push({
			hex,
			share: typeof c?.share === 'number' ? c.share : undefined,
		});
	}
	return out.sort((a, b) => (b.share ?? 0) - (a.share ?? 0));
}

/**
 * Que cor do logo vai em que campo.
 *
 * As regras, que a tela DIZ ao aluno em vez de esconder:
 *   • principal = a cor que mais ocupa o logo (em logo real, é a cor da marca);
 *   • apoio     = a próxima cor bem diferente da principal — não adianta
 *                 sugerir dois tons do mesmo azul: na arte parecem a mesma cor.
 *
 * A cor de FUNDO fica de fora de propósito (ver `CAMPOS_DE_COR_DO_LOGO`).
 */
export function papeisDaPaleta(
	cores: CorSugerida[],
): Partial<Record<string, string>> {
	if (!cores.length) return {};

	const principal = cores[0].hex;
	const apoio = cores
		.slice(1)
		.find((c) => distancia(c.hex, principal) > 60)?.hex;

	const papeis: Partial<Record<string, string>> = {
		[CAMPO_MARCA.primaria]: principal,
	};
	if (apoio) papeis[CAMPO_MARCA.secundaria] = apoio;
	return papeis;
}

/* ─────────────────────────── prévia honesta ─────────────────────────── */

/** O que a prévia desenha quando o aluno ainda não escolheu. */
export const COR_PADRAO = {
	fundo: '#ffffff',
	primaria: '#1f2937',
	secundaria: '#6b7280',
} as const;

/**
 * Só o que serve de `font-family` sem virar CSS arbitrário: letra, número,
 * espaço e os separadores de uma pilha de fontes.
 *
 * A fonte da marca é um NOME digitado pelo aluno ("Montserrat"). Se ela não
 * estiver instalada no computador dele, o navegador cai na próxima da pilha — e
 * a tela diz isso, em vez de deixá-lo acreditar que a prévia mostra a fonte
 * certa.
 */
export function fonteSegura(fonte: string): string | undefined {
	const limpo = fonte.replace(/[^\w\s,'-]/g, '').trim();
	if (!limpo) return undefined;
	return `${limpo}, ui-sans-serif, system-ui, sans-serif`;
}

/** Iniciais para o lugar do logo enquanto não há logo. */
export function iniciais(nome: string): string {
	const partes = nome.trim().split(/\s+/).filter(Boolean);
	if (!partes.length) return '?';
	return partes
		.slice(0, 2)
		.map((p) => p[0]?.toUpperCase() ?? '')
		.join('');
}

/**
 * O que ainda atrapalha o resultado — em português, sem jargão e sem alarme
 * falso. Ordem: o que mais estraga a arte primeiro.
 */
export function avisosDaMarca(marca: Marca): string[] {
	const avisos: string[] = [];
	const fundo = marca.fundo ?? COR_PADRAO.fundo;

	if (!marca.logo) {
		avisos.push('Sem logo, as artes saem sem a sua marca aplicada.');
	}
	if (marca.primaria && contraste(marca.primaria, fundo) < 3) {
		avisos.push(
			'A cor principal quase some no fundo escolhido — o texto vai ficar difícil de ler.',
		);
	}
	if (
		marca.primaria &&
		marca.secundaria &&
		distancia(marca.primaria, marca.secundaria) < 30
	) {
		avisos.push('A cor de apoio é quase igual à principal.');
	}
	if (!marca.naoUsar) {
		avisos.push(
			'Diga o que a sua marca NÃO é: é o campo que mais segura a IA longe do que você não quer.',
		);
	}
	return avisos;
}
