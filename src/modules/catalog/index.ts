export {
	catalogQueryKeys,
	useCoursePlans,
	usePublicCourse,
	usePublicCourses,
} from './hooks/use-catalog';
export {
	productsQueryKey,
	useCreateProduct,
	useDeleteProduct,
	useDuplicateProduct,
	useProducts,
	useUpdateProduct,
	useUploadProductImage,
} from './hooks/use-products';
export {
	getPublicCourse,
	listCoursePlans,
	listPublicCourses,
} from './services/catalog.service';
export {
	type CreateProductPayload,
	createProduct,
	deleteProduct,
	getProducts,
	type UpdateProductPayload,
	updateProduct,
	updateProductStatus,
	uploadProductImage,
} from './services/products.service';
export type {
	CoursePlan,
	PublicCourse,
	PublicCourseDetail,
} from './types/catalog';
export {
	catalogCoursePlanSchema,
	coursePlanSchema,
	publicCourseDetailSchema,
	publicCourseSchema,
} from './types/catalog';
export { type Product, productSchema } from './types/products';
