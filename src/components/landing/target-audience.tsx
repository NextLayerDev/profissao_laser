'use client';

import {
	Apple,
	Crosshair,
	Factory,
	Gem,
	Gift,
	HeartPulse,
	Puzzle,
	Utensils,
} from 'lucide-react';
import { useTilt } from '@/hooks/use-landing';
import { ScrollReveal, StaggerReveal } from './scroll-reveal';

const segments = [
	{
		icon: Factory,
		title: 'Industrial',
		description:
			'Profissionais que atuam em indústrias e gravam e cortam metais e outros materiais.',
	},
	{
		icon: Gift,
		title: 'Brindes',
		description:
			'Profissionais que trabalham com personalização de brindes, como canetas, canecas, chaveiros, etc.',
	},
	{
		icon: HeartPulse,
		title: 'Hospitalar',
		description:
			'Gravação de equipamentos de utensílios médicos, como bisturis, óticas, sondas, etc.',
	},
	{
		icon: Crosshair,
		title: 'Armeiros',
		description:
			'Para profissionais que atuam na gravação de airsoft, pistolas, fuzis, e outros armamentos.',
	},
	{
		icon: Utensils,
		title: 'Cutelaria',
		description:
			'Profissionais que atuam na personalização de facas e materiais para churrascos, machados, etc.',
	},
	{
		icon: Puzzle,
		title: 'Brinquedos',
		description:
			'Action figures, lego, bonecas, carrinhos, e uma infinidade de produtos personalizáveis.',
	},
	{
		icon: Gem,
		title: 'Ourives',
		description:
			'Para quem quer trabalhar com personalização de jóias delicadas e metais preciosos.',
	},
	{
		icon: Apple,
		title: 'Alimentos',
		description:
			'Pão de hambúrguer, alimentos personalizados de eventos, embalagens de alimentos, etc.',
	},
];

function SegmentCard({ segment }: { segment: (typeof segments)[number] }) {
	const tilt = useTilt(5);
	const Icon = segment.icon;
	return (
		<div
			ref={tilt.ref}
			{...tilt.handlers}
			style={tilt.style as React.CSSProperties}
			className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-5 text-center hover:border-violet-500/30 hover:bg-white/[0.06] transition-all duration-500 group"
		>
			<div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-violet-500/20 transition-colors">
				<Icon className="w-6 h-6 text-violet-400" />
			</div>
			<h3 className="text-white font-bold text-sm uppercase tracking-wide mb-2">
				{segment.title}
			</h3>
			<p className="text-gray-500 text-xs leading-relaxed">
				{segment.description}
			</p>
		</div>
	);
}

export function TargetAudience() {
	return (
		<section className="bg-ink-900 py-20 md:py-28 px-6">
			<div className="max-w-5xl mx-auto">
				<ScrollReveal>
					<p className="text-violet-400 uppercase tracking-widest text-sm font-bold text-center mb-3">
						Para quem é
					</p>
					<h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
						A Comunidade Profissão Laser
						<br />
						<span className="text-violet-400">vai funcionar para mim?</span>
					</h2>

					<p className="text-gray-400 text-center text-lg max-w-3xl mx-auto mb-12">
						A Comunidade pode ajudar inúmeros profissionais e empresas que atuam
						ou desejam atuar no mercado. Para quem não conhece absolutamente
						nada, é o ponto de partida essencial. Para quem já é do mercado, é
						importante para estar por dentro das novidades.
					</p>
				</ScrollReveal>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{segments.map((segment, i) => (
						<StaggerReveal key={segment.title} delay={i * 0.06}>
							<SegmentCard segment={segment} />
						</StaggerReveal>
					))}
				</div>

				{/* Negócio próprio */}
				<ScrollReveal
					delay={0.2}
					className="mt-16 text-center bg-gradient-to-r from-violet-500/10 via-violet-500/10 to-violet-500/10 border border-white/[0.08] rounded-3xl p-10"
				>
					<h3 className="text-2xl md:text-3xl font-bold text-white uppercase mb-4">
						Ideal para quem sonha em abrir o próprio negócio do zero!
					</h3>
					<p className="text-gray-400 text-lg max-w-3xl mx-auto">
						O Mercado da Gravação a Laser de Produtos é muito amplo, indo desde
						a indústria até mesmo a gravação em pão de hambúrguer. Tudo depende
						de dominar o equipamento e ter a estratégia correta de venda. Aqui
						literalmente o limite é a sua imaginação!
					</p>
				</ScrollReveal>
			</div>
		</section>
	);
}
