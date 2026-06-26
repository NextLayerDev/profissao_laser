import type { LucideIcon } from 'lucide-react';

export interface NavItem {
	name: string;
	icon: LucideIcon;
	href: string;
	hasDropdown: boolean;
	/**
	 * Id da seção (topologia do ADMIN — ver `ADMIN_SECTIONS` em
	 * `tool-categories.ts`) onde o item mora na sidebar colapsável. Opcional e
	 * aditivo: itens sem `section` caem numa seção default na sidebar.
	 */
	section?: string;
}
