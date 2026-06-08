'use client';

import {
	ArrowRight,
	CheckCircle2,
	GraduationCap,
	Play,
	Star,
	Target,
	Users,
} from 'lucide-react';
import { motion } from 'motion/react';

const benefits = [
	'Aprenda com especialistas',
	'Acesse parâmetros e conteúdos exclusivos',
	'Conecte-se com profissionais de todo o Brasil',
	'Encontre fornecedores e oportunidades reais',
	'Ferramentas exclusivas do mundo do laser a um click',
];

const stats = [
	{ icon: Users, value: '+3.500', label: 'Membros treinados' },
	{ icon: GraduationCap, value: '+250', label: 'Aulas' },
	{ icon: Star, value: '+15', label: 'Ferramentas exclusivas' },
	{ icon: Target, value: '100%', label: 'Foco no laser' },
];

export function Hero() {
	return (
		<section
			id="inicio"
			className="relative pt-20 lg:pt-28 pb-12 overflow-hidden bg-hero-glow"
		>
			<div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background pointer-events-none" />

			<div className="relative max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
				<motion.div
					initial={{ opacity: 0, y: 24 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
					className="relative z-10"
				>
					<span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-6">
						<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
						A maior comunidade de profissionais do laser do Brasil
					</span>
					<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05]">
						Tudo que um{' '}
						<span className="text-gradient">profissional precisa</span> para
						crescer em um só lugar
					</h1>
					<p className="mt-6 text-base lg:text-lg text-muted-foreground max-w-xl">
						A Comunidade Profissão Laser é a plataforma completa para você
						aprender, se conectar, trocar experiências e acelerar seus
						resultados.
					</p>
					<ul className="mt-8 space-y-3">
						{benefits.map((b, i) => (
							<motion.li
								key={b}
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.2 + i * 0.08 }}
								className="flex items-center gap-3 text-sm text-foreground/90"
							>
								<CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
								{b}
							</motion.li>
						))}
					</ul>
					<div className="mt-9 flex flex-wrap gap-4">
						<a
							href="#planos"
							className="inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground text-sm font-bold uppercase tracking-wider px-7 py-4 rounded-full shadow-glow hover:scale-[1.03] transition-transform"
						>
							Quero fazer parte agora <ArrowRight className="w-4 h-4" />
						</a>
						<a
							href="#video"
							className="inline-flex items-center gap-2.5 border border-border bg-card/40 text-foreground text-sm font-semibold uppercase tracking-wider px-6 py-4 rounded-full hover:bg-card transition-colors"
						>
							<Play className="w-4 h-4 text-primary" /> Assistir ao vídeo
						</a>
					</div>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 1, delay: 0.2 }}
					className="relative lg:absolute lg:inset-y-0 lg:right-0 lg:left-[30%] lg:w-auto lg:mr-[calc(50%-50vw)] overflow-visible flex items-center pointer-events-none"
				>
					<img
						src="/lp/devices-mockup.png"
						alt="Plataforma Comunidade Profissão Laser em laptop e celular"
						width={1400}
						height={1100}
						className="w-full h-auto lg:w-full lg:opacity-85"
					/>
				</motion.div>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.6 }}
				className="relative max-w-7xl mx-auto px-5 lg:px-8 mt-10"
			>
				<div className="glass-card rounded-2xl px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
					{stats.map((s) => (
						<div key={s.label} className="flex items-center gap-3">
							<s.icon className="w-7 h-7 text-primary" />
							<div>
								<div className="text-lg lg:text-xl font-bold">{s.value}</div>
								<div className="text-xs text-muted-foreground">{s.label}</div>
							</div>
						</div>
					))}
				</div>
			</motion.div>
		</section>
	);
}
