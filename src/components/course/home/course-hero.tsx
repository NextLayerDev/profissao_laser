'use client';

import { ArrowRight, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface CourseHeroProps {
	displayName: string;
}

export function CourseHero({ displayName }: CourseHeroProps) {
	return (
		<section className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-violet-500/10 bg-white dark:bg-[#12121a] isolate">
			{/* Background image */}
			<Image
				src="/img/header_prof-laser.png"
				alt=""
				aria-hidden
				fill
				className="object-cover opacity-[0.07] dark:opacity-[0.1]"
				priority
			/>

			{/* Gradient overlay */}
			<div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/80 to-violet-50/90 dark:from-[#1a0a2e]/95 dark:via-[#2d1b69]/90 dark:to-[#0f1b4d]/95 -z-[1]" />

			{/* Grid pattern overlay */}
			<div
				className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] -z-[1]"
				style={{
					backgroundImage:
						'linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)',
					backgroundSize: '40px 40px',
				}}
			/>

			{/* Animated glow orb */}
			<div
				className="absolute top-1/2 right-[15%] -translate-y-1/2 w-[300px] h-[300px] rounded-full -z-[1] blur-[100px]"
				style={{
					background:
						'radial-gradient(circle, rgba(139,92,246,0.25), rgba(217,70,239,0.15), transparent)',
					animation: 'pulseGlow 4s ease-in-out infinite',
				}}
			/>

			{/* Light effect line */}
			<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

			<div className="relative p-8 md:p-12 flex items-center justify-between">
				{/* Left side */}
				<div className="flex-1 max-w-xl">
					<h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
						Bem-vindo(a) de volta, {displayName}!
					</h2>
					<p className="text-slate-600 dark:text-gray-400 text-base md:text-lg leading-relaxed mb-1">
						Continue evoluindo na{' '}
						<span className="bg-gradient-to-r from-violet-600 via-violet-600 to-violet-400 bg-clip-text text-transparent font-semibold italic">
							Profissao Laser
						</span>
					</p>
					<p className="text-slate-500 dark:text-gray-500 text-sm leading-relaxed mb-5">
						Aprenda, compartilhe e evolua junto com milhares de profissionais
						que vivem o laser!
					</p>

					{/* Progress + Level cards */}
					<div className="flex flex-col sm:flex-row gap-3 mb-4">
						{/* Progress card */}
						<div className="flex-1 bg-slate-50 dark:bg-[#1a1a1d] border border-slate-200/60 dark:border-white/5 rounded-xl p-3">
							<p className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-2">
								Seu progresso hoje
							</p>
							<div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
								<div
									className="h-full bg-gradient-to-r from-violet-600 to-violet-600 rounded-full transition-all"
									style={{ width: '60%' }}
								/>
							</div>
							<p className="text-[11px] text-slate-400 dark:text-gray-500 mt-1">
								60% concluido
							</p>
						</div>

						{/* Level card */}
						<div className="flex-1 bg-slate-50 dark:bg-[#1a1a1d] border border-slate-200/60 dark:border-white/5 rounded-xl p-3">
							<p className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5">
								Seu nivel
							</p>
							<div className="flex items-center gap-2">
								<div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
									<Star className="w-3.5 h-3.5 text-violet-600" />
								</div>
								<div>
									<p className="text-sm font-bold text-slate-900 dark:text-white">
										Profissional
									</p>
									<p className="text-[10px] text-slate-400 dark:text-gray-500">
										2.450 / 3.000 XP
									</p>
								</div>
							</div>
						</div>
					</div>

					<Link
						href="/course/jornada"
						className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-600 transition-colors"
					>
						Ver meu progresso
						<ArrowRight className="w-3.5 h-3.5" />
					</Link>
				</div>

				{/* Right side - Machine image */}
				<div className="hidden lg:block w-[260px] h-[220px] relative shrink-0 ml-8">
					<div className="absolute inset-0 bg-violet-500/20 rounded-full blur-[60px]" />
					<Image
						src="/img/maquina-laser-min-min.png"
						alt="Maquina Laser"
						fill
						className="object-contain relative z-10"
					/>
				</div>
			</div>

			{/* Keyframes for glow animation */}
			<style jsx>{`
				@keyframes pulseGlow {
					0%, 100% { opacity: 0.5; transform: translateY(-50%) scale(1); }
					50% { opacity: 1; transform: translateY(-50%) scale(1.15); }
				}
			`}</style>
		</section>
	);
}
