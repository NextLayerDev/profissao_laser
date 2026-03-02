import type { ClassWithProducts } from '@/types/classes';

export interface CreateClassModalProps {
	isOpen: boolean;
	onClose: () => void;
	editing?: ClassWithProducts | null;
}
