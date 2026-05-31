'use client';

import { Settings } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
	type QuickAccessItem,
	quickAccessItems,
} from '@/utils/constants/quick-access';

interface QuickAccessGridProps {
	onSavedLessonsOpen: () => void;
	/** Modo compacto (sidebar): cards coloridos agrupados por section. */
	compact?: boolean;
}

const SECTION_LABELS: Record<QuickAccessItem['section'], string> = {
	CONTEUDO: 'Conteúdo',
	COMUNIDADE: 'Comunidade',
	FERRAMENTAS: 'Ferramentas',
};

const SECTION_ORDER: QuickAccessItem['section'][] = [
	'FERRAMENTAS',
	'CONTEUDO',
	'COMUNIDADE',
];

// Acesso 100% pelo plano: o grid vive dentro do SubscriptionGate (cliente já
// tem assinatura ativa), então todos os atalhos ficam liberados — o billing/uso
// de cada ferramenta é gatilhado na própria página dela.
export function QuickAccessGrid({ compact = false }: QuickAccessGridProps) {
	if (compact) {
		return <CompactQuickAccess />;
	}
	return <FullQuickAccess />;
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Full mode (grid de cards) — comportamento padrão                      */
/* ─────────────────────────────────────────────────────────────────────── */

function FullQuickAccess() {
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
					<QuickAccessCard key={item.label} item={item} />
				))}
			</div>
		</section>
	);
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Compact / sidebar mode — mesmos cards coloridos do Full mas agrupados */
/*  por section e renderizados em 2 colunas pra caber na metade da tela.  */
/* ─────────────────────────────────────────────────────────────────────── */

function CompactQuickAccess() {
	return (
		<section className="space-y-5">
			<div className="flex items-end justify-between">
				<h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
					Acesso Rápido
				</h3>
				<span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500">
					Ferramentas
				</span>
			</div>
			{SECTION_ORDER.map((section) => {
				const items = quickAccessItems.filter((i) => i.section === section);
				if (items.length === 0) return null;
				return (
					<div key={section} className="space-y-2.5">
						<div className="flex items-center gap-2 px-0.5">
							<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-gray-400">
								{SECTION_LABELS[section]}
							</p>
							<div className="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-white/10 to-transparent" />
						</div>
						<div className="grid grid-cols-2 gap-3">
							{items.map((item) => (
								<QuickAccessCard key={item.label} item={item} />
							))}
						</div>
					</div>
				);
			})}
		</section>
	);
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Card colorido com gradiente — usado em ambos os modos                  */
/* ─────────────────────────────────────────────────────────────────────── */

function QuickAccessCard({ item }: { item: QuickAccessItem }) {
	const { label, description, Icon, href, gradient, iconBare } = item;
	const isComingSoon = !href;

	const baseClass = `group relative overflow-hidden rounded-xl p-3.5 flex flex-col gap-2.5 transition-all duration-200 bg-gradient-to-br ${gradient} border border-white/10 hover:brightness-110 hover:-translate-y-0.5 cursor-pointer shadow-lg shadow-black/10 ${
		isComingSoon ? 'opacity-75' : ''
	}`;

	const content = (
		<>
			{/* Glow textura de fundo (vibe atmosférica) */}
			<div
				className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/15 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
				aria-hidden
			/>

			<div
				className={`relative flex items-center justify-center shrink-0 ${
					iconBare
						? 'w-10 h-10'
						: 'w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm'
				}`}
			>
				{iconBare ? (
					<Icon className="w-16 h-16 -ml-1 drop-shadow-md" />
				) : (
					<Icon className="w-5 h-5 text-white" />
				)}
			</div>
			<div className="relative min-w-0">
				<p className="text-sm font-bold leading-tight text-white">{label}</p>
				<p className="text-[11px] mt-0.5 leading-snug line-clamp-2 text-white/80">
					{description}
				</p>
			</div>
		</>
	);

	const hoverLine = (
		<div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
	);

	if (href) {
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
			onClick={() =>
				toast('Em breve', {
					description: `${label} estará disponível em breve!`,
				})
			}
			className={`${baseClass} text-left`}
		>
			{hoverLine}
			<span className="absolute top-2 right-2 px-2 py-0.5 bg-black/30 backdrop-blur-sm text-white/80 text-[10px] font-bold uppercase rounded-full tracking-wider z-10">
				Em breve
			</span>
			{content}
		</button>
	);
}
