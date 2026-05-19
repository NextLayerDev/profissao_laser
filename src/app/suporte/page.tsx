'use client';

import { BookOpen, FileText, Headphones } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '@/components/dashboard/header';
import { FAQAdminSection } from '@/components/duvidas-admin/faq-admin-section';
import { KBAdminSection } from '@/components/duvidas-admin/kb-admin-section';
import { SuporteAdminView } from '@/components/suporte/suporte-admin-view';
import { usePermissions } from '@/hooks/use-permissions';

type Tab = 'chamados' | 'faq' | 'kb';

const TABS: { key: Tab; label: string; icon: typeof Headphones }[] = [
	{ key: 'chamados', label: 'Chamados', icon: Headphones },
	{ key: 'faq', label: 'FAQ', icon: BookOpen },
	{ key: 'kb', label: 'Base de Conhecimento', icon: FileText },
];

export default function SuportePage() {
	const router = useRouter();
	const { canAdmin, isLoading } = usePermissions();
	const [activeTab, setActiveTab] = useState<Tab>('chamados');

	useEffect(() => {
		if (!isLoading && !canAdmin) {
			router.replace('/dashboard');
		}
	}, [canAdmin, isLoading, router]);

	if (isLoading || !canAdmin) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-slate-600 dark:text-gray-400">A carregar...</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen text-slate-900 dark:text-white">
			<Header />

			{/* Tabs */}
			<div className="shrink-0 px-4 md:px-8 pt-4 border-b border-slate-200 dark:border-white/10">
				<div className="flex gap-1">
					{TABS.map((tab) => {
						const Icon = tab.icon;
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
							</button>
						);
					})}
				</div>
			</div>

			{activeTab === 'chamados' && <SuporteAdminView />}
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
		</div>
	);
}
