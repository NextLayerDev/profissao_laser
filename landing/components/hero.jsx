/* Hero — interactive: laser-engrave headline + mouse spotlight + sparks canvas
   + live activity ticker. Designed to feel like the print but ALIVE. */

function HeroImage() {
	return (
		<div className="relative h-full w-full overflow-hidden hero-img rounded-2xl border border-violet-500/10 isolate">
			<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent z-10" />
			<svg
				viewBox="0 0 600 700"
				preserveAspectRatio="xMidYMid slice"
				className="absolute inset-0 w-full h-full"
			>
				<defs>
					<pattern
						id="hex"
						width="34"
						height="30"
						patternUnits="userSpaceOnUse"
					>
						<circle cx="17" cy="15" r="2" fill="rgba(255,255,255,0.18)" />
					</pattern>
					<radialGradient id="glow" cx="0.65" cy="0.55" r="0.55">
						<stop offset="0" stopColor="#f0abfc" stopOpacity="0.9" />
						<stop offset="0.4" stopColor="#a855f7" stopOpacity="0.55" />
						<stop offset="1" stopColor="#000" stopOpacity="0" />
					</radialGradient>
					<linearGradient id="beam" x1="0" x2="0" y1="0" y2="1">
						<stop offset="0" stopColor="#e9d5ff" stopOpacity="0" />
						<stop offset="0.5" stopColor="#c084fc" stopOpacity="0.7" />
						<stop offset="1" stopColor="#e9d5ff" stopOpacity="1" />
					</linearGradient>
				</defs>
				<g transform="skewY(-6) translate(0, 320)">
					<rect x="0" y="0" width="600" height="380" fill="rgba(15,5,30,0.7)" />
					<rect x="0" y="0" width="600" height="380" fill="url(#hex)" />
				</g>
				<ellipse cx="380" cy="320" rx="290" ry="220" fill="url(#glow)" />
				<g transform="translate(370, 70)">
					<rect
						x="-30"
						y="0"
						width="60"
						height="90"
						rx="6"
						fill="#1a1430"
						stroke="#2a1f4a"
						strokeWidth="1.5"
					/>
					<rect
						x="-22"
						y="90"
						width="44"
						height="40"
						rx="4"
						fill="#23173d"
						stroke="#2a1f4a"
						strokeWidth="1.5"
					/>
					<rect
						x="-14"
						y="130"
						width="28"
						height="60"
						rx="3"
						fill="#1a1430"
						stroke="#2a1f4a"
						strokeWidth="1.5"
					/>
					<circle cx="0" cy="195" r="6" fill="#0a0815" stroke="#2a1f4a" />
				</g>
				<rect
					x="368"
					y="205"
					width="4"
					height="120"
					fill="url(#beam)"
					className="laser-ray"
				/>
				<g transform="translate(370, 330)">
					<circle r="22" fill="#fdf4ff" opacity="0.35" className="laser-dot" />
					<circle r="10" fill="#f0abfc" opacity="0.9" className="laser-dot" />
					<circle r="3" fill="#fff" />
				</g>
				{Array.from({ length: 12 }).map((_, i) => {
					const a = (i * 30 * Math.PI) / 180;
					const r = 30 + (i % 4) * 8;
					return (
						<line
							key={i}
							x1={370}
							y1={330}
							x2={370 + Math.cos(a) * r}
							y2={330 + Math.sin(a) * r}
							stroke="#f0abfc"
							strokeWidth="1.4"
							opacity={0.7 - (i % 4) * 0.15}
						/>
					);
				})}
			</svg>
			<div className="absolute bottom-3 right-3 text-[10px] font-mono text-white/30 tracking-wide uppercase">
				[foto: cabeçote fiber em ação]
			</div>
		</div>
	);
}

function AvatarStack() {
	const items = [
		{ i: 'MR', g: 'from-violet-500 to-purple-700' },
		{ i: 'JC', g: 'from-fuchsia-500 to-pink-600' },
		{ i: 'AL', g: 'from-cyan-500 to-blue-600' },
		{ i: 'FP', g: 'from-orange-500 to-amber-400' },
		{ i: 'SP', g: 'from-violet-600 to-indigo-600' },
	];
	return (
		<div className="flex -space-x-2">
			{items.map((a, i) => (
				<div
					key={i}
					className={`bg-gradient-to-br ${a.g} w-9 h-9 rounded-full border-2 border-[#0d0d0f] grid place-items-center text-[11px] font-bold text-white`}
				>
					{a.i}
				</div>
			))}
		</div>
	);
}

/* Headline that "engraves" itself — purple cursor crosses the text revealing it. */
function EngravedHeadline() {
	// Use \u00A0 (non-breaking space) so React preserves it through text splitting
	const parts = [
		{ text: 'O ecossistema completo\npara ', cls: '' },
		{ text: 'profissionais do laser', cls: 'grad-brand' },
		{ text: '\naprenderem, evoluírem e\n', cls: '' },
		{ text: 'viverem do que amam.', cls: 'grad-brand' },
	];
	const total = parts.reduce((n, p) => n + p.text.length, 0);
	const [shown, setShown] = React.useState(0);
	React.useEffect(() => {
		if (shown >= total) return;
		const t = setTimeout(
			() => setShown((s) => s + Math.max(1, Math.floor(total / 90))),
			22,
		);
		return () => clearTimeout(t);
	}, [shown, total]);

	// Walk parts and slice each by remaining char budget
	let budget = shown;
	const rendered = [];
	for (let i = 0; i < parts.length; i++) {
		const len = parts[i].text.length;
		const take = Math.min(len, budget);
		if (take > 0) {
			const slice = parts[i].text.slice(0, take);
			// Render newlines as <br/>
			const lines = slice.split('\n');
			lines.forEach((line, li) => {
				rendered.push(
					<React.Fragment key={`${i}-${li}`}>
						<span className={parts[i].cls}>{line}</span>
						{li < lines.length - 1 && <br />}
					</React.Fragment>,
				);
			});
			budget -= take;
		} else break;
	}
	const done = shown >= total;
	return (
		<h1 className="font-display text-4xl md:text-5xl lg:text-[3.6rem] font-black text-white leading-[1.05] tracking-tight min-h-[5em]">
			{rendered}
			{!done && <span className="engrave-caret" />}
		</h1>
	);
}

/* Canvas of drifting purple sparks behind the hero. */
function SparksCanvas() {
	const ref = React.useRef(null);
	React.useEffect(() => {
		const cvs = ref.current;
		if (!cvs) return;
		const ctx = cvs.getContext('2d');
		const DPR = Math.min(window.devicePixelRatio || 1, 2);
		let raf,
			w = 0,
			h = 0,
			sparks = [];
		const rand = (a, b) => a + Math.random() * (b - a);
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

/* Mouse-following spotlight gradient over the hero. */
function Spotlight() {
	const ref = React.useRef(null);
	React.useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const onMove = (e) => {
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

/* Live activity ticker — rotating "just joined" / "just unlocked" pings. */
function LiveTicker() {
	const events = [
		{ who: 'Rafael S.', what: 'acabou de entrar', tag: 'novo membro' },
		{ who: 'Juliana C.', what: 'concluiu a Aula 12', tag: 'evolução' },
		{ who: 'André L.', what: 'fez upgrade pro plano Pro', tag: 'upgrade' },
		{ who: 'Marcos P.', what: 'baixou 24 vetores', tag: 'biblioteca' },
		{ who: 'Camila R.', what: 'entrou no Grupo WhatsApp', tag: 'comunidade' },
		{ who: 'Diego S.', what: 'enviou uma prévia aprovada', tag: 'projeto' },
	];
	const [idx, setIdx] = React.useState(0);
	React.useEffect(() => {
		const t = setInterval(() => setIdx((i) => (i + 1) % events.length), 2800);
		return () => clearInterval(t);
	}, []);
	const cur = events[idx];
	return (
		<div className="card-dark inline-flex items-center gap-3 rounded-full px-3 py-2 text-xs backdrop-blur-sm">
			<span className="relative flex w-2.5 h-2.5">
				<span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
				<span className="relative w-2.5 h-2.5 rounded-full bg-emerald-400" />
			</span>
			<span className="text-white font-bold">{cur.who}</span>
			<span className="text-slate-400">{cur.what}</span>
			<span className="px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 text-[10px] font-bold uppercase tracking-wider font-mono">
				{cur.tag}
			</span>
		</div>
	);
}

/* A single animated stat — counts up when in view */
function AvatarsAndStats() {
	const [ref, inView] = useInView(0.4);
	const n = useCountUp(2850, inView);
	return (
		<div ref={ref} className="flex items-center gap-3 mt-6">
			<AvatarStack />
			<div>
				<div className="text-white text-sm font-bold">
					{fmtNumber(n, { prefix: '+' })} membros ativos
				</div>
				<div className="text-slate-500 text-xs">e crescendo todos os dias</div>
			</div>
		</div>
	);
}

function Hero() {
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
							<IZap size={13} className="text-violet-300" />A maior comunidade
							de laser do Brasil
						</div>

						<EngravedHeadline />

						<p className="text-slate-400 text-base md:text-lg max-w-xl mt-6 leading-relaxed">
							Cursos completos, comunidade ativa, ferramentas exclusivas e
							conteúdo prático para transformar conhecimento em resultados.
						</p>

						<AvatarsAndStats />

						<div className="flex flex-wrap items-center gap-3 mt-7">
							<a
								ref={ctaRef}
								href="#planos"
								className="btn-accent group inline-flex items-center gap-2 text-white font-bold px-6 py-3.5 rounded-xl shadow-brand-lg"
							>
								QUERO FAZER PARTE AGORA
								<IArrowRight
									size={16}
									className="group-hover:translate-x-0.5 transition-transform"
								/>
							</a>
							<a
								href="#video"
								className="inline-flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] text-white font-semibold px-5 py-3.5 rounded-xl border border-violet-500/15 hover:border-violet-500/40 transition-colors"
							>
								<span className="btn-accent w-7 h-7 grid place-items-center rounded-full">
									<IPlay size={11} className="text-white translate-x-px" />
								</span>
								ASSISTIR AO VÍDEO
							</a>
						</div>

						<div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-6 text-xs text-slate-500">
							<span className="inline-flex items-center gap-1.5">
								<span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
								Acesso imediato
							</span>
							<span className="inline-flex items-center gap-1.5">
								<span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
								Cancelamento fácil
							</span>
							<span className="inline-flex items-center gap-1.5">
								<span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
								Ambiente 100% seguro
							</span>
						</div>

						{/* Live activity ticker */}
						<div className="mt-5">
							<LiveTicker />
						</div>
					</div>

					<div className="relative h-[420px] md:h-[520px] lg:h-[560px]">
						<HeroImage />
					</div>
				</div>
			</div>
		</section>
	);
}

Object.assign(window, { Hero, AvatarStack });
