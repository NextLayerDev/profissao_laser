import { AntiFraudWatermark } from '@/components/antifraud/anti-fraud-watermark';
import { PrintGuard } from '@/components/antifraud/print-guard';
import { AntifraudProvider } from '@/contexts/antifraud-context';

export default function CourseLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<AntifraudProvider>
			{children}
			<PrintGuard />
			<AntiFraudWatermark />
		</AntifraudProvider>
	);
}
