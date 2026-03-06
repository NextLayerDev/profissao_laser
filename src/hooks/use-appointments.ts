import {
	useMutation,
	useQueries,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';
import {
	createAppointment,
	deleteAppointment,
	getAppointments,
	getAppointmentsByCustomer,
	getAppointmentsByTechnician,
	getAvailableSlots,
	updateAppointmentStatus,
	updateAppointmentTechnician,
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

export function useAppointmentsByCustomer(customerId: string | null) {
	const {
		data: appointments,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['appointments', 'customer', customerId],
		queryFn: () => getAppointmentsByCustomer(customerId ?? ''),
		enabled: !!customerId,
	});
	return { appointments, isLoading, error };
}

export function useAvailableSlots(
	date: string | null,
	technicianId?: string | null,
) {
	const {
		data: slots,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['appointments', 'available-slots', date, technicianId ?? null],
		queryFn: () => getAvailableSlots(date ?? '', technicianId ?? undefined),
		enabled: !!date,
	});
	return { slots: slots ?? [], isLoading, error };
}

export function useAvailableSlotsForAnyTechnician(
	date: string | null,
	technicianIds: string[],
) {
	const results = useQueries({
		queries: technicianIds.map((techId) => ({
			queryKey: ['appointments', 'available-slots', date, techId],
			queryFn: () => getAvailableSlots(date ?? '', techId),
			enabled: !!date && technicianIds.length > 0,
		})),
	});

	const slotsSet = new Set<string>();
	const slotToTechnicianIds = new Map<string, string[]>();

	for (let i = 0; i < results.length; i++) {
		const techId = technicianIds[i];
		const techSlots = results[i].data ?? [];
		for (const slot of techSlots) {
			slotsSet.add(slot);
			const existing = slotToTechnicianIds.get(slot) ?? [];
			existing.push(techId);
			slotToTechnicianIds.set(slot, existing);
		}
	}

	const slots = Array.from(slotsSet).sort();
	const isLoading = results.some((r) => r.isLoading);
	const error = results.find((r) => r.error)?.error;

	return { slots, slotToTechnicianIds, isLoading, error };
}

export function useAppointmentsByTechnician(technicianId: string | null) {
	const {
		data: appointments,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['appointments', 'technician', technicianId],
		queryFn: () => getAppointmentsByTechnician(technicianId ?? ''),
		enabled: !!technicianId,
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

export function useUpdateAppointmentTechnician() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, technicianId }: { id: string; technicianId: string }) =>
			updateAppointmentTechnician(id, technicianId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['appointments'] });
		},
	});
}
