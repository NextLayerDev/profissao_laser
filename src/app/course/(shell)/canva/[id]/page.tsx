'use client';

import { useParams } from 'next/navigation';
import { CanvaEditor } from '@/components/canva-editor';
import { SubscriptionGate } from '@/components/course/subscription-gate';

export default function DesignEditorPage() {
	const { id } = useParams<{ id: string }>();
	// Acesso 100% pelo plano: SubscriptionGate libera só com assinatura ativa
	// (ou conta ilimitada / staff). O uso do ai_canvas é cobrado no próprio editor.
	return (
		<SubscriptionGate>
			<CanvaEditor designId={id} />
		</SubscriptionGate>
	);
}
