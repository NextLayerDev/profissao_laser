import { FaqSection } from '@/components/landing/faq-section';
import { FeatureCards } from '@/components/landing/feature-cards';
import { FinalCTA } from '@/components/landing/final-cta';
import { Hero } from '@/components/landing/hero';
import { LandingFooter } from '@/components/landing/landing-footer';
import { PricingSection } from '@/components/landing/pricing-section';
import { ScrollProgress } from '@/components/landing/scroll-progress';
import { StatsBar } from '@/components/landing/stats-bar';
import { Testimonials } from '@/components/landing/testimonials';
import { TopBar } from '@/components/landing/top-bar';
import { VideoSection } from '@/components/landing/video-section';
import { WhatsAppButton } from '@/components/landing/whatsapp-button';

function Divider() {
	return (
		<div className="max-w-5xl mx-auto px-6">
			<div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
		</div>
	);
}

export default function LandingPage() {
	return (
		<div className="min-h-screen bg-ink-950 antialiased">
			<ScrollProgress />
			<TopBar />
			<Hero />
			<StatsBar />
			<FeatureCards />
			<Divider />
			<VideoSection />
			<Divider />
			<PricingSection />
			<Divider />
			<Testimonials />
			<Divider />
			<FaqSection />
			<FinalCTA />
			<LandingFooter />
			<WhatsAppButton />
		</div>
	);
}
