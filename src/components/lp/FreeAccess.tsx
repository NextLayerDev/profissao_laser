'use client';

import {
	ArrowRight,
	CheckCircle2,
	Eye,
	GraduationCap,
	Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLandingFreeSummary } from '@/hooks/use-landing-free';
import { FALLBACK_FREE_SUMMARY } from '@/services/landing-free';

export function FreeAccess() {
	const { data } = useLandingFreeSummary();
	// Fallback também cobre o 1º render (antes do fetch), evitando layout shift.
	const summary = data ?? FALLBACK_FREE_SUMMARY;

	const lessons = summary.free_lessons_count;
	const previews = summary.courses_with_preview_count;
	const tools = summary.free_tools;

	// Benefícios dirigidos por dados: só entram os que têm valor.
	const benefits: string[] = [];
	if (lessons > 0) benefits.push(`${lessons} aulas liberadas — sem pagar nada`);
	if (previews > 0) benefits.push(`Prévias abertas em ${previews} cursos`);
	if (tools.length > 0) {
		benefits.push(
			`Ferramentas liberadas: ${tools.map((t) => t.name).join(', ')}`,
		);
	}
	benefits.push('Comunidade e fórum abertos pra você começar');

	const stats = [
		lessons > 0
			? { icon: GraduationCap, value: String(lessons), label: 'Aulas grátis' }
			: null,
		previews > 0
			? { icon: Eye, value: String(previews), label: 'Cursos com prévia' }
			: null,
		tools.length > 0
			? {
					icon: Sparkles,
					value: String(tools.length),
					label:
						tools.length === 1 ? 'Ferramenta grátis' : 'Ferramentas grátis',
				}
			: null,
	].filter(
		(s): s is { icon: typeof GraduationCap; value: string; label: string } =>
			Boolean(s),
	);

	const hasHighlights = stats.length > 0 || tools.length > 0;

	return (
		<section
			id="gratis"
			className="relative py-12 lg:py-20 overflow-hidden bg-hero-glow"
		>
			<div className="max-w-7xl mx-auto px-5 lg:px-8">
				<motion.div
					initial={{ opacity: 0, y: 24 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: '-80px' }}
					transition={{ duration: 0.6 }}
					className="relative glass-card rounded-3xl p-8 lg:p-12 overflow-hidden"
				>
					<div className="absolute inset-0 bg-gradient-primary opacity-10 pointer-events-none" />
					<div
						className={`relative grid gap-10 items-center ${
							hasHighlights ? 'lg:grid-cols-2' : ''
						}`}
					>
						{/* Texto + CTAs */}
						<div>
							<span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-5">
								<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
								Comece sem pagar nada
							</span>
							<h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05]">
								Entre hoje <span className="text-gradient">de graça</span>
							</h2>
							<p className="mt-5 text-base lg:text-lg text-muted-foreground max-w-xl">
								Crie sua conta e já comece a usar o que está liberado — sem
								cartão, sem assinatura. Quando quiser mais, é só escolher um
								plano.
							</p>
							<ul className="mt-7 space-y-3">
								{benefits.map((b) => (
									<li
										key={b}
										className="flex items-start gap-3 text-sm text-foreground/90"
									>
										<CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
										{b}
									</li>
								))}
							</ul>
							<div className="mt-9 flex flex-wrap gap-4">
								<a
									href="/register"
									className="inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground text-sm font-bold uppercase tracking-wider px-7 py-4 rounded-full shadow-glow hover:scale-[1.03] transition-transform"
								>
									Entrar de graça <ArrowRight className="w-4 h-4" />
								</a>
								<a
									href="/login"
									className="inline-flex items-center gap-2.5 border border-border bg-card/40 text-foreground text-sm font-semibold uppercase tracking-wider px-6 py-4 rounded-full hover:bg-card transition-colors"
								>
									Entrar
								</a>
							</div>
						</div>

						{/* Números ao vivo + abas liberadas */}
						{hasHighlights && (
							<div className="relative">
								{stats.length > 0 && (
									<div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-4">
										{stats.map((s) => (
											<div
												key={s.label}
												className="glass-card rounded-2xl p-5 flex flex-col gap-2"
											>
												<s.icon className="w-7 h-7 text-primary" />
												<div className="text-2xl lg:text-3xl font-bold leading-none">
													{s.value}
												</div>
												<div className="text-xs text-muted-foreground">
													{s.label}
												</div>
											</div>
										))}
									</div>
								)}
								{tools.length > 0 && (
									<div className="mt-5">
										<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">
											Ferramentas liberadas
										</div>
										<div className="flex flex-wrap gap-2">
											{tools.map((t) => (
												<span
													key={t.key}
													className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5"
												>
													<Sparkles className="w-3 h-3" /> {t.name}
												</span>
											))}
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				</motion.div>
			</div>
		</section>
	);
}
