'use client';

import { Flame, Lock, Users } from 'lucide-react';
import Link from 'next/link';
import type { CustomerFeatures, FeatureUpgradeTiers } from '@/types/classes';

interface CommunityCardProps {
	features: CustomerFeatures | null;
	upgradeTiers: FeatureUpgradeTiers | null;
}

export function CommunityCard({ features, upgradeTiers }: CommunityCardProps) {
	return (
		<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl p-5">
			<div className="flex items-center gap-3 mb-4">
				<div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
					<Flame className="w-5 h-5" />
				</div>
				<div>
					<h3 className="font-semibold text-slate-900 dark:text-white">
						Comunidade
					</h3>
					<p className="text-xs text-slate-500 dark:text-gray-500">
						{features?.comunidade
							? 'Conecte-se com profissionais'
							: upgradeTiers?.comunidade
								? `Disponível no plano ${upgradeTiers.comunidade}`
								: 'Faça upgrade para acessar'}
					</p>
				</div>
			</div>
			{features?.comunidade ? (
				<Link
					href="/comunity"
					className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-violet-600 hover:opacity-90 text-white font-semibold py-2.5 rounded-xl transition-all text-sm shadow-[0_0_15px_rgba(108,56,255,0.25)]"
				>
					<Users className="w-5 h-5" />
					Acessar comunidade
				</Link>
			) : (
				<div className="w-full flex items-center justify-center gap-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-gray-500 font-medium py-2.5 rounded-xl text-sm cursor-not-allowed">
					<Lock className="w-5 h-5" />
					{upgradeTiers?.comunidade
						? `Plano ${upgradeTiers.comunidade}`
						: 'Bloqueado'}
				</div>
			)}
		</div>
	);
}
