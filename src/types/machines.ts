export type MachineOptionCategory =
	| 'power'
	| 'lens'
	| 'software'
	| 'axis'
	| 'operation';

export interface MachineOption {
	id: string;
	machineId: string;
	category: MachineOptionCategory;
	value: string;
	order: number;
	status: 'ativo' | 'inativo';
	createdAt: string;
	updatedAt: string;
}

export interface MachineOptions {
	power: MachineOption[];
	lens: MachineOption[];
	software: MachineOption[];
	axis: MachineOption[];
	operation: MachineOption[];
}

export interface Machine {
	id: string;
	name: string;
	description: string | null;
	order: number;
	status: 'ativo' | 'inativo';
	createdBy: string | null;
	createdAt: string;
	updatedAt: string;
	options: MachineOptions;
}

export interface CustomerMachine {
	customerId: string;
	machineId: string;
	powerOptionId: string | null;
	lensOptionId: string | null;
	softwareOptionId: string | null;
	axisOptionId: string | null;
	operationOptionId: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateMachinePayload {
	name: string;
	description?: string;
	order?: number;
	status?: string;
}

export interface UpdateMachinePayload {
	name?: string;
	description?: string;
	order?: number;
	status?: string;
}

export interface CreateMachineOptionPayload {
	category: MachineOptionCategory;
	value: string;
	order?: number;
	status?: string;
}

export interface UpdateMachineOptionPayload {
	value?: string;
	order?: number;
	status?: string;
}

export interface SaveCustomerMachinePayload {
	machineId: string;
	powerOptionId?: string;
	lensOptionId?: string;
	softwareOptionId?: string;
	axisOptionId?: string;
	operationOptionId?: string;
}
