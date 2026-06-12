'use client';

import {
	BookOpen,
	CalendarCog,
	FileText,
	Headphones,
	MessageSquare,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '@/components/dashboard/header';
import { FAQAdminSection } from '@/components/duvidas-admin/faq-admin-section';
import { KBAdminSection } from '@/components/duvidas-admin/kb-admin-section';
import { AppointmentConfigSection } from '@/components/suporte/appointment-config-section';
import { SuporteAdminView } from '@/components/suporte/suporte-admin-view';
import { SuporteQuickBooking } from '@/components/suporte/suporte-quick-booking';
import { SupportChatAdmin } from '@/components/suporte/support-chat-admin';
import { useAdminPendings } from '@/hooks/use-admin-pendings';
import { usePermissions } from '@/modules/access';

type Tab = 'chamados' | 'chat-online' | 'faq' | 'kb' | 'agendamentos';

const TABS: { key: Tab; label: string; icon: typeof Headphones }[] = [
	{ key: 'chamados', label: 'Chamados', icon: Headphones },
	{ key: 'chat-online', label: 'Chat ao vivo', icon: MessageSquare },
	{ key: 'faq', label: 'FAQ', icon: BookOpen },
	{ key: 'kb', label: 'Base de Conhecimento', icon: FileText },
	{ key: 'agendamentos', label: 'Agendamentos', icon: CalendarCog },
];

export default function SuportePage() {
	const router = useRouter();
	const { can, isLoading } = usePermissions();
	const allowed = can('suporte.view');
	const [activeTab, setActiveTab] = useState<Tab>('chamados');
	const { unreadCount, liveWaiting, ticketsPending } =
		useAdminPendings(allowed);

	/** Pendências por aba — staff vê de cara onde precisa agir. */
	const tabBadges: Partial<Record<Tab, number>> = {
		chamados: ticketsPending,
		'chat-online': unreadCount + liveWaiting,
	};

	useEffect(() => {
		if (!isLoading && !allowed) {
			router.replace('/dashboard');
		}
	}, [allowed, isLoading, router]);

	if (isLoading || !allowed) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-slate-600 dark:text-gray-400">A carregar...</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen text-slate-900 dark:text-white">
			<Header />

			{/* Hero quick-booking */}
			<div className="shrink-0 px-4 md:px-8 pt-4">
				<SuporteQuickBooking />
			</div>

			{/* Tabs */}
			<div className="shrink-0 px-4 md:px-8 pt-2 border-b border-slate-200 dark:border-white/10">
				<div className="flex gap-1 overflow-x-auto">
					{TABS.map((tab) => {
						const Icon = tab.icon;
						const badge = tabBadges[tab.key] ?? 0;
						return (
							<button
								key={tab.key}
								type="button"
								onClick={() => setActiveTab(tab.key)}
								className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-all border-b-2 -mb-px ${
									activeTab === tab.key
										? 'text-violet-600 dark:text-violet-400 border-violet-500 bg-transparent'
										: 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
								}`}
							>
								<Icon className="w-4 h-4" />
								{tab.label}
								{badge > 0 && (
									<span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white leading-none">
										{badge > 99 ? '99+' : badge}
									</span>
								)}
							</button>
						);
					})}
				</div>
			</div>

			{activeTab === 'chamados' && <SuporteAdminView />}
			{activeTab === 'chat-online' && (
				<div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
					<SupportChatAdmin />
				</div>
			)}
			{activeTab === 'faq' && (
				<div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
					<FAQAdminSection />
				</div>
			)}
			{activeTab === 'kb' && (
				<div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
					<KBAdminSection />
				</div>
			)}
			{activeTab === 'agendamentos' && <AppointmentConfigSection />}
		</div>
	);
}
