import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	createAppointment,
	deleteAppointment,
	getAppointments,
	updateAppointmentStatus,
} from '@/services/appointments';
import type { CreateAppointmentPayload } from '@/types/appointments';

export function useAppointments() {
	const {
		data: appointments,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['appointments'],
		queryFn: getAppointments,
	});
	return { appointments, isLoading, error };
}

export function useCreateAppointment() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateAppointmentPayload) =>
			createAppointment(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['appointments'] });
		},
	});
}

export function useUpdateAppointmentStatus() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, status }: { id: string; status: string }) =>
			updateAppointmentStatus(id, status),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['appointments'] });
		},
	});
}

export function useDeleteAppointment() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteAppointment(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['appointments'] });
		},
	});
}
