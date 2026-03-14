import type { SystemClassWithRelations } from '@/types/system-classes';

export interface SystemClassAssociationsModalProps {
	isOpen: boolean;
	onClose: () => void;
	systemClass: SystemClassWithRelations;
}
