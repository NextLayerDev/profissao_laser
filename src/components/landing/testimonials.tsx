'use client';

import { Star } from 'lucide-react';
import { ScrollReveal } from './scroll-reveal';

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
			'Os parâmetros e as aulas avançadas me ajudaram a entregar resultados muito melhores pra meus clientes.',
		name: 'Juliana C.',
		role: 'Empresária',
		grad: 'from-fuchsia-500 to-pink-600',
	},
	{
		quote:
			'Aqui encontrei networking, fornecedores confiáveis e várias oportunidades de parcerias.',
		name: 'André L.',
		role: 'Designer & Laserista',
		grad: 'from-cyan-500 to-blue-600',
	},
	{
		quote:
			'A vetorização e a biblioteca economizam horas do meu dia. Vale cada centavo.',
		name: 'Marcos P.',
		role: 'Personalizados Premium',
		grad: 'from-orange-500 to-amber-400',
	},
	{
		quote:
			'O grupo do WhatsApp é ouro puro. Tirei dúvidas que custariam horas em segundos.',
		name: 'Camila R.',
		role: 'Atelier Laser',
		grad: 'from-emerald-500 to-teal-600',
	},
	{
		quote:
			'Os parâmetros prontos pra Fiber e UV economizaram dias de testes na minha máquina.',
		name: 'Diego S.',
		role: 'Lojista de Personalizados',
		grad: 'from-rose-500 to-red-600',
	},
];

function QuoteCard({ t }: { t: (typeof TESTIMONIALS)[number] }) {
	const initials = t.name
		.split(' ')
		.map((x) => x[0])
		.join('')
		.slice(0, 2);

	return (
		<div className="card-dark tile-hairline shine relative w-[340px] md:w-[380px] shrink-0 rounded-2xl p-6 hover:border-violet-500/30 transition-colors">
			<div className="font-display text-violet-400/80 text-4xl leading-none mb-2">
				&ldquo;
			</div>
			<p className="text-slate-200 text-[15px] leading-relaxed mb-5 line-clamp-4">
				{t.quote}
			</p>

			<div className="flex items-center gap-1 text-amber-300 mb-4">
				{Array.from({ length: 5 }).map((_, i) => (
					<Star key={i} size={14} />
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
		<section
			id="depoimentos"
			className="relative px-5 md:px-8 py-14 md:py-20 overflow-hidden"
		>
			<div className="max-w-7xl mx-auto">
				<ScrollReveal className="text-center mb-10">
					<h2 className="font-display text-3xl md:text-[2.5rem] font-black text-white tracking-tight">
						O que nossos <span className="grad-brand">membros dizem</span>
					</h2>
					<p className="text-slate-400 mt-3 text-sm max-w-xl mx-auto">
						+2.850 profissionais, 4,9 / 5 de avaliação média.
					</p>
				</ScrollReveal>
			</div>

			<div className="marquee-pause relative">
				<div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ink-900 to-transparent z-10 pointer-events-none" />
				<div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-ink-900 to-transparent z-10 pointer-events-none" />
				<div className="marquee-track py-4">
					{[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
						<QuoteCard key={i} t={t} />
					))}
				</div>
			</div>
		</section>
	);
}
