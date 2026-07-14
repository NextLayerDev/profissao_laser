'use client';

import { BibliotecaVetoresView } from '@/components/biblioteca/biblioteca-vetores-view';
import { SubscriptionGate } from '@/components/course/subscription-gate';

export default function BibliotecaCoursePage() {
	// Acesso 100% pelo plano: SubscriptionGate libera só com assinatura ativa
	// (ou conta ilimitada / staff).
	return (
		<SubscriptionGate toolKey="biblioteca_vetores">
			<BibliotecaVetoresView />
		</SubscriptionGate>
	);
}
