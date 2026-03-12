'use client';

import Image from 'next/image';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

const features = [
	{
		title: 'Lives Exclusivas',
		description:
			'Toda semana Lives Exclusivas com gravacoes personalizadas de diversos produtos passo a passo, dicas de empreendedorismo e muito mais!',
		image: '/img/thumbnail-youtube-min.jpg',
	},
	{
		title: 'Grupo de Network',
		description:
			'Uma comunidade engajada, com varias ferramentas que vao te ajudar a fazer a sua empresa decolar na gravacao a laser e faturar muito.',
		image: '/img/copo-stanley-copy-min.jpg',
	},
	{
		title: 'Curso Completo',
		description:
			'Nao fique mais procurando dicas aleatorias. Voce tera uma trilha de aprendizado para dominar a gravacao a laser de uma vez por todas!',
		image: '/img/como-fazer-preenchimento-100-min.jpg',
	},
	{
		title: 'Suporte Especializado',
		description:
			'Esta com problema na hora de usar sua maquina de gravacao a laser e precisa de ajuda? Aqui nao vamos te deixar na mao!',
		image: '/img/suport-min.jpg',
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
