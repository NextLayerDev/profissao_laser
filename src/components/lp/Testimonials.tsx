'use client';

import { Quote, Star } from 'lucide-react';
import { motion } from 'motion/react';

const items = [
	{
		quote:
			'A comunidade mudou meu jogo! O suporte é rápido, as aulas são práticas e já aumentei meu faturamento 3x desde que entrei.',
		name: 'Rafael S.',
		role: 'Especialista em Laser',
	},
	{
		quote:
			'Os parâmetros e as aulas avançadas me ajudaram a entregar resultados muito melhores para meus clientes.',
		name: 'Juliana C.',
		role: 'Empresária',
	},
	{
		quote:
			'Aqui encontrei networking, fornecedores confiáveis e várias oportunidades de parcerias.',
		name: 'André L.',
		role: 'Designer e Laserista',
	},
];

export function Testimonials() {
	return (
		<section id="depoimentos" className="py-10 lg:py-16">
			<div className="max-w-7xl mx-auto px-5 lg:px-8">
				<h2 className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-8">
					O que nossos membros dizem
				</h2>
				<div className="grid md:grid-cols-3 gap-5">
					{items.map((t, i) => (
						<motion.div
							key={t.name}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5, delay: i * 0.1 }}
							className="glass-card rounded-2xl p-6"
						>
							<Quote className="w-6 h-6 text-primary mb-3" />
							<p className="text-sm text-foreground/90 leading-relaxed mb-5">
								{t.quote}
							</p>
							<div className="flex items-center gap-3 pt-4 border-t border-border">
								<div className="w-10 h-10 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground font-bold text-sm">
									{t.name[0]}
								</div>
								<div className="flex-1">
									<div className="flex gap-0.5 mb-0.5">
										{Array.from({ length: 5 }).map((_, k) => (
											<Star
												key={k}
												className="w-3 h-3 fill-amber-400 text-amber-400"
											/>
										))}
									</div>
									<div className="text-sm font-semibold">{t.name}</div>
									<div className="text-xs text-muted-foreground">{t.role}</div>
								</div>
							</div>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
