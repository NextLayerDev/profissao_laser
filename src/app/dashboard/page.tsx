import { Header } from '@/components/dashboard/header';
import { MonthSummary } from '@/components/dashboard/month-summary';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { StatsOverview } from '@/components/dashboard/stats-overview';

export default function Dashboard() {
	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />
			<main className="px-4 md:px-8 py-6 space-y-8">
				<StatsOverview />
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2">
						<RecentActivity />
					</div>
					<div>
						<MonthSummary />
					</div>
				</div>
			</main>
			<footer className="px-4 md:px-8 py-4 mt-4 text-center text-xs text-slate-400 dark:text-gray-600">
				© 2024 Profissão Laser. Todos os direitos reservados.
			</footer>
		</div>
	);
}
