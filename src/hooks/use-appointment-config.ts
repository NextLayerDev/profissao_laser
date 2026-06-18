'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
	addDayOff,
	addHoliday,
	addRecurringBlock,
	deleteDayOff,
	deleteHoliday,
	deleteRecurringBlock,
	getGlobalConfig,
	getTechSchedule,
	listDaysOff,
	listHolidays,
	listRecurringBlocks,
	updateGlobalConfig,
	upsertTechSchedule,
} from '@/services/appointment-config';
import type {
	CreateDayOffPayload,
	CreateHolidayPayload,
	CreateRecurringBlockPayload,
	UpdateGlobalConfigPayload,
	UpsertTechnicianSchedulePayload,
} from '@/types/appointment-config';

const GLOBAL_KEY = ['appointment-config', 'global'] as const;
const HOLIDAYS_KEY = ['appointment-config', 'holidays'] as const;
const daysOffKey = (technicianId?: string, from?: string, to?: string) =>
	['appointment-config', 'days-off', technicianId, from, to] as const;
const techScheduleKey = (technicianId: string) =>
	['appointment-config', 'technician', technicianId] as const;

// Invalida tudo que possa derivar de uma config (slot picker inclusive).
function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
	qc.invalidateQueries({ queryKey: ['appointment-config'] });
	qc.invalidateQueries({ queryKey: ['appointments', 'available-slots'] });
}

export function useGlobalConfig() {
	return useQuery({
		queryKey: GLOBAL_KEY,
		queryFn: getGlobalConfig,
	});
}

export function useUpdateGlobalConfig() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: UpdateGlobalConfigPayload) =>
			updateGlobalConfig(payload),
		onSuccess: () => {
			invalidateAll(qc);
			toast.success('Config atualizada!');
		},
		onError: () => toast.error('Erro ao salvar config'),
	});
}

export function useHolidays() {
	return useQuery({
		queryKey: HOLIDAYS_KEY,
		queryFn: listHolidays,
	});
}

export function useAddHoliday() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateHolidayPayload) => addHoliday(payload),
		onSuccess: () => {
			invalidateAll(qc);
			toast.success('Feriado adicionado!');
		},
		onError: () => toast.error('Erro ao adicionar feriado'),
	});
}

export function useDeleteHoliday() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteHoliday(id),
		onSuccess: () => {
			invalidateAll(qc);
			toast.success('Feriado removido');
		},
		onError: () => toast.error('Erro ao remover feriado'),
	});
}

export function useDaysOff(params?: {
	technicianId?: string;
	from?: string;
	to?: string;
}) {
	return useQuery({
		queryKey: daysOffKey(params?.technicianId, params?.from, params?.to),
		queryFn: () => listDaysOff(params),
	});
}

export function useAddDayOff() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateDayOffPayload) => addDayOff(payload),
		onSuccess: () => {
			invalidateAll(qc);
			toast.success('Folga registrada!');
		},
		onError: () => toast.error('Erro ao registrar folga'),
	});
}

export function useDeleteDayOff() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteDayOff(id),
		onSuccess: () => {
			invalidateAll(qc);
			toast.success('Folga removida');
		},
		onError: () => toast.error('Erro ao remover folga'),
	});
}

const recurringBlocksKey = (technicianId?: string, weekday?: string) =>
	['appointment-config', 'recurring-blocks', technicianId, weekday] as const;

export function useRecurringBlocks(params?: {
	technicianId?: string;
	weekday?: string;
}) {
	return useQuery({
		queryKey: recurringBlocksKey(params?.technicianId, params?.weekday),
		queryFn: () => listRecurringBlocks(params),
	});
}

export function useAddRecurringBlock() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateRecurringBlockPayload) =>
			addRecurringBlock(payload),
		onSuccess: () => {
			invalidateAll(qc);
			toast.success('Bloqueio recorrente adicionado!');
		},
		onError: (e) =>
			toast.error(
				e instanceof Error ? e.message : 'Erro ao adicionar bloqueio',
			),
	});
}

export function useDeleteRecurringBlock() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteRecurringBlock(id),
		onSuccess: () => {
			invalidateAll(qc);
			toast.success('Bloqueio removido');
		},
		onError: () => toast.error('Erro ao remover bloqueio'),
	});
}

export function useTechSchedule(technicianId: string | null) {
	return useQuery({
		queryKey: techScheduleKey(technicianId ?? ''),
		queryFn: () => getTechSchedule(technicianId as string),
		enabled: !!technicianId,
	});
}

export function useUpsertTechSchedule(technicianId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: UpsertTechnicianSchedulePayload) =>
			upsertTechSchedule(technicianId, payload),
		onSuccess: () => {
			invalidateAll(qc);
			toast.success('Horário do técnico atualizado!');
		},
		onError: () => toast.error('Erro ao salvar horário do técnico'),
	});
}
