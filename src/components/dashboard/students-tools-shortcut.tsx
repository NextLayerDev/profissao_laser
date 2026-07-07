'use client';

import { ArrowRight, type LucideIcon, Pen, Users2 } from 'lucide-react';
import Link from 'next/link';
import { useStudents } from '@/hooks/use-students';
import { usePermissions } from '@/modules/access';

interface ShortcutCard {
	key: string;
	href: string;
	label: string;
	value: string;
	icon: LucideIcon;
	iconBg: string;
	gradient: string;
	decorColor: string;
}

export function StudentsToolsShortcut() {
	const { can } = usePermissions();
	const canAlunos = can('alunos.view');
	const canFerramentas = can('ferramentas.view');

	const { data, isLoading } = useStudents({ page: 1, limit: 1 });

	if (!canAlunos && !canFerramentas) return null;

	const cards: ShortcutCard[] = [
		canAlunos
			? {
					key: 'alunos',
					href: '/alunos',
					label: 'Alunos',
					value: isLoading ? '...' : String(data?.total ?? 0),
					icon: Users2,
					iconBg: 'bg-amber-600',
					gradient:
						'from-amber-100 to-white dark:from-amber-600/30 dark:to-[#1a1a1d]',
					decorColor: 'text-amber-400',
				}
			: null,
		canFerramentas
			? {
					key: 'vetorizacao',
					href: '/vetorizacao-admin',
					label: 'Vetorização',
					value: 'Suporte',
					icon: Pen,
					iconBg: 'bg-emerald-600',
					gradient:
						'from-emerald-100 to-white dark:from-emerald-600/30 dark:to-[#1a1a1d]',
					decorColor: 'text-emerald-400',
				}
			: null,
	].filter((c): c is ShortcutCard => c !== null);

	return (
		<div>
			<h3 className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-4">
				Atalhos
			</h3>
			<div className="grid grid-cols-2 gap-4">
				{cards.map((card) => (
					<Link
						key={card.key}
						href={card.href}
						className={`group relative overflow-hidden bg-linear-to-br ${card.gradient} rounded-2xl p-4 border border-slate-200 dark:border-gray-800/50 hover:border-slate-300 dark:hover:border-gray-700 transition-all duration-300 shadow-sm dark:shadow-none`}
					>
						<div className="flex items-start justify-between mb-3">
							<span className="text-xs text-slate-600 dark:text-gray-400">
								{card.label}
							</span>
							<div className={`${card.iconBg} p-2 rounded-lg shrink-0`}>
								<card.icon className="w-4 h-4 text-white" />
							</div>
						</div>
						<div className="flex items-end justify-between gap-2">
							<span className="text-xl font-bold text-slate-900 dark:text-white truncate">
								{card.value}
							</span>
							<ArrowRight className="w-4 h-4 text-slate-400 dark:text-gray-600 shrink-0 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
						</div>
						<card.icon
							className={`absolute -bottom-3 -right-3 w-16 h-16 ${card.decorColor} opacity-10`}
							aria-hidden="true"
						/>
					</Link>
				))}
			</div>
		</div>
	);
}
