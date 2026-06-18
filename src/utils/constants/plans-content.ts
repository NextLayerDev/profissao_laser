/**
 * Conteúdo de vitrine dos planos (taglines + bullets de features), indexado
 * pela `key` do plano. Preços/nome/ordem vêm da API; estes textos são fixos
 * (fiéis ao print) e reaproveitados na landing e na tela de checkout do plano.
 */

export const PLAN_TAGLINES: Record<string, string> = {
	basic: 'Para começar e aprender',
	pro: 'Para quem quer ir além',
	avan: 'Para quem busca resultados',
	max: 'Para quem quer o máximo',
};

export const PLAN_FEATURES: Record<string, string[]> = {
	basic: [
		'Aulas Gravadas',
		'Suporte online',
		'Biblioteca de vetores',
		'Parâmetros',
		'Fórum',
		'Chat',
		'Lista de fornecedores',
		'Eventos e Lives fechadas',
		'Vitrine de Projetos',
	],
	pro: [
		'Aulas Gravadas',
		'Suporte online',
		'Biblioteca de vetores',
		'Parâmetros',
		'Fórum',
		'Chat',
		'Lista de fornecedores',
		'Eventos e Lives fechadas',
		'Vitrine de Projetos',
		'Grupo de Whatsapp',
	],
	avan: [
		'Aulas Gravadas',
		'Suporte online',
		'Biblioteca de vetores',
		'Parâmetros',
		'Fórum',
		'Chat',
		'Lista de fornecedores',
		'Garantias e Lives fechadas',
		'Integração de Projetos',
		'Vetorização (equipe de suporte online)',
	],
	max: [
		'Aulas Gravadas',
		'Suporte online',
		'Biblioteca de vetores',
		'Parâmetros',
		'Chat',
		'Lista de fornecedores',
		'Eventos e Lives fechadas e suporte online',
		'Prévias',
		'Pacote de 150 Voxxys',
		'10 Horas de mentoria online',
		'Gravação 360° - Grupo de 5 pessoas',
	],
};

export const featuresForPlan = (key: string): string[] =>
	PLAN_FEATURES[key] ?? [];
