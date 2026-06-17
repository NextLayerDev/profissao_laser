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
						Financeiro
					</h2>
					<p className="text-slate-600 dark:text-gray-400 mt-1">
						Receita dos alunos, o repasse à plataforma (upvox) e quanto sobra
						pra empresa do curso.
					</p>
				</div>

				<FaturaView />
			</main>
		</div>
	);
}
