export type PersonalizationType = 'logo' | 'text' | 'both';

export interface LaserSettings {
	tamanho: 'pequeno' | 'medio' | 'grande' | 'custom';
	posicao: 'central' | 'superior' | 'inferior' | 'lateral';
	rotacao: number;
	intensidade: 'baixa' | 'media' | 'alta' | 'maxima';
	profundidade: 'superficial' | 'media' | 'profunda';
	comNome: 'com' | 'sem';
	nomePersonalizado: string;
	fonteFamilia: string;
	tamanhoNome: 'pequeno' | 'medio' | 'grande';
	orientacaoLogo: 'horizontal' | 'vertical';
	orientacaoNome: 'horizontal' | 'vertical';
	material: string;
	estiloGravacao: 'clean' | 'vintage' | 'elegante' | 'industrial' | 'futurista';
	acabamentoSuperficie: 'fosco' | 'brilhante' | 'escovado';
	contraste: number;
	efeitoSombra: number;
	moldura: 'nenhuma' | 'simples' | 'dupla' | 'ornamental' | 'arredondada';
	posicaoTextoRelLogo: string;
	espacamentoLogoTexto: string;
	tipoVisualizacao: string;
	anguloCamera: string;
	iluminacao: string;
	fundoCena: string;
	apenasTexto: boolean;
	modoLentes: boolean;
	textoLenteDireita: string;
	textoLenteEsquerda: string;
}

export interface Previa {
	id: string;
	customerId: string;
	name: string;
	productName: string;
	productColor?: string;
	imagebaseUrl: string;
	imageproductUrl: string;
	imagelogoUrl?: string;
	previewUrl: string;
	personalizationType: PersonalizationType;
	customName?: string;
	instrucoesPersonalizadas?: string;
	textoLenteDireita?: string;
	textoLenteEsquerda?: string;
	modoLentes: boolean;
	laserSettings: LaserSettings;
	notes?: string;
	prompt?: string;
	aiModel?: string;
	createdAt: string;
	updatedAt: string;
}

export interface PreviasResponse {
	data: Previa[];
	total: number;
	page: number;
	limit: number;
}

export interface GeneratePreviaPayload {
	imagebase_url: string;
	imageproduct_url: string;
	imagelogo_url?: string;
	productName: string;
	productColor?: string;
	personalizationType: PersonalizationType;
	customName?: string;
	instrucoesPersonalizadas?: string;
	modoLentes: boolean;
	textoLenteDireita?: string;
	textoLenteEsquerda?: string;
	name?: string;
	notes?: string;
	laserSettings: LaserSettings;
}

export interface UpdatePreviaPayload {
	name?: string;
	notes?: string;
}

export interface PreviasQuota {
	limit: number;
	used: number;
	remaining: number;
	resetsAt: string;
}

export interface PreviasUserUsage {
	customerId: string;
	customerName: string;
	customerEmail: string;
	plan: string;
	limit: number;
	used: number;
	remaining: number;
	lastGeneratedAt: string | null;
}

export interface PreviasAdminUsageResponse {
	data: PreviasUserUsage[];
	total: number;
	page: number;
	limit: number;
	summary: {
		totalGeneratedToday: number;
		activeUsersToday: number;
		totalUsers: number;
	};
}
