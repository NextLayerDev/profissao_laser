'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { CouponsTable } from '@/components/cupons/coupons-table';
import { CreateCouponModal } from '@/components/cupons/create-coupon-modal';
import { Header } from '@/components/dashboard/header';

export default function CuponsPage() {
	const [showCreate, setShowCreate] = useState(false);

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />

			<main className="px-4 md:px-8 py-6">
				<div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
					<div>
						<h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
							Cupons
						</h2>
						<p className="text-slate-600 dark:text-gray-400 mt-1">
							Descontos de % ou valor fixo no checkout de plano e de voxxys.
							Controle usos (total e por cliente), validade e veja os resgates.
						</p>
					</div>
					<button
						type="button"
						onClick={() => setShowCreate(true)}
						className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors"
					>
						<Plus className="w-4 h-4" />
						Novo cupom
					</button>
				</div>

				<div className="bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-white/8 shadow-sm dark:shadow-none">
					<CouponsTable />
				</div>
			</main>

			{showCreate && <CreateCouponModal onClose={() => setShowCreate(false)} />}
		</div>
	);
}
