import type { Metadata } from 'next';
import { PricingSection } from '@/components/landing/pricing-section';
import { AboutFernando } from '@/components/lp/AboutFernando';
import { CtaFooter } from '@/components/lp/CtaFooter';
import { EcosystemVideo } from '@/components/lp/EcosystemVideo';
import { Faq } from '@/components/lp/Faq';
import { Header } from '@/components/lp/Header';
import { Hero } from '@/components/lp/Hero';
import { Testimonials } from '@/components/lp/Testimonials';
import { Tools } from '@/components/lp/Tools';

export const metadata: Metadata = {
	title: 'Comunidade Profissão Laser — Cresça no mercado do laser',
	description:
		'Aulas, parâmetros, vetorização, fornecedores e networking — tudo que um profissional do laser precisa em um só lugar.',
};

export default function LandingPage() {
	return (
		<div className="lp-root min-h-screen bg-background text-foreground antialiased">
			<Header />
			<main>
				<Hero />
				<EcosystemVideo />
				<Tools />
				{/* Seção de planos: lógica + exibição + compra atuais (inalterada). */}
				<PricingSection />
				<Testimonials />
				<Faq />
				<AboutFernando />
				<CtaFooter />
			</main>
		</div>
	);
}
