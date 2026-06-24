'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
	type AiToolDefinition,
	type BankConfig,
	bankConfigSchema,
	publishToolDefinition,
	type ToolDefinitionDoc,
	updateToolDefinition,
} from '@/modules/tools/services/tool-definitions.service';
import { ToolBankConfigEditor } from './tool-bank-config-editor';
import { ToolBankManager } from './tool-bank-manager';

/**
 * "Banco do Admin" de uma tool — a tela onde o admin ALIMENTA o banco (lista,
 * cria, edita, reordena registros) e configura a estrutura dele. Reusada em DOIS
 * lugares pra não divergirem: a aba "Banco" do builder (fábrica) e a tela
 * dedicada da tool (`/ferramentas/t/[key]`, acessada pelo menu lateral). Salvar
 * a config = patch do `definition.bank` + publish.
 */
interface ToolBankAdminProps {
	definition: AiToolDefinition;
}

export function ToolBankAdmin({ definition }: ToolBankAdminProps) {
	const qc = useQueryClient();
	const [configOpen, setConfigOpen] = useState(false);

	const bank = useMemo<BankConfig>(
		() => bankConfigSchema.parse(definition.definition.bank ?? {}),
		[definition],
	);

	const saveBank = useMutation({
		mutationFn: async (next: BankConfig) => {
			const nextDoc = {
				...definition.definition,
				bank: next,
			} as ToolDefinitionDoc;
			await updateToolDefinition(definition.id, { definition: nextDoc });
			return publishToolDefinition(definition.id);
		},
		onSuccess: () => {
			toast.success('Banco configurado e publicado 🚀');
			qc.invalidateQueries({ queryKey: ['tool-definitions'] });
			qc.invalidateQueries({ queryKey: ['tools'] });
			qc.invalidateQueries({ queryKey: ['tool-bank', definition.tool_key] });
			setConfigOpen(false);
		},
		onError: (err) => {
			toast.error(
				err instanceof Error ? err.message : 'Falha ao salvar o banco',
			);
		},
	});

	return configOpen ? (
		<ToolBankConfigEditor
			config={bank}
			saving={saveBank.isPending}
			onSave={(c) => saveBank.mutate(c)}
			onClose={() => setConfigOpen(false)}
		/>
	) : (
		<ToolBankManager
			toolKey={definition.tool_key}
			bank={bank}
			onConfigure={() => setConfigOpen(true)}
		/>
	);
}
