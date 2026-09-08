'use client';

import { useParams } from 'next/navigation';
import { DynamicRoomView } from '@/modules/tools/components/dynamic-room-view';
import { DynamicToolView } from '@/modules/tools/components/dynamic-tool-view';
import { useToolDefinition } from '@/modules/tools/hooks/use-tool-definition';

/**
 * Página genérica de uma tool da Fábrica de Tools. Ramifica pelo TIPO de tool
 * (`engine_runtime`): `room_v1` (Mentoria) → `DynamicRoomView` (sessões + sala
 * gateada); qualquer outro → `DynamicToolView` (pipeline). Sem código por tool.
 * Abre com ou sem plano; a trava é a cobrança em voxxys disparada na view.
 */
export default function DynamicToolPage() {
	const params = useParams();
	const key = String(params.key ?? '');
	const { data: def } = useToolDefinition(key);
	const isRoom = def?.engine_runtime === 'room_v1';

	return (
		<>
			{isRoom ? (
				<DynamicRoomView toolKey={key} />
			) : (
				<DynamicToolView toolKey={key} />
			)}
		</>
	);
}
