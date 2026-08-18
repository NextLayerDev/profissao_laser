import { z } from 'zod';
import { apiCourses } from '@/shared/lib/api-courses';

/**
 * Visão Aluno: staff/admin navega a área do aluno com tudo desbloqueado.
 *
 * O estado vive no SERVIDOR (coluna `users.student_preview_until`), não num
 * header por request nem no localStorage — assim ele sobrevive a F5, vale em
 * SSE e em `<img src>`, e chega até nas chamadas servidor-a-servidor que a main
 * API faz ao upvox (que não carregam header custom nenhum).
 */
export const studentPreviewSchema = z.object({
	active: z.boolean(),
	until: z.string().nullable(),
});
export type StudentPreview = z.infer<typeof studentPreviewSchema>;

/** Liga a prévia por `hours` horas (o backend aceita 1..24, default 4). */
export async function startStudentPreview(
	hours?: number,
): Promise<StudentPreview> {
	const { data } = await apiCourses.post(
		'/v1/me/student-preview',
		hours ? { hours } : {},
	);
	return studentPreviewSchema.parse(data);
}

/** Desliga a prévia. Idempotente. */
export async function stopStudentPreview(): Promise<StudentPreview> {
	const { data } = await apiCourses.delete('/v1/me/student-preview');
	return studentPreviewSchema.parse(data);
}
