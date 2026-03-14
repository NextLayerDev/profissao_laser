import type { SystemClassWithRelations } from '@/types/system-classes';

export interface SystemClassCardProps {
	systemClass: SystemClassWithRelations;
	onEdit: (sc: SystemClassWithRelations) => void;
	onManageAssociations: (sc: SystemClassWithRelations) => void;
}
