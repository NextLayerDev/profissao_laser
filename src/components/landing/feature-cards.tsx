'use client';

import {
	BookOpen,
	Headphones,
	Image as ImageIcon,
	Layers,
	type LucideIcon,
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
} from 'lucide-react';
import { ScrollReveal, StaggerReveal } from './scroll-reveal';

// ─── Data (estilo do print: card escuro + ícone roxo) ────────────────────────

interface Feature {
	Icon: LucideIcon;
	title: string;
	desc: string;
}

const FEATURES: Feature[] = [
	{
		Icon: PlayCircle,
		title: 'Aulas Gravadas',
		desc: 'Aprenda no seu tempo e de onde estiver.',
	},
	{
		Icon: Headphones,
		title: 'Suporte online',
		desc: 'Tire dúvidas e tenha apoio sempre que precisar.',
	},
	{
		Icon: BookOpen,
		title: 'Biblioteca de Vetores',
		desc: 'Vetores organizados para acelerar seus projetos.',
	},
	{
		Icon: Palette,
		title: 'Vetorização',
		desc: 'Equipe especializada para vetorização de qualidade.',
	},
	{
		Icon: ImageIcon,
		title: 'Prévias',
		desc: 'Visualize e teste seus projetos antes da produção.',
	},
	{
		Icon: Sliders,
		title: 'Parâmetros',
		desc: 'Configurações testadas e validadas para cada material e máquina.',
	},
	{
		Icon: MessageSquare,
		title: 'Fórum',
		desc: 'Troque experiências, aprenda e cresça com a comunidade.',
	},
	{
		Icon: MessageCircle,
		title: 'Chat',
		desc: 'Converse em tempo real com membros e especialistas.',
	},
	{
		Icon: ShoppingCart,
		title: 'Lista de Fornecedores',
		desc: 'Encontre os melhores fornecedores e parceiros.',
	},
	{
		Icon: Radio,
		title: 'Eventos Online',
		desc: 'Lives e eventos exclusivos para membros.',
	},
	{
		Icon: UserPlus,
		title: 'Network Membros',
		desc: 'Conecte-se com profissionais e gere novas oportunidades.',
	},
	{
		Icon: Star,
		title: 'Vitrine de projetos',
		desc: 'Inspire-se e mostre seu trabalho para a comunidade.',
	},
	{
		Icon: Layers,
		title: 'Canva com IA',
		desc: 'Crie artes profissionais de forma rápida e inteligente.',
	},
	{
		Icon: Users,
		title: 'Equipe de Vetores',
		desc: 'Suporte especializado em vetorização para membros.',
	},
	{
		Icon: Store,
		title: 'Fornecedores Vendas Diretas',
		desc: 'Compre direto com fornecedores parceiros em condições especiais.',
	},
];

// ─── Card ─────────────────────────────────────────────────────────────────────

function FeatureCard({ f }: { f: Feature }) {
	const { Icon } = f;
	return (
		<div className="card-dark group relative rounded-2xl p-5 h-full transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/40 hover:shadow-brand">
			<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
			<div className="w-11 h-11 rounded-xl grid place-items-center mb-4 bg-gradient-to-br from-violet-600 to-violet-800 border border-violet-400/20 shadow-violet-soft group-hover:scale-105 transition-transform">
				<Icon size={20} className="text-white" />
			</div>
			<h3 className="font-display text-white text-[15px] font-bold tracking-tight mb-1.5">
				{f.title}
			</h3>
			<p className="text-slate-400 text-[13px] leading-relaxed">{f.desc}</p>
		</div>
	);
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

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
						<StaggerReveal key={f.title} delay={i * 0.04}>
							<FeatureCard f={f} />
						</StaggerReveal>
					))}
				</div>
			</div>
		</section>
	);
}
