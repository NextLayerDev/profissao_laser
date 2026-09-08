'use client';

import {
	CalendarDays,
	ClipboardList,
	FolderOpen,
	GraduationCap,
	Radio,
	Settings,
	Users,
	Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/dashboard/header';
import { useMentorCohorts } from '@/modules/mentoria/hooks';
import {
	Card,
	cohortStatusBadge,
	EmptyState,
	formatDate,
	PageTitle,
	Spinner,
} from './_components/ui';

const SECTIONS = [
	{
		href: '/mentoria-admin/turmas',
		icon: Users,
		title: 'Turmas',
		description: 'Criar turmas, gerenciar mentores e matricular alunos.',
	},
	{
		href: '/mentoria-admin/encontros',
		icon: CalendarDays,
		title: 'Encontros',
		description: 'Templates dos 10 encontros da metodologia (versões).',
	},
	{
		href: '/mentoria-admin/formularios',
		icon: ClipboardList,
		title: 'Formulários',
		description: 'Form-builder do diagnóstico e exercícios.',
	},
	{
		href: '/mentoria-admin/ferramentas',
		icon: Wrench,
		title: 'Ferramentas',
		description: 'Catálogo de ferramentas por área da empresa.',
	},
	{
		href: '/mentoria-admin/materiais',
		icon: FolderOpen,
		title: 'Materiais',
		description: 'Arquivos e links de apoio, globais ou por turma.',
	},
	{
		href: '/mentoria-admin/lives',
		icon: Radio,
		title: 'Lives',
		description: 'Salas de transmissão ao vivo e credenciais OBS.',
	},
	{
		href: '/mentoria-admin/configuracoes',
		icon: Settings,
		title: 'Configurações',
		description: 'Pesos da fórmula de maturidade por área.',
	},
] as const;

export default function MentoriaAdminHubPage() {
	const cohorts = useMentorCohorts();

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />
			<main className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
				<PageTitle
					title="Mentoria 360°"
					description="Administração do programa de mentoria: turmas, metodologia, materiais e acompanhamento das empresas."
				/>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{SECTIONS.map((s) => (
						<Link key={s.href} href={s.href}>
							<Card className="p-5 h-full hover:border-violet-400 dark:hover:border-violet-500/50 transition-colors">
								<div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-3">
									<s.icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
								</div>
								<h3 className="font-semibold text-slate-900 dark:text-white">
									{s.title}
								</h3>
								<p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
									{s.description}
								</p>
							</Card>
						</Link>
					))}
				</div>

				<section className="mt-10">
					<div className="flex items-center gap-2 mb-4">
						<GraduationCap className="w-5 h-5 text-violet-600 dark:text-violet-400" />
						<h3 className="text-lg font-semibold text-slate-900 dark:text-white">
							Minhas turmas (mentor)
						</h3>
					</div>
					<Card>
						{cohorts.isLoading ? (
							<Spinner />
						) : cohorts.isError ? (
							<EmptyState message="Não foi possível carregar suas turmas." />
						) : !cohorts.data?.length ? (
							<EmptyState message="Você ainda não é mentor de nenhuma turma." />
						) : (
							<ul className="divide-y divide-slate-100 dark:divide-white/5">
								{cohorts.data.map((c) => (
									<li key={c.id}>
										<Link
											href={`/mentoria-admin/turmas/${c.id}`}
											className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
										>
											<div>
												<p className="font-medium text-slate-900 dark:text-white">
													{c.name}
												</p>
												<p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
													{formatDate(c.starts_at)} — {formatDate(c.ends_at)}
												</p>
											</div>
											<div className="flex items-center gap-3">
												{cohortStatusBadge(c.status)}
												<span className="text-sm text-violet-600 dark:text-violet-400">
													Ver dashboard →
												</span>
											</div>
										</Link>
									</li>
								))}
							</ul>
						)}
					</Card>
				</section>
			</main>
		</div>
	);
}
