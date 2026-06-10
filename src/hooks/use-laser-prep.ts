'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { type LaserPrepParams, prepImage } from '@/services/gravacao-oneclick';

/**
 * Prepara a foto pra gravação a laser (motor `/api/laser-prep`).
 * Erros (incl. refund) são tratados pelo orquestrador `useRunTool`.
 */
export function useLaserPrep() {
	return useMutation({
		mutationFn: ({
			file,
			invocationId,
			params,
		}: {
			file: File;
			invocationId?: string;
			params: LaserPrepParams;
		}) => prepImage(file, { invocationId, params }),
		onSuccess: () => {
			toast.success('Imagem preparada com sucesso!');
		},
	});
}
