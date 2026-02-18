import { Alerts } from '@/components/dashboard/alerts';
import { ChatButton } from '@/components/dashboard/chat-button';
import { Header } from '@/components/dashboard/header';
import { QuickAccess } from '@/components/dashboard/quick-access';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';

export default function Dashboard() {
	return (
		<div className="min-h-screen bg-[#0d0d0f] text-white font-sans">
			<Header />

			<main className="px-8 py-6">
				<WelcomeBanner />
				<StatsOverview />

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<QuickAccess />
					<Alerts />
				</div>
			</main>

			<ChatButton />
		</div>
	);
}
