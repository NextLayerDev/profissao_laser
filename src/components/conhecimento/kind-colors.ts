import type { KbSourceKind } from '@/types/ai-knowledge';

/**
 * Cor por ORIGEM — estável e compartilhada entre a faixa de composição do topo e
 * o rótulo de cada linha da tabela, pra o olho ligar as duas coisas.
 *
 * Regra que isso respeita: a cor segue a ENTIDADE, nunca a posição dela no
 * ranking. Se eu colorisse por "1º, 2º, 3º maior", uma origem que crescesse
 * roubaria a cor da outra e a tela se repintaria sozinha entre duas visitas —
 * exatamente o que faz alguém desconfiar do dado.
 *
 * Os hexes vêm da paleta categórica validada (passa nos testes de daltonismo em
 * claro e escuro). São 5 tons + cinza: origens que dividem tom são de famílias
 * que raramente aparecem lado a lado no topo, e mesmo assim cada faixa carrega
 * rótulo direto — a identidade nunca depende só da cor.
 */
export interface KindColor {
	light: string;
	dark: string;
}

export const NEUTRAL: KindColor = { light: '#8b8b93', dark: '#7e7e88' };

const BLUE: KindColor = { light: '#2a78d6', dark: '#3987e5' };
const GREEN: KindColor = { light: '#008300', dark: '#008300' };
const MAGENTA: KindColor = { light: '#e87ba4', dark: '#d55181' };
const YELLOW: KindColor = { light: '#eda100', dark: '#c98500' };
const AQUA: KindColor = { light: '#1baf7a', dark: '#199e70' };

export const KIND_COLORS: Record<KbSourceKind, KindColor> = {
	// A oficina — o que a escola de fato ensina a fazer.
	parameter: BLUE,
	machine: BLUE,
	laser_product: AQUA,
	// O curso.
	lesson: GREEN,
	course: GREEN,
	// A ajuda escrita.
	faq: YELLOW,
	kb_article: YELLOW,
	manual: YELLOW,
	// O produto.
	tool: MAGENTA,
	plan: MAGENTA,
	// A rede em volta.
	fornecedor: NEUTRAL,
	channel: NEUTRAL,
	ticket: NEUTRAL,
};

export function kindColor(kind: KbSourceKind): KindColor {
	return KIND_COLORS[kind] ?? NEUTRAL;
}
