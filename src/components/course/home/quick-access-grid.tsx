'use client';

import { Lock, Settings } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { CustomerFeatures, FeatureUpgradeTiers } from '@/types/classes';
import {
	type QuickAccessItem,
	quickAccessItems,
} from '@/utils/constants/quick-access';

interface QuickAccessGridProps {
	features: CustomerFeatures | null;
	upgradeTiers: FeatureUpgradeTiers | null;
	onSavedLessonsOpen: () => void;
	/** Modo compacto (sidebar): botões menores, ícone+label, agrupados por section. */
	compact?: boolean;
}

const SECTION_LABELS: Record<QuickAccessItem['section'], string> = {
	CONTEUDO: 'Conteúdo',
	COMUNIDADE: 'Comunidade',
	FERRAMENTAS: 'Ferramentas',
};

const SECTION_ORDER: QuickAccessItem['section'][] = [
	'CONTEUDO',
	'COMUNIDADE',
	'FERRAMENTAS',
];

export function QuickAccessGrid({
	features,
	compact = false,
}: QuickAccessGridProps) {
	if (compact) {
		return <CompactQuickAccess features={features} />;
	}
	return <FullQuickAccess features={features} />;
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Full mode (grid de cards) — comportamento padrão                      */
/* ─────────────────────────────────────────────────────────────────────── */

function FullQuickAccess({ features }: { features: CustomerFeatures | null }) {
	return (
		<section>
			<div className="flex justify-between items-end mb-5">
				<h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
					Acesso Rápido
				</h3>
				<button
					type="button"
					onClick={() =>
						toast('Em breve', {
							description: 'Personalização estará disponível em breve!',
						})
					}
					className="text-xs text-slate-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 font-medium transition-colors flex items-center gap-1"
				>
					Personalizar
					<Settings className="w-3.5 h-3.5" />
				</button>
			</div>
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
				{quickAccessItems.map((item) => (
					<QuickAccessCard key={item.label} item={item} features={features} />
				))}
			</div>
		</section>
	);
}

function QuickAccessCard({
	item,
	features,
}: {
	item: QuickAccessItem;
	features: CustomerFeatures | null;
}) {
	const { label, description, Icon, featureKey, href, gradient } = item;
	const hasAccess = featureKey ? (features?.[featureKey] ?? false) : true;
	const isComingSoon = !href && !featureKey;
	const isLocked = featureKey && !hasAccess;

	const baseClass = `group relative rounded-lg p-3 flex flex-col gap-2.5 transition-all duration-200 bg-gradient-to-br ${gradient} border border-white/10 ${
		isLocked
			? 'opacity-50 cursor-not-allowed saturate-0'
			: 'hover:brightness-110 cursor-pointer shadow-lg'
	} ${isComingSoon ? 'opacity-75' : ''}`;

	const content = (
		<>
			<div
				className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
					isLocked ? 'bg-slate-200 dark:bg-white/[0.06]' : 'bg-white/20'
				}`}
			>
				{isLocked ? (
					<Lock className="w-4 h-4 text-slate-400 dark:text-gray-500" />
				) : (
					<Icon className="w-4 h-4 text-white" />
				)}
			</div>
			<div className="min-w-0">
				<p
					className={`text-sm font-bold leading-tight ${
						isLocked ? 'text-slate-400 dark:text-gray-500' : 'text-white'
					}`}
				>
					{label}
				</p>
				<p
					className={`text-xs mt-0.5 leading-tight ${
						isLocked ? 'text-slate-400/60 dark:text-gray-500' : 'text-white/70'
					}`}
				>
					{description}
				</p>
			</div>
		</>
	);

	const hoverLine = !isLocked ? (
		<div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-lg bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
	) : null;

	if (isLocked) {
		return <div className={baseClass}>{content}</div>;
	}
	if (href && hasAccess) {
		return (
			<Link href={href} className={baseClass}>
				{hoverLine}
				{content}
			</Link>
		);
	}
	return (
		<button
			type="button"
			onClick={() => {
				if (isComingSoon || !href) {
					toast('Em breve', {
						description: `${label} estará disponível em breve!`,
					});
				}
			}}
			className={`${baseClass} text-left`}
		>
			{hoverLine}
			{isComingSoon ? (
				<span className="absolute top-2 right-2 px-2 py-0.5 bg-black/30 backdrop-blur-sm text-white/80 text-[10px] font-bold uppercase rounded-full tracking-wider">
					Em breve
				</span>
			) : null}
			{content}
		</button>
	);
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Compact mode (sidebar) — tiles menores agrupados por section          */
/* ─────────────────────────────────────────────────────────────────────── */

function CompactQuickAccess({
	features,
}: {
	features: CustomerFeatures | null;
}) {
	return (
		<section className="space-y-4">
			<h3 className="font-display text-base font-bold text-slate-900 dark:text-white px-1">
				Acesso Rápido
			</h3>
			{SECTION_ORDER.map((section) => {
				const items = quickAccessItems.filter((i) => i.section === section);
				if (items.length === 0) return null;
				return (
					<div key={section} className="space-y-2">
						<p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 px-1">
							{SECTION_LABELS[section]}
						</p>
						<div className="grid grid-cols-2 gap-2">
							{items.map((item) => (
								<CompactQuickAccessTile
									key={item.label}
									item={item}
									features={features}
								/>
							))}
						</div>
					</div>
				);
			})}
		</section>
	);
}

function CompactQuickAccessTile({
	item,
	features,
}: {
	item: QuickAccessItem;
	features: CustomerFeatures | null;
}) {
	const { label, Icon, featureKey, href, iconBg, gradient } = item;
	const hasAccess = featureKey ? (features?.[featureKey] ?? false) : true;
	const isComingSoon = !href && !featureKey;
	const isLocked = featureKey && !hasAccess;

	const baseClass = `group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 transition-all ${
		isLocked
			? 'opacity-50 cursor-not-allowed saturate-0'
			: 'hover:border-violet-300 dark:hover:border-violet-500/40 hover:bg-slate-50 dark:hover:bg-white/[0.07] cursor-pointer'
	} ${isComingSoon ? 'opacity-75' : ''}`;

	const content = (
		<>
			<div
				className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
					isLocked
						? 'bg-slate-200 dark:bg-white/[0.06] text-slate-400'
						: `bg-gradient-to-br ${gradient} text-white`
				}`}
				aria-hidden
			>
				{isLocked ? (
					<Lock className="w-3.5 h-3.5" />
				) : (
					<Icon className="w-3.5 h-3.5" />
				)}
			</div>
			<span
				className={`text-xs font-semibold leading-tight truncate ${
					isLocked
						? 'text-slate-400 dark:text-gray-500'
						: 'text-slate-700 dark:text-gray-200'
				}`}
			>
				{label}
			</span>
			{/* iconBg só pra evitar prop-not-used (alt color futuro) */}
			<span className={`hidden ${iconBg}`} aria-hidden />
		</>
	);

	if (isLocked) {
		return <div className={baseClass}>{content}</div>;
	}
	if (href && hasAccess) {
		return (
			<Link href={href} className={baseClass}>
				{content}
			</Link>
		);
	}
	return (
		<button
			type="button"
			onClick={() => {
				if (isComingSoon || !href) {
					toast('Em breve', {
						description: `${label} estará disponível em breve!`,
					});
				}
			}}
			className={`${baseClass} text-left`}
		>
			{content}
		</button>
	);
}
