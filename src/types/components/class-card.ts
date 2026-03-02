import type { ClassWithProducts } from '@/types/classes';

export interface ClassCardProps {
	cls: ClassWithProducts;
	onEdit: (cls: ClassWithProducts) => void;
}
