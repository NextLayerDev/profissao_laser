'use client';

import {
	BookOpen,
	CalendarClock,
	ChevronRight,
	CreditCard,
	Flame,
	Gem,
	LayoutDashboard,
	Loader2,
	Lock,
	PackageX,
	Star,
	Store,
	Trophy,
	Users,
	Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { SavedLessonsModal } from '@/components/course/saved-lessons-modal';
import { UserBadge } from '@/components/store/user-badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { useCustomerFeatures } from '@/hooks/use-customer-features';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import { getCurrentUser, getToken } from '@/lib/auth';
import { FULL_FEATURES } from '@/utils/constants/class-features';
import {
	COURSE_STATUS_LABELS,
	COURSE_STATUS_STYLES,
} from '@/utils/constants/course-status';
import { quickAccessItems } from '@/utils/constants/quick-access';

const TIER_ORDER: Record<string, number> = { prata: 0, ouro: 1, platina: 2 };

const Background = () => (
	<div className="fixed inset-0 bg-linear-to-br from-slate-100 via-white to-slate-50 dark:from-[#12103a] dark:via-[#0d0b1e] dark:to-[#0a0818] pointer-events-none" />
);

export default function CoursePage() {
	const [email, setEmail] = useState<string | null | undefined>(undefined);
	const [name, setName] = useState<string>('');
	const [isAdmin, setIsAdmin] = useState(false);
	const [savedLessonsModalOpen, setSavedLessonsModalOpen] = useState(false);

	useEffect(() => {
		const user = getCurrentUser();
		setEmail(user?.email ?? null);
		setName(user?.name ?? '');
		setIsAdmin(!!getToken('user'));
	}, []);

	const {
		data: plans,
		isLoading,
		isError,
	} = useCustomerPlans(isAdmin ? null : (email ?? null));

	const uniquePlans = useMemo(() => {
		if (!plans) return [];
		const byKey = new Map<string, (typeof plans)[0]>();
		for (const plan of plans) {
			const key = plan.slug ?? plan.product_name;
			const existing = byKey.get(key);
			if (!existing) {
				byKey.set(key, plan);
			} else {
				const existingTier = existing.tier
					? (TIER_ORDER[existing.tier] ?? -1)
					: -1;
				const currentTier = plan.tier ? (TIER_ORDER[plan.tier] ?? -1) : -1;
				const existingActive =
					existing.status === 'active' || existing.status === 'ativo';
				const currentActive =
					plan.status === 'active' || plan.status === 'ativo';

				const shouldReplace =
					currentTier > existingTier ||
					(currentTier === existingTier && currentActive && !existingActive);
				if (shouldReplace) byKey.set(key, plan);
			}
		}
		return Array.from(byKey.values());
	}, [plans]);

	const activePlans =
		plans?.filter((p) => p.status === 'active' || p.status === 'ativo') ?? [];

	const activeUniqueCount = uniquePlans.filter(
		(p) => p.status === 'active' || p.status === 'ativo',
	).length;

	const customerFeatures = useCustomerFeatures(
		activePlans.length > 0 ? activePlans : undefined,
	);
	const features = isAdmin
		? FULL_FEATURES
		: (customerFeatures?.features ?? null);
	const upgradeTiers = isAdmin
		? null
		: (customerFeatures?.upgradeTiers ?? null);

	if (email === undefined || isLoading) {
		return (
			<div className="min-h-screen bg-slate-50 dark:bg-[#0d0b1e] flex items-center justify-center">
				<Background />
				<Loader2 className="relative z-10 w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	if (email === null) {
		return (
			<div className="min-h-screen bg-slate-50 dark:bg-[#0d0b1e] flex items-center justify-center">
				<Background />
				<div className="relative z-10 text-center">
					<BookOpen className="w-12 h-12 text-slate-400 dark:text-gray-600 mx-auto mb-4" />
					<p className="text-slate-600 dark:text-gray-400 font-medium">
						Você não está logado
					</p>
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

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#0d0b1e] text-slate-900 dark:text-white font-sans">
			<Background />

			{/* Header */}
			<header className="relative z-10 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-8 py-4">
				<div className="max-w-350 mx-auto flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="bg-linear-to-br from-violet-600 to-purple-700 rounded-lg p-1.5">
							<BookOpen className="w-5 h-5 text-white" />
						</div>
						<h1 className="text-lg font-bold text-slate-900 dark:text-white">
							Meus Cursos
						</h1>
					</div>

					<div className="flex items-center gap-2">
						<ThemeToggle />
						{isAdmin && (
							<Link
								href="/dashboard"
								className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-violet-500/50 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium rounded-xl transition-colors"
							>
								<LayoutDashboard className="w-4 h-4" />
								Painel
							</Link>
						)}
						<Link
							href="/store"
							className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-violet-500/50 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium rounded-xl transition-colors"
						>
							<Store className="w-4 h-4" />
							Ir para loja
						</Link>
						<Link
							href="/agendamentos"
							className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white text-sm font-medium rounded-xl transition-colors"
						>
							<CalendarClock className="w-4 h-4" />
							Agendamentos
						</Link>
						<UserBadge />
					</div>
				</div>
			</header>

			<div className="relative z-10 max-w-350 mx-auto px-6 py-8">
				{/* Top tag */}
				<div className="inline-flex items-center gap-2 bg-violet-100 dark:bg-white/10 border border-violet-200 dark:border-white/20 rounded-full px-4 py-1.5 mb-6 text-xs font-semibold text-violet-700 dark:text-white uppercase tracking-wider">
					<Zap className="w-4 h-4" />
					Comunidade Profissão Laser
				</div>

				{/* Main grid */}
				<div className="grid grid-cols-1 xl:grid-cols-[1fr_320px_300px] gap-6">
					{/* ── Left column ──────────────────────────────────────── */}
					<div className="space-y-6">
						{/* Hero */}
						<div>
							<h2 className="text-5xl font-black leading-tight mb-2">
								Olá,{' '}
								<span className="bg-linear-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
									{name || 'bem-vindo!'}
								</span>
							</h2>
							<p className="text-slate-600 dark:text-slate-400 text-base mb-6">
								Continue aprendendo e domine o mercado de produtos
								personalizados a laser.
							</p>

							{/* Stats row */}
							<div className="flex flex-wrap gap-4">
								<div className="flex items-center gap-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 shadow-sm dark:shadow-none">
									<div className="bg-linear-to-br from-violet-500 to-purple-600 rounded-lg p-2">
										<BookOpen className="w-5 h-5 text-white" />
									</div>
									<div>
										<p className="text-slate-900 dark:text-white font-bold text-lg leading-tight">
											{uniquePlans.length}
										</p>
										<p className="text-slate-500 dark:text-slate-400 text-xs">
											Curso{uniquePlans.length !== 1 ? 's' : ''}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 shadow-sm dark:shadow-none">
									<div className="bg-linear-to-br from-orange-500 to-amber-400 rounded-lg p-2">
										<Flame className="w-5 h-5 text-white" />
									</div>
									<div>
										<p className="text-slate-900 dark:text-white font-bold text-lg leading-tight">
											{activeUniqueCount}
										</p>
										<p className="text-slate-500 dark:text-slate-400 text-xs">
											Ativo{activeUniqueCount !== 1 ? 's' : ''}
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* Courses list */}
						<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-none">
							<div className="flex items-center justify-between mb-6">
								<div className="flex items-center gap-3">
									<div className="bg-linear-to-br from-violet-600 to-purple-700 rounded-lg p-2">
										<BookOpen className="w-5 h-5 text-white" />
									</div>
									<h2 className="text-lg font-bold">Meus cursos</h2>
								</div>
								<Link
									href="/store"
									className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors"
								>
									Ver loja
								</Link>
							</div>

							{isError || !plans || uniquePlans.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-16 text-center">
									<PackageX className="w-12 h-12 text-red-400 mx-auto mb-4" />
									<p className="text-red-400">
										{isError
											? 'Erro ao carregar seus cursos.'
											: 'Nenhum curso disponível ainda.'}
									</p>
								</div>
							) : (
								<div className="space-y-3">
									{uniquePlans.map((plan) => {
										const statusStyle =
											COURSE_STATUS_STYLES[plan.status] ??
											'bg-gray-700 text-gray-400';
										const statusLabel =
											COURSE_STATUS_LABELS[plan.status] ?? plan.status;

										const cardContent = (
											<>
												<div className="w-12 h-12 bg-violet-600/20 rounded-xl flex items-center justify-center shrink-0">
													<BookOpen className="w-5 h-5 text-violet-400" />
												</div>
												<div className="flex-1 min-w-0">
													<h3 className="font-semibold text-slate-900 dark:text-white truncate">
														{plan.product_name}
													</h3>
													<span
														className={`inline-block mt-1 text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle}`}
													>
														{statusLabel}
													</span>
												</div>
												<ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
											</>
										);

										return plan.slug ? (
											<Link
												key={plan.id}
												href={`/course/${plan.slug}`}
												className="flex items-center gap-4 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 hover:border-violet-500/40 rounded-xl px-4 py-3 transition-all duration-200 shadow-sm dark:shadow-none"
											>
												{cardContent}
											</Link>
										) : (
											<div
												key={plan.id}
												className="flex items-center gap-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 opacity-60 cursor-not-allowed shadow-sm dark:shadow-none"
											>
												{cardContent}
											</div>
										);
									})}
								</div>
							)}
						</div>
					</div>

					{/* ── Middle column — Acesso Rápido ─────────────────── */}
					<div className="space-y-4">
						<div className="flex items-center gap-2 mb-2">
							<div className="bg-linear-to-br from-cyan-500 to-blue-600 rounded-lg p-1.5">
								<Zap className="w-4 h-4 text-white" />
							</div>
							<h2 className="font-bold text-base">Acesso Rápido</h2>
						</div>

						{quickAccessItems.map(
							({ label, Icon, gradient, featureKey, href }) => {
								const hasAccess = features?.[featureKey];
								const className = `w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
									hasAccess
										? 'bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 hover:border-violet-500/40 group cursor-pointer shadow-sm dark:shadow-none'
										: 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 opacity-60 cursor-not-allowed shadow-sm dark:shadow-none'
								}`;
								const content = (
									<>
										<div className="flex items-center gap-3">
											<div
												className={`rounded-lg p-2 ${
													hasAccess
														? `bg-linear-to-br ${gradient} text-white`
														: 'bg-slate-200 dark:bg-white/10 text-slate-500'
												}`}
											>
												{hasAccess ? (
													<Icon className="w-5 h-5" />
												) : (
													<Lock className="w-5 h-5" />
												)}
											</div>
											<div>
												<span
													className={`font-medium text-sm ${hasAccess ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}
												>
													{label}
												</span>
												{!hasAccess && (
													<p className="text-xs text-slate-500 mt-0.5">
														{upgradeTiers?.[featureKey]
															? `Disponível no plano ${upgradeTiers[featureKey]}`
															: 'Faça upgrade para aceder'}
													</p>
												)}
											</div>
										</div>
										{hasAccess && (
											<ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-violet-400 transition-colors" />
										)}
									</>
								);
								if (hasAccess && label === 'Aulas Salvas') {
									return (
										<button
											key={label}
											type="button"
											onClick={() => setSavedLessonsModalOpen(true)}
											className={className}
										>
											{content}
										</button>
									);
								}
								return href && hasAccess ? (
									<Link key={label} href={href} className={className}>
										{content}
									</Link>
								) : (
									<div key={label} className={className}>
										{content}
									</div>
								);
							},
						)}
					</div>

					{/* ── Right column — Perfil ─────────────────────────── */}
					<div className="space-y-4">
						{/* Profile card */}
						<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 text-center shadow-sm dark:shadow-none">
							<div className="mx-auto w-20 h-20 rounded-2xl bg-linear-to-br from-violet-500 to-purple-700 flex items-center justify-center text-3xl font-black mb-4 shadow-lg shadow-violet-900/50 text-white">
								{(name || email || 'U')[0].toUpperCase()}
							</div>
							<h3 className="font-bold text-lg text-slate-900 dark:text-white">
								{name || 'Usuário'}
							</h3>
							<p className="text-slate-400 text-xs mb-5 truncate">{email}</p>

							<div className="flex justify-center gap-3 mb-4">
								<div className="bg-linear-to-br from-yellow-500 to-amber-400 rounded-xl p-3 text-white flex items-center justify-center w-12 h-12">
									<Star className="w-5 h-5" />
								</div>
								<div className="bg-linear-to-br from-orange-500 to-red-500 rounded-xl p-3 text-white flex items-center justify-center w-12 h-12">
									<Flame className="w-5 h-5" />
								</div>
								<div className="bg-linear-to-br from-cyan-500 to-blue-600 rounded-xl p-3 text-white flex items-center justify-center w-12 h-12">
									<Gem className="w-5 h-5" />
								</div>
							</div>

							<Link
								href="/course/assinatura"
								className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-white/5 hover:bg-violet-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 hover:border-violet-500/40 text-slate-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-white text-sm font-medium py-2.5 rounded-xl transition-all"
							>
								<CreditCard className="w-4 h-4" />
								Minha assinatura
							</Link>
						</div>

						{/* Stats mini cards */}
						<div className="grid grid-cols-2 gap-3">
							<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-center shadow-sm dark:shadow-none">
								<div className="mx-auto mb-2 w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center text-violet-400">
									<BookOpen className="w-5 h-5" />
								</div>
								<p className="text-3xl font-black text-slate-900 dark:text-white">
									{uniquePlans.length}
								</p>
								<p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider mt-0.5">
									Cursos
								</p>
							</div>
							<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-center shadow-sm dark:shadow-none">
								<div className="mx-auto mb-2 w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400">
									<Trophy className="w-5 h-5" />
								</div>
								<p className="text-3xl font-black text-slate-900 dark:text-white">
									{activeUniqueCount}
								</p>
								<p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider mt-0.5">
									Ativos
								</p>
							</div>
						</div>

						{/* Community card */}
						<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm dark:shadow-none">
							<div className="flex items-center gap-3 mb-3">
								<div className="bg-linear-to-br from-violet-500 to-purple-700 rounded-xl p-2.5 text-white">
									<Users className="w-6 h-6" />
								</div>
								<div>
									<h3 className="font-bold text-slate-900 dark:text-white">
										Comunidade
									</h3>
									<p className="text-slate-500 dark:text-slate-400 text-xs">
										{features?.comunidade
											? 'Conecte-se com outros profissionais'
											: upgradeTiers?.comunidade
												? `Disponível no plano ${upgradeTiers.comunidade}`
												: 'Faça upgrade para aceder à comunidade'}
									</p>
								</div>
							</div>
							{features?.comunidade ? (
								<Link
									href="/comunity"
									className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-semibold py-2.5 rounded-xl transition-all text-sm"
								>
									<Users className="w-5 h-5" />
									Acessar
								</Link>
							) : (
								<div className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-500 font-medium py-2.5 rounded-xl text-sm cursor-not-allowed">
									<Lock className="w-5 h-5" />
									{upgradeTiers?.comunidade
										? `Disponível no plano ${upgradeTiers.comunidade}`
										: 'Bloqueado'}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			<SavedLessonsModal
				isOpen={savedLessonsModalOpen}
				onClose={() => setSavedLessonsModalOpen(false)}
			/>
		</div>
	);
}
