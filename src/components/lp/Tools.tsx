'use client';

import {
	BookOpen,
	Eye,
	Headphones,
	Image as ImageIcon,
	MessageSquare,
	MessagesSquare,
	PenTool,
	PlayCircle,
	Radio,
	ShoppingCart,
	SlidersHorizontal,
	Sparkles,
	Store,
	Users,
	UsersRound,
} from 'lucide-react';
import { motion } from 'motion/react';

const tools = [
	{
		icon: PlayCircle,
		title: 'Aulas Gravadas',
		desc: 'Aprenda no seu tempo e de onde estiver',
		gradient: 'from-blue-500 to-blue-700',
	},
	{
		icon: Headphones,
		title: 'Suporte online',
		desc: 'Tire dúvidas com especialistas sempre que precisar',
		gradient: 'from-orange-500 to-red-500',
	},
	{
		icon: BookOpen,
		title: 'Biblioteca de Vetores',
		desc: 'Vetores organizados para acelerar seus projetos',
		gradient: 'from-yellow-400 to-amber-600',
	},
	{
		icon: PenTool,
		title: 'Vetorização',
		desc: 'Vetorização feita por especialistas para mais precisão',
		gradient: 'from-emerald-400 to-emerald-600',
	},
	{
		icon: Eye,
		title: 'Prévias',
		desc: 'Visualize e teste seus projetos antes da produção',
		gradient: 'from-pink-500 to-fuchsia-600',
	},
	{
		icon: SlidersHorizontal,
		title: 'Parâmetros',
		desc: 'Configurações testadas e validadas para cada material',
		gradient: 'from-cyan-500 to-blue-600',
	},
	{
		icon: MessageSquare,
		title: 'Fórum',
		desc: 'Troque experiências e aprenda com a comunidade',
		gradient: 'from-violet-500 to-purple-700',
	},
	{
		icon: MessagesSquare,
		title: 'Chat',
		desc: 'Converse em tempo real com membros e especialistas',
		gradient: 'from-teal-400 to-cyan-600',
	},
	{
		icon: ShoppingCart,
		title: 'Lista de Fornecedores',
		desc: 'Encontre os melhores fornecedores do mercado',
		gradient: 'from-amber-400 to-yellow-600',
	},
	{
		icon: Radio,
		title: 'Eventos Online',
		desc: 'Lives e eventos exclusivos para membros',
		gradient: 'from-rose-500 to-red-600',
	},
	{
		icon: Users,
		title: 'Network Membros',
		desc: 'Conecte-se com outros profissionais e gere oportunidades',
		gradient: 'from-indigo-500 to-blue-700',
	},
	{
		icon: ImageIcon,
		title: 'Vitrine de projetos',
		desc: 'Inspire-se e mostre seus projetos para a comunidade',
		gradient: 'from-fuchsia-500 to-pink-600',
	},
	{
		icon: Sparkles,
		title: 'Equipe de Vetores',
		desc: 'Uma equipe dedicada para vetorização',
		gradient: 'from-lime-400 to-green-600',
	},
	{
		icon: UsersRound,
		title: 'Network Pro',
		desc: 'Suporte especializado em vetorização para membros',
		gradient: 'from-sky-400 to-indigo-600',
	},
	{
		icon: Store,
		title: 'Fornecedores Vendas Diretas',
		desc: 'Compre direto com fornecedores parceiros em condições especiais',
		gradient: 'from-emerald-500 to-teal-700',
	},
];

export function Tools() {
	return (
		<section id="ferramentas" className="py-10 lg:py-16">
			<div className="max-w-7xl mx-auto px-5 lg:px-8">
				<div className="text-center max-w-3xl mx-auto mb-8">
					<span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
						Uma plataforma completa
					</span>
					<h2 className="mt-3 text-3xl lg:text-4xl font-bold">
						Ferramentas exclusivas para{' '}
						<span className="text-gradient">
							transformar conhecimento em resultados reais.
						</span>
					</h2>
				</div>
				<div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
					{tools.map((t, i) => (
						<motion.div
							key={t.title}
							initial={{ opacity: 0, y: 16 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: '-50px' }}
							transition={{ duration: 0.4, delay: (i % 5) * 0.06 }}
							className={`relative rounded-2xl p-5 bg-gradient-to-br ${t.gradient} hover:-translate-y-1 transition-all group shadow-lg overflow-hidden`}
						>
							<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
							<div className="relative w-10 h-10 rounded-lg bg-white/20 grid place-items-center mb-3 backdrop-blur-sm">
								<t.icon className="w-5 h-5 text-white" />
							</div>
							<h3 className="relative text-sm font-bold mb-1 text-white">
								{t.title}
							</h3>
							<p className="relative text-xs text-white/85 leading-relaxed">
								{t.desc}
							</p>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
