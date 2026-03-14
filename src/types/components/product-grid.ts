import type { ClassWithProducts } from '../classes';
import type { Product } from '../products';
import type { SystemClassWithRelations } from '../system-classes';

export interface ProductGridProps {
	products: Product[];
	isLoading: boolean;
	error: Error | null;
	/** Lista de classes (com produtos) para mostrar a qual classe cada produto pertence */
	classes?: ClassWithProducts[];
	/** Lista de system classes (com produtos) para mostrar a qual system class cada produto pertence */
	systemClasses?: SystemClassWithRelations[];
}
