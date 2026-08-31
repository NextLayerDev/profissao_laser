'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	Briefcase,
	Check,
	Flag,
	Plus,
	Smile,
	Sparkles,
	Triangle,
} from 'lucide-react';
import { useState } from 'react';
import {
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart,
	ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import { DynamicForm } from '@/modules/mentoria/components/dynamic-form';
import {
	useBusinessPlans,
	useGoalMutations,
	useGoals,
	useGoodNews,
	useMaslowHistory,
	usePostGoodNews,
	useSubmitMaslow,
} from '@/modules/mentoria/hooks';
import {
	createBusinessPlan,
	getFormTemplate,
} from '@/modules/mentoria/service';
import type { MntBusinessPlanVersion, MntGoal } from '@/modules/mentoria/types';
import {
	apiErrorCode,
	BTN_GHOST,
	BTN_PRIMARY,
	CARD,
	EmptyState,
	fmtDate,
	INPUT,
	JourneyGate,
	LABEL,
	MntHeader,
	MntSkeleton,
} from '../_components/shared';

const TABS = [
	{ key: 'boas-noticias', label: 'Boas Notícias', Icon: Smile },
	{ key: 'metas', label: 'Meta e Ação', Icon: Flag },
	{ key: 'maslow', label: 'Teste de Maslow', Icon: Triangle },
	{ key: 'plano', label: 'Plano de Negócios', Icon: Briefcase },
] as const;

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

	return (
		<div className="p-4 md:p-8 max-w-5xl mx-auto">
			<MntHeader
				title="Desenvolvimento pessoal e direção"
				subtitle="Boas notícias, metas, autopercepção e plano de negócios"
				icon={Sparkles}
				backHref="/course/mentoria"
			/>

			<div className="flex flex-wrap gap-2 mb-6">
				{TABS.map(({ key, label, Icon }) => (
					<button
						key={key}
						type="button"
						onClick={() => setTab(key)}
						className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium border transition ${
							tab === key
								? 'bg-teal-500/15 border-teal-500/50 text-teal-600 dark:text-teal-400'
								: 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5'
						}`}
					>
						<Icon className="w-4 h-4" />
						{label}
					</button>
				))}
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
	const [news, setNews] = useState(['', '', '']);

	if (isLoading || !data) return <MntSkeleton />;

	const submit = () => {
		if (news.some((n) => !n.trim())) {
			toast.error('Preencha as 3 boas notícias.');
			return;
		}
		post.mutate(
			news.map((n) => n.trim()),
			{
				onSuccess: () => {
					setNews(['', '', '']);
					toast.success('Boas notícias registradas! 🎉');
				},
				onError: (e) =>
					toast.error(
						apiErrorCode(e) === 'already_posted_today'
							? 'Você já registrou as boas notícias de hoje.'
							: 'Não foi possível registrar. Tente de novo.',
					),
			},
		);
	};

	return (
		<div className="space-y-6">
			{/* Streak de 7 dias */}
			<div className={`${CARD} p-5`}>
				<div className="flex items-center justify-between mb-4">
					<h3 className="font-semibold text-slate-900 dark:text-slate-100">
						Sequência de {data.streak_goal} dias
					</h3>
					<span className="text-sm text-slate-500 dark:text-gray-400">
						Atual: <b>{data.current_streak}</b> · Recorde:{' '}
						<b>{data.longest_streak}</b>
					</span>
				</div>
				<div className="flex flex-wrap gap-2">
					{Array.from({ length: data.streak_goal }, (_, i) => {
						const filled = i < data.current_streak;
						return (
							<div
								key={String(i)}
								className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs border ${
									filled
										? 'bg-teal-500/15 border-teal-500/40 text-teal-600 dark:text-teal-400'
										: 'border-slate-200 dark:border-white/10 text-slate-400'
								}`}
							>
								Dia {i + 1} {filled ? '✓' : '○'}
							</div>
						);
					})}
				</div>
			</div>

			{/* Postar hoje */}
			<div className={`${CARD} p-5`}>
				<h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
					Hoje, quais são suas 3 boas notícias?
				</h3>
				{data.posted_today ? (
					<p className="text-sm text-teal-600 dark:text-teal-400 mt-2">
						✓ Você já registrou as boas notícias de hoje. Volte amanhã!
					</p>
				) : (
					<div className="space-y-3 mt-4">
						{news.map((value, i) => (
							<input
								// biome-ignore lint/suspicious/noArrayIndexKey: posição fixa 1-3
								key={i}
								className={INPUT}
								placeholder={`${i + 1}.`}
								value={value}
								onChange={(e) =>
									setNews((prev) =>
										prev.map((p, j) => (j === i ? e.target.value : p)),
									)
								}
							/>
						))}
						<button
							type="button"
							onClick={submit}
							disabled={post.isPending}
							className={BTN_PRIMARY}
						>
							Registrar boas notícias
						</button>
					</div>
				)}
			</div>

			{/* Histórico */}
			{data.entries.length > 0 && (
				<div className={`${CARD} p-5`}>
					<h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
						Mural
					</h3>
					<div className="space-y-4">
						{data.entries.map((entry) => (
							<div
								key={entry.id}
								className="border-l-2 border-teal-500/40 pl-4"
							>
								<p className="text-xs text-slate-400 mb-1">
									{fmtDate(entry.posted_on)}
								</p>
								<ul className="text-sm text-slate-700 dark:text-slate-300 space-y-0.5">
									{entry.news.map((n) => (
										<li key={n}>• {n}</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

// ── Meta e Ação ──────────────────────────────────────────────────────────────
const GOAL_STATUS: Array<{ value: MntGoal['status']; label: string }> = [
	{ value: 'not_started', label: 'Não iniciada' },
	{ value: 'in_progress', label: 'Em andamento' },
	{ value: 'done', label: 'Concluída' },
	{ value: 'late', label: 'Atrasada' },
	{ value: 'cancelled', label: 'Cancelada' },
];

function GoalsTab({ journeyId }: { journeyId: string }) {
	const { data: goals, isLoading } = useGoals(journeyId);
	const { create, update } = useGoalMutations(journeyId);
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState({
		title: '',
		indicator_text: '',
		deadline: '',
		first_action_48h: '',
	});

	if (isLoading) return <MntSkeleton />;

	const submit = () => {
		if (!form.title.trim()) {
			toast.error('Descreva a sua meta.');
			return;
		}
		create.mutate(
			{
				title: form.title,
				indicator_text: form.indicator_text || null,
				deadline: form.deadline || null,
				first_action_48h: form.first_action_48h || null,
			},
			{
				onSuccess: () => {
					setShowForm(false);
					setForm({
						title: '',
						indicator_text: '',
						deadline: '',
						first_action_48h: '',
					});
					toast.success('Meta cadastrada!');
				},
				onError: () => toast.error('Não foi possível salvar a meta.'),
			},
		);
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<button
					type="button"
					onClick={() => setShowForm((v) => !v)}
					className={BTN_PRIMARY}
				>
					<Plus className="w-4 h-4" />
					Nova meta
				</button>
			</div>

			{showForm && (
				<div className={`${CARD} p-5 space-y-4`}>
					<div>
						<span className={LABEL}>Minha meta</span>
						<textarea
							className={`${INPUT} min-h-20`}
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
						/>
					</div>
					<div>
						<span className={LABEL}>Indicador que comprova que alcancei</span>
						<input
							className={INPUT}
							value={form.indicator_text}
							onChange={(e) =>
								setForm({ ...form, indicator_text: e.target.value })
							}
						/>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<span className={LABEL}>Prazo</span>
							<input
								type="date"
								className={INPUT}
								value={form.deadline}
								onChange={(e) => setForm({ ...form, deadline: e.target.value })}
							/>
						</div>
						<div>
							<span className={LABEL}>Primeira ação nas próximas 48 horas</span>
							<input
								className={INPUT}
								value={form.first_action_48h}
								onChange={(e) =>
									setForm({ ...form, first_action_48h: e.target.value })
								}
							/>
						</div>
					</div>
					<button
						type="button"
						onClick={submit}
						disabled={create.isPending}
						className={BTN_PRIMARY}
					>
						Cadastrar meta
					</button>
				</div>
			)}

			{(goals ?? []).length === 0 && !showForm ? (
				<EmptyState
					icon={Flag}
					title="Nenhuma meta cadastrada"
					description="Cadastre sua meta com o indicador que comprova o resultado e a primeira ação das próximas 48 horas."
				/>
			) : (
				(goals ?? []).map((goal) => (
					<div key={goal.id} className={`${CARD} p-5`}>
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div className="min-w-0 flex-1">
								<p className="font-semibold text-slate-900 dark:text-slate-100">
									{goal.title}
								</p>
								{goal.indicator_text && (
									<p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
										Indicador: {goal.indicator_text}
									</p>
								)}
								<p className="text-xs text-slate-400 mt-1">
									Prazo: {fmtDate(goal.deadline)}
								</p>
							</div>
							<select
								className={`${INPUT} w-auto`}
								value={goal.status}
								onChange={(e) =>
									update.mutate({
										goalId: goal.id,
										body: { status: e.target.value },
									})
								}
							>
								{GOAL_STATUS.map((s) => (
									<option key={s.value} value={s.value}>
										{s.label}
									</option>
								))}
							</select>
						</div>
						{goal.first_action_48h && (
							<button
								type="button"
								onClick={() =>
									update.mutate({
										goalId: goal.id,
										body: { first_action_done: !goal.first_action_done_at },
									})
								}
								className={`mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm border transition ${
									goal.first_action_done_at
										? 'bg-teal-500/15 border-teal-500/40 text-teal-600 dark:text-teal-400'
										: 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
								}`}
							>
								<Check className="w-4 h-4" />
								Ação 48h: {goal.first_action_48h}
							</button>
						)}
					</div>
				))
			)}
		</div>
	);
}

// ── Maslow ───────────────────────────────────────────────────────────────────
const MASLOW_STATEMENTS: Array<{ dimension: string; items: string[] }> = [
	{
		dimension: 'Fisiologia',
		items: [
			'Tenho dormido bem e acordo com energia para o dia.',
			'Minha alimentação e rotina de cuidados com o corpo estão em dia.',
			'Minha renda cobre com tranquilidade as necessidades básicas da minha casa.',
		],
	},
	{
		dimension: 'Segurança',
		items: [
			'Sinto que minha empresa me dá estabilidade financeira.',
			'Tenho reservas ou um plano para imprevistos.',
			'Me sinto seguro(a) em relação ao futuro do meu trabalho.',
		],
	},
	{
		dimension: 'Pertencimento',
		items: [
			'Tenho pessoas com quem posso contar de verdade.',
			'Me sinto parte de uma comunidade (família, amigos, grupo profissional).',
			'Minhas relações pessoais estão saudáveis.',
		],
	},
	{
		dimension: 'Estima',
		items: [
			'Me sinto reconhecido(a) pelo trabalho que faço.',
			'Tenho orgulho do que construí até aqui.',
			'Confio na minha capacidade de tomar boas decisões.',
		],
	},
	{
		dimension: 'Autorrealização',
		items: [
			'Sinto que estou evoluindo como pessoa e profissional.',
			'Meu trabalho tem propósito e me realiza.',
			'Estou construindo a vida que eu quero viver.',
		],
	},
];

const MASLOW_LABELS: Record<string, string> = {
	fisiologia: 'Fisiologia',
	seguranca: 'Segurança',
	pertencimento: 'Pertencimento',
	estima: 'Estima',
	autorrealizacao: 'Autorrealização',
};

function MaslowTab({ journeyId }: { journeyId: string }) {
	const { data: history, isLoading } = useMaslowHistory(journeyId);
	const submit = useSubmitMaslow(journeyId);
	const [answers, setAnswers] = useState<Array<number | null>>(
		Array.from({ length: 15 }, () => null),
	);
	const [showTest, setShowTest] = useState(false);

	if (isLoading) return <MntSkeleton />;

	const latest = history?.at(-1) ?? null;

	const send = () => {
		if (answers.some((a) => a === null)) {
			toast.error('Responda todas as 15 afirmações.');
			return;
		}
		submit.mutate(answers as number[], {
			onSuccess: () => {
				setShowTest(false);
				setAnswers(Array.from({ length: 15 }, () => null));
				toast.success('Teste aplicado!');
			},
			onError: () => toast.error('Não foi possível enviar o teste.'),
		});
	};

	return (
		<div className="space-y-6">
			<div className={`${CARD} p-4 text-xs text-slate-500 dark:text-gray-400`}>
				O Teste de Maslow é uma ferramenta educacional de autopercepção — não é
				um diagnóstico psicológico. Pontue cada afirmação de 0 (discordo
				totalmente) a 4 (concordo totalmente).
			</div>

			{latest && !showTest && (
				<div className={`${CARD} p-5`}>
					<div className="flex items-center justify-between mb-2">
						<h3 className="font-semibold text-slate-900 dark:text-slate-100">
							Sua última aplicação ({fmtDate(latest.taken_at)})
						</h3>
						<button
							type="button"
							onClick={() => setShowTest(true)}
							className={BTN_GHOST}
						>
							Refazer teste
						</button>
					</div>
					<MaslowRadar scores={latest.scores} />
					<LowestDimension scores={latest.scores} />
					{(history?.length ?? 0) > 1 && (
						<div className="mt-4 text-sm text-slate-500 dark:text-gray-400">
							Aplicações anteriores:{' '}
							{history
								?.slice(0, -1)
								.map((h) => fmtDate(h.taken_at))
								.join(' · ')}
						</div>
					)}
				</div>
			)}

			{(!latest || showTest) && (
				<div className={`${CARD} p-5 space-y-6`}>
					{MASLOW_STATEMENTS.map((group, g) => (
						<div key={group.dimension}>
							<h4 className="text-sm font-semibold text-teal-600 dark:text-teal-400 mb-3">
								{group.dimension}
							</h4>
							<div className="space-y-4">
								{group.items.map((statement, i) => {
									const index = g * 3 + i;
									return (
										<div key={statement}>
											<p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
												{statement}
											</p>
											<div className="flex gap-2">
												{[0, 1, 2, 3, 4].map((score) => (
													<button
														key={score}
														type="button"
														onClick={() =>
															setAnswers((prev) =>
																prev.map((p, j) => (j === index ? score : p)),
															)
														}
														className={`w-9 h-9 rounded-lg text-sm border transition ${
															answers[index] === score
																? 'bg-teal-600 text-white border-teal-600'
																: 'border-slate-200 dark:border-white/10 text-slate-500'
														}`}
													>
														{score}
													</button>
												))}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					))}
					<button
						type="button"
						onClick={send}
						disabled={submit.isPending}
						className={BTN_PRIMARY}
					>
						Enviar teste
					</button>
				</div>
			)}
		</div>
	);
}

function MaslowRadar({ scores }: { scores: Record<string, number> }) {
	const data = Object.entries(scores).map(([key, value]) => ({
		dimension: MASLOW_LABELS[key] ?? key,
		pct: value,
	}));
	return (
		<ResponsiveContainer width="100%" height={280}>
			<RadarChart data={data} outerRadius="70%">
				<PolarGrid
					stroke="currentColor"
					className="text-slate-200 dark:text-white/10"
				/>
				<PolarAngleAxis
					dataKey="dimension"
					tick={{ fontSize: 11, fill: 'currentColor' }}
				/>
				<PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
				<Radar
					dataKey="pct"
					stroke="#14b8a6"
					fill="#14b8a6"
					fillOpacity={0.35}
				/>
			</RadarChart>
		</ResponsiveContainer>
	);
}

function LowestDimension({ scores }: { scores: Record<string, number> }) {
	const lowest = Object.entries(scores).sort((a, b) => a[1] - b[1])[0];
	if (!lowest) return null;
	return (
		<p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
			💡 A dimensão que merece maior atenção agora é{' '}
			<b>{MASLOW_LABELS[lowest[0]] ?? lowest[0]}</b> ({lowest[1]}%).
		</p>
	);
}

// ── Plano de Negócios ────────────────────────────────────────────────────────
function BusinessPlanTab({ journeyId }: { journeyId: string }) {
	const qc = useQueryClient();
	const { data: versions, isLoading } = useBusinessPlans(journeyId);
	const { data: template } = useQuery({
		queryKey: ['mentoria', 'form-template', 'plano_negocios'],
		queryFn: () => getFormTemplate('plano_negocios'),
	});
	const [editing, setEditing] = useState(false);
	const [answers, setAnswers] = useState<Record<string, unknown>>({});
	const [viewing, setViewing] = useState<MntBusinessPlanVersion | null>(null);

	const create = useMutation({
		mutationFn: () => createBusinessPlan(journeyId, { content: answers }),
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: ['mentoria', 'business-plans', journeyId],
			});
			setEditing(false);
			setAnswers({});
			toast.success('Nova versão do plano salva!');
		},
		onError: () => toast.error('Não foi possível salvar o plano.'),
	});

	if (isLoading) return <MntSkeleton />;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<p className="text-sm text-slate-500 dark:text-gray-400">
					Cada envio gera uma nova versão imutável — assim dá pra comparar V1,
					V2... ao longo dos anos.
				</p>
				{template && (
					<button
						type="button"
						onClick={() => {
							setEditing((v) => !v);
							setViewing(null);
						}}
						className={BTN_PRIMARY}
					>
						<Plus className="w-4 h-4" />
						Nova versão
					</button>
				)}
			</div>

			{editing && template && (
				<div className="space-y-4">
					<DynamicForm
						template={template}
						initialAnswers={answers}
						onChange={setAnswers}
					/>
					<button
						type="button"
						onClick={() => create.mutate()}
						disabled={create.isPending}
						className={BTN_PRIMARY}
					>
						Salvar como nova versão
					</button>
				</div>
			)}

			{(versions ?? []).length === 0 && !editing ? (
				<EmptyState
					icon={Briefcase}
					title="Nenhuma versão do plano de negócios"
					description="Crie a V1 do seu plano — ela fica registrada para sempre e vira base de comparação."
				/>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					{(versions ?? []).map((v) => (
						<button
							key={v.id}
							type="button"
							onClick={() => {
								setViewing(viewing?.id === v.id ? null : v);
								setEditing(false);
							}}
							className={`${CARD} p-4 text-left hover:border-teal-500/40 transition`}
						>
							<p className="font-semibold text-slate-900 dark:text-slate-100">
								{v.label ?? `V${v.version}`}
							</p>
							<p className="text-xs text-slate-400 mt-0.5">
								{fmtDate(v.created_at)}
							</p>
						</button>
					))}
				</div>
			)}

			{viewing && template && (
				<div>
					<h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
						{viewing.label ?? `V${viewing.version}`} (somente leitura)
					</h3>
					<DynamicForm
						template={template}
						initialAnswers={viewing.content}
						readOnly
					/>
				</div>
			)}
		</div>
	);
}
