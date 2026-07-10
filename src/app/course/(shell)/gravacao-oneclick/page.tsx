'use client';

import { SubscriptionGate } from '@/components/course/subscription-gate';
import { GravacaoOneClickView } from '@/components/gravacao-oneclick/gravacao-oneclick-view';

export default function GravacaoOneClickCoursePage() {
	// Acesso 100% pelo plano: SubscriptionGate libera só com assinatura ativa
	// (ou conta ilimitada / staff). O uso/cobrança é gatilhado dentro da view.
	return (
		<SubscriptionGate toolKey="gravacao_oneclick">
			<GravacaoOneClickView />
		</SubscriptionGate>
	);
}
