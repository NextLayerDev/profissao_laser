'use client';

import { Briefcase, Flag, Smile, Triangle } from 'lucide-react';
import { useState } from 'react';
import {
	LowestDimension,
	MaslowRadar,
} from '@/app/course/(shell)/mentoria/desenvolvimento/_components/desenvolvimento-view';
import { DynamicForm } from '@/modules/mentoria/components/dynamic-form';
import type { MntBusinessPlanVersion, MntGoal } from '@/modules/mentoria/types';
import {
	useBusinessPlanTemplate,
	useMentorBusinessPlans,
	useMentorGoals,
	useMentorGoodNews,
	useMentorMaslow,
} from '../../../_components/admin-hooks';
import { Badge, Card, formatDate } from '../../../_components/ui';
import { AnswersList, QueryState, SectionTitle } from './common';

const GOAL_STATUS: Record<
	MntGoal['status'],
	{ tone: 'green' | 'amber' | 'red' | 'slate' | 'blue'; label: string }
> = {
	not_started: { tone: 'slate', label: 'Não iniciada' },
	in_progress: { tone: 'amber', label: 'Em andamento' },
	done: { tone: 'green', label: 'Concluída' },
	late: { tone: 'red', label: 'Atrasada' },
	cancelled: { tone: 'slate', label: 'Cancelada' },
};

export function DevelopmentTab({ journeyId }: { journeyId: string }) {
	const goodNews = useMentorGoodNews(journeyId);
	const goals = useMentorGoals(journeyId);
	const maslow = useMentorMaslow(journeyId);
	const plans = useMentorBusinessPlans(journeyId);

	const latestMaslow = maslow.data?.at(-1) ?? null;
	const news = goodNews.data;

	return (
		<div className="space-y-10">
			<section>
				<SectionTitle icon={Smile}>Boas Notícias</SectionTitle>
				<QueryState
					loading={goodNews.isLoading}
					error={goodNews.isError}
					empty={!news?.entries.length}
					errorText="Não foi possível carregar as boas notícias."
					emptyText="Nenhuma boa notícia ainda."
				>
					{news && (
						<Card className="p-4 space-y-3">
							<p className="text-sm text-muted" data-testid="mentor-streak">
								Sequência: <b className="text-primary">{news.current_streak}</b>
								/{news.streak_goal} · Recorde: {news.longest_streak}
							</p>
							<ul className="space-y-2">
								{[...news.entries]
									.sort((a, b) => b.posted_on.localeCompare(a.posted_on))
									.slice(0, 5)
									.map((e) => (
										<li key={e.id} className="text-sm">
											<span className="text-muted">
												{formatDate(e.posted_on)}:{' '}
											</span>
											<span className="text-primary">
												{e.news.filter(Boolean).join(' · ')}
											</span>
										</li>
									))}
							</ul>
						</Card>
					)}
				</QueryState>
			</section>

			<section>
				<SectionTitle icon={Flag}>Meta e Ação</SectionTitle>
				<QueryState
					loading={goals.isLoading}
					error={goals.isError}
					empty={!goals.data?.length}
					errorText="Não foi possível carregar as metas."
					emptyText="Nenhuma meta."
				>
					<Card>
						<ul
							className="divide-y divide-slate-100 dark:divide-white/5"
							data-testid="mentor-goals"
						>
							{goals.data?.map((g) => {
								const st = GOAL_STATUS[g.status] ?? {
									tone: 'slate' as const,
									label: g.status,
								};
								return (
									<li key={g.id} className="px-5 py-3">
										<div className="flex items-center gap-2 flex-wrap">
											<p className="font-medium text-primary">{g.title}</p>
											<Badge tone={st.tone}>{st.label}</Badge>
										</div>
										<p className="text-xs text-muted mt-0.5">
											{[
												g.indicator_text,
												g.deadline ? `Prazo ${formatDate(g.deadline)}` : null,
												g.first_action_48h
													? `1ª ação: ${g.first_action_48h}${g.first_action_done_at ? ' ✓' : ''}`
													: null,
											]
												.filter(Boolean)
												.join(' · ')}
										</p>
									</li>
								);
							})}
						</ul>
					</Card>
				</QueryState>
			</section>

			<section>
				<SectionTitle icon={Triangle}>Teste de Maslow</SectionTitle>
				<QueryState
					loading={maslow.isLoading}
					error={maslow.isError}
					empty={!latestMaslow}
					errorText="Não foi possível carregar o Maslow."
					emptyText="Teste ainda não feito."
				>
					{latestMaslow && (
						<Card className="p-5">
							<p
								className="text-sm text-muted mb-2"
								data-testid="mentor-maslow"
							>
								Última aplicação: {formatDate(latestMaslow.taken_at)}
								{(maslow.data?.length ?? 0) > 1
									? ` · ${maslow.data?.length} no total`
									: ''}
							</p>
							<MaslowRadar scores={latestMaslow.scores} />
							<LowestDimension scores={latestMaslow.scores} />
						</Card>
					)}
				</QueryState>
			</section>

			<section>
				<SectionTitle icon={Briefcase}>Plano de Negócios</SectionTitle>
				<QueryState
					loading={plans.isLoading}
					error={plans.isError}
					empty={!plans.data?.length}
					errorText="Não foi possível carregar o plano."
					emptyText="Nenhuma versão do plano."
				>
					<BusinessPlans versions={plans.data ?? []} />
				</QueryState>
			</section>
		</div>
	);
}

function BusinessPlans({ versions }: { versions: MntBusinessPlanVersion[] }) {
	const sorted = [...versions].sort((a, b) => b.version - a.version);
	const [openId, setOpenId] = useState<string | null>(null);
	const open = sorted.find((v) => v.id === openId) ?? null;
	const template = useBusinessPlanTemplate(!!open);
	return (
		<div className="space-y-3">
			<div className="flex flex-wrap gap-2" data-testid="mentor-plans">
				{sorted.map((v) => (
					<button
						key={v.id}
						type="button"
						aria-pressed={openId === v.id}
						onClick={() => setOpenId(openId === v.id ? null : v.id)}
						className={`rounded-control border px-3 py-2 text-left text-sm ${
							openId === v.id
								? 'border-brand bg-brand-wash'
								: 'border-subtle bg-surface hover:border-brand-border'
						}`}
					>
						<span className="font-medium text-primary">
							{v.label ?? `V${v.version}`}
						</span>
						<span className="text-muted"> · {formatDate(v.created_at)}</span>
					</button>
				))}
			</div>
			{open &&
				(template.data ? (
					<DynamicForm
						template={template.data}
						initialAnswers={open.content}
						readOnly
					/>
				) : (
					// Sem o template (erro ou carregando), mostra as respostas cruas.
					<Card className="p-4">
						<AnswersList answers={open.content} />
					</Card>
				))}
		</div>
	);
}
