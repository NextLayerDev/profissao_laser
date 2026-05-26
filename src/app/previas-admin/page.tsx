'use client';

import { Cpu, Eye, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '@/components/dashboard/header';
import { LaserProductsAdminView } from '@/components/previas/laser-products-admin-view';
import { MachinesAdminView } from '@/components/previas/machines-admin-view';
import { PreviasAdminView } from '@/components/previas/previas-admin-view';
import { usePermissions } from '@/hooks/use-permissions';

type Tab = 'catalogo' | 'uso' | 'maquinas';

const TABS: { key: Tab; label: string; icon: typeof Eye }[] = [
	{ key: 'catalogo', label: 'Catalogo', icon: Package },
	{ key: 'maquinas', label: 'Maquinas', icon: Cpu },
	{ key: 'uso', label: 'Uso', icon: Eye },
];

export default function PreviasAdminPage() {
	const router = useRouter();
	const { can, isLoading: permissionsLoading } = usePermissions();
	const allowed = can('previas.view');
	const [activeTab, setActiveTab] = useState<Tab>('catalogo');

	useEffect(() => {
		if (!permissionsLoading && !allowed) {
			router.replace('/dashboard');
		}
	}, [allowed, permissionsLoading, router]);

	if (permissionsLoading || !allowed) {
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
				<div className="flex items-center gap-4 mb-3">
					<Eye className="w-6 h-6 text-violet-400" />
					<h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
						Previas IA
					</h2>
				</div>
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

			{activeTab === 'catalogo' && (
				<div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
					<LaserProductsAdminView />
				</div>
			)}
			{activeTab === 'maquinas' && (
				<div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
					<MachinesAdminView />
				</div>
			)}
			{activeTab === 'uso' && (
				<div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
					<PreviasAdminView />
				</div>
			)}
		</div>
	);
}
