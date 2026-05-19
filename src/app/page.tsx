import { FaqSection } from '@/components/landing/faq-section';
import { FeatureCards } from '@/components/landing/feature-cards';
import { FinalCTA } from '@/components/landing/final-cta';
import { Hero } from '@/components/landing/hero';
import { JourneySection } from '@/components/landing/journey-section';
import { LandingFooter } from '@/components/landing/landing-footer';
import { NetworkSection } from '@/components/landing/network-section';
import { PlatformSection } from '@/components/landing/platform-section';
import { PricingSection } from '@/components/landing/pricing-section';
import { ProductsSection } from '@/components/landing/products-section';
import { ProfessionalsSection } from '@/components/landing/professionals-section';
import { StatsBar } from '@/components/landing/stats-bar';
import { TargetAudience } from '@/components/landing/target-audience';
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
		<div className="min-h-screen bg-[#0d0d0f] antialiased">
			<TopBar />
			<Hero />
			<StatsBar />
			<FeatureCards />
			<Divider />
			<VideoSection />
			<Divider />
			<Testimonials />
			<Divider />
			<NetworkSection />
			<Divider />
			<PlatformSection />
			<Divider />
			<JourneySection />
			<Divider />
			<TargetAudience />
			<Divider />
			<ProductsSection />
			<Divider />
			<PricingSection />
			<Divider />
			<ProfessionalsSection />
			<Divider />
			<FaqSection />
			<FinalCTA />
			<LandingFooter />
			<WhatsAppButton />
		</div>
	);
}
