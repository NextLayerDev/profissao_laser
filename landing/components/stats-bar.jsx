/* StatsBar — count-up animation, multi-tone icon tiles like the print */

function Stat({
	I,
	gradFrom,
	gradTo,
	value,
	suffix = '',
	prefix = '+',
	label,
}) {
	const [ref, inView] = useInView(0.4);
	const n = useCountUp(value, inView);
	return (
		<div ref={ref} className="bg-[#12121a] px-6 py-5 flex items-center gap-4">
			<div
				className="rounded-xl p-2.5 grid place-items-center shrink-0 shadow-violet-soft"
				style={{
					background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
				}}
			>
				<I size={20} className="text-white" />
			</div>
			<div>
				<div className="font-display text-white font-extrabold text-xl md:text-2xl leading-none tracking-tight">
					{fmtNumber(n, { prefix, suffix })}
				</div>
				<div className="text-slate-400 text-xs md:text-sm mt-1">{label}</div>
			</div>
		</div>
	);
}

function StatsBar() {
	return (
		<section className="px-5 md:px-8 max-w-7xl mx-auto -mt-2 mb-16 md:mb-24 relative z-10">
			<div className="card-dark relative rounded-2xl overflow-hidden">
				<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
				<div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-violet-500/[0.08]">
					<Stat
						I={IUsers}
						value={2850}
						gradFrom="#7c3aed"
						gradTo="#5b21b6"
						label="Membros ativos"
					/>
					<Stat
						I={IBookOpen}
						value={150}
						gradFrom="#06b6d4"
						gradTo="#1d4ed8"
						label="Aulas e conteúdos"
					/>
					<Stat
						I={ISparkles}
						value={14}
						prefix=""
						gradFrom="#a855f7"
						gradTo="#7e22ce"
						label="Ferramentas exclusivas"
					/>
					<Stat
						I={ITarget}
						value={100}
						prefix=""
						suffix="%"
						gradFrom="#f97316"
						gradTo="#dc2626"
						label="Focado em laser"
					/>
				</div>
			</div>
		</section>
	);
}

Object.assign(window, { StatsBar });
