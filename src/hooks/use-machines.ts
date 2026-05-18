'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
	createMachine,
	createMachineOption,
	deleteCustomerMachine,
	deleteMachine,
	deleteMachineOption,
	getCustomerMachine,
	getMachine,
	getMachines,
	saveCustomerMachine,
	updateMachine,
	updateMachineOption,
} from '@/services/machines';
import type {
	CreateMachineOptionPayload,
	CreateMachinePayload,
	SaveCustomerMachinePayload,
	UpdateMachineOptionPayload,
	UpdateMachinePayload,
} from '@/types/machines';

const QUERY_KEY = ['machines'] as const;
const CUSTOMER_MACHINE_KEY = ['customer-machine'] as const;

// ─── Queries ────────────────────────────────────────────────────────────────

export function useMachines(enabled = true) {
	return useQuery({
		queryKey: QUERY_KEY,
		queryFn: getMachines,
		enabled,
	});
}

export function useMachine(id: string | null, enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'detail', id] as const,
		queryFn: () => {
			if (!id) throw new Error('ID required');
			return getMachine(id);
		},
		enabled: !!id && enabled,
	});
}

export function useCustomerMachine(enabled = true) {
	return useQuery({
		queryKey: CUSTOMER_MACHINE_KEY,
		queryFn: getCustomerMachine,
		enabled,
		retry: false,
	});
}

// ─── Machine Mutations ──────────────────────────────────────────────────────

export function useCreateMachine() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateMachinePayload) => createMachine(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			toast.success('Maquina criada!');
		},
		onError: () => toast.error('Erro ao criar maquina'),
	});
}

export function useUpdateMachine() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: UpdateMachinePayload;
		}) => updateMachine(id, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			toast.success('Maquina atualizada!');
		},
		onError: () => toast.error('Erro ao atualizar maquina'),
	});
}

export function useDeleteMachine() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteMachine(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			toast.success('Maquina excluida!');
		},
		onError: () => toast.error('Erro ao excluir maquina'),
	});
}

// ─── Machine Option Mutations ───────────────────────────────────────────────

export function useCreateMachineOption() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			machineId,
			payload,
		}: {
			machineId: string;
			payload: CreateMachineOptionPayload;
		}) => createMachineOption(machineId, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			toast.success('Opcao criada!');
		},
		onError: () => toast.error('Erro ao criar opcao'),
	});
}

export function useUpdateMachineOption() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			machineId,
			optionId,
			payload,
		}: {
			machineId: string;
			optionId: string;
			payload: UpdateMachineOptionPayload;
		}) => updateMachineOption(machineId, optionId, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			toast.success('Opcao atualizada!');
		},
		onError: () => toast.error('Erro ao atualizar opcao'),
	});
}

export function useDeleteMachineOption() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			machineId,
			optionId,
		}: {
			machineId: string;
			optionId: string;
		}) => deleteMachineOption(machineId, optionId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			toast.success('Opcao excluida!');
		},
		onError: () => toast.error('Erro ao excluir opcao'),
	});
}

// ─── Customer Machine Mutations ─────────────────────────────────────────────

export function useSaveCustomerMachine() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: SaveCustomerMachinePayload) =>
			saveCustomerMachine(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: CUSTOMER_MACHINE_KEY });
			toast.success('Maquina salva!');
		},
		onError: () => toast.error('Erro ao salvar maquina'),
	});
}

export function useDeleteCustomerMachine() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => deleteCustomerMachine(),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: CUSTOMER_MACHINE_KEY });
			toast.success('Maquina removida!');
		},
		onError: () => toast.error('Erro ao remover maquina'),
	});
}
