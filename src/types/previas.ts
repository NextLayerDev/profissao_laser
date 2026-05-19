export type PersonalizationType = 'logo' | 'text' | 'both';

export interface PreviaOptionItem {
	value: string;
	label: string;
}

export interface PreviaFontOption {
	value: string;
	label: string;
	family: string;
	category: string;
}

export interface PreviaRange {
	min: number;
	max: number;
}

export interface PreviaOptions {
	tamanho: PreviaOptionItem[];
	posicao: PreviaOptionItem[];
	intensidade: PreviaOptionItem[];
	profundidade: PreviaOptionItem[];
	tamanhoNome: PreviaOptionItem[];
	material: PreviaOptionItem[];
	estiloGravacao: PreviaOptionItem[];
	acabamentoSuperficie: PreviaOptionItem[];
	moldura: PreviaOptionItem[];
	posicaoTextoRelLogo: PreviaOptionItem[];
	espacamentoLogoTexto: PreviaOptionItem[];
	tipoVisualizacao: PreviaOptionItem[];
	anguloCamera: PreviaOptionItem[];
	iluminacao: PreviaOptionItem[];
	fundoCena: PreviaOptionItem[];
	orientacaoLogo: PreviaOptionItem[];
	orientacaoNome: PreviaOptionItem[];
	comNome: PreviaOptionItem[];
	fontes: PreviaFontOption[];
	ranges: Record<string, PreviaRange>;
}

export interface LaserSettings {
	tamanho: string;
	posicao: string;
	rotacao: number;
	intensidade: string;
	profundidade: string;
	comNome: string;
	nomePersonalizado: string;
	fonteFamilia: string;
	tamanhoNome: string;
	orientacaoLogo: string;
	orientacaoNome: string;
	material: string;
	estiloGravacao: string;
	acabamentoSuperficie: string;
	contraste: number;
	efeitoSombra: number;
	moldura: string;
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
	productVariantId: string;
	imagelogo_url?: string;
	personalizationType: PersonalizationType;
	customName?: string;
	instrucoesPersonalizadas?: string;
	modoLentes: boolean;
	textoLenteDireita?: string;
	textoLenteEsquerda?: string;
	name?: string;
	notes?: string;
	laserSettings: LaserSettings;
	useWatermark?: boolean;
	useCredits?: boolean;
}

export interface Watermark {
	customerId: string;
	imageUrl: string;
	createdAt: string;
	updatedAt: string;
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
