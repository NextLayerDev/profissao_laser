'use client';

import { ArrowRight, Check, Play } from 'lucide-react';
import Image from 'next/image';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useMagnetic } from '@/hooks/use-landing';

// ─── Headline com efeito de gravação (typewriter) ────────────────────────────

interface HeadlinePart {
	text: string;
	cls: string;
}

function EngravedHeadline() {
	const parts: HeadlinePart[] = [
		{ text: 'Tudo que um ', cls: '' },
		{ text: 'profissional', cls: 'grad-brand' },
		{ text: ' precisa para crescer em um só lugar.', cls: '' },
	];
	const total = parts.reduce((n, p) => n + p.text.length, 0);
	const [shown, setShown] = useState(0);

	useEffect(() => {
		if (shown >= total) return;
		const t = setTimeout(
			() => setShown((s) => s + Math.max(1, Math.floor(total / 90))),
			22,
		);
		return () => clearTimeout(t);
	}, [shown, total]);

	let budget = shown;
	const rendered: React.ReactNode[] = [];
	for (let i = 0; i < parts.length; i++) {
		const len = parts[i].text.length;
		const take = Math.min(len, budget);
		if (take > 0) {
			const slice = parts[i].text.slice(0, take);
			const lines = slice.split('\n');
			lines.forEach((line, li) => {
				rendered.push(
					<Fragment key={`${i}-${li}`}>
						<span className={parts[i].cls}>{line}</span>
						{li < lines.length - 1 && <br />}
					</Fragment>,
				);
			});
			budget -= take;
		} else break;
	}
	const done = shown >= total;

	return (
		<h1 className="font-display text-4xl md:text-5xl lg:text-[3.6rem] font-black text-white leading-[1.05] tracking-tight min-h-[3.5em]">
			{rendered}
			{!done && <span className="engrave-caret" />}
		</h1>
	);
}

// ─── Sparks (partículas) + spotlight do mouse ────────────────────────────────

function SparksCanvas() {
	const ref = useRef<HTMLCanvasElement>(null);
	useEffect(() => {
		const cvs = ref.current;
		if (!cvs) return;
		const ctx = cvs.getContext('2d');
		if (!ctx) return;
		const DPR = Math.min(window.devicePixelRatio || 1, 2);
		let raf: number;
		let w = 0;
		let h = 0;
		const rand = (a: number, b: number) => a + Math.random() * (b - a);
		let sparks: {
			x: number;
			y: number;
			vx: number;
			vy: number;
			r: number;
			a: number;
			hue: number;
		}[] = [];

		const reset = () => {
			w = cvs.clientWidth;
			h = cvs.clientHeight;
			cvs.width = w * DPR;
			cvs.height = h * DPR;
			ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
			sparks = Array.from({ length: 60 }, () => ({
				x: rand(0, w),
				y: rand(0, h),
				vx: rand(-0.15, 0.15),
				vy: rand(-0.5, -0.05),
				r: rand(0.6, 1.8),
				a: rand(0.2, 0.85),
				hue: rand(270, 305),
			}));
		};

		const draw = () => {
			ctx.clearRect(0, 0, w, h);
			for (const s of sparks) {
				s.x += s.vx;
				s.y += s.vy;
				if (s.y < -10) {
					s.y = h + 10;
					s.x = rand(0, w);
				}
				if (s.x < -10) s.x = w + 10;
				if (s.x > w + 10) s.x = -10;
				ctx.beginPath();
				ctx.fillStyle = `hsla(${s.hue}, 90%, 75%, ${s.a})`;
				ctx.shadowBlur = 8;
				ctx.shadowColor = `hsla(${s.hue}, 95%, 70%, ${s.a})`;
				ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
				ctx.fill();
			}
			raf = requestAnimationFrame(draw);
		};

		reset();
		draw();
		window.addEventListener('resize', reset);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('resize', reset);
		};
	}, []);

	return (
		<canvas
			ref={ref}
			className="absolute inset-0 w-full h-full pointer-events-none"
			aria-hidden
		/>
	);
}

function Spotlight() {
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const onMove = (e: MouseEvent) => {
			const r = el.getBoundingClientRect();
			const x = ((e.clientX - r.left) / r.width) * 100;
			const y = ((e.clientY - r.top) / r.height) * 100;
			el.style.setProperty('--mx', `${x}%`);
			el.style.setProperty('--my', `${y}%`);
		};
		el.parentElement?.addEventListener('mousemove', onMove);
		return () => el.parentElement?.removeEventListener('mousemove', onMove);
	}, []);
	return (
		<div
			ref={ref}
			className="absolute inset-0 pointer-events-none"
			style={{
				background:
					'radial-gradient(500px circle at var(--mx, 50%) var(--my, 30%), rgba(139,92,246,0.18), transparent 60%)',
				transition: 'background-position 0.2s ease',
			}}
		/>
	);
}

// ─── Bullets do hero (print) ─────────────────────────────────────────────────

const HERO_BULLETS = [
	'Aprenda com especialistas',
	'Acesse parâmetros e conteúdos exclusivos',
	'Conecte-se com profissionais de todo o Brasil',
	'Encontre fornecedores e oportunidades reais',
	'Ferramentas exclusivas do mundo do laser a um click',
];

// ─── Mockup de dispositivos (aproximação CSS da plataforma) ──────────────────

const DASH_TILES = [
	'from-violet-500 to-purple-700',
	'from-amber-400 to-orange-600',
	'from-cyan-400 to-blue-600',
	'from-pink-500 to-rose-600',
	'from-emerald-400 to-teal-600',
	'from-fuchsia-500 to-purple-600',
	'from-sky-400 to-indigo-600',
	'from-orange-400 to-red-600',
	'from-violet-400 to-indigo-700',
	'from-teal-400 to-cyan-600',
];

function DashboardMock() {
	return (
		<div className="absolute inset-0 p-2.5 flex flex-col gap-2">
			<div className="flex items-center gap-2">
				<div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-700" />
				<div className="h-1.5 w-16 rounded-full bg-white/15" />
				<div className="ml-auto h-1.5 w-8 rounded-full bg-violet-500/40" />
			</div>
			<div className="text-[8px] text-white/50 font-semibold">
				Olá, bem-vindo!
			</div>
			<div className="grid grid-cols-5 gap-1.5 flex-1">
				{DASH_TILES.map((g) => (
					<div key={g} className={`rounded-md bg-gradient-to-br ${g}`} />
				))}
			</div>
		</div>
	);
}

function PhoneMock() {
	return (
		<div className="absolute inset-0 p-1.5 flex flex-col gap-1">
			<div className="h-1 w-8 rounded-full bg-white/15 mx-auto" />
			<div className="grid grid-cols-3 gap-1 flex-1 mt-1">
				{Array.from({ length: 9 }).map((_, i) => (
					<div
						key={`pm-${i}`}
						className={`rounded bg-gradient-to-br ${DASH_TILES[i % DASH_TILES.length]}`}
					/>
				))}
			</div>
		</div>
	);
}

// ─── Main Hero ───────────────────────────────────────────────────────────────

export function Hero() {
	const ctaRef = useMagnetic(0.18);

	return (
		<section id="hero" className="relative overflow-hidden pt-6 md:pt-8">
			{/* Background layers */}
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-violet-800/20 rounded-full blur-3xl" />
				<div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-indigo-900/20 rounded-full blur-3xl" />
				<div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-fuchsia-700/15 rounded-full blur-3xl" />
				<div className="absolute inset-0 bg-grid opacity-[0.05] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
				<SparksCanvas />
				<Spotlight />
			</div>

			<div className="relative max-w-7xl mx-auto px-5 md:px-8 pt-8 md:pt-12 pb-12 md:pb-16">
				<div className="hairline-violet absolute top-0 left-0 right-0" />

				<div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 items-center">
					<div className="animate-fade-in-up">
						<div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 text-violet-200 text-[11px] font-semibold uppercase tracking-[0.16em] px-3 py-1.5 rounded-full mb-6">
							<span className="relative flex w-2 h-2">
								<span className="absolute inset-0 rounded-full bg-violet-400 animate-ping opacity-60" />
								<span className="relative w-2 h-2 rounded-full bg-violet-400" />
							</span>
							A maior comunidade de profissionais do laser do Brasil
						</div>

						<EngravedHeadline />

						<p className="text-slate-400 text-base md:text-lg max-w-xl mt-6 leading-relaxed">
							A comunidade Profissão Laser é a plataforma completa para você
							aprender, se conectar, trocar experiências e acelerar seus
							resultados.
						</p>

						<ul className="mt-7 space-y-3">
							{HERO_BULLETS.map((b) => (
								<li key={b} className="flex items-center gap-3">
									<span className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/30 grid place-items-center shrink-0">
										<Check size={12} className="text-violet-300" />
									</span>
									<span className="text-slate-200 text-sm md:text-[15px]">
										{b}
									</span>
								</li>
							))}
						</ul>

						<div className="flex flex-wrap items-center gap-3 mt-8">
							<button
								ref={ctaRef}
								type="button"
								className="btn-accent group inline-flex items-center gap-2 text-white font-bold px-6 py-3.5 rounded-xl shadow-brand-lg uppercase tracking-wider text-sm"
							>
								Quero fazer parte agora
								<ArrowRight
									size={16}
									className="group-hover:translate-x-0.5 transition-transform"
								/>
							</button>
							<button
								type="button"
								className="inline-flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] text-white font-semibold px-5 py-3.5 rounded-xl border border-violet-500/15 hover:border-violet-500/40 transition-colors uppercase tracking-wider text-sm"
							>
								<span className="btn-accent w-7 h-7 grid place-items-center rounded-full">
									<Play size={11} className="text-white translate-x-px" />
								</span>
								Assistir ao vídeo
							</button>
						</div>
					</div>

					{/* Mockup de dispositivos + foto do profissional + citação */}
					<div className="relative h-[440px] md:h-[560px]">
						<div className="absolute -inset-8 bg-violet-700/25 blur-[80px] rounded-full" />

						{/* Notebook (atrás, à esquerda) */}
						<div className="absolute top-4 left-0 w-[64%]">
							<div className="rounded-lg bg-[#15131f] border border-violet-500/20 p-1.5 shadow-2xl shadow-violet-900/40">
								<div className="relative rounded-md overflow-hidden bg-[#0c0a14] aspect-video">
									<DashboardMock />
								</div>
							</div>
							<div className="mx-auto h-2 w-[112%] -ml-[6%] rounded-b-lg bg-gradient-to-b from-[#1a1726] to-[#0e0c16] border-x border-b border-violet-500/10" />
						</div>

						{/* Foto do profissional (recorte) com glow roxo atrás */}
						<div className="absolute bottom-0 right-0 w-[62%] h-[94%]">
							<div className="absolute inset-0 grid place-items-center">
								<div className="w-[80%] h-[72%] rounded-full bg-violet-600/45 blur-[70px]" />
								<div className="absolute w-[55%] h-[55%] rounded-full bg-fuchsia-500/30 blur-[60px]" />
							</div>
							<Image
								src="/img/profissional-hero.png"
								alt="Fernando Nucci — Especialista em Laser"
								fill
								sizes="(max-width: 1024px) 100vw, 380px"
								className="relative z-10 object-contain object-bottom drop-shadow-[0_10px_40px_rgba(139,92,246,0.5)]"
								priority
							/>
						</div>

						{/* Celular (canto inferior esquerdo) */}
						<div className="absolute bottom-3 left-1 w-[84px] md:w-[100px]">
							<div className="rounded-[1.1rem] bg-[#15131f] border border-violet-500/25 p-1 shadow-2xl shadow-violet-900/50">
								<div className="relative rounded-[0.85rem] overflow-hidden bg-[#0c0a14] aspect-[9/18]">
									<PhoneMock />
								</div>
							</div>
						</div>

						{/* Card de citação (sobreposto) */}
						<div className="absolute bottom-2 left-1/2 -translate-x-1/2 md:left-[26%] card-dark rounded-2xl p-3.5 max-w-[250px] backdrop-blur-md border border-violet-500/25 shadow-brand">
							<p className="text-white text-[12.5px] font-semibold leading-snug">
								"O mercado não está difícil, o mercado está se{' '}
								<span className="grad-brand">PROFISSIONALIZANDO!</span>"
							</p>
							<p className="text-slate-400 text-[11px] mt-1.5">
								— Fernando Nucci · Especialista em Laser
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
