'use client';

import {
	ArrowDownToLine,
	FileText,
	Lock,
	RefreshCw,
	RotateCcw,
	XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Header } from '@/components/dashboard/header';
import { VoxxysIcon } from '@/components/ui/voxxys-icon';
import { usePermissions } from '@/modules/access';
import {
	EntriesSection,
	FailedPaymentsSection,
	InvoicesSection,
	RefundsSection,
	SubscriptionsSection,
	VoxAnalyticsSection,
} from '@/modules/analytics';

type Tab =
	| 'entries'
	| 'subscriptions'
	| 'voxes'
	| 'invoices'
	| 'failed'
	| 'refunds';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
	{
		key: 'entries',
		label: 'Entradas',
		icon: <ArrowDownToLine className="w-4 h-4" />,
	},
	{
		key: 'subscriptions',
		label: 'Assinaturas',
		icon: <RefreshCw className="w-4 h-4" />,
	},
	{
		key: 'voxes',
		label: 'Voxxys',
		icon: <VoxxysIcon className="w-4 h-4" />,
	},
	{
		key: 'invoices',
		label: 'Faturas',
		icon: <FileText className="w-4 h-4" />,
	},
	{
		key: 'failed',
		label: 'Pagamentos falhos',
		icon: <XCircle className="w-4 h-4" />,
	},
	{
		key: 'refunds',
		label: 'Reembolsos',
		icon: <RotateCcw className="w-4 h-4" />,
	},
];

export default function VendasPage() {
	const { can, isLoading: permissionsLoading } = usePermissions();
	const allowed = can('vendas.view');

	const [activeTab, setActiveTab] = useState<Tab>('entries');

	if (permissionsLoading) return null;

	if (!allowed) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<Lock className="w-12 h-12 text-slate-400 dark:text-gray-600 mx-auto mb-4" />
					<p className="text-slate-600 dark:text-gray-400 font-medium mb-2">
						Você não tem permissão
					</p>
					<p className="text-sm text-slate-500 dark:text-gray-500 mb-4">
						Você não tem acesso à página de Vendas.
					</p>
					<Link
						href="/dashboard"
						className="inline-block px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
					>
						Voltar ao painel
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />

			<main className="px-4 md:px-8 py-6 space-y-6">
				<div>
					<h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
						Vendas
					</h2>
					<p className="text-slate-600 dark:text-gray-400 mt-1">
						Assinaturas recorrentes, vendas de voxxys e reembolsos em um só
						lugar.
					</p>
				</div>

				{/* Tabs */}
				<div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 rounded-2xl p-1 w-fit">
					{TABS.map(({ key, label, icon }) => (
						<button
							key={key}
							type="button"
							onClick={() => setActiveTab(key)}
							className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
								activeTab === key
									? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
									: 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
							}`}
						>
							{icon}
							{label}
						</button>
					))}
				</div>

				{activeTab === 'entries' && <EntriesSection />}
				{activeTab === 'subscriptions' && <SubscriptionsSection />}
				{activeTab === 'voxes' && <VoxAnalyticsSection />}
				{activeTab === 'invoices' && <InvoicesSection />}
				{activeTab === 'failed' && <FailedPaymentsSection />}
				{activeTab === 'refunds' && <RefundsSection />}
			</main>
		</div>
	);
}
