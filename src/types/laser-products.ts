export interface LaserProduct {
	id: string;
	name: string;
	description: string | null;
	category: string;
	defaultMaterial: string | null;
	tags: string[];
	status: 'ativo' | 'inativo';
	createdBy: string | null;
	imageUrl: string | null;
	variants?: LaserProductVariant[];
	createdAt: string;
	updatedAt: string;
}

export interface LaserProductVariant {
	id: string;
	productId: string;
	name: string;
	colorName: string | null;
	colorHex: string | null;
	tipo: string | null;
	imageUrl: string;
	order: number;
	status: 'ativo' | 'inativo';
	createdAt: string;
	updatedAt: string;
}

export interface LaserProductsResponse {
	data: LaserProduct[];
	total: number;
	page: number;
	limit: number;
}

export interface LaserProductsParams {
	page?: number;
	limit?: number;
	category?: string;
	search?: string;
	status?: 'ativo' | 'inativo';
}

export interface CreateLaserProductPayload {
	name: string;
	description?: string;
	category: string;
	defaultMaterial?: string;
	tags?: string[];
	status?: 'ativo' | 'inativo';
	imageUrl?: string;
}

export interface UpdateLaserProductPayload {
	name?: string;
	description?: string | null;
	category?: string;
	defaultMaterial?: string | null;
	tags?: string[];
	status?: 'ativo' | 'inativo';
	imageUrl?: string | null;
}

export interface CreateLaserProductVariantPayload {
	name: string;
	colorName?: string;
	colorHex?: string;
	tipo?: string;
	imageUrl: string;
	order?: number;
	status?: 'ativo' | 'inativo';
}

export interface UpdateLaserProductVariantPayload {
	name?: string;
	colorName?: string | null;
	colorHex?: string | null;
	tipo?: string | null;
	imageUrl?: string;
	order?: number;
	status?: 'ativo' | 'inativo';
}
