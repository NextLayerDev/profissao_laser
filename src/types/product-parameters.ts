export interface ParameterLesson {
	id: string;
	title: string;
	videoUrl: string;
	duration: number | null;
}

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
	notes: string | null;
	powerWatts?: number | null;
	lens?: string | null;
	software?: string | null;
	line?: number | null;
	crossHatch?: number | null;
	angle?: number | null;
	passesFill?: number | null;
	defocus?: number | null;
	createdAt: string;
	updatedAt: string;
}

export interface ProductParameter {
	id: string;
	productId: string;
	variantId: string | null;
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
	machine: string;
	powerWatts: number;
	lens: string;
	software: string;
	material: string;
	mode: string;
	speed: number;
	power: number;
	frequency: number;
	line: number;
	crossHatch: number;
	angle: number;
	passes: number;
	passesFill: number;
	notes?: string;
	defocus?: number;
	gas?: boolean;
	materialType?: string;
	thickness?: string;
}

export interface CreateProductParameterPayload {
	machineId: string;
	variantId?: string | null;
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
	variantId?: string | null;
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
