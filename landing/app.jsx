/* App — root composition, mirrors src/app/page.tsx in repo */

function App() {
	return (
		<div
			className="min-h-screen bg-ink-950 antialiased"
			data-screen-label="Landing Profissão Laser"
		>
			<TopBar />
			<Hero />
			<StatsBar />
			<FeatureGrid />
			<VideoSection />
			<Testimonials />
			<PricingSection />
			<FaqSection />
			<FinalCTA />
			<LandingFooter />
		</div>
	);
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />);
