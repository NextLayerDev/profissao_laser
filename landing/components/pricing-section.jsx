/* PricingSection — featured plan pulses, has orbiting sparkles + falling
   sparkle particles. Price animates smoothly on toggle. */

const BASE = [
	'Acesso à comunidade',
	'Aulas gravadas (Fiber, UV, CO₂, Diodo)',
	'Suporte on-line',
	'Biblioteca de vetores',
	'Parâmetros',
	'Fórum',
	'Chat',
	'Lista de fornecedores',
	'Eventos e Lives',
	'Membros',
	'Vitrine de projetos',
];

const PLANS = [
	{
		id: 'starter',
		name: 'Starter',
		tagline: 'Pra quem está começando e quer o essencial.',
		monthly: 49,
		annual: 299,
		installments: 29,
		inherits: null,
		addons: [],
		cta: 'ESCOLHER PLANO',
		featured: false,
	},
	{
		id: 'plus',
		name: 'Plus',
		tagline: 'Pra quem quer ir além e se conectar.',
		monthly: 59,
		annual: 399,
		installments: 39,
		inherits: 'Starter',
		addons: ['Grupo no WhatsApp'],
		cta: 'ESCOLHER PLANO',
		featured: false,
	},
	{
		id: 'pro',
		name: 'Pro',
		tagline: 'Pra quem quer resultados profissionais.',
		monthly: 69,
		annual: 599,
		installments: 59,
		inherits: 'Plus',
		addons: ['Vetorização ilimitada'],
		cta: 'ESCOLHER PLANO',
		featured: true,
		badge: 'MAIS ESCOLHIDO',
	},
	{
		id: 'elite',
		name: 'Elite',
		tagline: 'Pra quem vive do laser e quer dominar.',
		monthly: 119,
		annual: 999,
		installments: 109,
		inherits: 'Pro',
		addons: ['Prévias com marca d\u2019água'],
		cta: 'ESCOLHER PLANO',
		featured: false,
	},
];

function fmt(v) {
	return v.toString().replace('.', ',');
}

/* Sparkle orbit + falling sparkles for featured plan */
function FeaturedSparkles() {
	const bits = Array.from({ length: 8 }).map((_, i) => ({
		x: 10 + i * 11,
		delay: i * 0.27,
	}));
	return (
		<>
			{/* Orbiting ring of mini-sparkles */}
			<div className="orbit">
				{Array.from({ length: 6 }).map((_, i) => {
					const a = (i / 6) * Math.PI * 2;
					const _r = 50; // % of half-card
					return (
						<span
							key={i}
							className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-violet-300 shadow-[0_0_8px_#c4b5fd]"
							style={{
								transform: `translate(${Math.cos(a) * 180}px, ${Math.sin(a) * 220}px)`,
							}}
						/>
					);
				})}
			</div>
			{/* Falling sparkle bits, top-of-card */}
			<div className="pointer-events-none absolute -top-1 left-0 right-0 h-10 overflow-visible">
				{bits.map((b, i) => (
					<span
						key={i}
						className="sparkle-bit absolute top-0 w-1 h-1 rounded-full bg-violet-300 shadow-[0_0_6px_#c4b5fd]"
						style={{ left: `${b.x}%`, animationDelay: `${b.delay}s` }}
					/>
				))}
			</div>
		</>
	);
}

/* Smooth count-tween of a price between two values */
function useTween(value, duration = 350) {
	const [v, setV] = React.useState(value);
	const from = React.useRef(value);
	React.useEffect(() => {
		const start = performance.now();
		const f = from.current;
		let raf;
		const tick = (now) => {
			const p = Math.min(1, (now - start) / duration);
			const e = 1 - (1 - p) ** 3;
			setV(f + (value - f) * e);
			if (p < 1) raf = requestAnimationFrame(tick);
			else from.current = value;
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [value, duration]);
	return v;
}

function PricingCard({ p, billing }) {
	const isAnnual = billing === 'annual';
	const target = isAnnual ? p.installments : p.monthly;
	const tweened = useTween(target);
	const priceShown = Math.round(tweened);
	const subline = isAnnual
		? `12x de R$ ${fmt(p.installments)} no anual (R$ ${fmt(p.annual)})`
		: `Cobrado mensalmente`;

	return (
		<div
			className={`tile-hairline shine relative rounded-2xl border p-6 flex flex-col transition-all duration-300
      ${
				p.featured
					? 'border-violet-500/50 aura lg:-translate-y-2'
					: 'card-dark hover:border-violet-500/30'
			}`}
			style={
				p.featured
					? {
							background:
								'linear-gradient(180deg, rgba(124,58,237,0.18) 0%, rgba(124,58,237,0.06) 60%, #15121f 100%)',
						}
					: {}
			}
		>
			{p.featured && <FeaturedSparkles />}

			{p.badge && (
				<div className="btn-accent absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold uppercase tracking-[0.18em] px-3 py-1 rounded-full shadow-brand">
					{p.badge}
				</div>
			)}

			<div className="relative text-center pt-2">
				<h3 className="font-display text-xl font-bold tracking-tight text-white">
					{p.name}
				</h3>
				<p className="text-slate-400 text-[13px] mt-1 min-h-[2.5rem]">
					{p.tagline}
				</p>
			</div>

			<div className="relative text-center my-5">
				<div className="flex items-baseline justify-center gap-1">
					<span className="text-slate-400 text-base font-bold mr-1">R$</span>
					<span className="font-display text-white text-5xl font-black tracking-tight tabular-nums">
						{priceShown}
					</span>
					<span className="text-slate-400 text-base font-bold">/mês</span>
				</div>
				<div className="text-slate-500 text-xs mt-1.5 font-mono">{subline}</div>
			</div>

			<div className="relative border-t border-violet-500/10 pt-5 mb-5 flex-1">
				<div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-3">
					{p.inherits
						? `Inclui tudo do ${p.inherits} +`
						: 'Acesso a recursos iniciais'}
				</div>
				<ul className="space-y-2.5">
					{(p.inherits ? p.addons : BASE.slice(0, 5)).map((line, i) => (
						<li key={i} className="flex items-start gap-2.5">
							<div
								className={`w-4 h-4 rounded-full mt-0.5 grid place-items-center shrink-0
                ${p.featured ? 'bg-violet-400/25' : 'bg-violet-500/15'}`}
							>
								<ICheck
									size={10}
									className={p.featured ? 'text-violet-200' : 'text-violet-400'}
								/>
							</div>
							<span className="text-slate-200 text-[13.5px] leading-snug">
								{line}
							</span>
						</li>
					))}
				</ul>
			</div>

			<button
				type="button"
				className={`relative w-full font-bold uppercase tracking-wider text-[13px] py-3.5 rounded-xl transition-all cursor-pointer
        ${
					p.featured
						? 'btn-accent text-white shadow-brand'
						: 'bg-white/[0.04] hover:bg-violet-500/10 text-white border border-violet-500/15 hover:border-violet-500/40'
				}`}
			>
				{p.cta}
			</button>
		</div>
	);
}

function PricingSection() {
	const [billing, setBilling] = React.useState('annual');
	return (
		<section id="planos" className="relative px-5 md:px-8 py-16 md:py-24">
			<div className="max-w-7xl mx-auto">
				<div className="text-center mb-8">
					<h2 className="font-display text-3xl md:text-[2.5rem] font-black text-white tracking-tight">
						Escolha o plano <span className="grad-brand">ideal para você</span>
					</h2>
				</div>

				<div className="flex justify-center mb-10">
					<div className="inline-flex p-1 rounded-xl card-dark">
						<button
							type="button"
							onClick={() => setBilling('monthly')}
							className={`px-5 py-2 text-sm font-bold rounded-lg transition-all
              ${billing === 'monthly' ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:text-white'}`}
						>
							Mensal
						</button>
						<button
							type="button"
							onClick={() => setBilling('annual')}
							className={`relative px-5 py-2 text-sm font-bold rounded-lg transition-all
              ${billing === 'annual' ? 'btn-accent text-white shadow-brand' : 'text-slate-400 hover:text-white'}`}
						>
							Anual
							<span className="ml-2 inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-white/20">
								–20%
							</span>
						</button>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
					{PLANS.map((p) => (
						<PricingCard key={p.id} p={p} billing={billing} />
					))}
				</div>

				<div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-10 text-slate-400 text-sm">
					<span className="inline-flex items-center gap-2">
						<IShield size={16} className="text-violet-400" />7 dias de garantia
						incondicional. Não gostou? Devolvemos 100% do seu dinheiro.
					</span>
				</div>
			</div>
		</section>
	);
}

Object.assign(window, { PricingSection });
