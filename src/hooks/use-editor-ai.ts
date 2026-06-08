'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
	applyColor,
	editorAiGenerate,
	removeBackground,
} from '@/services/editor-ai';
import type {
	ApplyColorPayload,
	EditorAiPayload,
	RemoveBackgroundPayload,
} from '@/types/editor-ai';

export function useEditorAiGenerate() {
	return useMutation({
		mutationFn: (payload: EditorAiPayload) => editorAiGenerate(payload),
		onSuccess: () => toast.success('Imagem gerada!'),
		onError: () => toast.error('Erro ao gerar imagem'),
	});
}

export function useRemoveBackground() {
	return useMutation({
		mutationFn: (payload: RemoveBackgroundPayload) => removeBackground(payload),
		onSuccess: () => toast.success('Fundo removido!'),
		onError: () => toast.error('Erro ao remover fundo'),
	});
}

export function useApplyColor() {
	return useMutation({
		mutationFn: (payload: ApplyColorPayload) => applyColor(payload),
		onSuccess: () => toast.success('Cor aplicada!'),
		onError: () => toast.error('Erro ao aplicar cor'),
	});
}
