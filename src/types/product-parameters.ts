export interface ParameterLesson {
	id: string;
	title: string;
	videoUrl: string;
	duration: number | null;
}

export interface LaserParameter {
	id: string;
	material: string;
	materialType: string;
	thickness: string;
	power: number;
	speed: number;
	frequency: number;
	passes: number;
	mode: string;
	gas: string | null;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface ProductParameter {
	id: string;
	productId: string;
	machineId: string;
	parameterId: string;
	powerOptionId: string | null;
	lensOptionId: string | null;
	softwareOptionId: string | null;
	axisOptionId: string | null;
	operationOptionId: string | null;
	lessonId: string | null;
	createdAt: string;
	updatedAt: string;
	parameter: LaserParameter;
	lesson: ParameterLesson | null;
}

export interface ParameterLookupResult {
	association: ProductParameter;
	parameter: LaserParameter;
	lesson: ParameterLesson | null;
}

export interface InlineParameterPayload {
	material: string;
	materialType: string;
	thickness: string;
	power: number;
	speed: number;
	frequency: number;
	passes: number;
	mode: string;
	gas?: string;
	notes?: string;
}

export interface CreateProductParameterPayload {
	machineId: string;
	parameterId?: string;
	parameter?: InlineParameterPayload;
	powerOptionId?: string;
	lensOptionId?: string;
	softwareOptionId?: string;
	axisOptionId?: string;
	operationOptionId?: string;
	lessonId?: string;
}

export interface UpdateProductParameterPayload {
	machineId?: string;
	parameterId?: string;
	parameter?: InlineParameterPayload;
	powerOptionId?: string | null;
	lensOptionId?: string | null;
	softwareOptionId?: string | null;
	axisOptionId?: string | null;
	operationOptionId?: string | null;
	lessonId?: string | null;
}

export interface ParameterLookupParams {
	machineId?: string;
	powerOptionId?: string;
	lensOptionId?: string;
	softwareOptionId?: string;
	axisOptionId?: string;
	operationOptionId?: string;
}
