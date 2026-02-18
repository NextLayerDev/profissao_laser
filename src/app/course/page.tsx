'use client';

import { ArrowRight, BookOpen, Loader2, PackageX, Store } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import { getCurrentUser } from '@/lib/auth';

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
	ativo: 'Ativo',
	inactive: 'Inativo',
	canceled: 'Cancelado',
	cancelado: 'Cancelado',
	past_due: 'Pagamento pendente',
	trialing: 'Em teste',
};

export default function CoursePage() {
	const [email, setEmail] = useState<string | null | undefined>(undefined);
	const [name, setName] = useState<string>('');

	useEffect(() => {
		const user = getCurrentUser();
		setEmail(user?.email ?? null);
		setName(user?.name ?? '');
	}, []);

	const { data: plans, isLoading, isError } = useCustomerPlans(email ?? null);

	if (email === undefined || isLoading) {
		return (
			<div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
				<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	if (email === null) {
		return (
			<div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
				<div className="text-center">
					<BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
					<p className="text-gray-400 font-medium">Você não está logado</p>
					<Link
						href="/login"
						className="mt-4 inline-block px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
					>
						Fazer login
					</Link>
				</div>
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
				<div className="max-w-3xl mx-auto flex items-center justify-between">
					<div className="flex items-center gap-3">
						<BookOpen className="w-6 h-6 text-violet-400" />
						<div>
							<h1 className="text-xl font-bold">Meus Cursos</h1>
							<p className="text-sm text-gray-500 mt-0.5">{name || email}</p>
						</div>
					</div>
					<Link
						href="/store"
						className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
					>
						<Store className="w-4 h-4" />
						Ver loja
					</Link>
				</div>
			</header>

			<main className="px-8 py-8 max-w-3xl mx-auto">
				{!plans || plans.length === 0 ? (
					<div className="bg-[#1a1a1d] border border-gray-800 rounded-2xl p-16 text-center">
						<BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
						<p className="text-gray-400 text-lg font-medium">
							Nenhum curso encontrado
						</p>
						<p className="text-gray-600 text-sm mt-2 mb-6">
							Você ainda não possui nenhum curso ativo.
						</p>
						<Link
							href="/store"
							className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
						>
							<Store className="w-4 h-4" />
							Conhecer cursos
						</Link>
					</div>
				) : (
					<div className="space-y-4">
						<p className="text-gray-500 text-sm">
							{plans.length} curso{plans.length !== 1 ? 's' : ''} disponíve
							{plans.length !== 1 ? 'is' : 'l'}
						</p>

						{plans.map((plan) => {
							const statusStyle =
								STATUS_STYLES[plan.status] ?? 'bg-gray-700 text-gray-400';
							const statusLabel = STATUS_LABELS[plan.status] ?? plan.status;
							const cardClass =
								'bg-[#1a1a1d] border rounded-2xl p-6 flex items-center gap-5 transition-all duration-200';

							const inner = (
								<>
									<div className="w-14 h-14 bg-violet-600/20 rounded-xl flex items-center justify-center shrink-0">
										<BookOpen className="w-6 h-6 text-violet-400" />
									</div>

									<div className="flex-1 min-w-0">
										<h2 className="font-semibold text-white text-lg truncate">
											{plan.product_name}
										</h2>
										<span
											className={`inline-block mt-1 text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle}`}
										>
											{statusLabel}
										</span>
									</div>

									<ArrowRight className="w-5 h-5 text-gray-600 shrink-0" />
								</>
							);

							return plan.slug ? (
								<Link
									key={plan.id}
									href={`/course/${plan.slug}`}
									className={`${cardClass} border-gray-800 hover:border-violet-500/40 hover:bg-[#1f1f22] cursor-pointer`}
								>
									{inner}
								</Link>
							) : (
								<div
									key={plan.id}
									className={`${cardClass} border-gray-800 opacity-60 cursor-not-allowed`}
								>
									{inner}
								</div>
							);
						})}
					</div>
				)}
			</main>
		</div>
	);
}
