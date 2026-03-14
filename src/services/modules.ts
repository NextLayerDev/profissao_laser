import { Upload as TusUpload } from 'tus-js-client';
import { api } from '@/lib/fetch';
import type {
	CreateLessonPayload,
	CreateModulePayload,
	Lesson,
	Module,
	UpdateLessonPayload,
	UpdateModulePayload,
} from '@/types/modules';

export type {
	CreateLessonPayload,
	CreateModulePayload,
	Lesson,
	Module,
	UpdateLessonPayload,
	UpdateModulePayload,
};

export async function getModules(productId: string): Promise<Module[]> {
	const { data } = await api.get(`/module/${productId}`);
	return data;
}

export async function getLessons(moduleId: string): Promise<Lesson[]> {
	const { data } = await api.get(`/module/${moduleId}/lessons`);
	return data;
}

export async function createModule(
	payload: CreateModulePayload,
): Promise<Module> {
	const { data } = await api.post('/module', payload);
	return data;
}

export async function updateModule(
	id: string,
	payload: UpdateModulePayload,
): Promise<Module> {
	const { data } = await api.put(`/module/${id}`, payload);
	return data;
}

export async function deleteModule(id: string): Promise<void> {
	await api.delete(`/module/${id}`);
}

export async function createLesson(
	payload: CreateLessonPayload,
): Promise<Lesson> {
	const { data } = await api.post('/lesson', payload);
	return data;
}

export async function updateLesson(
	id: string,
	payload: UpdateLessonPayload,
): Promise<Lesson> {
	const { data } = await api.put(`/lesson/${id}`, payload);
	return data;
}

export async function deleteLesson(id: string): Promise<void> {
	await api.delete(`/lesson/${id}`);
}

export async function reorderModules(
	productId: string,
	moduleIds: string[],
): Promise<void> {
	await api.patch('/module/reorder', { productId, moduleIds });
}

export async function reorderLessons(
	moduleId: string,
	lessonIds: string[],
): Promise<void> {
	await api.patch('/lesson/reorder', { moduleId, lessonIds });
}

export async function uploadLessonVideo(
	id: string,
	file: File,
	onProgress?: (percent: number) => void,
): Promise<Lesson> {
	// Step 1: Obter credenciais BunnyCDN do backend
	const { data: presigned } = await api.post(
		`/lesson/${id}/video/presigned-url`,
		{ filename: file.name },
	);
	const { videoId, tusEndpoint, authSignature, authExpire, libraryId } =
		presigned as {
			videoId: string;
			tusEndpoint: string;
			authSignature: string;
			authExpire: number;
			libraryId: string;
		};

	// Step 2: Upload via TUS para BunnyCDN
	await new Promise<void>((resolve, reject) => {
		const upload = new TusUpload(file, {
			endpoint: tusEndpoint,
			retryDelays: [0, 3000, 5000, 10000, 20000],
			storeFingerprintForResuming: false,
			removeFingerprintOnSuccess: true,
			headers: {
				AuthorizationSignature: authSignature,
				AuthorizationExpire: String(authExpire),
				VideoId: videoId,
				LibraryId: libraryId,
			},
			metadata: {
				filetype: file.type,
				title: file.name,
			},
			onError: (error) => {
				console.error('[TUS] Upload error:', error);
				reject(error);
			},
			onProgress: (bytesUploaded, bytesTotal) => {
				if (bytesTotal) {
					const percent = Math.round((bytesUploaded / bytesTotal) * 100);
					onProgress?.(percent);
				}
			},
			onSuccess: () => resolve(),
		});
		upload.start();
	});

	// Step 3: Confirmar upload no backend e salvar videoUrl na aula
	const { data } = await api.patch(`/lesson/${id}/video/confirm`, { videoId });
	return data;
}
