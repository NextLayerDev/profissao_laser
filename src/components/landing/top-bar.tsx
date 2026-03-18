'use client';

import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const INITIAL_MINUTES = 15;

export function TopBar() {
	const [timeLeft, setTimeLeft] = useState(INITIAL_MINUTES * 60);

	useEffect(() => {
		const timer = setInterval(() => {
			setTimeLeft((prev) => (prev <= 0 ? 0 : prev - 1));
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	const scrollToVideo = () => {
		document
			.getElementById('cursos')
			?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	const minutes = Math.floor(timeLeft / 60)
		.toString()
		.padStart(2, '0');
	const seconds = (timeLeft % 60).toString().padStart(2, '0');

	return (
		<div className="sticky top-0 z-50 bg-[#0d0d0f]/80 backdrop-blur-xl border-b border-white/[0.06] px-4 py-2.5">
			<div className="max-w-7xl mx-auto flex items-center justify-between">
				{/* Logo */}
				<div className="flex items-center gap-3">
					<Image
						src="/img/header_prof-laser.png"
						alt="Profissão Laser"
						width={40}
						height={40}
						className="rounded-lg"
					/>
					<span className="hidden md:block text-white font-bold text-sm tracking-wide">
						PROFISSÃO LASER
					</span>
				</div>

				{/* Timer */}
				<div className="flex items-center gap-3">
					<p className="text-white/70 text-xs font-medium uppercase tracking-wide hidden sm:block">
						Oferta encerra em:
					</p>
					<div className="flex items-center gap-1.5">
						<div className="bg-white/[0.07] rounded-lg px-2.5 py-1.5 text-center min-w-[44px]">
							<span className="text-[#f2295b] text-lg font-bold font-mono">
								{minutes}
							</span>
						</div>
						<span className="text-white/30 font-bold">:</span>
						<div className="bg-white/[0.07] rounded-lg px-2.5 py-1.5 text-center min-w-[44px]">
							<span className="text-[#f2295b] text-lg font-bold font-mono">
								{seconds}
							</span>
						</div>
					</div>
				</div>

				{/* CTA */}
				<button
					type="button"
					onClick={scrollToVideo}
					className="flex items-center gap-1.5 sm:gap-2 bg-[#f2295b] hover:bg-[#e0214f] text-white text-xs font-bold uppercase tracking-wide px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-[#f2295b]/20 cursor-pointer"
				>
					<span className="hidden sm:inline">Aproveitar oferta</span>
					<span className="sm:hidden">Oferta</span>
					<ChevronRight className="w-3.5 h-3.5" />
				</button>
			</div>
		</div>
	);
}
