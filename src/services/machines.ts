import { api } from '@/lib/fetch';
import type {
	CreateMachineOptionPayload,
	CreateMachinePayload,
	CustomerMachine,
	Machine,
	MachineOption,
	MachineOptions,
	SaveCustomerMachinePayload,
	UpdateMachineOptionPayload,
	UpdateMachinePayload,
} from '@/types/machines';

// ─── Normalizador snake_case → camelCase ────────────────────────────────────

const OPTION_CATEGORIES: (keyof MachineOptions)[] = [
	'power',
	'lens',
	'software',
	'axis',
	'operation',
];

const EMPTY_OPTIONS: MachineOptions = {
	power: [],
	lens: [],
	software: [],
	axis: [],
	operation: [],
};

// biome-ignore lint/suspicious/noExplicitAny: raw API response
function normalizeOption(raw: any): MachineOption {
	return {
		id: raw.id,
		machineId: raw.machine_id ?? raw.machineId ?? '',
		category: raw.category,
		value: raw.value,
		order: raw.order ?? 0,
		status: raw.status ?? 'ativo',
		createdAt: raw.created_at ?? raw.createdAt ?? '',
		updatedAt: raw.updated_at ?? raw.updatedAt ?? '',
	};
}

// biome-ignore lint/suspicious/noExplicitAny: raw API response
function normalizeMachine(raw: any): Machine {
	const options = { ...EMPTY_OPTIONS };
	if (raw.options && typeof raw.options === 'object') {
		for (const cat of OPTION_CATEGORIES) {
			if (Array.isArray(raw.options[cat])) {
				options[cat] = raw.options[cat].map(normalizeOption);
			}
		}
	}
	return {
		id: raw.id,
		name: raw.name,
		description: raw.description ?? null,
		order: raw.order ?? 0,
		status: raw.status ?? 'ativo',
		createdBy: raw.created_by ?? raw.createdBy ?? null,
		createdAt: raw.created_at ?? raw.createdAt ?? '',
		updatedAt: raw.updated_at ?? raw.updatedAt ?? '',
		options,
	};
}

// biome-ignore lint/suspicious/noExplicitAny: raw API response
function normalizeCustomerMachine(raw: any): CustomerMachine {
	return {
		customerId: raw.customer_id ?? raw.customerId ?? '',
		machineId: raw.machine_id ?? raw.machineId ?? '',
		powerOptionId: raw.power_option_id ?? raw.powerOptionId ?? null,
		lensOptionId: raw.lens_option_id ?? raw.lensOptionId ?? null,
		softwareOptionId: raw.software_option_id ?? raw.softwareOptionId ?? null,
		axisOptionId: raw.axis_option_id ?? raw.axisOptionId ?? null,
		operationOptionId: raw.operation_option_id ?? raw.operationOptionId ?? null,
		createdAt: raw.created_at ?? raw.createdAt ?? '',
		updatedAt: raw.updated_at ?? raw.updatedAt ?? '',
	};
}

// ─── Machines CRUD ──────────────────────────────────────────────────────────

export async function getMachines(): Promise<Machine[]> {
	const { data } = await api.get('/machines');
	return Array.isArray(data) ? data.map(normalizeMachine) : [];
}

export async function getMachine(id: string): Promise<Machine> {
	const { data } = await api.get(`/machines/${id}`);
	return normalizeMachine(data);
}

export async function createMachine(
	payload: CreateMachinePayload,
): Promise<Machine> {
	const { data } = await api.post('/machines', payload);
	return normalizeMachine(data);
}

export async function updateMachine(
	id: string,
	payload: UpdateMachinePayload,
): Promise<Machine> {
	const { data } = await api.patch(`/machines/${id}`, payload);
	return normalizeMachine(data);
}

export async function deleteMachine(id: string): Promise<void> {
	await api.delete(`/machines/${id}`);
}

// ─── Machine Options ────────────────────────────────────────────────────────

export async function createMachineOption(
	machineId: string,
	payload: CreateMachineOptionPayload,
): Promise<MachineOption> {
	const { data } = await api.post(`/machines/${machineId}/options`, payload);
	return normalizeOption(data);
}

export async function updateMachineOption(
	machineId: string,
	optionId: string,
	payload: UpdateMachineOptionPayload,
): Promise<MachineOption> {
	const { data } = await api.patch(
		`/machines/${machineId}/options/${optionId}`,
		payload,
	);
	return normalizeOption(data);
}

export async function deleteMachineOption(
	machineId: string,
	optionId: string,
): Promise<void> {
	await api.delete(`/machines/${machineId}/options/${optionId}`);
}

// ─── Customer Machine ───────────────────────────────────────────────────────

export async function getCustomerMachine(): Promise<CustomerMachine | null> {
	try {
		const { data } = await api.get('/me/machine');
		return normalizeCustomerMachine(data);
	} catch (err: unknown) {
		const status = (err as { response?: { status?: number } })?.response
			?.status;
		if (status === 404) return null;
		throw err;
	}
}

export async function saveCustomerMachine(
	payload: SaveCustomerMachinePayload,
): Promise<CustomerMachine> {
	const { data } = await api.put('/me/machine', payload);
	return normalizeCustomerMachine(data);
}

export async function deleteCustomerMachine(): Promise<void> {
	await api.delete('/me/machine');
}
