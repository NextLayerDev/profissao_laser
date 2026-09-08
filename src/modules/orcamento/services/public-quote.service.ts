import axios from 'axios';
import { z } from 'zod';
import { api } from '@/lib/fetch';

/**
 * Link público de orçamento — o cliente do BACKEND público (F6).
 *
 * Quem consome esta tela não é aluno, não tem conta e nunca vai ter: é o
 * cliente final do profissional, abrindo um link do WhatsApp no celular. Por
 * isso tudo aqui é anônimo — o `api` até anexa o Bearer se por acaso houver um
 * (o profissional testando o próprio link), mas a rota não tem `preHandler` de
 * auth e ignora o header.
 *
 * ARMADILHA JÁ PAGA: `/orcamento` PRECISA estar em `PUBLIC_PAGE_PREFIXES` nos
 * DOIS clients axios (`src/lib/fetch.ts` e `src/shared/lib/api-courses.ts`) e em
 * `PUBLIC_PATHS` do `AuthGuard`. Sem isso um 401 nesta página pública derruba a
 * sessão de quem estiver logado em outra aba.
 */

const BASE = '/api/public/quote';

/* ─────────────────────────────── contrato ─────────────────────────────── */

export const materialPublicoSchema = z.object({
	/** A FAMÍLIA do material ("mdf"), não o id da linha do banco do dono. */
	id: z.string(),
	nome: z.string(),
	espessuras: z.array(z.number()),
});
export type MaterialPublico = z.infer<typeof materialPublicoSchema>;

export const campoLeadSchema = z.object({
	name: z.string(),
	label: z.string(),
	required: z.boolean(),
});
export type CampoLead = z.infer<typeof campoLeadSchema>;

export const quoteLinkInfoSchema = z.object({
	titulo: z.string(),
	logo_url: z.string(),
	cor: z.string(),
	/**
	 * Nome da empresa, vindo da MARCA do profissional (`usar_marca` ligado no
	 * link). É o que faz a página deixar de ser um formulário anônimo e virar a
	 * proposta de uma empresa. Vazio quando ele não cadastrou marca — e aí a
	 * página fica NEUTRA, com o título do link, exatamente como sempre foi.
	 *
	 * `.default('')` nos dois campos novos não é preguiça: esta tela é servida
	 * separada da API e pode estar à frente dela num deploy. Sem default, um
	 * back mais antigo quebraria o `parse` e a página pública sairia DO AR —
	 * troca péssima por um nome de empresa.
	 */
	empresa: z.string().default(''),
	/** Só dígitos (o back higieniza). Vazio = o link não oferece contato. */
	whatsapp: z.string().default(''),
	materiais: z.array(materialPublicoSchema),
	qtd_max: z.number().int(),
	campos_lead: z.array(campoLeadSchema),
	mostrar_prazo: z.boolean(),
	/** Assinado (HMAC) pelo servidor, válido por 30 min, exigido no POST. */
	nonce: z.string(),
});
export type QuoteLinkInfo = z.infer<typeof quoteLinkInfoSchema>;

/**
 * TODOS OS CAMPOS SÃO OPCIONAIS, espelhando o schema do servidor: o caminho do
 * honeypot responde `200 {}` para o robô não descobrir a defesa pelo 500. Uma
 * tela que exigisse `price_total_cents` quebraria justo nesse caminho.
 */
export const estimateResultSchema = z.object({
	price_unit_cents: z.number().int().optional(),
	price_total_cents: z.number().int().optional(),
	qtd: z.number().int().optional(),
	prazo_dias: z.number().int().optional(),
	dims_mm: z.object({ largura: z.number(), altura: z.number() }).optional(),
	pecas: z.number().int().optional(),
	resumo: z.string().optional(),
	avisos: z.array(z.string()).optional(),
	/**
	 * `true` = a velocidade de corte saiu de um modelo, não de uma medição na
	 * máquina. O motor sempre soube disso; a página nunca contou, e o cliente
	 * recebia um preço estimado com cara de preço fechado. Uma proposta que
	 * esconde isso quebra na hora de entregar.
	 */
	estimativa: z.boolean().optional(),
	/**
	 * Desconto por quantidade já embutido no total (0–100).
	 *
	 * Sem ele a proposta não fechava: "10 peças · R$ 13,00 cada" em cima de
	 * "R$ 123,50". O cliente multiplica, dá R$ 130,00, e a conta que ele acabou
	 * de receber não bate — o que lê como erro de quem mandou o orçamento.
	 */
	desconto_pct: z.number().optional(),
});
export type EstimateResult = z.infer<typeof estimateResultSchema>;

/* ──────────────────────── constantes do servidor ──────────────────────── */

/** `HONEYPOT_FIELD` do backend. Bot que preenche → 200 vazio, sem cobrar. */
export const CAMPO_HONEYPOT = 'website';

/** `MAX_UPLOAD_BYTES` do backend (8 MB). Barrar aqui evita subir para levar 413. */
export const MAX_ARQUIVO_MB = 8;

/** Extensões que o servidor aceita — e confere contra o CONTEÚDO do arquivo. */
export const EXTENSOES = ['dxf', 'svg'] as const;

/**
 * `NONCE_MIN_AGE_MS` do backend é 3 s: um POST cedo demais é tratado como robô.
 * Usamos 3,5 s de folga porque o relógio de quem compara é o do SERVIDOR, e o
 * carimbo do nonce vem de lá — meio segundo cobre a latência da rede.
 */
export const NONCE_IDADE_MINIMA_MS = 3_500;

/** Acento padrão quando o dono do link não configurou (ou configurou lixo). */
export const ACCENT_PADRAO = '#7c3aed';

/* ─────────────────────────────── higiene ─────────────────────────────── */

const COR_HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * O servidor já passa `cor` por `saneiaTexto` (tira marcação), mas isso não a
 * torna uma COR: sobra qualquer string de 32 caracteres, e ela vai parar numa
 * custom property que alimenta `color-mix()` e `background`. Aqui exigimos hex
 * de verdade e caímos no padrão da casa quando não é — assim nenhum valor do
 * dono do link chega ao CSS da página que o cliente final dele abre.
 */
export function corSegura(cor: string): string {
	return COR_HEX.test(cor.trim()) ? cor.trim() : ACCENT_PADRAO;
}

/**
 * Segunda barreira sobre `saneiaUrl` do servidor. Custa três linhas e cobre o
 * caso de a API ser servida por uma versão mais antiga do que esta tela.
 */
export function logoSegura(url: string): string {
	const limpa = url.trim();
	if (/^https?:\/\//i.test(limpa)) return limpa;
	// `data:image/svg+xml` fica de FORA de propósito: SVG carrega script.
	if (/^data:image\/(png|jpe?g|gif|webp|avif);/i.test(limpa)) return limpa;
	return '';
}

/**
 * O link de "fechar pedido" no WhatsApp.
 *
 * O número já estava cadastrado no link e a página NUNCA o mostrou: o cliente
 * recebia o preço e o único botão da tela era "Recalcular". Orçamento sem
 * caminho para fechar o pedido é orçamento que morre na tela.
 *
 * Só dígitos entram (o back já filtra, aqui é a segunda barreira — este valor
 * vai dentro de um `href`), e o DDI 55 é assumido quando o número tem cara de
 * telefone brasileiro sem ele: quem cadastra "11 98888-7777" não está pensando
 * em código de país, e um wa.me sem DDI abre em branco.
 */
export function linkWhatsapp(numero: string, mensagem: string): string | null {
	const d = numero.replace(/\D+/g, '');
	if (d.length < 8) return null;
	const comDdi = d.length <= 11 ? `55${d}` : d;
	return `https://wa.me/${comDdi}?text=${encodeURIComponent(mensagem)}`;
}

/* ──────────────────────────────── chamadas ──────────────────────────────── */

export async function getQuoteLink(slug: string): Promise<QuoteLinkInfo> {
	const { data } = await api.get(`${BASE}/${encodeURIComponent(slug)}`);
	return quoteLinkInfoSchema.parse(data);
}

export interface EstimateInput {
	nonce: string;
	/** Id da FAMÍLIA do material, como veio em `materiais[].id`. */
	material: string;
	espessuraMm: number;
	qtd: number;
	arquivo: File;
	/** Só quando o link pede lead. `consentimento` é conferido pelo servidor. */
	lead?: {
		nome: string;
		whatsapp: string;
		email: string;
		empresa: string;
		consentimento: boolean;
	};
	/** Valor do campo-armadilha. Vai SEMPRE, vazio no caminho humano. */
	honeypot: string;
}

export async function postEstimate(
	slug: string,
	input: EstimateInput,
	opts: { onUploadProgress?: (pct: number) => void; signal?: AbortSignal } = {},
): Promise<EstimateResult> {
	const form = new FormData();
	form.append('arquivo', input.arquivo, input.arquivo.name);
	form.append('nonce', input.nonce);
	form.append('material', input.material);
	form.append('espessura_mm', String(input.espessuraMm));
	form.append('qtd', String(input.qtd));
	// O honeypot vai mesmo vazio: é o que um formulário de verdade manda, e é o
	// que faz o campo preenchido virar sinal em vez de ruído.
	form.append(CAMPO_HONEYPOT, input.honeypot);
	if (input.lead) {
		form.append('nome', input.lead.nome);
		form.append('whatsapp', input.lead.whatsapp);
		form.append('email', input.lead.email);
		form.append('empresa', input.lead.empresa);
		form.append('consentimento', input.lead.consentimento ? 'true' : 'false');
	}

	const { data } = await api.post(
		`${BASE}/${encodeURIComponent(slug)}/estimate`,
		form,
		{
			signal: opts.signal,
			onUploadProgress: (e) => {
				// `e.total` some em alguns proxies. Sem total não há porcentagem
				// HONESTA — devolvemos -1 e a tela mostra indeterminado em vez de
				// inventar um número.
				if (!opts.onUploadProgress) return;
				opts.onUploadProgress(
					e.total ? Math.round((e.loaded / e.total) * 100) : -1,
				);
			},
		},
	);
	return estimateResultSchema.parse(data);
}

/* ─────────────────────── erros em linguagem de leigo ─────────────────────── */

export interface ErroAmigavel {
	titulo: string;
	texto: string;
	/** O nonce venceu: dá para tentar de novo sozinho, com um token novo. */
	renovaSessao?: boolean;
	/** Para onde levar o visitante de volta. */
	volta?: 'arquivo' | 'opcoes';
}

/** Códigos que o backend devolve em `message` (`MSG` de `lib/public-quote.ts`). */
const POR_CODIGO: Record<string, ErroAmigavel> = {
	link_invalido: {
		titulo: 'Este link não está mais valendo',
		texto:
			'O profissional pode ter desativado ou trocado o link. Peça um novo para ele e tente de novo.',
	},
	orcamento_indisponivel: {
		// NEUTRO POR CONTRATO. Do outro lado pode estar o concorrente do
		// profissional: "sem saldo" contaria a ele que a empresa está no vermelho.
		titulo: 'Orçamento indisponível no momento',
		texto:
			'O cálculo automático está fora do ar por enquanto. Fale direto com o profissional para receber o preço.',
	},
	limite_atingido: {
		titulo: 'Muitos orçamentos em pouco tempo',
		texto:
			'Espere alguns minutos e tente de novo. Se for urgente, fale direto com o profissional.',
	},
	arquivo_grande_demais: {
		titulo: 'O arquivo é pesado demais',
		texto: `Envie um arquivo de até ${MAX_ARQUIVO_MB} MB. Desenho com detalhe demais também trava: se der, mande só o contorno de corte, sem texto nem hachura.`,
		volta: 'arquivo',
	},
	arquivo_invalido: {
		titulo: 'Esse arquivo não parece um DXF',
		texto:
			'Aceitamos desenho vetorial em DXF ou SVG. Foto, PDF e arquivo de impressão não servem — peça ao seu projetista o DXF do corte.',
		volta: 'arquivo',
	},
	sessao_expirada: {
		titulo: 'A página ficou aberta tempo demais',
		texto: 'Vamos atualizar e tentar outra vez.',
		renovaSessao: true,
	},
	dados_invalidos: {
		titulo: 'Confira as opções do pedido',
		texto:
			'Material, espessura ou quantidade não fecham com o que este link oferece. Escolha de novo nas listas acima.',
		volta: 'opcoes',
	},
};

/**
 * A resposta neutra, para quando a tela precisa mostrar "indisponível" sem ter
 * um erro HTTP na mão — o caminho do honeypot devolve `200 {}` e é sucesso do
 * ponto de vista da rede.
 */
export const ERRO_NEUTRO: ErroAmigavel = POR_CODIGO.orcamento_indisponivel;

const SEM_RESPOSTA: ErroAmigavel = {
	titulo: 'Não conseguimos falar com o servidor',
	texto:
		'Verifique sua internet e tente de novo. Nada foi cobrado e nenhum dado foi enviado.',
};

const DESCONHECIDO: ErroAmigavel = {
	titulo: 'Algo deu errado no caminho',
	texto:
		'Tente de novo em instantes. Se continuar, fale direto com o profissional.',
};

/**
 * Traduz qualquer falha para uma frase que o cliente final entende.
 *
 * REGRA: nunca vaza status HTTP, código interno, stack nem nome de campo do
 * backend. Quem lê isto não sabe o que é laser, muito menos o que é 415.
 */
export function erroAmigavel(err: unknown): ErroAmigavel {
	if (!axios.isAxiosError(err)) return DESCONHECIDO;
	if (!err.response) {
		// Sem resposta = rede, DNS, CORS ou abort. Nenhum deles chegou a cobrar.
		return SEM_RESPOSTA;
	}
	const body = err.response.data as { message?: unknown } | undefined;
	const codigo = typeof body?.message === 'string' ? body.message : '';
	const porCodigo = POR_CODIGO[codigo];
	if (porCodigo) return porCodigo;

	// Sem código reconhecido, o status ainda diz o suficiente para escolher a
	// frase certa — e é o que salva a tela quando o backend ganha um caminho
	// novo antes desta lista.
	const s = err.response.status;
	if (s === 404) return POR_CODIGO.link_invalido;
	if (s === 402) return POR_CODIGO.orcamento_indisponivel;
	if (s === 429) return POR_CODIGO.limite_atingido;
	if (s === 413) return POR_CODIGO.arquivo_grande_demais;
	if (s === 415) return POR_CODIGO.arquivo_invalido;
	if (s === 400) return POR_CODIGO.dados_invalidos;
	return POR_CODIGO.orcamento_indisponivel;
}

/* ───────────────────────────── formatação ───────────────────────────── */

const BRL = new Intl.NumberFormat('pt-BR', {
	style: 'currency',
	currency: 'BRL',
});

export function reais(cents: number): string {
	return BRL.format(cents / 100);
}

/** Milímetros sem casa decimal inútil: 320 mm, 12,5 mm. */
export function mm(v: number): string {
	const arredondado = Math.round(v * 10) / 10;
	return Number.isInteger(arredondado)
		? String(arredondado)
		: arredondado.toFixed(1).replace('.', ',');
}
