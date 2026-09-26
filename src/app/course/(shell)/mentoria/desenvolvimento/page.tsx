'use client';

// Desenvolvimento pessoal e direção — 4 abas independentes (Boas Notícias,
// Meta e Ação, Maslow, Plano de Negócios).
//
// Este arquivo é só o CONTAINER de cada aba: gates, busca e mutações. O
// desenho de cada aba mora em `_components/desenvolvimento-view.tsx`, mesma
// separação do Diagnóstico — cada `*Tab` aqui só chama seus hooks quando a
// aba está selecionada, e a rota de conferência
// `app/(dev)/mentoria-desenvolvimento-check` monta as vistas com fixtures.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import {
	useBusinessPlans,
	useGoalMutations,
	useGoals,
	useGoodNews,
	useInvalidateToolProgress,
	useMaslowHistory,
	usePostGoodNews,
	useSubmitMaslow,
} from '@/modules/mentoria/hooks';
import {
	createBusinessPlan,
	getFormTemplate,
} from '@/modules/mentoria/service';
import {
	apiErrorCode,
	apiErrorDetails,
	JourneyGate,
	MntHeader,
	MntSkeleton,
} from '../_components/shared';
import {
	BusinessPlanView,
	DESENVOLVIMENTO_TABS,
	GoalsView,
	GoodNewsView,
	MaslowView,
} from './_components/desenvolvimento-view';

export default function DesenvolvimentoPage() {
	return (
		<SubscriptionGate toolKey="mentoria_360">
			<JourneyGate>
				{({ journeyId }) => <Content journeyId={journeyId} />}
			</JourneyGate>
		</SubscriptionGate>
	);
}

function Content({ journeyId }: { journeyId: string }) {
	const [tab, setTab] = useState<string>('boas-noticias');
	// `?aba=plano` abre direto numa aba (ex.: atalho "Ir para o Plano de
	// Negócios" quando Ferramentas está bloqueada). Lido no mount — sem
	// useSearchParams, que exigiria Suspense no build.
	useEffect(() => {
		const aba = new URLSearchParams(window.location.search).get('aba');
		if (aba && DESENVOLVIMENTO_TABS.some((t) => t.key === aba)) setTab(aba);
	}, []);

	return (
		// Sem `p-4 md:p-8`: o `mentoria/layout.tsx` já aplica o padding da área, e
		// aplicar de novo aqui dobrava a margem em relação às telas irmãs.
		<div className="max-w-5xl mx-auto">
			<MntHeader
				title="Desenvolvimento pessoal e direção"
				subtitle="Boas notícias, metas, autopercepção e plano de negócios"
				icon={Sparkles}
				backHref="/course/mentoria"
			/>

			{/* Pílula com ícone no mesmo desenho do card de navegação da Mentoria —
			    e não o `SegmentedControl` local, cujo `label` é string e não tem
			    lugar para o ícone que identifica cada aba. */}
			<div
				role="tablist"
				aria-label="Seções do desenvolvimento pessoal"
				className="flex flex-wrap gap-2 mb-6"
			>
				{DESENVOLVIMENTO_TABS.map(({ key, label, Icon }) => {
					const active = tab === key;
					return (
						<button
							key={key}
							type="button"
							role="tab"
							aria-selected={active}
							onClick={() => setTab(key)}
							className={`inline-flex items-center gap-2 rounded-control border px-4 py-2 text-label transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
								active
									? // `text-brand` não tem tom escuro no DS — par `dark:`,
										// mesma ressalva do resto da Mentoria.
										'border-brand-border bg-brand-wash text-brand dark:text-violet-400'
									: 'border-subtle text-secondary hover:text-primary hover:bg-surface-sunken'
							}`}
						>
							<Icon className="h-4 w-4 shrink-0" aria-hidden />
							{label}
						</button>
					);
				})}
			</div>

			{tab === 'boas-noticias' && <GoodNewsTab journeyId={journeyId} />}
			{tab === 'metas' && <GoalsTab journeyId={journeyId} />}
			{tab === 'maslow' && <MaslowTab journeyId={journeyId} />}
			{tab === 'plano' && <BusinessPlanTab journeyId={journeyId} />}
		</div>
	);
}

// ── Boas Notícias ────────────────────────────────────────────────────────────
function GoodNewsTab({ journeyId }: { journeyId: string }) {
	const { data, isLoading } = useGoodNews(journeyId);
	const post = usePostGoodNews(journeyId);

	if (isLoading || !data) return <MntSkeleton />;

	return (
		<GoodNewsView
			data={data}
			posting={post.isPending}
			onPost={(news) => {
				if (news.some((n) => !n.trim())) {
					toast.error('Preencha as 3 boas notícias.');
					return;
				}
				post.mutate(news, {
					onSuccess: () => toast.success('Boas notícias registradas! 🎉'),
					onError: (e) =>
						toast.error(
							apiErrorCode(e) === 'already_posted_today'
								? 'Você já registrou as boas notícias de hoje.'
								: 'Não foi possível registrar. Tente de novo.',
						),
				});
			}}
		/>
	);
}

// ── Meta e Ação ──────────────────────────────────────────────────────────────
function GoalsTab({ journeyId }: { journeyId: string }) {
	const { data: goals, isLoading } = useGoals(journeyId);
	const { create, update } = useGoalMutations(journeyId);

	if (isLoading) return <MntSkeleton />;

	return (
		<GoalsView
			goals={goals ?? []}
			creating={create.isPending}
			onCreate={(body, cb) => {
				if (!body.title.trim()) {
					toast.error('Descreva a sua meta.');
					return;
				}
				create.mutate(body, {
					onSuccess: () => {
						toast.success('Meta cadastrada!');
						cb?.onSuccess?.();
					},
					onError: () => toast.error('Não foi possível salvar a meta.'),
				});
			}}
			// Falha silenciosa voltava o select sem explicação.
			updatingGoalId={
				update.isPending ? (update.variables?.goalId ?? null) : null
			}
			onUpdateStatus={(goalId, status) =>
				update.mutate(
					{ goalId, body: { status } },
					{ onError: () => toast.error('Não foi possível atualizar a meta.') },
				)
			}
			onToggleFirstAction={(goalId, done) =>
				update.mutate(
					{ goalId, body: { first_action_done: done } },
					{ onError: () => toast.error('Não foi possível atualizar a meta.') },
				)
			}
			onEdit={(goalId, body, cb) =>
				update.mutate(
					{ goalId, body },
					{
						onSuccess: () => {
							toast.success('Meta salva!');
							cb?.onSuccess?.();
						},
						onError: () => toast.error('Não foi possível salvar a meta.'),
					},
				)
			}
		/>
	);
}

// ── Maslow ───────────────────────────────────────────────────────────────────
function MaslowTab({ journeyId }: { journeyId: string }) {
	const { data: history, isLoading } = useMaslowHistory(journeyId);
	const submit = useSubmitMaslow(journeyId);

	if (isLoading) return <MntSkeleton />;

	return (
		<MaslowView
			history={history ?? []}
			submitting={submit.isPending}
			onSubmit={(answers, cb) =>
				submit.mutate(answers, {
					onSuccess: () => {
						toast.success('Teste aplicado!');
						cb?.onSuccess?.();
					},
					onError: () => toast.error('Não foi possível enviar o teste.'),
				})
			}
		/>
	);
}

// ── Plano de Negócios ────────────────────────────────────────────────────────
function BusinessPlanTab({ journeyId }: { journeyId: string }) {
	const qc = useQueryClient();
	const invalidateProgress = useInvalidateToolProgress();
	const { data: versions, isLoading } = useBusinessPlans(journeyId);
	const { data: template } = useQuery({
		queryKey: ['mentoria', 'form-template', 'plano_negocios'],
		queryFn: () => getFormTemplate('plano_negocios'),
	});

	const create = useMutation({
		mutationFn: (answers: Record<string, unknown>) =>
			createBusinessPlan(journeyId, { content: answers }),
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: ['mentoria', 'business-plans', journeyId],
			});
			// 1ª versão conclui o Plano de Negócios no Mapa.
			invalidateProgress();
			toast.success('Nova versão do plano salva!');
		},
		// A API valida os obrigatórios do formulário plano_negocios: dizer quais.
		onError: (e) => {
			if (apiErrorCode(e) !== 'required_fields_missing') {
				toast.error('Não foi possível salvar o plano.');
				return;
			}
			const missing = apiErrorDetails(e)?.missing;
			const labels = new Map(
				(template?.schema.blocks ?? []).flatMap((b) =>
					b.fields.map((f) => [f.key, f.label] as const),
				),
			);
			const names = Array.isArray(missing)
				? missing.map((k) => labels.get(String(k)) ?? String(k))
				: [];
			toast.error(
				names.length
					? `Falta responder: ${names.join(', ')}.`
					: 'Há campos obrigatórios sem resposta.',
			);
		},
	});

	if (isLoading) return <MntSkeleton />;

	return (
		<BusinessPlanView
			template={template}
			versions={versions ?? []}
			creating={create.isPending}
			onCreate={(answers, cb) =>
				create.mutate(answers, { onSuccess: () => cb?.onSuccess?.() })
			}
		/>
	);
}
