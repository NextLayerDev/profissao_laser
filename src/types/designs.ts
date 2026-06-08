export interface Design {
	id: string;
	customerId: string;
	name: string;
	templateId?: string;
	canvasJson: string;
	thumbnailUrl?: string;
	width: number;
	height: number;
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

export interface DesignsResponse {
	data: Design[];
	total: number;
	page: number;
	limit: number;
}

export interface CreateDesignPayload {
	name: string;
	templateId?: string;
	canvasJson: string;
	width: number;
	height: number;
	notes?: string;
}

export interface UpdateDesignPayload {
	name?: string;
	canvasJson?: string;
	notes?: string;
}
