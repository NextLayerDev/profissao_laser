'use client';

import { Check, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { type LandingPlan, useLandingPlans } from '@/hooks/use-landing-plans';
import type { PlanInterval } from '@/services/landing-plans';
import { PLAN_FEATURES, PLAN_TAGLINES } from '@/utils/constants/plans-content';
import { ScrollReveal, StaggerReveal } from './scroll-reveal';

// ─── Cores por plano (presentacional), indexadas pela `key` ──────────────────
// Preços/nome/ordem vêm da API; features/taglines de plans-content.

interface PlanAccent {
	name: string; // cor do nome do plano
	iconText: string; // cor do check
	iconBg: string; // fundo do check
	glow: string; // cor do glow no topo do card
	cta: string; // classes do botão (não-destaque)
}

const ACCENTS: Record<string, PlanAccent> = {
	basic: {
		name: 'text-emerald-300',
		iconText: 'text-emerald-400',
		iconBg: 'bg-emerald-500/15',
		glow: 'from-emerald-500/20',
		cta: 'bg-white/[0.04] text-white border border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50',
	},
	pro: {
		name: 'text-sky-300',
		iconText: 'text-sky-400',
		iconBg: 'bg-sky-500/15',
		glow: 'from-sky-500/20',
		cta: 'bg-white/[0.04] text-white border border-sky-500/30 hover:bg-sky-500/10 hover:border-sky-500/50',
	},
	avan: {
		name: 'text-violet-200',
		iconText: 'text-violet-200',
		iconBg: 'bg-violet-400/25',
		glow: 'from-violet-500/25',
		cta: 'btn-accent text-white shadow-brand',
	},
	max: {
		name: 'text-amber-300',
		iconText: 'text-amber-400',
		iconBg: 'bg-amber-500/15',
		glow: 'from-amber-500/20',
		cta: 'bg-white/[0.04] text-white border border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/50',
	},
};
const DEFAULT_ACCENT: PlanAccent = ACCENTS.avan;
const accentFor = (key: string): PlanAccent => ACCENTS[key] ?? DEFAULT_ACCENT;
const featuresFor = (key: string): string[] => PLAN_FEATURES[key] ?? [];

// Fallback (mesmos valores do print) — usado se a API pública ainda não responder.
const FALLBACK_PLANS: LandingPlan[] = [
	{
		id: 'basic',
		key: 'basic',
		name: 'Starter',
		tagline: 'Para começar e aprender',
		monthly: 49,
		annual: 299,
		installment: 29.9,
		featured: false,
		features: [],
	},
	{
		id: 'pro',
		key: 'pro',
		name: 'Profissional',
		tagline: 'Para quem quer ir além',
		monthly: 59,
		annual: 399,
		installment: 39.9,
		featured: false,
		features: [],
	},
	{
		id: 'avan',
		key: 'avan',
		name: 'Avançado',
		tagline: 'Para quem busca resultados',
		monthly: 69,
		annual: 599,
		installment: 59.9,
		featured: true,
		badge: 'MAIS ESCOLHIDO',
		features: [],
	},
	{
		id: 'max',
		key: 'max',
		name: 'Elite',
		tagline: 'Para quem quer o máximo',
		monthly: 119,
		annual: 999,
		installment: 99.9,
		featured: false,
		features: [],
	},
];

// ─── Helpers de preço ──────────────────────────────────────────────────────────

function fmt(v: number): string {
	return v.toFixed(2).replace('.', ',');
}

function splitPrice(v: number): { int: number; cents: string } {
	const int = Math.floor(v);
	const cents = Math.round((v - int) * 100)
		.toString()
		.padStart(2, '0');
	return { int, cents };
}

// ─── Sparkles do plano em destaque ───────────────────────────────────────────

function FeaturedSparkles() {
	const bits = Array.from({ length: 8 }).map((_, i) => ({
		x: 10 + i * 11,
		delay: i * 0.27,
	}));
	return (
		<>
			<div className="orbit">
				{Array.from({ length: 6 }).map((_, i) => {
					const a = (i / 6) * Math.PI * 2;
					return (
						<span
							key={`orbit-${i}-${a.toFixed(2)}`}
							className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-violet-300 shadow-[0_0_8px_#c4b5fd]"
							style={{
								transform: `translate(${Math.cos(a) * 180}px, ${Math.sin(a) * 220}px)`,
							}}
						/>
					);
				})}
			</div>
			<div className="pointer-events-none absolute -top-1 left-0 right-0 h-10 overflow-visible">
				{bits.map((b) => (
					<span
						key={`bit-${b.x}`}
						className="sparkle-bit absolute top-0 w-1 h-1 rounded-full bg-violet-300 shadow-[0_0_6px_#c4b5fd]"
						style={{ left: `${b.x}%`, animationDelay: `${b.delay}s` }}
					/>
				))}
			</div>
		</>
	);
}

// ─── Skeleton (loading) ─────────────────────────────────────────────────────────

function SkeletonCard() {
	return (
		<div className="card-dark w-full rounded-2xl border p-6 animate-pulse">
			<div className="h-5 w-24 mx-auto rounded bg-white/10" />
			<div className="h-3 w-32 mx-auto mt-3 rounded bg-white/5" />
			<div className="h-12 w-36 mx-auto my-6 rounded bg-white/10" />
			<div className="border-t border-white/10 pt-5 space-y-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={`sk-${i}`} className="h-3 w-full rounded bg-white/5" />
				))}
			</div>
			<div className="h-11 w-full mt-5 rounded-xl bg-white/10" />
		</div>
	);
}

// ─── Card de plano ────────────────────────────────────────────────────────────

function PlanCard({
	p,
	billing,
	onBuy,
}: {
	p: LandingPlan;
	billing: 'annual' | 'monthly';
	onBuy: (p: LandingPlan) => void;
}) {
	const isAnnual = billing === 'annual';
	const a = accentFor(p.key);
	// Itens definidos pelo admin (na tela de Planos); se o plano não tiver nenhum,
	// cai na lista padrão hardcoded (`featuresFor`) — sem regressão visual.
	const features = p.features.length
		? p.features.map((f) => f.label)
		: featuresFor(p.key);
	const tagline = p.tagline || PLAN_TAGLINES[p.key] || '';
	const annualP = p.annual != null ? splitPrice(p.annual) : null;
	const monthlyP = p.monthly != null ? splitPrice(p.monthly) : null;

	return (
		<motion.div
			animate={{ y: p.featured ? -8 : 0 }}
			whileHover={{ y: p.featured ? -14 : -6 }}
			transition={{ type: 'spring', stiffness: 260, damping: 20 }}
			className={`tile-hairline relative w-full h-full rounded-2xl border p-6 flex flex-col ${
				p.featured ? 'border-violet-500/50 aura' : 'card-dark shine'
			}`}
			style={
				p.featured
					? {
							background:
								'linear-gradient(180deg, rgba(124,58,237,0.18) 0%, rgba(124,58,237,0.06) 60%, #15121f 100%)',
						}
					: {}
			}
		>
			{/* glow colorido no topo (cor do plano) */}
			<div
				className={`pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-2xl bg-gradient-to-b ${a.glow} to-transparent`}
			/>

			{p.featured && <FeaturedSparkles />}

			{p.badge && (
				<div className="btn-accent absolute -top-3 left-1/2 -translate-x-1/2 z-20 text-white text-[10px] font-bold uppercase tracking-[0.18em] px-3 py-1 rounded-full shadow-brand whitespace-nowrap">
					{p.badge}
				</div>
			)}

			<div className="relative text-center pt-2">
				<h3
					className={`font-display text-xl font-bold tracking-tight ${a.name}`}
				>
					{p.name}
				</h3>
				<p className="text-slate-400 text-[13px] mt-1 min-h-[1.5rem]">
					{tagline}
				</p>
			</div>

			<div className="relative text-center my-5">
				{isAnnual ? (
					annualP ? (
						<>
							<div className="flex items-baseline justify-center gap-1">
								<span className="text-slate-400 text-base font-bold mr-1">
									R$
								</span>
								<span className="font-display text-white text-5xl font-black tracking-tight tabular-nums">
									{annualP.int}
								</span>
								<span className="text-slate-400 text-sm font-bold">
									,{annualP.cents}/ano
								</span>
							</div>
							{p.installment != null && (
								<div className="text-slate-500 text-xs mt-2 font-mono">
									ou 12x de R$ {fmt(p.installment)}
								</div>
							)}
							{p.monthly != null && (
								<div className="text-slate-500 text-xs font-mono">
									ou R$ {fmt(p.monthly)}/mês
								</div>
							)}
						</>
					) : (
						<div className="text-slate-400 text-lg font-bold py-4">
							Sob consulta
						</div>
					)
				) : monthlyP ? (
					<>
						<div className="flex items-baseline justify-center gap-1">
							<span className="text-slate-400 text-base font-bold mr-1">
								R$
							</span>
							<span className="font-display text-white text-5xl font-black tracking-tight tabular-nums">
								{monthlyP.int}
							</span>
							<span className="text-slate-400 text-sm font-bold">
								,{monthlyP.cents}/mês
							</span>
						</div>
						<div className="text-slate-500 text-xs mt-2 font-mono">
							cobrado mensalmente
						</div>
					</>
				) : (
					<div className="text-slate-400 text-lg font-bold py-4">
						Sob consulta
					</div>
				)}
			</div>

			<div className="relative border-t border-white/10 pt-5 mb-5 flex-1">
				<ul className="space-y-2.5">
					{features.map((line, idx) => (
						<li
							key={`${p.key}-${idx}-${line}`}
							className="flex items-start gap-2.5"
						>
							<div
								className={`w-4 h-4 rounded-full mt-0.5 grid place-items-center shrink-0 ${a.iconBg}`}
							>
								<Check className={`w-2.5 h-2.5 ${a.iconText}`} />
							</div>
							<span className="text-slate-200 text-[13.5px] leading-snug">
								{line}
							</span>
						</li>
					))}
				</ul>
			</div>

			<button
				type="button"
				onClick={() => onBuy(p)}
				className={`relative w-full font-bold uppercase tracking-wider text-[13px] py-3.5 rounded-xl transition-all cursor-pointer ${a.cta}`}
			>
				Quero este plano
			</button>
		</motion.div>
	);
}

// ─── Seção ────────────────────────────────────────────────────────────────────

export function PricingSection() {
	const [billing, setBilling] = useState<'annual' | 'monthly'>('annual');
	const { data, isLoading } = useLandingPlans();
	const router = useRouter();

	const plans: LandingPlan[] = data && data.length > 0 ? data : FALLBACK_PLANS;

	function onBuy(p: LandingPlan) {
		const interval: PlanInterval = billing === 'annual' ? 'yearly' : 'monthly';
		// Leva pra tela de checkout do plano (criar conta / login → pagamento).
		router.push(`/checkout/plano/${p.key}?interval=${interval}`);
	}

	return (
		<section id="planos" className="relative px-5 md:px-8 py-16 md:py-24">
			<div className="max-w-[1600px] mx-auto">
				<ScrollReveal className="text-center mb-8">
					<h2 className="font-display text-3xl md:text-[2.5rem] font-black text-white tracking-tight">
						Escolha o plano <span className="grad-brand">ideal para você</span>
					</h2>
				</ScrollReveal>

				{/* Toggle mensal / anual */}
				<ScrollReveal className="flex justify-center mb-10">
					<div className="inline-flex p-1 rounded-xl card-dark">
						<button
							type="button"
							onClick={() => setBilling('annual')}
							className={`relative px-5 py-2 text-sm font-bold rounded-lg transition-all ${
								billing === 'annual'
									? 'btn-accent text-white shadow-brand'
									: 'text-slate-400 hover:text-white'
							}`}
						>
							Anual
							<span className="ml-2 inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-white/20">
								Até 20% desconto
							</span>
						</button>
						<button
							type="button"
							onClick={() => setBilling('monthly')}
							className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${
								billing === 'monthly'
									? 'bg-white/[0.08] text-white'
									: 'text-slate-400 hover:text-white'
							}`}
						>
							Mensal
						</button>
					</div>
				</ScrollReveal>

				{/* Grid adaptativo: distribui 1..7+ planos numa linha (telas largas) e
				   quebra centralizado nas menores, com altura igual por linha. */}
				<div className="flex flex-wrap justify-center gap-5">
					{isLoading && !data
						? Array.from({ length: 4 }).map((_, i) => (
								<div
									key={`skeleton-${i}`}
									className="flex grow basis-[250px] min-w-[200px] max-w-[340px]"
								>
									<SkeletonCard />
								</div>
							))
						: plans.map((p, i) => (
								<StaggerReveal
									key={p.id}
									delay={i * 0.08}
									className="flex grow basis-[250px] min-w-[200px] max-w-[340px]"
								>
									<PlanCard p={p} billing={billing} onBuy={onBuy} />
								</StaggerReveal>
							))}
				</div>

				<div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-10 text-slate-400 text-sm">
					<span className="inline-flex items-center gap-2">
						<Shield size={16} className="text-violet-400" />7 dias de garantia
						incondicional. Não gostou? Devolvemos 100% do seu dinheiro.
					</span>
				</div>
			</div>
		</section>
	);
}
