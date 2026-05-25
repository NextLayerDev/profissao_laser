'use client';

import { ArrowLeft, Layers } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '@/components/dashboard/header';
import {
	PlanCoursesSection,
	PlanToolsSection,
	usePlanDetails,
} from '@/modules/plans';

export default function PlanoDetalhe() {
	const { id } = useParams<{ id: string }>();
	const { data, isLoading, error } = usePlanDetails(id);

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />

			<main className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
				<Link
					href="/products"
					className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6"
				>
					<ArrowLeft className="w-4 h-4" />
					Voltar ao catálogo
				</Link>

				{isLoading ? (
					<div className="flex justify-center py-20">
						<div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
					</div>
				) : error || !data ? (
					<div className="text-center py-20">
						<Layers className="w-10 h-10 text-slate-400 mx-auto mb-4" />
						<p className="text-slate-600 dark:text-gray-400 font-medium">
							{error ? 'Erro ao carregar plano' : 'Plano não encontrado'}
						</p>
					</div>
				) : (
					<>
						<div className="mb-8">
							<div className="flex items-center gap-3">
								<h1 className="text-2xl font-bold tracking-tight">
									{data.plan.name}
								</h1>
								<span
									className={`text-xs px-2 py-1 rounded-md ${
										data.plan.published
											? 'bg-emerald-500/15 text-emerald-600'
											: 'bg-slate-500/15 text-slate-500'
									}`}
								>
									{data.plan.published ? 'Publicado' : 'Rascunho'}
								</span>
							</div>
							<p className="text-sm text-slate-500 font-mono mt-1">
								{data.plan.key}
							</p>
							{data.plan.description && (
								<p className="text-sm text-slate-600 dark:text-gray-400 mt-2">
									{data.plan.description}
								</p>
							)}
							{/* Preços do plano (provisionados no Stripe na criação) */}
							{(data.plan.price_monthly_cents != null ||
								data.plan.price_yearly_cents != null) && (
								<div className="flex items-center gap-4 mt-3">
									{data.plan.price_monthly_cents != null && (
										<span className="text-sm text-slate-700 dark:text-slate-300">
											<span className="text-slate-500 mr-1">Mensal</span>
											<span className="font-semibold tabular-nums">
												R$ {(data.plan.price_monthly_cents / 100).toFixed(2)}
											</span>
										</span>
									)}
									{data.plan.price_yearly_cents != null && (
										<span className="text-sm text-slate-700 dark:text-slate-300">
											<span className="text-slate-500 mr-1">Anual</span>
											<span className="font-semibold tabular-nums">
												R$ {(data.plan.price_yearly_cents / 100).toFixed(2)}
											</span>
										</span>
									)}
								</div>
							)}
						</div>

						<div className="space-y-10">
							<PlanToolsSection
								planId={data.plan.id}
								entitlements={data.tools}
							/>
							<PlanCoursesSection
								planId={data.plan.id}
								planKey={data.plan.key}
								courses={data.courses}
							/>
						</div>
					</>
				)}
			</main>
		</div>
	);
}
