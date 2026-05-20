import { api } from '@/lib/fetch';
import type {
	CreateProductParameterPayload,
	LaserParameter,
	ParameterLesson,
	ParameterLookupParams,
	ParameterLookupResult,
	ProductParameter,
	UpdateProductParameterPayload,
} from '@/types/product-parameters';

// ─── Normalizador snake_case → camelCase ────────────────────────────────────

// biome-ignore lint/suspicious/noExplicitAny: raw API response
function normalizeParameter(raw: any): LaserParameter {
	return {
		id: raw.id,
		material: raw.material ?? '',
		materialType: raw.material_type ?? raw.materialType ?? null,
		thickness: raw.thickness ?? null,
		power: raw.power ?? 0,
		speed: raw.speed ?? 0,
		frequency: raw.frequency ?? 0,
		passes: raw.passes ?? 0,
		mode: raw.mode ?? '',
		gas: raw.gas ?? null,
		notes: raw.notes ?? null,
		powerWatts: raw.power_watts ?? raw.powerWatts ?? null,
		lens: raw.lens ?? null,
		software: raw.software ?? null,
		line: raw.line ?? null,
		crossHatch: raw.cross_hatch ?? raw.crossHatch ?? null,
		angle: raw.angle ?? null,
		passesFill: raw.passes_fill ?? raw.passesFill ?? null,
		defocus: raw.defocus ?? null,
		createdAt: raw.created_at ?? raw.createdAt ?? '',
		updatedAt: raw.updated_at ?? raw.updatedAt ?? '',
	};
}

// biome-ignore lint/suspicious/noExplicitAny: raw API response
function normalizeLesson(raw: any): ParameterLesson | null {
	if (!raw) return null;
	return {
		id: raw.id,
		title: raw.title ?? '',
		videoUrl: raw.video_url ?? raw.videoUrl ?? '',
		duration: raw.duration ?? null,
	};
}

// biome-ignore lint/suspicious/noExplicitAny: raw API response
function normalizeProductParameter(raw: any): ProductParameter {
	return {
		id: raw.id,
		productId: raw.product_id ?? raw.productId ?? '',
		variantId: raw.variant_id ?? raw.variantId ?? null,
		machineId: raw.machine_id ?? raw.machineId ?? '',
		parameterId: raw.parameter_id ?? raw.parameterId ?? '',
		powerOptionId: raw.power_option_id ?? raw.powerOptionId ?? null,
		lensOptionId: raw.lens_option_id ?? raw.lensOptionId ?? null,
		softwareOptionId: raw.software_option_id ?? raw.softwareOptionId ?? null,
		axisOptionId: raw.axis_option_id ?? raw.axisOptionId ?? null,
		operationOptionId: raw.operation_option_id ?? raw.operationOptionId ?? null,
		lessonId: raw.lesson_id ?? raw.lessonId ?? null,
		createdAt: raw.created_at ?? raw.createdAt ?? '',
		updatedAt: raw.updated_at ?? raw.updatedAt ?? '',
		parameter: raw.parameter
			? normalizeParameter(raw.parameter)
			: ({} as LaserParameter),
		lesson: normalizeLesson(raw.lesson),
	};
}

// biome-ignore lint/suspicious/noExplicitAny: raw API response
function normalizeLookup(raw: any): ParameterLookupResult {
	return {
		association: normalizeProductParameter(raw.association ?? raw),
		parameter: normalizeParameter(
			raw.parameter ?? raw.association?.parameter ?? {},
		),
		lesson: normalizeLesson(raw.lesson ?? raw.association?.lesson),
	};
}

// ─── CRUD ───────────────────────────────────────────────────────────────────

export async function getProductParameters(
	productId: string,
): Promise<ProductParameter[]> {
	const { data } = await api.get(`/laser-products/${productId}/parameters`);
	return Array.isArray(data) ? data.map(normalizeProductParameter) : [];
}

export async function createProductParameter(
	productId: string,
	payload: CreateProductParameterPayload,
): Promise<ProductParameter> {
	const { data } = await api.post(
		`/laser-products/${productId}/parameters`,
		payload,
	);
	return normalizeProductParameter(data);
}

export async function updateProductParameter(
	productId: string,
	assocId: string,
	payload: UpdateProductParameterPayload,
): Promise<ProductParameter> {
	const { data } = await api.patch(
		`/laser-products/${productId}/parameters/${assocId}`,
		payload,
	);
	return normalizeProductParameter(data);
}

export async function deleteProductParameter(
	productId: string,
	assocId: string,
): Promise<void> {
	await api.delete(`/laser-products/${productId}/parameters/${assocId}`);
}

// ─── Lookup ─────────────────────────────────────────────────────────────────

export async function lookupProductParameter(
	productId: string,
	params?: ParameterLookupParams,
): Promise<ParameterLookupResult | null> {
	try {
		const { data } = await api.get(
			`/laser-products/${productId}/parameter-lookup`,
			{ params },
		);
		return normalizeLookup(data);
	} catch (err: unknown) {
		const status = (err as { response?: { status?: number } })?.response
			?.status;
		if (status === 404) return null;
		throw err;
	}
}
