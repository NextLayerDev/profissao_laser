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
	crossHatch?: number | null;
	angle?: number | null;
	passesFill?: number | null;
	defocus?: number | null;
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

export interface ParameterMaterial {
	id: string;
	name: string;
	type: string;
	commonThicknesses?: string[] | null;
}
