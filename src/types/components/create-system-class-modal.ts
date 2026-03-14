import type { SystemClassWithRelations } from '@/types/system-classes';

export interface CreateSystemClassModalProps {
	isOpen: boolean;
	onClose: () => void;
	editing?: SystemClassWithRelations | null;
}
