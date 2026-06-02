'use client';

import { ArrowLeft, ClipboardList, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ParameterGridCard } from '@/components/parametros/parameter-grid-card';
import { PageHeader } from '@/components/ui/page-header';
import { useMySubmissions } from '@/hooks/use-parameters';
import type { LaserParameter } from '@/types/parameters';

/* ------------------------------------------------------------------ */
/*  Status badge                                                       */
/* ------------------------------------------------------------------ */

const STATUS_BADGE: Record<
	NonNullable<LaserParameter['status']>,
	{ label: string; className: string }
> = {
	pending: {
		label: 'Em análise',
		className:
			'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
	},
	approved: {
		label: 'Aprovado',
		className:
			'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
	},
	rejected: {
		label: 'Rejeitado',
		className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
	},
};

/* ------------------------------------------------------------------ */
/*  View                                                               */
/* ------------------------------------------------------------------ */

export function MySubmissionsView() {
	const { data, isLoading } = useMySubmissions();
	const submissions = data?.data ?? [];

	return (
		<div className="relative">
			<Link
				href="/course/parametros"
				className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400"
			>
				<ArrowLeft className="h-4 w-4" />
				Voltar para Parâmetros
			</Link>

			<PageHeader
				title="Minhas submissões"
				subtitle="Acompanhe o status dos parâmetros que você enviou para análise."
				icon={ClipboardList}
			/>

			{isLoading ? (
				<div className="flex justify-center py-20">
					<Loader2 className="h-8 w-8 animate-spin text-violet-500" />
				</div>
			) : submissions.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-gray-500">
					<ClipboardList className="mb-3 h-12 w-12 opacity-40" />
					<p className="text-sm font-medium">
						Você ainda não enviou parâmetros
					</p>
					<p className="mt-1 text-xs text-slate-400">
						Envie uma receita em Parâmetros para vê-la aqui.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{submissions.map((p) => {
						const badge = STATUS_BADGE[p.status ?? 'pending'];
						return (
							<div key={p.id} className="flex flex-col gap-2">
								<div className="flex items-center justify-between gap-2">
									<span
										className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}
									>
										{badge.label}
									</span>
								</div>
								<ParameterGridCard parameter={p} />
								{p.status === 'rejected' && p.reviewNote ? (
									<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
										<span className="font-semibold">Motivo:</span>{' '}
										{p.reviewNote}
									</div>
								) : null}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
