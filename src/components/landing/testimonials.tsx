'use client';

import { Star } from 'lucide-react';
import { ScrollReveal, StaggerReveal } from './scroll-reveal';

const TESTIMONIALS = [
	{
		quote:
			'A comunidade mudou meu jogo! O suporte é rápido, as aulas são práticas e já aumentei meu faturamento 3x desde que entrei.',
		name: 'Rafael S.',
		role: 'Especialista em Laser',
		grad: 'from-violet-500 to-purple-700',
	},
	{
		quote:
			'Os parâmetros e as aulas avançadas me ajudaram a entregar resultados muito melhores para meus clientes.',
		name: 'Juliana C.',
		role: 'Empresária',
		grad: 'from-fuchsia-500 to-pink-600',
	},
	{
		quote:
			'Aqui encontrei networking, fornecedores confiáveis e várias oportunidades de parcerias.',
		name: 'André L.',
		role: 'Designer e Laserista',
		grad: 'from-cyan-500 to-blue-600',
	},
];

function QuoteCard({ t }: { t: (typeof TESTIMONIALS)[number] }) {
	const initials = t.name
		.split(' ')
		.map((x) => x[0])
		.join('')
		.slice(0, 2);

	return (
		<div className="card-dark tile-hairline shine relative w-full h-full rounded-2xl p-6 hover:border-violet-500/30 hover:-translate-y-1 transition-all duration-300">
			<div className="font-display text-violet-400/80 text-4xl leading-none mb-2">
				&ldquo;
			</div>
			<p className="text-slate-200 text-[15px] leading-relaxed mb-5">
				{t.quote}
			</p>

			<div className="flex items-center gap-1 text-amber-300 mb-4">
				{Array.from({ length: 5 }).map((_, i) => (
					<Star key={`star-${t.name}-${i}`} size={14} fill="currentColor" />
				))}
			</div>

			<div className="flex items-center gap-3 pt-4 border-t border-violet-500/10">
				<div
					className={`bg-gradient-to-br ${t.grad} w-10 h-10 rounded-lg grid place-items-center text-white text-sm font-bold`}
				>
					{initials}
				</div>
				<div>
					<div className="text-white font-bold text-sm">{t.name}</div>
					<div className="text-slate-500 text-xs">{t.role}</div>
				</div>
			</div>
		</div>
	);
}

export function Testimonials() {
	return (
		<section id="depoimentos" className="relative px-5 md:px-8 py-14 md:py-20">
			<div className="max-w-7xl mx-auto">
				<ScrollReveal className="text-center mb-10">
					<h2 className="font-display text-3xl md:text-[2.5rem] font-black text-white tracking-tight">
						O que nossos <span className="grad-brand">membros dizem</span>
					</h2>
				</ScrollReveal>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
					{TESTIMONIALS.map((t, i) => (
						<StaggerReveal key={t.name} delay={i * 0.1}>
							<QuoteCard t={t} />
						</StaggerReveal>
					))}
				</div>
			</div>
		</section>
	);
}
