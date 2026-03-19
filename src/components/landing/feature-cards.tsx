'use client';

import Image from 'next/image';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

const features = [
	{
		title: 'Lives Exclusivas',
		description:
			'Lives fechadas exclusivas para membros com gravações personalizadas de diversos produtos passo a passo, dicas de empreendedorismo e muito mais!',
		image: '/img/LIVES.jpeg',
	},
	{
		title: 'Grupo de Network',
		description:
			'Uma comunidade engajada, com várias ferramentas que vão te ajudar a fazer a sua empresa decolar na gravação a laser e faturar muito.',
		image: '/img/NETWORK.jpeg',
	},
	{
		title: 'Curso Completo',
		description:
			'Não fique mais procurando dicas aleatórias. Você terá uma trilha de aprendizado para dominar a gravação a laser de uma vez por todas!',
		image: '/img/CURSOS.jpeg',
	},
	{
		title: 'Suporte Especializado',
		description:
			'Está com problema na hora de usar sua máquina de gravação a laser e precisa de ajuda? Aqui não vamos te deixar na mão!',
		image: '/img/suport-min.jpeg',
	},
];

export function FeatureCards() {
	const { ref, isVisible } = useScrollReveal();

	return (
		<section className="bg-[#0d0d0f] py-4">
			<div
				ref={ref}
				className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-4 max-w-7xl mx-auto"
			>
				{features.map((feature, i) => (
					<div
						key={feature.title}
						className={`relative group overflow-hidden rounded-2xl transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
						style={{ transitionDelay: `${i * 120}ms` }}
					>
						<div className="relative aspect-[4/3]">
							<Image
								src={feature.image}
								alt={feature.title}
								fill
								className="object-cover group-hover:scale-105 transition-transform duration-700"
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
						</div>
						<div className="absolute bottom-0 left-0 right-0 p-5">
							<h3 className="text-white text-lg font-black uppercase tracking-wide mb-2">
								{feature.title}
							</h3>
							<p className="text-gray-300 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300">
								{feature.description}
							</p>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
