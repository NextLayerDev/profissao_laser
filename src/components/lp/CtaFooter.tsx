import { ArrowRight, Zap } from 'lucide-react';

export function CtaFooter() {
	return (
		<section className="py-8">
			<div className="max-w-7xl mx-auto px-5 lg:px-8">
				<div className="relative glass-card rounded-3xl p-8 lg:p-10 overflow-hidden">
					<div className="absolute inset-0 bg-gradient-primary opacity-20" />
					<div className="relative flex flex-col lg:flex-row items-center justify-between gap-6">
						<div className="flex items-center gap-4">
							<span className="grid place-items-center w-14 h-14 rounded-full bg-gradient-primary shadow-glow animate-pulse-glow shrink-0">
								<Zap className="w-6 h-6 text-primary-foreground" />
							</span>
							<div>
								<h3 className="text-xl lg:text-2xl font-bold">
									Pronto para acelerar sua carreira e transformar seu negócio?
								</h3>
								<p className="text-sm text-muted-foreground mt-1">
									Faça parte da maior comunidade de profissionais do laser do
									Brasil.
								</p>
							</div>
						</div>
						<a
							href="#planos"
							className="inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground text-sm font-bold uppercase tracking-wider px-7 py-4 rounded-full shadow-glow hover:scale-[1.03] transition-transform whitespace-nowrap"
						>
							Quero fazer parte agora <ArrowRight className="w-4 h-4" />
						</a>
					</div>
				</div>
			</div>
			<footer className="max-w-7xl mx-auto px-5 lg:px-8 mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground">
				© {new Date().getFullYear()} Comunidade Profissão Laser. Todos os
				direitos reservados.
			</footer>
		</section>
	);
}
