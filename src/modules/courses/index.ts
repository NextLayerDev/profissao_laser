export { CourseContentSection } from './components/course-content-section';
export { CoursesAdminSection } from './components/courses-admin-section';

export {
	adminCoursesQueryKey,
	coursesQueryKey,
	useAdminCourses,
	useCourses,
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
	useReorderCourseModules,
	useUpdateCourseModule,
} from './hooks/use-course-modules';
export {
	lessonMaterialsQueryKey,
	useDeleteMaterial,
	useLessonMaterials,
	useUploadLessonMaterial,
} from './hooks/use-lesson-materials';
export {
	moduleLessonsQueryKey,
	useCreateLesson,
	useDeleteLesson,
	useModuleLessons,
	useReorderLessons,
	useUpdateLesson,
	useUploadLessonVideo,
} from './hooks/use-lessons';
export {
	lessonQuizQueryKey,
	useAttemptQuiz,
	useCreateLessonQuiz,
	useCreateQuestion,
	useDeleteQuestion,
	useDeleteQuiz,
	useLessonQuiz,
	useUpdateQuestion,
} from './hooks/use-quizzes';

export {
	createCourse,
	deleteCourse,
	listAdminCourses,
	listCourses,
	updateCourse,
	uploadCourseImage,
} from './services/courses.service';
export {
	createLesson,
	deleteLesson,
	deleteMaterial,
	listLessonMaterials,
	listModuleLessons,
	reorderLessons,
	updateLesson,
	uploadLessonMaterial,
	uploadLessonVideo,
} from './services/lessons.service';
export {
	createCourseModule,
	deleteCourseModule,
	listCourseModules,
	reorderCourseModules,
	updateCourseModule,
} from './services/modules.service';
export {
	attemptLessonQuiz,
	createLessonQuiz,
	createQuestion,
	deleteQuestion,
	deleteQuiz,
	getLessonQuiz,
	updateQuestion,
} from './services/quizzes.service';

export type {
	Course,
	CourseDetail,
	CourseDetailPlan,
	CourseDetailTool,
	CreateCoursePayload,
	UpdateCoursePayload,
} from './types/courses';
export {
	courseDetailSchema,
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
export type { Material } from './types/materials';
export { materialSchema } from './types/materials';
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
export type {
	CreateQuestionPayload,
	CreateQuizPayload,
	Quiz,
	QuizAttemptAnswer,
	QuizAttemptResult,
	QuizOption,
	QuizQuestion,
	UpdateQuestionPayload,
} from './types/quizzes';
export {
	createQuestionSchema,
	createQuizSchema,
	quizAttemptResultSchema,
	quizQuestionSchema,
	quizSchema,
	updateQuestionSchema,
} from './types/quizzes';
