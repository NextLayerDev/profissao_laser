'use client';

import { CanvaView } from '@/components/canva/canva-view';
import { SubscriptionGate } from '@/components/course/subscription-gate';

export default function CanvaCoursePage() {
	// Acesso 100% pelo plano: SubscriptionGate libera só com assinatura ativa
	// (ou conta ilimitada / staff). O uso do ai_canvas é cobrado no próprio editor.
	return (
		<SubscriptionGate>
			<CanvaView />
		</SubscriptionGate>
	);
}
