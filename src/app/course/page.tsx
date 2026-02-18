'use client';

import { ArrowRight, BookOpen, Loader2, PackageX } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import { db } from '@/lib/db';

const STATUS_STYLES: Record<string, string> = {
	active: 'bg-emerald-500/10 text-emerald-400',
	ativo: 'bg-emerald-500/10 text-emerald-400',
	inactive: 'bg-gray-700 text-gray-400',
	canceled: 'bg-red-500/10 text-red-400',
	cancelado: 'bg-red-500/10 text-red-400',
	past_due: 'bg-yellow-500/10 text-yellow-400',
	trialing: 'bg-blue-500/10 text-blue-400',
};

const STATUS_LABELS: Record<string, string> = {
	active: 'Ativo',
	inactive: 'Inativo',
	canceled: 'Cancelado',
	cancelado: 'Cancelado',
	past_due: 'Pagamento pendente',
	trialing: 'Em teste',
};

export default function CoursePage() {
	const [email, setEmail] = useState<string | null>(null);

	useEffect(() => {
		db.auth.getUser().then(({ data }) => {
			setEmail(data.user?.email ?? null);
		});
	}, []);

	const { data: plans, isLoading, isError } = useCustomerPlans(email);

	if (!email || isLoading) {
		return (
			<div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
				<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
				<div className="text-center">
					<PackageX className="w-12 h-12 text-red-400 mx-auto mb-4" />
					<p className="text-gray-400">Erro ao carregar seus cursos.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#0d0d0f] text-white font-sans">
			<header className="bg-[#1a1a1d] border-b border-gray-800 px-8 py-5">
				<div className="flex items-center gap-3">
					<BookOpen className="w-6 h-6 text-violet-400" />
					<h1 className="text-xl font-bold">Meus Cursos</h1>
				</div>
				<p className="text-sm text-gray-500 mt-1">{email}</p>
			</header>

			<main className="px-8 py-8 max-w-4xl mx-auto">
				{!plans || plans.length === 0 ? (
					<div className="bg-[#1a1a1d] border border-gray-800 rounded-xl p-16 text-center">
						<BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
						<p className="text-gray-400 text-lg font-medium">
							Nenhum curso encontrado
						</p>
						<p className="text-gray-600 text-sm mt-2">
							Você ainda não possui nenhum curso ativo.
						</p>
					</div>
				) : (
					<div className="space-y-4">
						<p className="text-gray-400 text-sm">
							{plans.length} curso{plans.length !== 1 ? 's' : ''} disponíve
							{plans.length !== 1 ? 'is' : 'l'}
						</p>

						{plans.map((plan) => {
							const statusStyle =
								STATUS_STYLES[plan.status] ?? 'bg-gray-700 text-gray-400';
							const statusLabel = STATUS_LABELS[plan.status] ?? plan.status;

							return (
								<div
									key={plan.id}
									className="bg-[#1a1a1d] border border-gray-800 rounded-xl p-6 flex items-center gap-5"
								>
									<div className="w-14 h-14 bg-violet-600/20 rounded-xl flex items-center justify-center shrink-0">
										<BookOpen className="w-6 h-6 text-violet-400" />
									</div>

									<div className="flex-1 min-w-0">
										<h2 className="font-semibold text-white text-lg truncate">
											{plan.product_name}
										</h2>
										<p className="text-xs text-gray-500 mt-0.5 font-mono">
											{plan.id}
										</p>
									</div>

									<span
										className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full ${statusStyle}`}
									>
										{statusLabel}
									</span>

									<Link
										href={`/course/${plan.slug}`}
										className="shrink-0 flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
									>
										Acessar
										<ArrowRight className="w-4 h-4" />
									</Link>
								</div>
							);
						})}
					</div>
				)}
			</main>
		</div>
	);
}
