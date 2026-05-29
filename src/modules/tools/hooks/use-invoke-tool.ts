'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { invokeTool } from '../services/tools.service';

export function useInvokeTool() {
	return useMutation({
		mutationFn: ({
			toolKey,
			courseSlug,
		}: {
			toolKey: string;
			courseSlug: string;
		}) => invokeTool(toolKey, courseSlug),
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao executar a ferramenta')),
	});
}
