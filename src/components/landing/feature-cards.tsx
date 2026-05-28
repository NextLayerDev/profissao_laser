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
import { motion } from 'motion/react';
import { TOOL_COLORS } from '@/utils/constants/tool-colors';
import { ScrollReveal, StaggerReveal } from './scroll-reveal';

// ─── Data (card escuro + ícone colorido, mesma paleta do início do aluno) ─────

interface Feature {
	Icon: LucideIcon;
	title: string;
	desc: string;
	gradient: string;
}

const FEATURES: Feature[] = [
	{
		Icon: PlayCircle,
		title: 'Aulas Gravadas',
		desc: 'Aprenda no seu tempo e de onde estiver.',
		gradient: TOOL_COLORS.aulas.gradient,
	},
	{
		Icon: Headphones,
		title: 'Suporte online',
		desc: 'Tire dúvidas e tenha apoio sempre que precisar.',
		gradient: TOOL_COLORS.suporte.gradient,
	},
	{
		Icon: BookOpen,
		title: 'Biblioteca de Vetores',
		desc: 'Vetores organizados para acelerar seus projetos.',
		gradient: TOOL_COLORS.biblioteca.gradient,
	},
	{
		Icon: Palette,
		title: 'Vetorização',
		desc: 'Equipe especializada para vetorização de qualidade.',
		gradient: TOOL_COLORS.vetorizacao.gradient,
	},
	{
		Icon: ImageIcon,
		title: 'Prévias',
		desc: 'Visualize e teste seus projetos antes da produção.',
		gradient: TOOL_COLORS.previas.gradient,
	},
	{
		Icon: Sliders,
		title: 'Parâmetros',
		desc: 'Configurações testadas e validadas para cada material e máquina.',
		gradient: TOOL_COLORS.parametros.gradient,
	},
	{
		Icon: MessageSquare,
		title: 'Fórum',
		desc: 'Troque experiências, aprenda e cresça com a comunidade.',
		gradient: TOOL_COLORS.forum.gradient,
	},
	{
		Icon: MessageCircle,
		title: 'Chat',
		desc: 'Converse em tempo real com membros e especialistas.',
		gradient: TOOL_COLORS.chat.gradient,
	},
	{
		Icon: ShoppingCart,
		title: 'Lista de Fornecedores',
		desc: 'Encontre os melhores fornecedores e parceiros.',
		gradient: TOOL_COLORS.fornecedores.gradient,
	},
	{
		Icon: Radio,
		title: 'Eventos Online',
		desc: 'Lives e eventos exclusivos para membros.',
		gradient: TOOL_COLORS.eventos.gradient,
	},
	{
		Icon: UserPlus,
		title: 'Network Membros',
		desc: 'Conecte-se com profissionais e gere novas oportunidades.',
		gradient: TOOL_COLORS.membros.gradient,
	},
	{
		Icon: Star,
		title: 'Vitrine de projetos',
		desc: 'Inspire-se e mostre seu trabalho para a comunidade.',
		gradient: TOOL_COLORS.vitrine.gradient,
	},
	{
		Icon: Layers,
		title: 'Canva com IA',
		desc: 'Crie artes profissionais de forma rápida e inteligente.',
		gradient: TOOL_COLORS.canva.gradient,
	},
	{
		Icon: Users,
		title: 'Equipe de Vetores',
		desc: 'Suporte especializado em vetorização para membros.',
		gradient: TOOL_COLORS.equipeVetores.gradient,
	},
	{
		Icon: Store,
		title: 'Fornecedores Vendas Diretas',
		desc: 'Compre direto com fornecedores parceiros em condições especiais.',
		gradient: TOOL_COLORS.fornecedoresVendas.gradient,
	},
];

// ─── Card ─────────────────────────────────────────────────────────────────────

function FeatureCard({ f }: { f: Feature }) {
	const { Icon } = f;
	return (
		<motion.div
			whileHover={{ y: -6 }}
			transition={{ type: 'spring', stiffness: 280, damping: 18 }}
			className="card-dark group relative rounded-2xl p-5 h-full transition-colors hover:border-violet-500/40 hover:shadow-brand"
		>
			<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
			<div
				className={`w-11 h-11 rounded-xl grid place-items-center mb-4 bg-gradient-to-br ${f.gradient} border border-white/15 shadow-lg shadow-black/20 group-hover:scale-105 transition-transform`}
			>
				<Icon size={20} className="text-white" />
			</div>
			<h3 className="font-display text-white text-[15px] font-bold tracking-tight leading-snug min-h-[2.5em] mb-1.5">
				{f.title}
			</h3>
			<p className="text-slate-400 text-[13px] leading-relaxed">{f.desc}</p>
		</motion.div>
	);
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

export function FeatureCards() {
	return (
		<section id="recursos" className="relative px-5 md:px-8 py-12 md:py-16">
			<div className="max-w-[1600px] mx-auto">
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
