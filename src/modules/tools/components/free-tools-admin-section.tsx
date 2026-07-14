'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Gift, Loader2, Lock, Wrench } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/empty-state';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import {
	type QuickAccessItem,
	quickAccessItems,
} from '@/utils/constants/quick-access';
import { toolsQueryKey, useTools } from '../hooks/use-tools';
import { createTool, updateTool } from '../services/tools.service';
import type { Tool } from '../types/tools';

/**
 * Espelha o MENU DO ALUNO (quick-access): cada item gated tem um `toolKey`, e o
 * acesso grátis é a flag `tools.is_free` dessa key — a mesma que o
 * `SubscriptionGate` da página consulta via entitlements. Nomes idênticos aos da
 * navbar do cliente, agrupados pelas mesmas seções.
 */

const SECTION_LABELS: Record<QuickAccessItem['section'], string> = {
	CONTEUDO: 'Conteúdo',
	COMUNIDADE: 'Comunidade',
	FERRAMENTAS: 'Ferramentas',
};

const NAV_ITEMS = quickAccessItems.filter(
	(i): i is QuickAccessItem & { toolKey: string } => !!i.toolKey,
);

function FreeToggle({
	label,
	isFree,
	onToggle,
	disabled,
}: {
	label: string;
	isFree: boolean;
	onToggle: () => void;
	disabled: boolean;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={isFree}
			aria-label={
				isFree ? `Tornar "${label}" paga` : `Tornar "${label}" grátis`
			}
			disabled={disabled}
			onClick={onToggle}
			className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-wait ${
				isFree ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/10'
			}`}
		>
			<span
				className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
					isFree ? 'translate-x-5' : 'translate-x-0'
				}`}
			/>
		</button>
	);
}

export function FreeToolsAdminSection() {
	const { data: tools, isLoading, isError } = useTools();
	const qc = useQueryClient();
	const [pendingKey, setPendingKey] = useState<string | null>(null);

	const toggleMut = useMutation({
		// Página sem linha no registry (ex.: Chat/Eventos, que não são cobradas):
		// cria a tool com custo 0 só pra carregar a flag is_free.
		mutationFn: async ({
			item,
			tool,
		}: {
			item: QuickAccessItem & { toolKey: string };
			tool?: Tool;
		}) => {
			if (tool) return updateTool(tool.id, { is_free: !tool.is_free });
			const created = await createTool({
				key: item.toolKey,
				name: item.label,
				description: item.description,
				vox_cost: 0,
				enabled: true,
			});
			return updateTool(created.id, { is_free: true });
		},
		onSuccess: (t) => {
			qc.invalidateQueries({ queryKey: toolsQueryKey });
			toast.success(
				t.is_free ? 'Liberado para não assinantes' : 'Não é mais grátis',
			);
		},
		onError: (err) => toast.error(getApiErrorMessage(err, 'Erro ao atualizar')),
	});

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

	const byKey = new Map((tools ?? []).map((t) => [t.key, t]));
	const sections = (Object.keys(SECTION_LABELS) as QuickAccessItem['section'][])
		.map((section) => ({
			section,
			items: NAV_ITEMS.filter((i) => i.section === section),
		}))
		.filter((s) => s.items.length > 0);

	return (
		<div className="space-y-4">
			{sections.map(({ section, items }) => (
				<div key={section}>
					<p className="px-0.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-gray-400">
						{SECTION_LABELS[section]}
					</p>
					<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] divide-y divide-slate-100 dark:divide-white/5 overflow-hidden">
						{items.map((item) => {
							const tool = byKey.get(item.toolKey);
							const isFree = !!tool?.is_free;
							return (
								<div
									key={item.toolKey}
									className="flex items-center gap-3 px-4 py-3"
								>
									{isFree ? (
										<Gift className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
									) : (
										<Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
									)}
									<div className="flex-1 min-w-0">
										<p className="text-sm text-slate-700 dark:text-gray-200 truncate">
											{item.label}
										</p>
										<p className="text-xs text-slate-400 truncate">
											{item.description}
										</p>
									</div>
									<FreeToggle
										label={item.label}
										isFree={isFree}
										disabled={
											toggleMut.isPending && pendingKey === item.toolKey
										}
										onToggle={() => {
											setPendingKey(item.toolKey);
											toggleMut.mutate(
												{ item, tool },
												{ onSettled: () => setPendingKey(null) },
											);
										}}
									/>
								</div>
							);
						})}
					</div>
				</div>
			))}
		</div>
	);
}
