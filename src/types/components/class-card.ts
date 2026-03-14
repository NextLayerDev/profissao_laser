import type { ClassWithProducts } from '@/types/classes';
import type { SystemClassWithRelations } from '@/types/system-classes';

export interface ClassCardProps {
	cls: ClassWithProducts;
	onEdit: (cls: ClassWithProducts) => void;
	systemClasses?: SystemClassWithRelations[];
}
