'use client';

import { Eye } from 'lucide-react';
import { useState } from 'react';
import { DynamicRoomView } from '@/modules/tools/components/dynamic-room-view';
import { RoomEditContext } from '@/modules/tools/lib/room-ui';
import type { AiToolDefinition } from '@/modules/tools/services/tool-definitions.service';
import type { BuilderRoomState } from './builder-model';
import { RoomAppearanceSection } from './room-appearance-section';

/**
 * Aparência: FORMULÁRIO (esquerda) + CANVAS clicável (direita) lado a lado.
 * Clicar num elemento do canvas seleciona/rola até o campo no form; editar no
 * form reflete no canvas na hora (via previewDef). Sincronizados por `screen`
 * (Aluno/Admin) + `selected`.
 */
export function RoomAppearanceEditor({
	room,
	setRoom,
	previewDef,
}: {
	room: BuilderRoomState;
	setRoom: (partial: Partial<BuilderRoomState>) => void;
	previewDef: AiToolDefinition | null;
}) {
	const [screen, setScreen] = useState<'customer' | 'admin'>('customer');
	const [selected, setSelected] = useState<string>();

	// Clique no canvas → seleciona + rola/foca o campo correspondente no form.
	const focusField = (field: string) => {
		setSelected(field);
		if (typeof document === 'undefined') return;
		const el = document.getElementById(
			field === 'banner' ? 'ap-banner' : `ap-${field}`,
		);
		if (!el) return;
		el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		if (el instanceof HTMLInputElement) el.focus({ preventScroll: true });
	};

	return (
		<div className="grid gap-4 lg:grid-cols-2">
			<RoomAppearanceSection
				room={room}
				setRoom={setRoom}
				screen={screen}
				onScreenChange={(s) => {
					setScreen(s);
					setSelected(undefined);
				}}
				selectedField={selected}
				onFieldFocus={setSelected}
			/>
			<div className="lg:sticky lg:top-[148px] lg:self-start">
				<div className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-violet-300">
					<Eye className="h-3.5 w-3.5" /> Clique nos elementos pra editar
				</div>
				<div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-50 p-3 dark:bg-[#0c0f12]">
					{previewDef ? (
						<RoomEditContext.Provider
							value={{ editable: true, selected, onPick: focusField }}
						>
							<DynamicRoomView
								toolKey={previewDef.tool_key}
								definitionOverride={previewDef}
								previewAs={screen}
							/>
						</RoomEditContext.Provider>
					) : (
						<p className="p-6 text-sm text-rose-400">
							Defina o nome/identificador da tool pra ver o preview.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
