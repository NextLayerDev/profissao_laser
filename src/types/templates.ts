export type TipoImagem = 'base' | 'exemplo' | 'referencia';
export type TemplateStatus = 'ativo' | 'inativo';

export interface Template {
	id: string;
	name: string;
	description?: string;
	categoryId?: string;
	tipoImagem: TipoImagem;
	imageUrl: string;
	canvasJson?: string;
	tags?: string[];
	width: number;
	height: number;
	status: TemplateStatus;
	createdBy?: string;
	createdAt: string;
	updatedAt: string;
}

export interface TemplatesResponse {
	data: Template[];
	total: number;
	page: number;
	limit: number;
}

export interface CreateTemplatePayload {
	name: string;
	description?: string;
	categoryId?: string;
	tipoImagem?: TipoImagem;
	imageUrl: string;
	canvasJson?: string;
	tags?: string[];
	width?: number;
	height?: number;
	status?: TemplateStatus;
}

export type UpdateTemplatePayload = Partial<CreateTemplatePayload>;

export interface CloneTemplatePayload {
	name?: string;
	notes?: string;
}
