'use client';

import Image from 'next/image';
import { useCommunityStats } from '@/hooks/use-community';

function formatStat(value: number | undefined): string {
	if (value == null) return '\u2014';
	return `+${value.toLocaleString('pt-BR')}`;
}

export function CourseFooter() {
	const { data: stats } = useCommunityStats();

	const items = [
		{ value: stats?.activeMembers, label: 'membros ativos' },
		{ value: stats?.completedProjects, label: 'projetos compartilhados' },
		{ value: stats?.messagesSent, label: 'mensagens trocadas' },
		{ value: stats?.livesRealized, label: 'lives realizadas' },
	];

	return (
		<footer className="relative border-t border-slate-200 dark:border-white/5 mt-8 pt-8 pb-6">
			{/* Subtle background gradient */}
			<div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-600/[0.02] to-violet-600/[0.04] dark:via-violet-600/[0.03] dark:to-violet-600/[0.05] pointer-events-none" />

			<div className="relative">
				{/* CTA + Stats */}
				<div className="flex flex-col gap-6 mb-6">
					<div>
						<p className="text-base font-bold text-slate-900 dark:text-white">
							Participe, ajude e cresca junto!
						</p>
						<p className="text-sm text-slate-500 dark:text-gray-500 mt-0.5">
							A comunidade cresce com a contribuicao de cada membro
						</p>
					</div>

					<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
						{items.map((stat) => (
							<div key={stat.label} className="text-center">
								<p className="text-lg font-bold text-slate-900 dark:text-white">
									{formatStat(stat.value)}
								</p>
								<p className="text-[11px] text-slate-500 dark:text-gray-500">
									{stat.label}
								</p>
							</div>
						))}
					</div>
				</div>

				{/* Logo + Copyright */}
				<div className="pt-4 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between">
					<Image
						src="/img/header_prof-laser.png"
						alt="Profissao Laser"
						width={100}
						height={28}
						className="h-auto opacity-50 dark:opacity-30"
					/>
					<p className="text-xs text-slate-400 dark:text-gray-500">
						Comunidade Profissao Laser
					</p>
				</div>
			</div>
		</footer>
	);
}
