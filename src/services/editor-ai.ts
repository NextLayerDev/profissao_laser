import { api } from '@/shared/lib/fetch';
import type {
	ApplyColorPayload,
	ApplyColorResponse,
	EditorAiPayload,
	EditorAiResponse,
	RemoveBackgroundPayload,
	RemoveBackgroundResponse,
} from '@/types/editor-ai';

export async function editorAiGenerate(
	payload: EditorAiPayload,
): Promise<EditorAiResponse> {
	const { data } = await api.post<EditorAiResponse>('/editor/ai', payload);
	return data;
}

export async function removeBackground(
	payload: RemoveBackgroundPayload,
): Promise<RemoveBackgroundResponse> {
	const { data } = await api.post<RemoveBackgroundResponse>(
		'/editor/remove-background',
		payload,
	);
	return data;
}

export async function applyColor(
	payload: ApplyColorPayload,
): Promise<ApplyColorResponse> {
	const { data } = await api.post<ApplyColorResponse>(
		'/editor/apply-color',
		payload,
	);
	return data;
}
