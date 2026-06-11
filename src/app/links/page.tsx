'use client';

import { CalendarRange, Link2, Plus, Receipt, Users } from 'lucide-react';
import { useState } from 'react';
import { Header } from '@/components/dashboard/header';
import { AnnualLinksTable } from '@/components/links/annual-links-table';
import { CompanyInvoiceTab } from '@/components/links/company-invoice-tab';
import { CreateAnnualLinkModal } from '@/components/links/create-annual-link-modal';
import { CreatePlanLinkModal } from '@/components/links/create-plan-link-modal';
import { LinkSubscribersTable } from '@/components/links/link-subscribers-table';
import { PlanLinksTable } from '@/components/links/plan-links-table';

type Tab = 'links' | 'annual' | 'subscribers' | 'invoice';

const TABS: { id: Tab; label: string; Icon: typeof Link2 }[] = [
	{ id: 'links', label: 'Links de Plano', Icon: Link2 },
	{ id: 'annual', label: 'Links Anuais', Icon: CalendarRange },
	{ id: 'subscribers', label: 'Assinantes', Icon: Users },
	{ id: 'invoice', label: 'Fatura aberta', Icon: Receipt },
];

export default function LinksPage() {
	const [activeTab, setActiveTab] = useState<Tab>('links');
	const [showCreate, setShowCreate] = useState(false);
	const [showCreateAnnual, setShowCreateAnnual] = useState(false);

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />

			<main className="px-4 md:px-8 py-6">
				<div className="mb-6">
					<h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
						Links de Plano
					</h2>
					<p className="text-slate-600 dark:text-gray-400 mt-1">
						Links especiais: nos mensais quem abre escolhe o plano e paga o 1º
						mês a preço de custo; nos anuais o plano é fixo e o 1º ano sai pelo
						piso mensal × 12. O custo dos voxxys usados acumula na fatura
						aberta.
					</p>
				</div>

				{/* Tabs */}
				<div className="flex items-center justify-between mb-6 flex-wrap gap-3">
					<div className="flex items-center gap-2 flex-wrap">
						{TABS.map(({ id, label, Icon }) => (
							<button
								key={id}
								type="button"
								onClick={() => setActiveTab(id)}
								className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
									activeTab === id
										? 'bg-violet-600 text-white'
										: 'bg-white dark:bg-[#1a1a1d] text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700 hover:text-slate-900 dark:hover:text-white shadow-sm dark:shadow-none'
								}`}
							>
								<Icon className="w-4 h-4" />
								{label}
							</button>
						))}
					</div>
					{activeTab === 'links' && (
						<button
							type="button"
							onClick={() => setShowCreate(true)}
							className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors"
						>
							<Plus className="w-4 h-4" />
							Gerar Link
						</button>
					)}
					{activeTab === 'annual' && (
						<button
							type="button"
							onClick={() => setShowCreateAnnual(true)}
							className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors"
						>
							<Plus className="w-4 h-4" />
							Gerar Link Anual
						</button>
					)}
				</div>

				{/* Content */}
				<div className="bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-white/8 shadow-sm dark:shadow-none">
					{activeTab === 'links' && <PlanLinksTable />}
					{activeTab === 'annual' && <AnnualLinksTable />}
					{activeTab === 'subscribers' && <LinkSubscribersTable />}
					{activeTab === 'invoice' && <CompanyInvoiceTab />}
				</div>
			</main>

			{showCreate && (
				<CreatePlanLinkModal onClose={() => setShowCreate(false)} />
			)}
			{showCreateAnnual && (
				<CreateAnnualLinkModal onClose={() => setShowCreateAnnual(false)} />
			)}
		</div>
	);
}
