'use client';

import { Check, Shield } from 'lucide-react';
import { useState } from 'react';
import { ScrollReveal, StaggerReveal } from './scroll-reveal';

// ─── Planos (estáticos, fiéis ao print) ──────────────────────────────────────

interface PlanAccent {
	name: string; // cor do nome do plano
	iconText: string; // cor do check
	iconBg: string; // fundo do check
	glow: string; // cor do glow no topo do card
	cta: string; // classes do botão (não-destaque)
}

interface Plan {
	id: string;
	name: string;
	tagline: string;
	annual: number; // R$/ano
	installment: number; // 12x R$
	monthly: number; // R$/mês
	features: string[];
	accent: PlanAccent;
	featured?: boolean;
	badge?: string;
}

const PLANS: Plan[] = [
	{
		id: 'starter',
		name: 'Starter',
		tagline: 'Para começar e aprender',
		annual: 299,
		installment: 29.9,
		monthly: 49,
		accent: {
			name: 'text-emerald-300',
			iconText: 'text-emerald-400',
			iconBg: 'bg-emerald-500/15',
			glow: 'from-emerald-500/20',
			cta: 'bg-white/[0.04] text-white border border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50',
		},
		features: [
			'Aulas Gravadas',
			'Suporte online',
			'Biblioteca de vetores',
			'Parâmetros',
			'Fórum',
			'Chat',
			'Lista de fornecedores',
			'Eventos e Lives fechadas',
			'Vitrine de Projetos',
		],
	},
	{
		id: 'profissional',
		name: 'Profissional',
		tagline: 'Para quem quer ir além',
		annual: 399,
		installment: 39.9,
		monthly: 59,
		accent: {
			name: 'text-sky-300',
			iconText: 'text-sky-400',
			iconBg: 'bg-sky-500/15',
			glow: 'from-sky-500/20',
			cta: 'bg-white/[0.04] text-white border border-sky-500/30 hover:bg-sky-500/10 hover:border-sky-500/50',
		},
		features: [
			'Aulas Gravadas',
			'Suporte online',
			'Biblioteca de vetores',
			'Parâmetros',
			'Fórum',
			'Chat',
			'Lista de fornecedores',
			'Eventos e Lives fechadas',
			'Vitrine de Projetos',
			'Grupo de Whatsapp',
		],
	},
	{
		id: 'avancado',
		name: 'Avançado',
		tagline: 'Para quem busca resultados',
		annual: 599,
		installment: 59.9,
		monthly: 69,
		featured: true,
		badge: 'MAIS ESCOLHIDO',
		accent: {
			name: 'text-violet-200',
			iconText: 'text-violet-200',
			iconBg: 'bg-violet-400/25',
			glow: 'from-violet-500/25',
			cta: 'btn-accent text-white shadow-brand',
		},
		features: [
			'Aulas Gravadas',
			'Suporte online',
			'Biblioteca de vetores',
			'Parâmetros',
			'Fórum',
			'Chat',
			'Lista de fornecedores',
			'Garantias e Lives fechadas',
			'Integração de Projetos',
			'Vetorização (equipe de suporte online)',
		],
	},
	{
		id: 'elite',
		name: 'Elite',
		tagline: 'Para quem quer o máximo',
		annual: 999,
		installment: 99.9,
		monthly: 119,
		accent: {
			name: 'text-amber-300',
			iconText: 'text-amber-400',
			iconBg: 'bg-amber-500/15',
			glow: 'from-amber-500/20',
			cta: 'bg-white/[0.04] text-white border border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/50',
		},
		features: [
			'Aulas Gravadas',
			'Suporte online',
			'Biblioteca de vetores',
			'Parâmetros',
			'Chat',
			'Lista de fornecedores',
			'Eventos e Lives fechadas e suporte online',
			'Prévias',
			'Canva com IA',
			'Pacote de 150 Voxxys',
			'10 Horas de mentoria online',
			'Gravação 360° - Grupo de 5 pessoas',
		],
	},
];

function fmt(v: number): string {
	return v.toFixed(2).replace('.', ',');
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

// ─── Card de plano ────────────────────────────────────────────────────────────

function PlanCard({ p, billing }: { p: Plan; billing: 'annual' | 'monthly' }) {
	const isAnnual = billing === 'annual';
	const a = p.accent;
	return (
		<div
			className={`tile-hairline shine relative rounded-2xl border p-6 flex flex-col transition-all duration-300 ${
				p.featured
					? 'border-violet-500/50 aura lg:-translate-y-2'
					: 'card-dark hover:-translate-y-1'
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
				<div className="btn-accent absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold uppercase tracking-[0.18em] px-3 py-1 rounded-full shadow-brand whitespace-nowrap">
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
					{p.tagline}
				</p>
			</div>

			<div className="relative text-center my-5">
				{isAnnual ? (
					<>
						<div className="flex items-baseline justify-center gap-1">
							<span className="text-slate-400 text-base font-bold mr-1">
								R$
							</span>
							<span className="font-display text-white text-5xl font-black tracking-tight tabular-nums">
								{p.annual}
							</span>
							<span className="text-slate-400 text-sm font-bold">,00/ano</span>
						</div>
						<div className="text-slate-500 text-xs mt-2 font-mono">
							ou 12x de R$ {fmt(p.installment)}
						</div>
						<div className="text-slate-500 text-xs font-mono">
							ou R$ {p.monthly},00/mês
						</div>
					</>
				) : (
					<>
						<div className="flex items-baseline justify-center gap-1">
							<span className="text-slate-400 text-base font-bold mr-1">
								R$
							</span>
							<span className="font-display text-white text-5xl font-black tracking-tight tabular-nums">
								{p.monthly}
							</span>
							<span className="text-slate-400 text-sm font-bold">,00/mês</span>
						</div>
						<div className="text-slate-500 text-xs mt-2 font-mono">
							cobrado mensalmente
						</div>
					</>
				)}
			</div>

			<div className="relative border-t border-white/10 pt-5 mb-5 flex-1">
				<ul className="space-y-2.5">
					{p.features.map((line) => (
						<li key={line} className="flex items-start gap-2.5">
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

			{/* CTA inerte por ora (sem destino) */}
			<button
				type="button"
				className={`relative w-full font-bold uppercase tracking-wider text-[13px] py-3.5 rounded-xl transition-all cursor-pointer ${a.cta}`}
			>
				Quero este plano
			</button>
		</div>
	);
}

// ─── Seção ────────────────────────────────────────────────────────────────────

export function PricingSection() {
	const [billing, setBilling] = useState<'annual' | 'monthly'>('annual');

	return (
		<section id="planos" className="relative px-5 md:px-8 py-16 md:py-24">
			<div className="max-w-7xl mx-auto">
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

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
					{PLANS.map((p, i) => (
						<StaggerReveal key={p.id} delay={i * 0.08}>
							<PlanCard p={p} billing={billing} />
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
