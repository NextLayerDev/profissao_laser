'use client';

import Image from 'next/image';
import { ScrollReveal, StaggerReveal } from './scroll-reveal';

const professionals = [
	{
		name: 'Fernando Nucci',
		image: '/img/FERNANDO02.jpeg',
		bio: 'Sou Fernando Nucci e trabalho no mercado de máquinas de gravação a laser a mais de 10 anos. Atualmente sou sócio de 5 empresas que faturam mais de 10 milhões de reais por ano. No mercado do laser, já vendi mais de 3 milhões de reais em 2023. Acompanho de perto a dificuldade dos profissionais do mercado de gravação a laser, e quero mostrar como é possível vencer neste mercado que ainda está apenas começando!',
	},
	{
		name: 'Giovani Meinhardt',
		image: '/img/GIOVANI01.jpeg',
		bio: 'Me chamo Giovani Meinhardt trabalho no mercado de Presentes corporativos gravados a laser a mais de 3 anos, tendo atendido diversas empresas, inclusive multinacionais. Busco sempre novidades e tendências para oferecer um atendimento diferenciado e produtos de alta qualidade. Tenho faturado a média de R$30k/mês com a gravação a laser no ano de 2023.',
	},
];

export function ProfessionalsSection() {
	return (
		<section className="bg-ink-900 py-20 md:py-28 px-6">
			<div className="max-w-5xl mx-auto">
				<ScrollReveal>
					<p className="text-violet-400 uppercase tracking-widest text-sm font-bold text-center mb-3">
						Quem está por trás
					</p>
					<h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
						Profissionais
					</h2>
				</ScrollReveal>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					{professionals.map((pro, i) => (
						<StaggerReveal key={pro.name} delay={i * 0.15}>
							<div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-3xl p-8 hover:border-violet-500/20 transition-all duration-500">
								<div className="relative w-24 h-24 rounded-full mx-auto mb-6 overflow-hidden border-2 border-violet-500/30 shadow-lg shadow-violet-500/10">
									<Image
										src={pro.image}
										alt={pro.name}
										fill
										className="object-cover"
									/>
								</div>
								<h3 className="text-white text-xl font-bold text-center mb-4">
									{pro.name}
								</h3>
								<p className="text-gray-400 text-sm leading-relaxed">
									{pro.bio}
								</p>
							</div>
						</StaggerReveal>
					))}
				</div>
			</div>
		</section>
	);
}
