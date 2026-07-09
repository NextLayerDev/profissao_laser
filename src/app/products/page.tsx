'use client';

import { BookOpen, Gift, Layers, Puzzle, Wrench } from 'lucide-react';
import { useState } from 'react';
import { Header } from '@/components/dashboard/header';
import { CoursesAdminSection } from '@/modules/courses';
import { FreeLessonsAdminSection } from '@/modules/lessons';
import { PlansAdminSection } from '@/modules/plans';
import { ToolsAdminSection } from '@/modules/tools';
import { VoxesAdminSection } from '@/modules/voxes';

type Tab = 'cursos' | 'voxes' | 'planos' | 'tools' | 'aulas-gratis';

interface TabDef {
	key: Tab;
	label: string;
	icon: typeof BookOpen;
	/** Tailwind classes para o estado ativo (gradient + sombra colorida). */
	activeClasses: string;
	/** Cor do ícone quando inativo, hint de domínio. */
	iconInactiveClass: string;
}

const TABS: TabDef[] = [
	{
		key: 'cursos',
		label: 'Cursos',
		icon: BookOpen,
		activeClasses:
			'bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/30',
		iconInactiveClass: 'text-sky-500',
	},
	{
		key: 'voxes',
		label: 'Voxxys',
		icon: Puzzle,
		activeClasses:
			'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30',
		iconInactiveClass: 'text-amber-500',
	},
	{
		key: 'planos',
		label: 'Planos',
		icon: Layers,
		activeClasses:
			'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30',
		iconInactiveClass: 'text-violet-500',
	},
	{
		key: 'tools',
		label: 'Funcionalidades',
		icon: Wrench,
		activeClasses:
			'bg-gradient-to-br from-emerald-500 to-cyan-600 text-white shadow-lg shadow-emerald-500/30',
		iconInactiveClass: 'text-emerald-500',
	},
	{
		key: 'aulas-gratis',
		label: 'Aulas Grátis',
		icon: Gift,
		activeClasses:
			'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/30',
		iconInactiveClass: 'text-rose-500',
	},
];

export default function Catalogo() {
	const [activeTab, setActiveTab] = useState<Tab>('cursos');

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />

			<main className="px-4 md:px-8 py-6">
				<div className="mb-6">
					<h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
						Catálogo
					</h2>
					<p className="text-slate-600 dark:text-gray-400 mt-1">
						Cursos, planos, voxxys e tools em um só lugar.
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2 mb-6">
					{TABS.map(
						({ key, label, icon: Icon, activeClasses, iconInactiveClass }) => {
							const isActive = activeTab === key;
							return (
								<button
									key={key}
									type="button"
									onClick={() => setActiveTab(key)}
									className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
										isActive
											? activeClasses
											: 'bg-white dark:bg-[#1a1a1d] text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700 hover:text-slate-900 dark:hover:text-white shadow-sm dark:shadow-none'
									}`}
								>
									<Icon
										className={`w-4 h-4 ${
											isActive ? 'text-white' : iconInactiveClass
										}`}
									/>
									{label}
								</button>
							);
						},
					)}
				</div>

				{activeTab === 'cursos' && <CoursesAdminSection />}
				{activeTab === 'voxes' && <VoxesAdminSection />}
				{activeTab === 'planos' && <PlansAdminSection />}
				{activeTab === 'tools' && <ToolsAdminSection />}
				{activeTab === 'aulas-gratis' && <FreeLessonsAdminSection />}
			</main>
		</div>
	);
}
