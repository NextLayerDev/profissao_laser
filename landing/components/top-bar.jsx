/* TopBar — mirrors src/components/landing/top-bar.tsx style.
   Nav: Início · Recursos · Depoimentos · Planos · FAQ + Entrar / Quero fazer parte
*/
function Logo({ size = 28 }) {
	// Header logo — Syne italic wordmark, matching dev branch brand styling
	return (
		<div className="flex items-center gap-2.5">
			<div
				className="tile-grad rounded-lg p-1.5 grid place-items-center"
				style={{ width: size + 6, height: size + 6 }}
			>
				<svg
					aria-hidden="true"
					viewBox="0 0 32 32"
					width={size - 4}
					height={size - 4}
					fill="none"
				>
					<path
						d="M16 2l2.3 6.7 6.9.5-5.3 4.5 1.8 6.8L16 17l-5.7 3.5 1.8-6.8-5.3-4.5 6.9-.5z"
						fill="#fff"
					/>
					<circle cx="16" cy="13" r="1.4" fill="#7c3aed" />
				</svg>
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

function TopBar() {
	const [scrolled, setScrolled] = React.useState(false);
	const [open, setOpen] = React.useState(false);
	React.useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 12);
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	const nav = [
		['Início', '#hero'],
		['Recursos', '#recursos'],
		['Depoimentos', '#depoimentos'],
		['Planos', '#planos'],
		['FAQ', '#faq'],
	];

	return (
		<header
			className={`sticky top-0 z-50 transition-all duration-300 ${
				scrolled
					? 'bg-ink-950/80 backdrop-blur-xl border-b border-white/[0.06]'
					: 'bg-transparent'
			}`}
		>
			<div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
				<Logo />

				<nav className="hidden lg:flex items-center gap-1">
					{nav.map(([label, href]) => (
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
					<a
						href="#login"
						className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-200 hover:text-white border border-white/[0.1] hover:border-white/[0.2] rounded-xl transition-colors"
					>
						Entrar
					</a>
					<a
						href="#planos"
						className="btn-accent inline-flex items-center gap-1.5 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-brand"
					>
						Quero fazer parte
						<IArrowRight size={15} />
					</a>
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
					{nav.map(([label, href]) => (
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

Object.assign(window, { TopBar, Logo });
