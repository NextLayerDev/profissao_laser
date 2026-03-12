'use client';

import { ChevronDown, Star, Users, Zap } from 'lucide-react';
import Image from 'next/image';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

export function Hero() {
	const { ref, isVisible } = useScrollReveal(0.1);

	const scrollToCursos = () => {
		document
			.getElementById('video-compra')
			?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	return (
		<section className="relative overflow-hidden min-h-[90vh] flex items-center">
			{/* Background image */}
			<Image
				src="/img/header_prof-laser.png"
				alt=""
				fill
				className="object-cover opacity-15"
				priority
			/>
			{/* Gradient overlays */}
			<div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e]/95 via-[#2d1b69]/90 to-[#0f1b4d]/95" />
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-20 left-10 w-72 h-72 bg-[#f2295b]/10 rounded-full blur-[120px]" />
				<div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-600/10 rounded-full blur-[150px]" />
				<div
					className="absolute inset-0 opacity-[0.03]"
					style={{
						backgroundImage:
							'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
						backgroundSize: '60px 60px',
					}}
				/>
			</div>

			<div
				ref={ref}
				className={`relative max-w-6xl mx-auto px-6 py-20 md:py-28 w-full transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
			>
				<div className="flex flex-col items-center text-center">
					{/* Header logo */}
					<div className="relative w-full max-w-md mx-auto mb-8">
						<Image
							src="/img/header_prof-laser.png"
							alt="Comunidade Profissão Laser"
							width={480}
							height={120}
							className="w-full h-auto object-contain"
							priority
						/>
					</div>

					<h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6 max-w-4xl">
						Conheca os cursos que vao{' '}
						<span className="relative inline-block">
							<span className="bg-gradient-to-r from-[#f2295b] via-[#ff6b6b] to-[#f2295b] bg-clip-text text-transparent">
								transformar
							</span>
							<div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-[#f2295b]/0 via-[#f2295b] to-[#f2295b]/0 rounded-full" />
						</span>{' '}
						seu negocio
					</h1>

					<p className="text-lg md:text-xl text-gray-300/90 leading-relaxed max-w-2xl mb-10">
						Domine todos os processos da gravacao a laser com cursos praticos,
						suporte especializado e uma comunidade ativa de profissionais. Do
						basico ao avancado, temos o caminho certo para voce.
					</p>

					<button
						type="button"
						onClick={scrollToCursos}
						className="group inline-flex items-center gap-3 bg-[#f2295b] hover:bg-[#e0214f] text-white text-lg font-bold px-10 py-5 rounded-2xl transition-all duration-300 shadow-xl shadow-[#f2295b]/20 hover:shadow-[#f2295b]/30 hover:-translate-y-0.5 mb-14 cursor-pointer"
					>
						Ver todos os cursos
						<ChevronDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform animate-bounce" />
					</button>

					{/* Social proof */}
					<div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
						{[
							{
								icon: Users,
								color: 'text-violet-400',
								value: '2.500+',
								label: 'Membros ativos',
							},
							{
								icon: Star,
								color: 'text-amber-400',
								value: '4.9/5',
								label: 'Avaliacao dos alunos',
							},
							{
								icon: Zap,
								color: 'text-emerald-400',
								value: 'Lives semanais',
								label: 'Conteudo exclusivo ao vivo',
							},
						].map((stat, i) => (
							<div key={stat.label} className="contents">
								{i > 0 && (
									<div className="w-px h-10 bg-white/10 hidden sm:block" />
								)}
								<div className="flex items-center gap-2.5">
									<div className="w-10 h-10 rounded-xl bg-white/[0.07] flex items-center justify-center">
										<stat.icon className={`w-5 h-5 ${stat.color}`} />
									</div>
									<div className="text-left">
										<p className="text-white font-bold text-lg leading-tight">
											{stat.value}
										</p>
										<p className="text-gray-400 text-xs">{stat.label}</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			<div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0d0d0f] to-transparent pointer-events-none" />
		</section>
	);
}
