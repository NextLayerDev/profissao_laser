'use client';

import { useParams } from 'next/navigation';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import { DynamicRoomView } from '@/modules/tools/components/dynamic-room-view';
import { DynamicToolView } from '@/modules/tools/components/dynamic-tool-view';
import { useToolDefinition } from '@/modules/tools/hooks/use-tool-definition';

/**
 * Página genérica de uma tool da Fábrica de Tools. Ramifica pelo TIPO de tool
 * (`engine_runtime`): `room_v1` (Mentoria) → `DynamicRoomView` (sessões + sala
 * gateada); qualquer outro → `DynamicToolView` (pipeline). Sem código por tool.
 * Acesso 100% pelo plano (SubscriptionGate); cobrança disparada na view.
 */
export default function DynamicToolPage() {
	const params = useParams();
	const key = String(params.key ?? '');
	const { data: def } = useToolDefinition(key);
	const isRoom = def?.engine_runtime === 'room_v1';

	return (
		<SubscriptionGate toolKey={key}>
			{isRoom ? (
				<DynamicRoomView toolKey={key} />
			) : (
				<DynamicToolView toolKey={key} />
			)}
		</SubscriptionGate>
	);
}
