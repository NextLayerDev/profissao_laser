'use client';

import { Briefcase } from 'lucide-react';
import Link from 'next/link';

const TYPE_STYLES: Record<string, string> = {
	PEDIDO: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
	PARCERIA:
		'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
	FORNECEDOR:
		'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

const OPPORTUNITIES = [
	{
		type: 'PEDIDO',
		description: 'Producao de 200 brindes personalizados em acrilico',
		location: 'Sao Paulo, SP',
		price: 'R$ 3.500',
	},
	{
		type: 'PARCERIA',
		description: 'Parceria para producao de convites em MDF cortado a laser',
		location: 'Curitiba, PR',
		price: 'Negociavel',
	},
	{
		type: 'FORNECEDOR',
		description: 'Chapas de MDF 3mm com preco de distribuidora',
		location: 'Nacional',
		price: 'Atacado',
	},
];

export function CommunityOpportunities() {
	return (
		<div className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<Briefcase className="w-4 h-4 text-violet-500" />
					<h3 className="text-sm font-bold text-slate-900 dark:text-white">
						Oportunidades
					</h3>
				</div>
				<Link
					href="/course/comunity"
					className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-500 font-medium transition-colors"
				>
					Ver todas
				</Link>
			</div>

			<div className="space-y-0 divide-y divide-slate-100 dark:divide-white/5">
				{OPPORTUNITIES.map((opp, idx) => (
					<div
						key={opp.description}
						className={`${idx === 0 ? '' : 'pt-3'} ${idx === OPPORTUNITIES.length - 1 ? '' : 'pb-3'}`}
					>
						<div className="flex items-center gap-2 mb-1.5">
							<span
								className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded tracking-wider ${TYPE_STYLES[opp.type]}`}
							>
								{opp.type}
							</span>
						</div>
						<p className="text-sm text-slate-700 dark:text-gray-300 leading-snug mb-1">
							{opp.description}
						</p>
						<div className="flex items-center justify-between">
							<span className="text-[11px] text-slate-400 dark:text-gray-500">
								{opp.location}
							</span>
							<span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
								{opp.price}
							</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
