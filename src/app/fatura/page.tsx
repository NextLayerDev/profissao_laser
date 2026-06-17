'use client';

import { Header } from '@/components/dashboard/header';
import { FaturaView } from '@/components/fatura/fatura-view';

export default function FaturaPage() {
	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />

			<main className="px-4 md:px-8 py-6">
				<div className="mb-6">
					<h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
						Fatura
					</h2>
					<p className="text-slate-600 dark:text-gray-400 mt-1">
						Tudo que a empresa deve à plataforma: 3,5% de cada assinatura, 100%
						do 1º período das compras por link, custo de plataforma dos usos de
						ferramenta e os voxxys doados pelos planos.
					</p>
				</div>

				<FaturaView />
			</main>
		</div>
	);
}
