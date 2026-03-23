'use client';

import { Gift, Globe, Link2, Plus } from 'lucide-react';
import { useState } from 'react';
import { Header } from '@/components/dashboard/header';
import { CreateGlobalPromoLinkModal } from '@/components/links/create-global-promo-link-modal';
import { GlobalPromoLinksTable } from '@/components/links/global-promo-links-table';
import { PaymentLinksTable } from '@/components/links/payment-links-table';
import { PromoLinksTable } from '@/components/links/promo-links-table';

type Tab = 'payment' | 'promo' | 'global';

export default function LinksPage() {
	const [activeTab, setActiveTab] = useState<Tab>('payment');
	const [showCreateGlobal, setShowCreateGlobal] = useState(false);

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] text-slate-900 dark:text-white font-sans">
			<Header />

			<main className="px-8 py-6">
				<div className="mb-6">
					<h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
						Links
					</h2>
					<p className="text-slate-600 dark:text-gray-400 mt-1">
						Gerencie seus links de pagamento, promocionais e globais.
					</p>
				</div>

				{/* Tabs */}
				<div className="flex items-center gap-2 mb-6">
					<button
						type="button"
						onClick={() => setActiveTab('payment')}
						className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
							activeTab === 'payment'
								? 'bg-violet-600 text-white'
								: 'bg-white dark:bg-[#1a1a1d] text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700 hover:text-slate-900 dark:hover:text-white shadow-sm dark:shadow-none'
						}`}
					>
						<Link2 className="w-4 h-4" />
						Links de Pagamento
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('promo')}
						className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
							activeTab === 'promo'
								? 'bg-violet-600 text-white'
								: 'bg-white dark:bg-[#1a1a1d] text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700 hover:text-slate-900 dark:hover:text-white shadow-sm dark:shadow-none'
						}`}
					>
						<Gift className="w-4 h-4" />
						Links Promocionais
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('global')}
						className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
							activeTab === 'global'
								? 'bg-violet-600 text-white'
								: 'bg-white dark:bg-[#1a1a1d] text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700 hover:text-slate-900 dark:hover:text-white shadow-sm dark:shadow-none'
						}`}
					>
						<Globe className="w-4 h-4" />
						Links Globais
					</button>
				</div>

				{/* Content */}
				<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm dark:shadow-none">
					{activeTab === 'payment' && <PaymentLinksTable />}
					{activeTab === 'promo' && <PromoLinksTable />}
					{activeTab === 'global' && (
						<>
							<div className="flex items-center justify-end px-4 pt-4">
								<button
									type="button"
									onClick={() => setShowCreateGlobal(true)}
									className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors"
								>
									<Plus className="w-4 h-4" />
									Criar Link Global
								</button>
							</div>
							<GlobalPromoLinksTable />
						</>
					)}
				</div>
			</main>

			{showCreateGlobal && (
				<CreateGlobalPromoLinkModal
					onClose={() => setShowCreateGlobal(false)}
				/>
			)}
		</div>
	);
}
