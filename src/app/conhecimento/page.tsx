'use client';

import { BookOpen, FlaskConical, History, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AiPanel } from '@/components/conhecimento/ai-panel';
import { AnswersTab } from '@/components/conhecimento/answers-tab';
import { ConhecimentoHeader } from '@/components/conhecimento/header';
import { PlaygroundTab } from '@/components/conhecimento/playground-tab';
import { RunsTab } from '@/components/conhecimento/runs-tab';
import { SourcesTab } from '@/components/conhecimento/sources-tab';
import { TeachPanel } from '@/components/conhecimento/teach-panel';
import { Header } from '@/components/dashboard/header';
import { useKbHealth, useKbSyncRuns } from '@/hooks/use-ai-knowledge';
import { usePermissions } from '@/modules/access';
import type { KbSourceKind } from '@/types/ai-knowledge';
import { canSeeNavItem } from '@/utils/constants/permissions';

type Tab = 'conhecimentos' | 'testar' | 'respostas' | 'historico';

const TABS: { key: Tab; label: string; icon: typeof BookOpen }[] = [
	{ key: 'conhecimentos', label: 'Conhecimentos', icon: BookOpen },
	{ key: 'testar', label: 'Testar a IA', icon: FlaskConical },
	{ key: 'respostas', label: 'Respostas da IA', icon: MessageSquare },
	{ key: 'historico', label: 'Histórico', icon: History },
];

export default function ConhecimentoPage() {
	const router = useRouter();
	const { can, isLoading } = usePermissions();
	// Mesma porta do Suporte: quem atende o chat cuida do cérebro da IA.
	const allowed = canSeeNavItem('Cérebro da IA', can);
	// A API deriva a permissão do método HTTP: POST/PATCH → edit, DELETE → delete.
	const canEdit = can('suporte.edit');
	const canDelete = can('suporte.delete');

	const [activeTab, setActiveTab] = useState<Tab>('conhecimentos');
	const [teachOpen, setTeachOpen] = useState(false);
	const [activeRunId, setActiveRunId] = useState<string | null>(null);
	const [adopted, setAdopted] = useState(false);
	/** Escopo pré-marcado quando a staff clica em "Ensinar isso" num ponto cego. */
	const [teachScopes, setTeachScopes] = useState<KbSourceKind[] | null>(null);
	/** Filtro empurrado pelo topo (clicar numa faixa da composição / numa ordem). */
	const [pushedFilter, setPushedFilter] = useState<{
		kind?: KbSourceKind;
		status?: 'error';
		nonce: number;
	} | null>(null);

	const { data: health } = useKbHealth();
	const { data: runs } = useKbSyncRuns(10);

	// Deep-link: /conhecimento?tab=testar abre direto na aba pedida.
	useEffect(() => {
		const tab = new URLSearchParams(window.location.search).get('tab');
		if (tab && TABS.some((t) => t.key === tab)) {
			setActiveTab(tab as Tab);
		}
	}, []);

	// Já tem varredura rodando ao abrir a tela? Adota — um F5 não pode fazer a
	// staff achar que o progresso se perdeu.
	useEffect(() => {
		if (adopted || !runs) return;
		const running = runs.find((r) => r.status === 'running');
		if (running) setActiveRunId(running.id);
		setAdopted(true);
	}, [runs, adopted]);

	useEffect(() => {
		if (!isLoading && !allowed) {
			router.replace('/dashboard');
		}
	}, [allowed, isLoading, router]);

	if (isLoading || !allowed) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-slate-600 dark:text-gray-400">A carregar...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />

			<div className="px-4 md:px-8 pt-4 space-y-4">
				<ConhecimentoHeader
					health={health}
					canEdit={canEdit}
					onTeach={() => {
						setTeachScopes(null);
						setTeachOpen(true);
					}}
				/>

				<TeachPanel
					open={teachOpen}
					onClose={() => {
						setTeachOpen(false);
						setTeachScopes(null);
					}}
					activeRunId={activeRunId}
					onRunChange={setActiveRunId}
					canEdit={canEdit}
					preselectedScopes={teachScopes}
				/>
			</div>

			{/* Tabs */}
			<div className="px-4 md:px-8 pt-3 border-b border-slate-200 dark:border-white/10">
				<div className="flex gap-1 overflow-x-auto">
					{TABS.map((tab) => {
						const Icon = tab.icon;
						return (
							<button
								key={tab.key}
								type="button"
								onClick={() => setActiveTab(tab.key)}
								className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-all border-b-2 -mb-px whitespace-nowrap ${
									activeTab === tab.key
										? 'text-violet-600 dark:text-violet-400 border-violet-500 bg-transparent'
										: 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
								}`}
							>
								<Icon className="w-4 h-4" />
								{tab.label}
							</button>
						);
					})}
				</div>
			</div>

			<div className="px-4 md:px-8 py-6">
				{/* Meio a meio: a lista à esquerda, o desempenho da IA à direita.
				    Em telas menores o painel desce pra baixo da lista. */}
				{activeTab === 'conhecimentos' && (
					<div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
						<SourcesTab
							canEdit={canEdit}
							canDelete={canDelete}
							onTeach={() => setTeachOpen(true)}
							pushedFilter={pushedFilter}
						/>
						{/* Gruda no topo: a lista é muito mais alta que o painel, e sem
						    isso o desempenho da IA some da vista já na primeira rolagem. */}
						<div className="xl:sticky xl:top-4">
							<AiPanel
								health={health}
								canEdit={canEdit}
								onTeach={() => {
									setTeachScopes(null);
									setTeachOpen(true);
								}}
								onTeachScopes={(scopes) => {
									setTeachScopes(scopes);
									setTeachOpen(true);
								}}
								onFilterKind={(kind) =>
									setPushedFilter({ kind, nonce: Date.now() })
								}
								onFilterStatus={(status) =>
									setPushedFilter({ status, nonce: Date.now() })
								}
							/>
						</div>
					</div>
				)}
				{activeTab === 'testar' && <PlaygroundTab canEdit={canEdit} />}
				{activeTab === 'respostas' && <AnswersTab />}
				{activeTab === 'historico' && <RunsTab canEdit={canEdit} />}
			</div>
		</div>
	);
}
