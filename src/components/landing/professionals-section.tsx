'use client';

import Image from 'next/image';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

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
	const { ref, isVisible } = useScrollReveal();

	return (
		<section className="bg-[#0d0d0f] py-20 md:py-28 px-6">
			<div
				ref={ref}
				className={`max-w-5xl mx-auto transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
			>
				<p className="text-[#f2295b] uppercase tracking-widest text-sm font-bold text-center mb-3">
					Quem está por trás
				</p>
				<h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
					Profissionais
				</h2>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
					{professionals.map((pro, i) => (
						<div
							key={pro.name}
							className={`bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-3xl p-8 hover:border-[#f2295b]/20 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
							style={{ transitionDelay: `${300 + i * 200}ms` }}
						>
							<div className="relative w-24 h-24 rounded-full mx-auto mb-6 overflow-hidden border-2 border-[#f2295b]/30 shadow-lg shadow-[#f2295b]/10">
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
							<p className="text-gray-400 text-sm leading-relaxed">{pro.bio}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
