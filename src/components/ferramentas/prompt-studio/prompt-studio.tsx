'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { usePermissions } from '@/modules/access';
import { TOOL_DEFINITION_KEY } from '@/modules/tools/hooks/use-tool-definition';
import {
	type AiToolDefinition,
	type Creation,
	publishToolDefinition,
	type ToolDefinitionDoc,
	updateToolDefinition,
} from '@/modules/tools/services/tool-definitions.service';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { ToolBankAdmin } from '../tool-bank-admin';
import { CardsPanel } from './cards-panel';
import { FormatsPanel } from './formats-panel';

type Tab = 'cards' | 'formatos' | 'avancado';

/**
 * PROMPTS MÁGICOS — a tela única do admin/expert.
 *
 * Antes, alimentar a ferramenta exigia dois lugares: o banco em
 * `/ferramentas/t/prompts_magicos` (o card) e o builder em `/ferramentas` (os
 * formatos, enterrados num editor de definition). Aqui as duas coisas moram
 * juntas e falam a língua do produto: CARDS (o que o aluno escolhe) e
 * FORMATOS (a peça física onde a arte vai). O editor clássico do banco fica
 * em "Avançado" para o que esta tela não mostra (especificações, tamanho por
 * item, nº de fotos) — e nada que ele grava se perde aqui.
 *
 * Ligada pela definition (`ui.admin_studio = 'prompts'`), não pelo nome da
 * tool.
 */
export function PromptStudio({ definition }: { definition: AiToolDefinition }) {
	const [tab, setTab] = useState<Tab>('cards');
	const qc = useQueryClient();
	/**
	 * Gravar a definition (formatos) exige o papel `admin` no upvox. O técnico
	 * com `prompts-magicos.view` cuida dos cards, que moram no banco do motor;
	 * os formatos ele vê, mas não publica — a tela diz isso antes do clique.
	 */
	const { canAdmin } = usePermissions();

	const saveFormats = useMutation({
		mutationFn: async (creations: Creation[]) => {
			const nextDoc = {
				...definition.definition,
				creations,
			} as ToolDefinitionDoc;
			await updateToolDefinition(definition.id, { definition: nextDoc });
			return publishToolDefinition(definition.id);
		},
		onSuccess: () => {
			toast.success('Formatos publicados — o aluno já vê.');
			qc.invalidateQueries({
				queryKey: TOOL_DEFINITION_KEY(definition.tool_key),
			});
			qc.invalidateQueries({ queryKey: ['tool-definitions'] });
		},
		onError: (err) =>
			toast.error(
				getApiErrorMessage(err, 'Não foi possível salvar os formatos.'),
			),
	});

	const tabs: { id: Tab; label: string }[] = [
		{ id: 'cards', label: 'Cards' },
		{ id: 'formatos', label: 'Formatos' },
		{ id: 'avancado', label: 'Avançado' },
	];

	return (
		<div className="space-y-5">
			<div
				role="tablist"
				aria-label="Seções"
				className="flex gap-1 border-b border-white/[0.07]"
			>
				{tabs.map((t) => (
					<button
						key={t.id}
						type="button"
						role="tab"
						aria-selected={tab === t.id}
						onClick={() => setTab(t.id)}
						className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
							tab === t.id
								? 'border-emerald-400 text-white'
								: 'border-transparent text-slate-500 hover:text-slate-200'
						}`}
					>
						{t.label}
					</button>
				))}
			</div>

			{tab === 'cards' && <CardsPanel definition={definition} />}
			{tab === 'formatos' && (
				<FormatsPanel
					// Remonta quando a definition publicada muda: o rascunho nasce dela.
					key={definition.version}
					value={definition.definition.creations ?? []}
					saving={saveFormats.isPending}
					canPublish={canAdmin}
					onSave={(next) => saveFormats.mutate(next)}
				/>
			)}
			{tab === 'avancado' && (
				<div className="space-y-3">
					<p className="text-[13px] text-slate-400">
						Editor completo do banco: especificações do aluno, tamanho por card
						e quantidade de fotos.
					</p>
					<ToolBankAdmin definition={definition} />
				</div>
			)}
		</div>
	);
}
