import { getCourseBySlug } from '@/modules/courses/services/courses.service';
import { listModuleLessons } from '@/modules/courses/services/lessons.service';
import { listCourseModules } from '@/modules/courses/services/modules.service';
import type { Course } from '@/types/course';

/**
 * Monta a árvore da sala de aula a partir da upvox (`/v1`): meta do curso +
 * módulos + lições, mapeando snake_case → o tipo `Course` legado (camelCase)
 * que a sala de aula e os demais consumidores esperam.
 *
 * O módulo de cursos foi removido do main API na consolidação do gateway; o
 * conteúdo agora vive na upvox. Os uuids de curso/lição foram preservados na
 * migração, então progresso/salvos (servidos pelo main API) seguem casando
 * pelos mesmos ids.
 */
export async function getCourse(slug: string): Promise<Course> {
	const [course, modules] = await Promise.all([
		getCourseBySlug(slug),
		listCourseModules(slug),
	]);

	const modulesWithLessons = await Promise.all(
		modules
			.slice()
			.sort((a, b) => a.position - b.position)
			.map(async (m) => {
				const lessons = await listModuleLessons(m.id);
				return {
					id: m.id,
					title: m.title,
					description: m.description ?? null,
					order: m.position,
					lessons: lessons
						.slice()
						.sort((a, b) => a.position - b.position)
						.map((l) => ({
							id: l.id,
							title: l.title,
							description: l.description ?? null,
							videoUrl: l.video_playback_url ?? null,
							duration: l.duration_seconds ?? null,
							order: l.position,
							isFree: l.is_free,
						})),
				};
			}),
	);

	return {
		id: course.id,
		name: course.title,
		description: course.description ?? null,
		image: course.image_url ?? null,
		slug: course.slug,
		modules: modulesWithLessons,
	};
}
