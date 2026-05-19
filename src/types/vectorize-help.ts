export type VectorizeHelpIcon =
	| 'play'
	| 'zap'
	| 'image'
	| 'help-circle'
	| 'book-open'
	| 'lightbulb'
	| 'video'
	| 'file-text'
	| 'layers'
	| 'target';

export type VectorizeHelpType = 'text' | 'video';

export interface VectorizeHelpItem {
	id: string;
	title: string;
	description: string;
	icon: VectorizeHelpIcon;
	type: VectorizeHelpType;
	content: string | null;
	videoUrl: string | null;
	order: number;
	active: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface CreateVectorizeHelpPayload {
	title: string;
	description: string;
	icon: VectorizeHelpIcon;
	type: VectorizeHelpType;
	content?: string;
	videoUrl?: string;
	order?: number;
	active?: boolean;
}

export interface UpdateVectorizeHelpPayload {
	title?: string;
	description?: string;
	icon?: VectorizeHelpIcon;
	type?: VectorizeHelpType;
	content?: string;
	videoUrl?: string;
	order?: number;
	active?: boolean;
}
