/* FinalCTA — magnetic CTA button, rotating star + animated glow orb */

function FinalCTA() {
	const ctaRef = useMagnetic(0.22);
	return (
		<section className="relative px-5 md:px-8 pb-16">
			<div className="max-w-7xl mx-auto">
				<div
					className="card-dark relative overflow-hidden rounded-2xl p-7 md:p-10"
					style={{
						background:
							'linear-gradient(120deg, rgba(124,58,237,0.18) 0%, rgba(76,29,149,0.10) 60%, #12121a 100%)',
					}}
				>
					<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />
					<div
						className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[100px] animate-pulse-laser"
						style={{
							background:
								'radial-gradient(circle, rgba(139,92,246,0.30), rgba(217,70,239,0.18), transparent)',
						}}
					/>

					{/* slowly rotating star illustration */}
					<svg
						aria-hidden="true"
						viewBox="0 0 200 200"
						className="absolute -left-10 -bottom-10 w-44 h-44 opacity-35"
						style={{ animation: 'orbit-spin 30s linear infinite' }}
					>
						<path
							d="M100 10 L120 80 L195 90 L140 130 L155 200 L100 160 L45 200 L60 130 L5 90 L80 80 Z"
							fill="none"
							stroke="#c4b5fd"
							strokeWidth="1.5"
						/>
						<circle cx="100" cy="100" r="6" fill="#c4b5fd" />
					</svg>

					<div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
						<div className="md:pl-32">
							<h3 className="font-display text-white text-2xl md:text-3xl font-black leading-tight tracking-tight">
								Pronto para acelerar sua carreira
								<br />e{' '}
								<span className="grad-brand">transformar seu negócio?</span>
							</h3>
							<p className="text-slate-300/90 text-sm md:text-base mt-2">
								Faça parte da maior comunidade de profissionais do laser do
								Brasil.
							</p>
						</div>

						<div className="flex flex-col items-start md:items-end gap-3">
							<a
								ref={ctaRef}
								href="#planos"
								className="btn-accent inline-flex items-center gap-2 text-white font-bold px-6 py-3.5 rounded-xl shadow-brand-lg"
								style={{
									transition:
										'transform .25s cubic-bezier(.2,.8,.2,1), background .2s ease, box-shadow .2s ease',
								}}
							>
								QUERO FAZER PARTE AGORA
								<IArrowRight size={16} />
							</a>

							<div className="flex items-center gap-2.5">
								<AvatarStack />
								<div className="text-slate-300 text-xs leading-tight">
									<div className="text-white text-sm font-bold">
										+2.850 profissionais
									</div>
									já estão evoluindo. Você pode ser o próximo.
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

Object.assign(window, { FinalCTA });
