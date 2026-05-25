export { CourseContentSection } from './components/course-content-section';
export { CoursesAdminSection } from './components/courses-admin-section';

export {
	adminCoursesQueryKey,
	useAdminCourses,
	useCreateCourse,
	useDeleteCourse,
	useUpdateCourse,
	useUploadCourseImage,
} from './hooks/use-admin-courses';
export {
	courseModulesQueryKey,
	useCourseModules,
	useCreateCourseModule,
	useDeleteCourseModule,
	useUpdateCourseModule,
} from './hooks/use-course-modules';
export {
	moduleLessonsQueryKey,
	useCreateLesson,
	useDeleteLesson,
	useModuleLessons,
	useUpdateLesson,
} from './hooks/use-lessons';

export {
	createCourse,
	deleteCourse,
	listAdminCourses,
	updateCourse,
	uploadCourseImage,
} from './services/courses.service';
export {
	createLesson,
	deleteLesson,
	listModuleLessons,
	updateLesson,
} from './services/lessons.service';
export {
	createCourseModule,
	deleteCourseModule,
	listCourseModules,
	updateCourseModule,
} from './services/modules.service';
export type {
	CatalogPlanItem,
	CatalogPlansResponse,
} from './types/course-catalog';
export {
	catalogPlanItemSchema,
	catalogPlansResponseSchema,
} from './types/course-catalog';
export type {
	Course,
	CreateCoursePayload,
	UpdateCoursePayload,
} from './types/courses';
export {
	courseSchema,
	createCourseSchema,
	updateCourseSchema,
} from './types/courses';
export type {
	CreateLessonPayload,
	Lesson,
	UpdateLessonPayload,
} from './types/lessons';
export {
	createLessonSchema,
	lessonSchema,
	updateLessonSchema,
} from './types/lessons';
export type {
	CourseModule,
	CreateCourseModulePayload,
	UpdateCourseModulePayload,
} from './types/modules';
export {
	courseModuleSchema,
	createCourseModuleSchema,
	updateCourseModuleSchema,
} from './types/modules';
