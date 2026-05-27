'use client';

import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const NAV_LINKS = [
	['Início', '#hero'],
	['Ferramentas', '#recursos'],
	['Depoimentos', '#depoimentos'],
	['Planos', '#planos'],
	['Perguntas', '#faq'],
] as const;

function Logo({ size = 40 }: { size?: number }) {
	return (
		<div className="flex items-center gap-2.5">
			<div className="relative shrink-0" style={{ width: size, height: size }}>
				<Image
					src="/img/logo-profissao-laser.png"
					alt="Comunidade Profissão Laser"
					fill
					sizes="44px"
					className="object-contain"
				/>
			</div>
			<div className="leading-tight">
				<div className="text-[10px] uppercase tracking-[0.20em] text-violet-300/80 font-semibold">
					Comunidade
				</div>
				<div className="font-display text-white font-extrabold text-sm tracking-tight -mt-0.5">
					PROFISSÃO LASER
				</div>
			</div>
		</div>
	);
}

export { Logo };

export function TopBar() {
	const [scrolled, setScrolled] = useState(false);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 12);
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	return (
		<header
			className={`sticky top-0 z-50 transition-all duration-300 ${
				scrolled
					? 'bg-ink-950/80 backdrop-blur-xl border-b border-white/[0.06] shadow-brand'
					: 'bg-transparent'
			}`}
		>
			<div className="max-w-[1600px] mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
				<Logo />

				<nav className="hidden lg:flex items-center gap-1">
					{NAV_LINKS.map(([label, href]) => (
						<a
							key={href}
							href={href}
							className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]"
						>
							{label}
						</a>
					))}
				</nav>

				<div className="flex items-center gap-2">
					<button
						type="button"
						className="btn-accent hidden sm:inline-flex items-center gap-1.5 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-brand"
					>
						Quero fazer parte agora
						<ArrowRight size={15} />
					</button>
					<button
						type="button"
						onClick={() => setOpen((v) => !v)}
						className="lg:hidden ml-1 w-9 h-9 grid place-items-center text-white border border-white/10 rounded-lg"
					>
						<div className="space-y-1">
							<span className="block w-4 h-px bg-white" />
							<span className="block w-4 h-px bg-white" />
							<span className="block w-4 h-px bg-white" />
						</div>
					</button>
				</div>
			</div>

			{open && (
				<div className="lg:hidden border-t border-white/[0.06] bg-ink-900/95 backdrop-blur-xl px-5 py-3 flex flex-col gap-1">
					{NAV_LINKS.map(([label, href]) => (
						<a
							key={href}
							href={href}
							onClick={() => setOpen(false)}
							className="px-3 py-2.5 text-sm text-gray-200 hover:text-white hover:bg-white/[0.04] rounded-lg"
						>
							{label}
						</a>
					))}
				</div>
			)}
		</header>
	);
}
