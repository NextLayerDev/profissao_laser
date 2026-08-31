'use client';

import {
	Activity,
	ArrowRight,
	BarChart3,
	BookOpen,
	Check,
	CheckSquare,
	ClipboardList,
	Compass,
	FileText,
	Heart,
	Link2,
	Lock,
	Radio,
	Sparkles,
	Target,
	TrendingUp,
	Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import { CompanyMapRadar } from '@/modules/mentoria/components/company-map-radar';
import {
	useCompanyMap,
	useGoals,
	useKpis,
	useMentoriaBootstrap,
	useMyMaterials,
	useTasks,
} from '@/modules/mentoria/hooks';
import type { MentoriaBootstrap } from '@/modules/mentoria/types';
import { CompanyForm } from './_components/company-form';
import {
	CARD,
	EmptyState,
	MntHeader,
	MntSkeleton,
	meetingStatusLabel,
} from './_components/shared';

export default function MentoriaHomePage() {
	return (
		<SubscriptionGate toolKey="mentoria_360">
			<HomeContent />
		</SubscriptionGate>
	);
}

function HomeContent() {
	const { data, isLoading } = useMentoriaBootstrap();

	if (isLoading) return <MntSkeleton />;

	if (!data?.journey) {
		return (
			<div className="p-4 md:p-8 max-w-3xl mx-auto">
				<MntHeader
					title="Mentoria 360°"
					subtitle="Profissão Laser 360° — sua empresa vista por inteiro"
					icon={Compass}
				/>
				<EmptyState
					title="Você ainda não está matriculado em uma turma de mentoria"
					description="Assim que sua matrícula for confirmada pela equipe, sua jornada de 10 encontros aparece aqui. Enquanto isso, adiante o cadastro da sua empresa abaixo."
				/>
				<div className="mt-6">
					<CompanyForm company={data?.company ?? null} />
				</div>
			</div>
		);
	}

	return <Dashboard bootstrap={data} journeyId={data.journey.id} />;
}

function Dashboard({
	bootstrap,
	journeyId,
}: {
	bootstrap: MentoriaBootstrap;
	journeyId: string;
}) {
	const { company, cohort, meetings, progress } = bootstrap;
	const { data: tasks } = useTasks(journeyId);
	const { data: goals } = useGoals(journeyId);
	const { data: kpis } = useKpis(journeyId);
	const { data: map } = useCompanyMap(journeyId);
	const { data: materials } = useMyMaterials();

	const tasksPending = (tasks ?? []).filter(
		(t) =>
			t.status === 'pending' ||
			t.status === 'in_progress' ||
			t.status === 'overdue',
	).length;
	const tasksDone = (tasks ?? []).filter((t) => t.status === 'done').length;
	const goalsActive = (goals ?? []).filter(
		(g) =>
			g.status === 'not_started' ||
			g.status === 'in_progress' ||
			g.status === 'late',
	).length;
	const kpisGreen = (kpis ?? []).filter(
		(k) => k.current_semaphore === 'green',
	).length;
	const kpisRed = (kpis ?? []).filter(
		(k) => k.current_semaphore === 'red',
	).length;

	const shortcuts = [
		{
			href: '/course/mentoria/diagnostico',
			label: 'Diagnóstico',
			desc: 'Raio-X inicial e Foto Zero',
			icon: ClipboardList,
		},
		{
			href: '/course/mentoria/jornada',
			label: 'Jornada',
			desc: '10 encontros da mentoria',
			icon: Compass,
		},
		{
			href: '/course/mentoria/ferramentas',
			label: 'Ferramentas',
			desc: 'Mapa da minha empresa',
			icon: Wrench,
		},
		{
			href: '/course/mentoria/indicadores',
			label: 'Indicadores',
			desc: 'KPIs com semáforo',
			icon: BarChart3,
		},
		{
			href: '/course/mentoria/tarefas',
			label: 'Tarefas',
			desc: 'Plano de ação',
			icon: CheckSquare,
		},
		{
			href: '/course/mentoria/desenvolvimento',
			label: 'Desenvolvimento',
			desc: 'Boas notícias, metas, Maslow',
			icon: Heart,
		},
		{
			href: '/course/mentoria/evolucao',
			label: 'Evolução',
			desc: 'Antes × depois e relatórios',
			icon: TrendingUp,
		},
		{
			href: '/course/mentoria/lives',
			label: 'Lives',
			desc: 'Transmissões e gravações',
			icon: Radio,
		},
	];

	return (
		<div className="p-4 md:p-8 space-y-6">
			<MntHeader
				title={company?.name ?? 'Minha Empresa 360°'}
				subtitle={
					cohort
						? `Turma ${cohort.name} — Mentoria Profissão Laser 360°`
						: 'Mentoria Profissão Laser 360°'
				}
				icon={Compass}
			/>

			{/* Progresso da jornada */}
			<section className={`${CARD} p-5`}>
				<div className="flex flex-wrap items-center justify-between gap-3 mb-3">
					<h2 className="font-semibold text-slate-900 dark:text-slate-100">
						Progresso da jornada
					</h2>
					<span className="text-sm text-slate-500 dark:text-gray-400">
						Encontros {progress.meetings_done}/{progress.meetings_total} ·{' '}
						{Math.round(progress.progress_pct)}%
					</span>
				</div>
				<div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
					<div
						className="h-full rounded-full bg-teal-500 transition-all"
						style={{ width: `${Math.min(100, progress.progress_pct)}%` }}
					/>
				</div>
				{/* Timeline compacta */}
				<div className="mt-4 flex flex-wrap items-center gap-2">
					{[...meetings]
						.sort((a, b) => a.position - b.position)
						.map((m) => (
							<Link
								key={m.id}
								href={
									m.status === 'locked'
										? '/course/mentoria/jornada'
										: `/course/mentoria/jornada/${m.id}`
								}
								title={`${m.position}. ${m.template?.title ?? 'Encontro'} — ${meetingStatusLabel(m.status)}`}
								className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-semibold transition ${
									m.status === 'done'
										? 'bg-teal-500 border-teal-500 text-white'
										: m.status === 'locked'
											? 'border-slate-200 dark:border-white/10 text-slate-300 dark:text-gray-600'
											: 'border-teal-500/60 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10'
								}`}
							>
								{m.status === 'done' ? (
									<Check className="w-3.5 h-3.5" />
								) : m.status === 'locked' ? (
									<Lock className="w-3 h-3" />
								) : (
									m.position
								)}
							</Link>
						))}
					<Link
						href="/course/mentoria/jornada"
						className="ml-1 inline-flex items-center gap-1 text-sm text-teal-600 dark:text-teal-400 hover:underline"
					>
						Ver jornada <ArrowRight className="w-3.5 h-3.5" />
					</Link>
				</div>
			</section>

			{/* Indicadores rápidos */}
			<section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<QuickStat
					icon={CheckSquare}
					label="Tarefas"
					value={`${tasksPending} pendentes`}
					sub={`${tasksDone} concluídas`}
					href="/course/mentoria/tarefas"
				/>
				<QuickStat
					icon={Target}
					label="Metas"
					value={`${goalsActive} ativas`}
					sub={`${(goals ?? []).length} no total`}
					href="/course/mentoria/desenvolvimento"
				/>
				<QuickStat
					icon={Activity}
					label="Indicadores"
					value={`${kpisGreen} no verde`}
					sub={`${kpisRed} no vermelho`}
					href="/course/mentoria/indicadores"
				/>
			</section>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Saúde das áreas */}
				<section className={`${CARD} p-5`}>
					<h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
						Saúde das áreas
					</h2>
					<p className="text-sm text-slate-500 dark:text-gray-400 mb-2">
						Maturidade da empresa por área (Mapa da Minha Empresa)
					</p>
					{map && map.areas.length > 0 ? (
						<CompanyMapRadar map={map} />
					) : (
						<p className="text-sm text-slate-400 dark:text-gray-500 py-10 text-center">
							Comece a usar as ferramentas para ver o mapa da sua empresa.
						</p>
					)}
					<Link
						href="/course/mentoria/ferramentas"
						className="inline-flex items-center gap-1 text-sm text-teal-600 dark:text-teal-400 hover:underline"
					>
						Ver ferramentas <ArrowRight className="w-3.5 h-3.5" />
					</Link>
				</section>

				{/* Materiais */}
				<section className={`${CARD} p-5`}>
					<div className="flex items-center gap-2 mb-3">
						<BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
						<h2 className="font-semibold text-slate-900 dark:text-slate-100">
							Materiais da mentoria
						</h2>
					</div>
					{(materials ?? []).length === 0 ? (
						<p className="text-sm text-slate-400 dark:text-gray-500 py-8 text-center">
							Nenhum material disponível ainda.
						</p>
					) : (
						<ul className="space-y-2">
							{(materials ?? []).slice(0, 8).map((mat) => (
								<li key={mat.id}>
									<a
										href={mat.url}
										target="_blank"
										rel="noreferrer"
										className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition"
									>
										{mat.kind === 'link' ? (
											<Link2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
										) : (
											<FileText className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
										)}
										<div className="min-w-0">
											<p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
												{mat.title}
											</p>
											{mat.description && (
												<p className="text-xs text-slate-500 dark:text-gray-400 truncate">
													{mat.description}
												</p>
											)}
										</div>
									</a>
								</li>
							))}
						</ul>
					)}
				</section>
			</div>

			{/* Atalhos */}
			<section>
				<div className="flex items-center gap-2 mb-3">
					<Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
					<h2 className="font-semibold text-slate-900 dark:text-slate-100">
						Acesso rápido
					</h2>
				</div>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{shortcuts.map((s) => (
						<Link
							key={s.href}
							href={s.href}
							className={`${CARD} p-4 hover:border-teal-500/50 transition group`}
						>
							<s.icon className="w-5 h-5 text-teal-600 dark:text-teal-400 mb-2" />
							<p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
								{s.label}
							</p>
							<p className="text-xs text-slate-500 dark:text-gray-400">
								{s.desc}
							</p>
						</Link>
					))}
				</div>
			</section>

			{/* Empresa */}
			<CompanyForm company={company} />
		</div>
	);
}

function QuickStat({
	icon: Icon,
	label,
	value,
	sub,
	href,
}: {
	icon: typeof Activity;
	label: string;
	value: string;
	sub: string;
	href: string;
}) {
	return (
		<Link
			href={href}
			className={`${CARD} p-4 hover:border-teal-500/50 transition block`}
		>
			<div className="flex items-center gap-2 mb-2">
				<Icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
				<span className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">
					{label}
				</span>
			</div>
			<p className="text-lg font-bold text-slate-900 dark:text-slate-100">
				{value}
			</p>
			<p className="text-xs text-slate-500 dark:text-gray-400">{sub}</p>
		</Link>
	);
}
