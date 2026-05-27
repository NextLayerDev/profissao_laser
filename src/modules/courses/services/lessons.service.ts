import { Upload as TusUpload } from 'tus-js-client';
import { apiCourses as api } from '@/shared/lib/api-courses';
import {
	type CreateLessonPayload,
	type Lesson,
	lessonSchema,
	type UpdateLessonPayload,
} from '../types/lessons';

export async function listModuleLessons(moduleId: string): Promise<Lesson[]> {
	const { data } = await api.get(`/v1/module/${moduleId}/lessons`);
	return lessonSchema.array().parse(data);
}

export async function getLesson(id: string): Promise<Lesson> {
	const { data } = await api.get(`/v1/lesson/${id}`);
	return lessonSchema.parse(data);
}

export async function createLesson(
	payload: CreateLessonPayload,
): Promise<Lesson> {
	const { data } = await api.post('/v1/lesson', payload);
	return lessonSchema.parse(data);
}

export async function updateLesson(
	id: string,
	payload: UpdateLessonPayload,
): Promise<Lesson> {
	const { data } = await api.patch(`/v1/lesson/${id}`, payload);
	return lessonSchema.parse(data);
}

export async function deleteLesson(id: string): Promise<void> {
	await api.delete(`/v1/lesson/${id}`);
}

export async function uploadLessonVideo(
	id: string,
	file: File,
	onProgress?: (percent: number) => void,
): Promise<Lesson> {
	const { data: presigned } = await api.post(
		`/v1/lesson/${id}/video/upload-url`,
	);
	const {
		video_id: videoId,
		tus_endpoint: tusEndpoint,
		auth_signature: authSignature,
		auth_expire: authExpire,
		library_id: libraryId,
	} = presigned as {
		video_id: string;
		tus_endpoint: string;
		auth_signature: string;
		auth_expire: number;
		library_id: string;
	};

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
			onError: (error) => reject(error),
			onProgress: (bytesUploaded, bytesTotal) => {
				if (bytesTotal) {
					onProgress?.(Math.round((bytesUploaded / bytesTotal) * 100));
				}
			},
			onSuccess: () => resolve(),
		});
		upload.start();
	});

	const { data } = await api.patch(`/v1/lesson/${id}/video/confirm`, {});
	return lessonSchema.parse(data);
}
