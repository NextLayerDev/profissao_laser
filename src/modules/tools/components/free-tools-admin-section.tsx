'use client';

import { Gift, Loader2, Lock, Wrench } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { VoxxysIcon } from '@/components/ui/voxxys-icon';
import { formatVox } from '@/lib/format';
import { useTools } from '../hooks/use-tools';
import { useUpdateTool } from '../hooks/use-update-tool';
import type { Tool } from '../types/tools';

function ToolFreeToggle({
	tool,
	onToggle,
	disabled,
}: {
	tool: Tool;
	onToggle: () => void;
	disabled: boolean;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={tool.is_free}
			aria-label={
				tool.is_free
					? `Tornar "${tool.name}" paga`
					: `Tornar "${tool.name}" grátis`
			}
			disabled={disabled}
			onClick={onToggle}
			className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-wait ${
				tool.is_free ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/10'
			}`}
		>
			<span
				className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
					tool.is_free ? 'translate-x-5' : 'translate-x-0'
				}`}
			/>
		</button>
	);
}

export function FreeToolsAdminSection() {
	const { data: tools, isLoading, isError } = useTools();
	const updateMut = useUpdateTool();
	const [pendingId, setPendingId] = useState<string | null>(null);

	if (isLoading) {
		return (
			<div className="flex justify-center py-16">
				<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	if (isError) {
		return (
			<EmptyState
				icon={Wrench}
				title="Não foi possível carregar as ferramentas"
				description="Tente novamente em instantes."
			/>
		);
	}

	if ((tools ?? []).length === 0) {
		return (
			<EmptyState
				icon={Wrench}
				title="Nenhuma ferramenta cadastrada"
				description="Crie uma ferramenta na aba Funcionalidades para liberá-la aqui."
			/>
		);
	}

	return (
		<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] divide-y divide-slate-100 dark:divide-white/5 overflow-hidden">
			{(tools ?? []).map((tool) => (
				<div key={tool.id} className="flex items-center gap-3 px-4 py-3">
					{tool.is_free ? (
						<Gift className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
					) : (
						<Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
					)}
					<div className="flex-1 min-w-0">
						<p className="text-sm text-slate-700 dark:text-gray-200 truncate">
							{tool.name}
						</p>
						<p className="text-xs text-slate-400 flex items-center gap-1">
							<VoxxysIcon className="w-3 h-3" />
							{formatVox(tool.vox_cost)} voxxys/uso
						</p>
					</div>
					<ToolFreeToggle
						tool={tool}
						disabled={updateMut.isPending && pendingId === tool.id}
						onToggle={() => {
							setPendingId(tool.id);
							updateMut.mutate(
								{ id: tool.id, payload: { is_free: !tool.is_free } },
								{ onSettled: () => setPendingId(null) },
							);
						}}
					/>
				</div>
			))}
		</div>
	);
}
