'use client';

import { SubscriptionGate } from '@/components/course/subscription-gate';
import { VetorizacaoView } from '@/components/vetorizacao/vetorizacao-view';

export default function VetorizacaoCoursePage() {
	// Acesso 100% pelo plano: SubscriptionGate libera só com assinatura ativa
	// (ou conta ilimitada / staff). O uso da ferramenta é gatilhado no PR3.
	return (
		<SubscriptionGate toolKey="vectorize">
			<VetorizacaoView />
		</SubscriptionGate>
	);
}
