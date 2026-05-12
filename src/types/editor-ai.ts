export type EditorAiMode = 'generate' | 'edit';

export interface EditorAiPayload {
	mode: EditorAiMode;
	prompt: string;
	image?: string;
	regionInfo?: { x: number; y: number; width: number; height: number };
	mask?: string;
}

export interface EditorAiResponse {
	imageBase64: string;
}

export interface RemoveBackgroundPayload {
	image: string;
}

export interface RemoveBackgroundResponse {
	imageBase64: string;
}

export interface ApplyColorPayload {
	image: string;
	targetColor: string;
}

export interface ApplyColorResponse {
	imageBase64: string;
}
