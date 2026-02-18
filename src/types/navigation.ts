import type { LucideIcon } from 'lucide-react';

export interface NavItem {
	name: string;
	icon: LucideIcon;
	href: string;
	hasDropdown: boolean;
}
