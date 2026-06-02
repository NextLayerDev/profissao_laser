export interface LaserParameter {
	id: string;
	material: string;
	materialType?: string | null;
	thickness?: string | null;
	power: number;
	speed: number;
	frequency: number;
	passes: number;
	mode: string;
	gas?: boolean | string | null;
	machine?: string | null;
	notes?: string | null;
	powerWatts?: number | null;
	lens?: string | null;
	software?: string | null;
	line?: number | null;
	crossHatch?: boolean | null;
	angle?: number | null;
	passesFill?: number | null;
	defocus?: number | null;
	// Software-specific (Ezcad / Lightburn)
	tamanhoLinha?: number | null;
	tamanhoDivisao?: number | null;
	sobreposicao?: number | null;
	forcarSeparacao?: boolean | null;
	axisRotative?: boolean | null;
	lineTypeId?: string | null;
	createdBy: string;
	createdByName?: string | null;
	isPublic: boolean;
	rating?: number | null;
	likesCount?: number;
	savesCount?: number;
	isSaved?: boolean;
	isLiked?: boolean;
	userRating?: number | null;
	createdAt: string;
	updatedAt: string;
	// Imagem + categoria (redesign)
	imageUrl?: string | null;
	category?: string | null;
	color?: string | null;
	// Multi-passada: parâmetro "pai" com N passadas (cada passada = um parâmetro)
	parentId?: string | null;
	passOrder?: number | null;
	isParent?: boolean;
	passCount?: number;
}

/** Parâmetro + suas passadas em ordem (pai = passada 1). */
export interface ParameterWithPasses extends Omit<LaserParameter, 'passes'> {
	passes: LaserParameter[];
}

/** Sidebar do redesign de Parâmetros. */
export interface ParameterSidebar {
	topContributors: {
		createdBy: string;
		name: string | null;
		count: number;
	}[];
	recentActivity: {
		id: string;
		material: string;
		createdByName: string | null;
		createdAt: string;
	}[];
	mostUsed: {
		id: string;
		material: string;
		imageUrl: string | null;
		likesCount: number;
	}[];
}

export interface ParametersResponse {
	data: LaserParameter[];
	total: number;
}

export interface ParameterStats {
	totalParameters: number;
	totalMachines: number;
	totalMaterials: number;
	totalContributors: number;
}

export interface ParameterMachine {
	id: string;
	brand: string;
	model: string;
}

/** Opção de vocabulário (Lente/Tipo/Categoria/Cor) para os dropdowns de filtro. */
export interface ParameterOption {
	id: string;
	dimension: string;
	value: string;
	order: number;
	status: string;
}

export interface ParameterMaterial {
	id: string;
	name: string;
	type: string;
	commonThicknesses?: string[] | null;
}
