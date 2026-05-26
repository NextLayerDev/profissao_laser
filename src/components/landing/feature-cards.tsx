'use client';

import {
	BookOpen,
	Headphones,
	Image as ImageIcon,
	Layers,
	MessageCircle,
	MessageSquare,
	Palette,
	PlayCircle,
	Radio,
	ShoppingCart,
	Sliders,
	Star,
	Store,
	UserPlus,
	Users,
	Wrench,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useTilt } from '@/hooks/use-landing';
import { ScrollReveal, StaggerReveal } from './scroll-reveal';

// ─── Icon map ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<
	string,
	ComponentType<{ size?: number; className?: string }>
> = {
	PlayCircle,
	Wrench,
	Headphones,
	BookOpen,
	Palette,
	ImageIcon,
	Sliders,
	MessageSquare,
	MessageCircle,
	ShoppingCart,
	Radio,
	UserPlus,
	Users,
	Star,
	Layers,
	Store,
};

// ─── Data ────────────────────────────────────────────────────────────────────

interface Feature {
	icon: string;
	title: string;
	desc: string;
	anim: string;
	from: string;
	to: string;
}

const FEATURES: Feature[] = [
	{
		icon: 'PlayCircle',
		title: 'Aulas Gravadas',
		anim: 'pulse',
		desc: 'Aprenda no seu tempo e de onde estiver.',
		from: '#7c3aed',
		to: '#4c1d95',
	},
	{
		icon: 'Headphones',
		title: 'Suporte online',
		anim: 'radio',
		desc: 'Tire dúvidas e tenha apoio sempre que precisar.',
		from: '#fb923c',
		to: '#c2410c',
	},
	{
		icon: 'BookOpen',
		title: 'Biblioteca de Vetores',
		anim: 'book',
		desc: 'Vetores organizados para acelerar seus projetos.',
		from: '#f59e0b',
		to: '#b45309',
	},
	{
		icon: 'Palette',
		title: 'Vetorização',
		anim: 'trace',
		desc: 'Equipe especializada para vetorização de qualidade.',
		from: '#22c55e',
		to: '#15803d',
	},
	{
		icon: 'ImageIcon',
		title: 'Prévias',
		anim: 'img',
		desc: 'Visualize e teste seus projetos antes da produção.',
		from: '#ec4899',
		to: '#9d174d',
	},
	{
		icon: 'Sliders',
		title: 'Parâmetros',
		anim: 'slider',
		desc: 'Configurações testadas e validadas para cada material e máquina.',
		from: '#06b6d4',
		to: '#0e7490',
	},
	{
		icon: 'MessageSquare',
		title: 'Fórum',
		anim: 'chat',
		desc: 'Troque experiências, aprenda e cresça com a comunidade.',
		from: '#a855f7',
		to: '#6b21a8',
	},
	{
		icon: 'MessageCircle',
		title: 'Chat',
		anim: 'chat',
		desc: 'Converse em tempo real com membros e especialistas.',
		from: '#14b8a6',
		to: '#0f766e',
	},
	{
		icon: 'ShoppingCart',
		title: 'Lista de Fornecedores',
		anim: 'cart',
		desc: 'Encontre os melhores fornecedores e parceiros.',
		from: '#f59e0b',
		to: '#b45309',
	},
	{
		icon: 'Radio',
		title: 'Eventos Online',
		anim: 'radio',
		desc: 'Lives e eventos exclusivos para membros.',
		from: '#f43f5e',
		to: '#9f1239',
	},
	{
		icon: 'UserPlus',
		title: 'Network Membros',
		anim: 'network',
		desc: 'Conecte-se com profissionais e gere novas oportunidades.',
		from: '#8b5cf6',
		to: '#4338ca',
	},
	{
		icon: 'Star',
		title: 'Vitrine de projetos',
		anim: 'spark',
		desc: 'Inspire-se e mostre seu trabalho para a comunidade.',
		from: '#ec4899',
		to: '#be185d',
	},
	{
		icon: 'Layers',
		title: 'Canva com IA',
		anim: 'grid',
		desc: 'Crie artes profissionais de forma rápida e inteligente.',
		from: '#06b6d4',
		to: '#1e40af',
	},
	{
		icon: 'Users',
		title: 'Equipe de Vetores',
		anim: 'trace',
		desc: 'Suporte especializado em vetorização para membros.',
		from: '#8b5cf6',
		to: '#6d28d9',
	},
	{
		icon: 'Store',
		title: 'Fornecedores Vendas Diretas',
		anim: 'cart',
		desc: 'Compre direto com fornecedores parceiros em condições especiais.',
		from: '#f59e0b',
		to: '#92400e',
	},
];

// ─── Mini-animations ─────────────────────────────────────────────────────────

function MiniAnim({ kind }: { kind: string }) {
	if (kind === 'chat')
		return (
			<div className="mini-chat absolute top-3 right-3 flex flex-col items-end gap-1 w-16">
				<div className="b1 bg-white/90 rounded-md rounded-tr-sm h-2.5 w-12" />
				<div className="b2 bg-white/60 rounded-md rounded-tl-sm h-2 w-8 self-start" />
				<div className="b3 bg-white/90 rounded-md rounded-tr-sm h-2 w-10" />
			</div>
		);
	if (kind === 'slider')
		return (
			<div className="mini-slider absolute top-3 right-3 w-20 space-y-1.5">
				{[1, 2, 3].map((i) => (
					<div key={i} className="relative h-1 rounded-full bg-white/25">
						<div
							className={`knob k${i} absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow`}
							style={{
								left: i === 1 ? '30%' : i === 2 ? '70%' : '20%',
							}}
						/>
					</div>
				))}
			</div>
		);
	if (kind === 'trace')
		return (
			<svg
				aria-hidden="true"
				className="mini-trace absolute top-2 right-2 w-16 h-12"
				viewBox="0 0 64 48"
			>
				<path
					className="path"
					d="M4 38 Q 18 4, 32 22 T 60 12"
					fill="none"
					stroke="white"
					strokeWidth="2.4"
					strokeLinecap="round"
					opacity="0.95"
				/>
			</svg>
		);
	if (kind === 'bars')
		return (
			<div className="mini-bars absolute top-3 right-3 flex items-end gap-1 h-10">
				{[1, 2, 3, 4, 5].map((i) => (
					<div
						key={i}
						className={`bar b${i} w-1.5 h-full bg-white/85 rounded-sm`}
					/>
				))}
			</div>
		);
	if (kind === 'pulse')
		return (
			<div className="mini-pulse absolute top-3 right-3 w-12 h-12">
				<div className="ring r1 absolute inset-0 rounded-full border-2 border-white/80" />
				<div className="ring r2 absolute inset-0 rounded-full border-2 border-white/80" />
				<div className="ring r3 absolute inset-0 rounded-full border-2 border-white/80" />
				<div className="absolute inset-0 grid place-items-center">
					<div className="w-3 h-3 rounded-full bg-white" />
				</div>
			</div>
		);
	if (kind === 'spark')
		return (
			<div className="mini-spark absolute top-2 right-2 w-12 h-12">
				<svg
					aria-hidden="true"
					viewBox="0 0 32 32"
					className="absolute inset-0"
				>
					<polygon
						className="star s1"
						points="16 4 18 14 28 16 18 18 16 28 14 18 4 16 14 14"
						fill="#fff"
					/>
					<polygon
						className="star s2"
						points="24 8 25 12 29 13 25 14 24 18 23 14 19 13 23 12"
						fill="#fff"
					/>
					<polygon
						className="star s3"
						points="6 22 7 25 10 26 7 27 6 30 5 27 2 26 5 25"
						fill="#fff"
					/>
				</svg>
			</div>
		);
	if (kind === 'cart')
		return (
			<div className="mini-cart absolute top-3 right-3 flex flex-col items-end gap-1">
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						className={`item i${i} bg-white/90 rounded h-2 w-12 flex items-center gap-1 px-1`}
					>
						<span className="w-1 h-1 rounded-full bg-amber-700" />
					</div>
				))}
			</div>
		);
	if (kind === 'book')
		return (
			<div className="mini-book absolute top-3 right-3 w-12 h-10">
				<div className="page p1 absolute right-0 bottom-0 w-9 h-9 bg-white/30 rounded" />
				<div className="page p2 absolute right-1 bottom-1 w-9 h-9 bg-white/60 rounded" />
				<div className="page p3 absolute right-2 bottom-2 w-9 h-9 bg-white/90 rounded shadow" />
			</div>
		);
	if (kind === 'network')
		return (
			<svg
				aria-hidden="true"
				className="mini-network absolute top-2 right-2 w-14 h-14"
				viewBox="0 0 56 56"
			>
				<line
					className="edge"
					x1="14"
					y1="14"
					x2="40"
					y2="20"
					stroke="white"
					strokeWidth="1.2"
				/>
				<line
					className="edge"
					x1="14"
					y1="14"
					x2="20"
					y2="40"
					stroke="white"
					strokeWidth="1.2"
				/>
				<line
					className="edge"
					x1="40"
					y1="20"
					x2="20"
					y2="40"
					stroke="white"
					strokeWidth="1.2"
				/>
				<circle className="node n1" cx="14" cy="14" r="4" fill="white" />
				<circle className="node n2" cx="40" cy="20" r="4" fill="white" />
				<circle className="node n3" cx="20" cy="40" r="4" fill="white" />
			</svg>
		);
	if (kind === 'grid')
		return (
			<div className="mini-grid absolute top-3 right-3 grid grid-cols-2 gap-1 w-10">
				<div className="cell c1 h-4 rounded-sm bg-white/40" />
				<div className="cell c2 h-4 rounded-sm bg-white/40" />
				<div className="cell c3 h-4 rounded-sm bg-white/40" />
				<div className="cell c4 h-4 rounded-sm bg-white/40" />
			</div>
		);
	if (kind === 'img')
		return (
			<div className="mini-img absolute top-2 right-2 w-14 h-12 rounded-md overflow-hidden bg-white/15 relative">
				<div className="frame absolute inset-0">
					<div className="absolute inset-1 rounded-sm bg-white/40" />
					<div className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-white/80" />
				</div>
				<div className="scan absolute left-0 right-0 h-px bg-white" />
			</div>
		);
	if (kind === 'radio')
		return (
			<div className="mini-radio absolute top-3 right-3 flex flex-col gap-1 items-end">
				<div className="wave w1 h-1 w-12 rounded-full bg-white" />
				<div className="wave w2 h-1 w-8 rounded-full bg-white" />
				<div className="wave w3 h-1 w-10 rounded-full bg-white" />
			</div>
		);
	return null;
}

// ─── Feature Card ────────────────────────────────────────────────────────────

function FeatureCard({ f, delay }: { f: Feature; delay: number }) {
	const tilt = useTilt(6);
	const IconComponent = ICON_MAP[f.icon];

	return (
		<div className="lift relative" style={{ transitionDelay: `${delay}ms` }}>
			<div
				ref={tilt.ref}
				{...tilt.handlers}
				style={tilt.style as React.CSSProperties}
				className="shine tile-hairline group relative rounded-2xl p-5 h-full"
			>
				<div
					className="absolute inset-0 rounded-2xl"
					style={{
						background: `linear-gradient(135deg, ${f.from} 0%, ${f.to} 100%)`,
					}}
				/>
				<div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 to-transparent opacity-60 pointer-events-none" />

				<MiniAnim kind={f.anim} />

				<div className="relative">
					<div className="bg-white/15 backdrop-blur-sm w-11 h-11 rounded-lg p-2 grid place-items-center mb-4 inline-block border border-white/20">
						{IconComponent && (
							<IconComponent size={22} className="text-white" />
						)}
					</div>
					<h3 className="font-display text-white text-[16px] font-bold tracking-tight mb-1.5">
						{f.title}
					</h3>
					<p className="text-white/80 text-[13px] leading-relaxed line-clamp-3">
						{f.desc}
					</p>
				</div>
			</div>
		</div>
	);
}

// ─── Feature Grid ────────────────────────────────────────────────────────────

export function FeatureCards() {
	return (
		<section id="recursos" className="relative px-5 md:px-8 py-12 md:py-16">
			<div className="max-w-7xl mx-auto">
				<ScrollReveal className="text-center mb-12">
					<h2 className="font-display text-3xl md:text-[2.5rem] font-black text-white tracking-tight">
						Uma plataforma completa{' '}
						<span className="grad-brand">com tudo que você precisa</span>
					</h2>
					<p className="text-slate-400 mt-3 max-w-2xl mx-auto">
						Ferramentas exclusivas para transformar conhecimento em resultados
						reais.
					</p>
				</ScrollReveal>

				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
					{FEATURES.map((f, i) => (
						<StaggerReveal key={f.title} delay={i * 0.05}>
							<FeatureCard f={f} delay={i * 30} />
						</StaggerReveal>
					))}
				</div>
			</div>
		</section>
	);
}
