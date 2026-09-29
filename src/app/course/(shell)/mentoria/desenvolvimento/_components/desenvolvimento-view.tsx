'use client';

// Apresentação das 4 abas de Desenvolvimento pessoal — cada `*View` só recebe
// dados e devolve eventos. Quem busca e quem muta é o `page.tsx`, uma aba de
// cada vez (cada `*Tab` só chama seus hooks quando está selecionada).
//
// A separação existe pelo mesmo motivo do Diagnóstico
// (`diagnostico/_components/diagnostico-view.tsx`): sequência de dias, metas
// em cada status e várias aplicações de Maslow são caros de reproduzir de
// propósito num ambiente real. Com as vistas puras, `app/(dev)/
// mentoria-desenvolvimento-check` monta os casos com fixtures.

import { Badge, Button, buttonLabel } from '@upvox-dev/ui';
import {
	Archive,
	ArchiveRestore,
	Briefcase,
	Check,
	CheckCircle2,
	ChevronRight,
	Flag,
	Lightbulb,
	Lock,
	Pencil,
	Plus,
	Smile,
	Triangle,
} from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Text } from 'react-native-css/components/Text';
import {
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart,
	ResponsiveContainer,
} from 'recharts';
import {
	DynamicForm,
	formatAnswer,
	inputClass,
	isAnswered,
} from '@/modules/mentoria/components/dynamic-form';
import { HelpTip } from '@/modules/mentoria/components/help-tip';
import type {
	FormBlock,
	FormField,
	GoodNewsState,
	MntBusinessPlanVersion,
	MntFormTemplate,
	MntGoal,
	MntMaslowTest,
} from '@/modules/mentoria/types';
import {
	CARD,
	ConfirmDialog,
	EmptyState,
	fmtDate,
} from '../../_components/shared';

/** Os forms só fecham/limpam quando o container confirma o sucesso. */
export type MutationCallbacks = { onSuccess?: () => void };

/** Rótulo de campo — mesmo step do `dynamic-form`, que é o vizinho visual. */
const FIELD_LABEL = 'mb-1.5 block text-label text-primary';

export const DESENVOLVIMENTO_TABS = [
	{ key: 'boas-noticias', label: 'Boas Notícias', Icon: Smile },
	{ key: 'metas', label: 'Meta e Ação', Icon: Flag },
	{ key: 'maslow', label: 'Teste de Maslow', Icon: Triangle },
	{ key: 'plano', label: 'Plano de Negócios', Icon: Briefcase },
] as const;

// ── Boas Notícias ────────────────────────────────────────────────────────────
export function GoodNewsView({
	data,
	posting,
	onPost,
}: {
	data: GoodNewsState;
	posting: boolean;
	onPost: (news: string[]) => void;
}) {
	const [news, setNews] = useState(['', '', '']);
	const fieldId = useId();

	const submit = () => onPost(news.map((n) => n.trim()));

	return (
		<div className="space-y-6">
			{/* Streak de N dias */}
			<div className={`${CARD} p-5`}>
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-title text-primary">
						Sequência de {data.streak_goal} dias
					</h3>
					<span className="text-body text-muted">
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
								className={`flex items-center gap-1.5 rounded-chip border px-3 py-1.5 text-caption ${
									filled
										? // `text-brand` não tem versão escura no DS e sumiria no
											// fundo preto — daí o par `dark:` (lacuna A.3 da doc).
											'border-brand bg-brand-wash text-brand dark:text-violet-400'
										: 'border-subtle text-muted'
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
				<h3 className="mb-1 text-title text-primary">
					Hoje, quais são suas 3 boas notícias?
				</h3>
				{data.posted_today ? (
					// Verde e não roxo: aqui a semântica é "feito", não identidade da
					// marca. `text-success` também não tem tom escuro no DS (A.3).
					<p className="mt-2 flex items-center gap-2 text-body text-emerald-600 dark:text-emerald-400">
						<CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
						Registradas hoje. Volte amanhã!
					</p>
				) : (
					<div className="space-y-3 mt-4">
						{news.map((value, i) => (
							<input
								key={i}
								id={`${fieldId}-${i}`}
								className={inputClass}
								placeholder={`${i + 1}.`}
								// Sem rótulo visível: o título do card já pergunta, e três
								// rótulos "1./2./3." repetiriam a numeração do placeholder.
								// O nome acessível vem daqui.
								aria-label={`Boa notícia ${i + 1}`}
								value={value}
								onChange={(e) =>
									setNews((prev) =>
										prev.map((p, j) => (j === i ? e.target.value : p)),
									)
								}
							/>
						))}
						<Button variant="primary" onPress={submit} disabled={posting}>
							Registrar boas notícias
						</Button>
					</div>
				)}
			</div>

			{/* Histórico */}
			{data.entries.length > 0 && (
				<div className={`${CARD} p-5`}>
					<h3 className="mb-4 text-title text-primary">Mural</h3>
					<div className="space-y-4">
						{data.entries.map((entry) => (
							// Acento neutro: o mural é histórico, não estado ativo — a borda
							// colorida sugeria seleção onde não há nenhuma.
							<div key={entry.id} className="border-l-2 border-subtle pl-4">
								<p className="mb-1 text-caption text-muted">
									{fmtDate(entry.posted_on)}
								</p>
								<ul className="space-y-0.5 text-body text-secondary">
									{/* Texto repetido no mesmo dia duplicava a key. */}
									{entry.news.map((n, idx) => (
										<li key={`${entry.id}-${idx}`}>• {n}</li>
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
	// "Arquivar" grava cancelled: a meta sai da lista e dá para reativar.
	{ value: 'cancelled', label: 'Arquivada' },
];

/** Campos editáveis da meta (os mesmos do cadastro). */
export type GoalFields = {
	title: string;
	indicator_text: string | null;
	deadline: string | null;
	first_action_48h: string | null;
};

/**
 * Tom do `Badge` por status. O `<select>` continua sendo quem ALTERA (o
 * `Select` do DS é só o gatilho, sem lista de opções — lacuna A.5); o badge só
 * dá a leitura de relance que a lista não tinha.
 */
const GOAL_STATUS_TONE: Record<
	MntGoal['status'],
	'neutral' | 'success' | 'warning' | 'danger' | 'brand'
> = {
	not_started: 'neutral',
	in_progress: 'brand',
	done: 'success',
	late: 'danger',
	cancelled: 'neutral',
};

function goalStatusLabel(status: MntGoal['status']): string {
	return GOAL_STATUS.find((s) => s.value === status)?.label ?? status;
}

export function GoalsView({
	goals,
	creating,
	onCreate,
	onUpdateStatus,
	onToggleFirstAction,
	updatingGoalId = null,
	onEdit,
}: {
	goals: MntGoal[];
	creating: boolean;
	onCreate: (body: GoalFields, cb?: MutationCallbacks) => void;
	/** Sem ele, a meta não mostra "Editar". */
	onEdit?: (goalId: string, body: GoalFields, cb?: MutationCallbacks) => void;
	onUpdateStatus: (goalId: string, status: string) => void;
	onToggleFirstAction: (goalId: string, done: boolean) => void;
	/** Meta com atualização em andamento: trava o select e o toggle dela. */
	updatingGoalId?: string | null;
}) {
	const [showForm, setShowForm] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [archiving, setArchiving] = useState<MntGoal | null>(null);
	const [showArchived, setShowArchived] = useState(false);
	const fieldId = useId();
	const active = goals.filter((g) => g.status !== 'cancelled');
	const archived = goals.filter((g) => g.status === 'cancelled');
	const [form, setForm] = useState({
		title: '',
		indicator_text: '',
		deadline: '',
		first_action_48h: '',
	});

	// Fecha e limpa só no sucesso: com erro de rede a meta digitada sumia.
	const submit = () => {
		onCreate(
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
				},
			},
		);
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				{/* Ícone + texto é um ARRAY de children, e array bypassa o wrap
				    automático do Button em <Text> — o texto cru quebraria em runtime
				    ("A text node cannot be a child of a <View>"). Daí o <Text>
				    explícito, e a cor do ícone à mão: `buttonLabel` veste só o <Text>. */}
				<Button variant="primary" onPress={() => setShowForm((v) => !v)}>
					<Plus className="h-4 w-4 text-on-brand" aria-hidden />
					<Text className={buttonLabel({ variant: 'primary' })}>Nova meta</Text>
				</Button>
			</div>

			{showForm && (
				<div className={`${CARD} p-5 space-y-4`}>
					<div>
						<label htmlFor={`${fieldId}-title`} className={FIELD_LABEL}>
							Minha meta
						</label>
						<textarea
							id={`${fieldId}-title`}
							className={`${inputClass} min-h-24`}
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
						/>
					</div>
					<div>
						<label htmlFor={`${fieldId}-indicator`} className={FIELD_LABEL}>
							Indicador que comprova que alcancei
						</label>
						<input
							id={`${fieldId}-indicator`}
							className={inputClass}
							value={form.indicator_text}
							onChange={(e) =>
								setForm({ ...form, indicator_text: e.target.value })
							}
						/>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label htmlFor={`${fieldId}-deadline`} className={FIELD_LABEL}>
								Prazo
							</label>
							{/* `<input type="date">` nativo de propósito: o `Input
							    type="date"` do DS é um Pressable que abre o Modal dele — que
							    não rola (lacunas A.5). */}
							<input
								id={`${fieldId}-deadline`}
								type="date"
								className={inputClass}
								value={form.deadline}
								onChange={(e) => setForm({ ...form, deadline: e.target.value })}
							/>
						</div>
						<div>
							<label htmlFor={`${fieldId}-action`} className={FIELD_LABEL}>
								Primeira ação nas próximas 48 horas
							</label>
							<input
								id={`${fieldId}-action`}
								className={inputClass}
								value={form.first_action_48h}
								onChange={(e) =>
									setForm({ ...form, first_action_48h: e.target.value })
								}
							/>
						</div>
					</div>
					<Button
						variant="primary"
						onPress={submit}
						disabled={creating || !form.title.trim()}
					>
						Cadastrar meta
					</Button>
				</div>
			)}

			{active.length === 0 && !showForm ? (
				<EmptyState
					icon={Flag}
					title="Nenhuma meta cadastrada"
					description="Meta, indicador e a 1ª ação em 48h."
				/>
			) : (
				active.map((goal) =>
					editingId === goal.id && onEdit ? (
						<GoalEditCard
							key={goal.id}
							goal={goal}
							saving={updatingGoalId === goal.id}
							onCancel={() => setEditingId(null)}
							onSave={(body) =>
								onEdit(goal.id, body, { onSuccess: () => setEditingId(null) })
							}
						/>
					) : (
						<div key={goal.id} className={`${CARD} p-5`}>
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div className="min-w-0 flex-1">
									<p className="text-body font-semibold text-primary">
										{goal.title}
									</p>
									{goal.indicator_text && (
										<p className="mt-1 text-body text-muted">
											Indicador: {goal.indicator_text}
										</p>
									)}
									<p className="mt-1 text-caption text-muted">
										Prazo: {fmtDate(goal.deadline)}
									</p>
								</div>
								<div className="flex items-center gap-2">
									<Badge tone={GOAL_STATUS_TONE[goal.status]}>
										{goalStatusLabel(goal.status)}
									</Badge>
									{/* O badge já mostra o status por escrito, então o select fica
								    com `aria-label` em vez de um rótulo visível duplicado. */}
									<select
										className={`${inputClass} w-auto`}
										aria-label="Status da meta"
										value={goal.status}
										disabled={updatingGoalId === goal.id}
										onChange={(e) => onUpdateStatus(goal.id, e.target.value)}
									>
										{GOAL_STATUS.filter((s) => s.value !== 'cancelled').map(
											(s) => (
												<option key={s.value} value={s.value}>
													{s.label}
												</option>
											),
										)}
									</select>
									{onEdit && (
										<button
											type="button"
											className="rounded-control p-2 text-muted hover:bg-surface-sunken hover:text-primary"
											aria-label={`Editar meta: ${goal.title}`}
											onClick={() => setEditingId(goal.id)}
										>
											<Pencil className="h-4 w-4" aria-hidden />
										</button>
									)}
									<button
										type="button"
										className="rounded-control p-2 text-muted hover:bg-surface-sunken hover:text-primary"
										aria-label={`Arquivar meta: ${goal.title}`}
										disabled={updatingGoalId === goal.id}
										onClick={() => setArchiving(goal)}
									>
										<Archive className="h-4 w-4" aria-hidden />
									</button>
								</div>
							</div>
							{goal.first_action_48h && (
								<button
									type="button"
									aria-pressed={Boolean(goal.first_action_done_at)}
									disabled={updatingGoalId === goal.id}
									onClick={() =>
										onToggleFirstAction(goal.id, !goal.first_action_done_at)
									}
									className={`mt-3 inline-flex items-center gap-2 rounded-control border px-3 py-2 text-label transition ${
										goal.first_action_done_at
											? // Verde de "feito", não roxo de marca — mesma leitura do
												// "já postei hoje". Par `dark:` pela lacuna A.3.
												'border-emerald-500/40 bg-success-wash text-emerald-600 dark:text-emerald-400'
											: 'border-subtle text-secondary hover:text-primary'
									}`}
								>
									<Check className="h-4 w-4" aria-hidden />
									Ação 48h: {goal.first_action_48h}
								</button>
							)}
						</div>
					),
				)
			)}

			{archived.length > 0 && (
				<div>
					<button
						type="button"
						className="text-caption text-muted hover:text-primary"
						onClick={() => setShowArchived((v) => !v)}
					>
						{showArchived ? 'Ocultar' : 'Ver'} arquivadas ({archived.length})
					</button>
					{showArchived && (
						<ul className="mt-2 space-y-2" data-testid="goals-archived">
							{archived.map((g) => (
								<li
									key={g.id}
									className={`${CARD} flex items-center justify-between gap-3 p-3`}
								>
									<span className="min-w-0 truncate text-body text-secondary">
										{g.title}
									</span>
									<button
										type="button"
										className="inline-flex shrink-0 items-center gap-1.5 rounded-control border border-subtle px-3 py-1.5 text-label text-primary hover:bg-surface-sunken"
										disabled={updatingGoalId === g.id}
										onClick={() =>
											onUpdateStatus(
												g.id,
												g.first_action_done_at ? 'in_progress' : 'not_started',
											)
										}
									>
										<ArchiveRestore className="h-4 w-4" aria-hidden />
										Reativar
									</button>
								</li>
							))}
						</ul>
					)}
				</div>
			)}

			{archiving && (
				<ConfirmDialog
					title="Arquivar esta meta?"
					confirmLabel="Arquivar"
					onCancel={() => setArchiving(null)}
					onConfirm={() => {
						onUpdateStatus(archiving.id, 'cancelled');
						setArchiving(null);
					}}
				>
					Sai da lista. Dá para reativar depois.
				</ConfirmDialog>
			)}
		</div>
	);
}

/** Edição no próprio card (mesmos campos do cadastro). */
function GoalEditCard({
	goal,
	saving,
	onCancel,
	onSave,
}: {
	goal: MntGoal;
	saving: boolean;
	onCancel: () => void;
	onSave: (body: GoalFields) => void;
}) {
	const fieldId = useId();
	const [form, setForm] = useState({
		title: goal.title,
		indicator_text: goal.indicator_text ?? '',
		deadline: goal.deadline?.slice(0, 10) ?? '',
		first_action_48h: goal.first_action_48h ?? '',
	});
	return (
		<div className={`${CARD} p-5 space-y-4`}>
			<div>
				<label htmlFor={`${fieldId}-title`} className={FIELD_LABEL}>
					Minha meta
				</label>
				<textarea
					id={`${fieldId}-title`}
					className={`${inputClass} min-h-20`}
					value={form.title}
					onChange={(e) => setForm({ ...form, title: e.target.value })}
				/>
			</div>
			<div>
				<label htmlFor={`${fieldId}-indicator`} className={FIELD_LABEL}>
					Indicador
				</label>
				<input
					id={`${fieldId}-indicator`}
					className={inputClass}
					value={form.indicator_text}
					onChange={(e) => setForm({ ...form, indicator_text: e.target.value })}
				/>
			</div>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<label htmlFor={`${fieldId}-deadline`} className={FIELD_LABEL}>
						Prazo
					</label>
					<input
						id={`${fieldId}-deadline`}
						type="date"
						className={inputClass}
						value={form.deadline}
						onChange={(e) => setForm({ ...form, deadline: e.target.value })}
					/>
				</div>
				<div>
					<label htmlFor={`${fieldId}-action`} className={FIELD_LABEL}>
						Primeira ação (48h)
					</label>
					<input
						id={`${fieldId}-action`}
						className={inputClass}
						value={form.first_action_48h}
						onChange={(e) =>
							setForm({ ...form, first_action_48h: e.target.value })
						}
					/>
				</div>
			</div>
			<div className="flex justify-end gap-2">
				<Button variant="secondary" onPress={onCancel}>
					Cancelar
				</Button>
				<Button
					variant="primary"
					disabled={saving || !form.title.trim()}
					onPress={() =>
						onSave({
							title: form.title.trim(),
							indicator_text: form.indicator_text || null,
							deadline: form.deadline || null,
							first_action_48h: form.first_action_48h || null,
						})
					}
				>
					{saving ? 'Salvando...' : 'Salvar'}
				</Button>
			</div>
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

export function MaslowView({
	history,
	submitting,
	onSubmit,
}: {
	history: MntMaslowTest[];
	submitting: boolean;
	onSubmit: (answers: number[], cb?: MutationCallbacks) => void;
}) {
	const [answers, setAnswers] = useState<Array<number | null>>(
		Array.from({ length: 15 }, () => null),
	);
	const [showTest, setShowTest] = useState(false);
	const statementId = useId();

	const latest = history.at(-1) ?? null;

	const reset = () => {
		setShowTest(false);
		setAnswers(Array.from({ length: 15 }, () => null));
	};

	// Limpa só no sucesso: com erro, as 15 respostas sumiam.
	const send = () => onSubmit(answers as number[], { onSuccess: reset });

	return (
		<div className="space-y-6">
			{/* O aviso "não é diagnóstico" fica visível (curto); a escala explicada
			    vai no "?" e a legenda vira as pontas da régua. */}
			<p className="inline-flex items-center gap-1 text-caption text-muted">
				Autopercepção, não diagnóstico psicológico.
				<HelpTip label="Sobre o Teste de Maslow">
					Ferramenta educacional de autopercepção. Pontue cada afirmação de 0
					(discordo totalmente) a 4 (concordo totalmente).
				</HelpTip>
			</p>

			{latest && !showTest && (
				<div className={`${CARD} p-5`}>
					<div className="flex items-center justify-between mb-2">
						<h3 className="text-title text-primary">
							Sua última aplicação ({fmtDate(latest.taken_at)})
						</h3>
						<Button variant="secondary" onPress={() => setShowTest(true)}>
							Refazer teste
						</Button>
					</div>
					<MaslowRadar scores={latest.scores} />
					<LowestDimension scores={latest.scores} />
					{history.length > 1 && (
						<div className="mt-4 text-body text-muted">
							Aplicações anteriores:{' '}
							{history
								.slice(0, -1)
								.map((h) => fmtDate(h.taken_at))
								.join(' · ')}
						</div>
					)}
				</div>
			)}

			{(!latest || showTest) && (
				<div className={`${CARD} p-5 space-y-6`}>
					{/* Legenda única da régua: repetir 0–4 em 15 linhas era ruído. */}
					<p
						className="flex items-center gap-2 text-caption text-muted"
						aria-hidden
					>
						Discordo
						<span className="flex gap-1">
							{[0, 1, 2, 3, 4].map((n) => (
								<span
									key={n}
									className="h-2.5 w-2.5 rounded-full bg-violet-500"
									style={{ opacity: 0.2 + n * 0.2 }}
								/>
							))}
						</span>
						Concordo
					</p>
					{MASLOW_STATEMENTS.map((group, g) => (
						<div key={group.dimension}>
							{/* `text-brand` não tem tom escuro no DS — par `dark:` (A.3). */}
							<h4 className="mb-3 text-label font-semibold text-brand dark:text-violet-400">
								{group.dimension}
							</h4>
							<div className="space-y-4">
								{group.items.map((statement, i) => {
									const index = g * 3 + i;
									const labelId = `${statementId}-${index}`;
									return (
										<div key={statement}>
											{/* Grupo de botões não tem elemento rotulável para um
											    `htmlFor` apontar, então o enunciado vira <span> com
											    id e o fieldset o referencia — mesma solução do
											    campo `scale` do dynamic-form. */}
											<span
												id={labelId}
												className="mb-2 block text-body text-primary"
											>
												{statement}
											</span>
											<fieldset
												aria-labelledby={labelId}
												className="flex gap-2"
											>
												{[0, 1, 2, 3, 4].map((score) => (
													<button
														key={score}
														type="button"
														// Número só no escolhido; a régua tem legenda.
														aria-label={`${score} de 4`}
														title={`${score} de 4`}
														aria-pressed={answers[index] === score}
														onClick={() =>
															setAnswers((prev) =>
																prev.map((p, j) => (j === index ? score : p)),
															)
														}
														className={`h-8 w-8 rounded-full border text-caption transition ${
															answers[index] === score
																? 'border-brand bg-brand text-on-brand'
																: 'border-slate-300 text-muted hover:border-brand-border dark:border-white/25'
														}`}
													>
														{answers[index] === score ? score : null}
													</button>
												))}
											</fieldset>
										</div>
									);
								})}
							</div>
						</div>
					))}
					<div className="flex flex-wrap gap-2">
						<Button
							variant="primary"
							onPress={send}
							disabled={submitting || answers.some((a) => a === null)}
						>
							Enviar teste
						</Button>
						{/* Quem clicou em "Refazer" só para rever as perguntas não tinha
						    como voltar ao resultado. */}
						{latest && showTest && (
							<Button variant="secondary" onPress={reset} disabled={submitting}>
								Cancelar
							</Button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

/** Também usado na visão do mentor. */
export function MaslowRadar({ scores }: { scores: Record<string, number> }) {
	const data = Object.entries(scores).map(([key, value]) => ({
		dimension: MASLOW_LABELS[key] ?? key,
		pct: value,
	}));
	return (
		<ResponsiveContainer width="100%" height={280}>
			<RadarChart data={data} outerRadius="70%">
				<PolarGrid stroke="currentColor" className="text-subtle" />
				<PolarAngleAxis
					dataKey="dimension"
					tick={{ fontSize: 11, fill: 'currentColor' }}
				/>
				<PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
				{/* Hex cravado porque `stroke`/`fill` do recharts não aceitam
				    `className` (lacuna A.4 da doc) — é o roxo da marca (#7c3aed), o
				    mesmo que a home duplica em `SERIES_COLORS`. */}
				<Radar
					dataKey="pct"
					stroke="#7c3aed"
					fill="#7c3aed"
					fillOpacity={0.35}
				/>
			</RadarChart>
		</ResponsiveContainer>
	);
}

export function LowestDimension({
	scores,
}: {
	scores: Record<string, number>;
}) {
	const lowest = Object.entries(scores).sort((a, b) => a[1] - b[1])[0];
	if (!lowest) return null;
	return (
		// Caixa de destaque, e não linha solta: é a única leitura acionável do
		// radar. Mesma moldura âmbar do "A LEVANTAR" do dynamic-form; o par
		// `dark:` do âmbar é a mesma lacuna A.3 dos outros tons semânticos.
		<div className="mt-3 flex items-start gap-2 rounded-control border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-2">
			<Lightbulb
				className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
				aria-hidden
			/>
			<p className="text-body text-amber-600 dark:text-amber-400">
				Mais atenção agora: <b>{MASLOW_LABELS[lowest[0]] ?? lowest[0]}</b> (
				{lowest[1]}%).
			</p>
		</div>
	);
}

// ── Plano de Negócios ────────────────────────────────────────────────────────
//
// O plano virou um formulário longo (o admin montou ~11 blocos e ~70
// perguntas), e a tela antiga não aguentou:
//
// - a versão salva aparecia como o FORMULÁRIO com os campos desabilitados — o
//   aluno clicava, "não digita nada", e não achava botão de salvar (o "Nova
//   versão" ficava no canto). Agora a versão salva é LEITURA em blocos
//   (pergunta → resposta), sem nenhum input, e o convite para editar é o CTA
//   principal do topo;
// - ~70 campos numa página só não têm ritmo. A edição vira um passo a passo
//   por bloco: navegador com x/y por bloco, Anterior/Próximo e o salvar sempre
//   visível na barra de baixo;
// - perder 70 respostas por fechar a aba seria cruel: o rascunho fica salvo
//   neste aparelho (localStorage) até virar versão;
// - respostas de perguntas que o admin tirou do formulário não somem: aparecem
//   em "Respostas de perguntas antigas" (mesmo padrão da Foto Zero).

const DRAFT_PREFIX = 'mentoria:plano-negocios:rascunho:';

type PlanDraft = {
	answers: Record<string, unknown>;
	step: number;
	savedAt: string;
};

function readDraft(key: string | undefined): PlanDraft | null {
	if (!key) return null;
	try {
		const raw = localStorage.getItem(DRAFT_PREFIX + key);
		return raw ? (JSON.parse(raw) as PlanDraft) : null;
	} catch {
		return null;
	}
}

function writeDraft(key: string | undefined, draft: PlanDraft | null) {
	if (!key) return;
	try {
		if (draft) localStorage.setItem(DRAFT_PREFIX + key, JSON.stringify(draft));
		else localStorage.removeItem(DRAFT_PREFIX + key);
	} catch {
		// Aba anônima / storage bloqueado: segue sem rascunho local.
	}
}

function fmtTime(iso: string): string {
	return new Date(iso).toLocaleString('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	});
}

/** Obrigatórios sem resposta ("A LEVANTAR" conta como resposta). */
function missingRequired(
	fields: FormField[],
	answers: Record<string, unknown>,
) {
	return fields.filter((f) => f.required && !isAnswered(answers[f.key]));
}

export function BusinessPlanView({
	template,
	versions,
	creating,
	onCreate,
	draftKey,
}: {
	template: MntFormTemplate | null | undefined;
	versions: MntBusinessPlanVersion[];
	creating: boolean;
	onCreate: (answers: Record<string, unknown>, cb?: MutationCallbacks) => void;
	/** Chave do rascunho local (ex.: id da jornada). Sem ela, não salva rascunho. */
	draftKey?: string;
}) {
	const sorted = [...versions].sort((a, b) => b.version - a.version);
	const latest = sorted[0] ?? null;
	const blocks = template?.schema.blocks ?? [];

	// Sem nenhuma versão, a tela já abre no preenchimento — é o único caminho.
	const [mode, setMode] = useState<'view' | 'edit'>(() =>
		sorted.length === 0 ? 'edit' : 'view',
	);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const selected = sorted.find((v) => v.id === selectedId) ?? latest;

	if (!template) {
		return (
			<EmptyState
				icon={Briefcase}
				title="Plano de negócios ainda não disponível"
				description="O formulário do plano ainda não foi publicado pela mentoria."
			/>
		);
	}

	if (mode === 'edit') {
		return (
			<BusinessPlanEditor
				template={template}
				base={latest}
				nextVersion={(latest?.version ?? 0) + 1}
				creating={creating}
				draftKey={draftKey}
				canCancel={sorted.length > 0}
				onCancel={() => setMode('view')}
				onSave={(answers, done) =>
					onCreate(answers, {
						onSuccess: () => {
							done();
							setSelectedId(null);
							setMode('view');
						},
					})
				}
			/>
		);
	}

	if (!selected) return null;
	const answered = blocks
		.flatMap((b) => b.fields)
		.filter((f) => isAnswered(selected.content[f.key])).length;
	const total = blocks.reduce((n, b) => n + b.fields.length, 0);
	const isLatest = selected.id === latest?.id;

	return (
		<div className="space-y-5">
			{/* Cabeçalho da versão aberta + o convite para atualizar (CTA principal). */}
			<div className={`${CARD} p-5`}>
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="min-w-0">
						<p className="inline-flex items-center gap-1.5 text-caption uppercase tracking-wide text-muted">
							<Lock className="h-3.5 w-3.5" aria-hidden />
							Versão salva · somente leitura
							<HelpTip label="Sobre as versões">
								Cada vez que você salva, nasce uma versão nova e as anteriores
								ficam guardadas — assim dá para comparar V1, V2... ao longo da
								mentoria.
							</HelpTip>
						</p>
						<h3 className="mt-1 text-title text-primary">
							{selected.label ?? `V${selected.version}`}
						</h3>
						<p className="mt-0.5 text-caption text-muted">
							Salva em {fmtDate(selected.created_at)} · {answered} de {total}{' '}
							perguntas respondidas
						</p>
					</div>
					<Button variant="primary" onPress={() => setMode('edit')}>
						<Pencil className="h-4 w-4 text-on-brand" aria-hidden />
						<Text className={buttonLabel({ variant: 'primary' })}>
							{`Atualizar plano (criar V${(latest?.version ?? 0) + 1})`}
						</Text>
					</Button>
				</div>
				<ProgressLine done={answered} total={total} />

				{sorted.length > 1 && (
					<div className="mt-4 flex flex-wrap gap-2" aria-label="Versões">
						{sorted.map((v) => {
							const on = v.id === selected.id;
							return (
								<button
									key={v.id}
									type="button"
									aria-pressed={on}
									onClick={() => setSelectedId(v.id)}
									className={`rounded-chip border px-3 py-1 text-caption transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
										on
											? 'border-brand bg-brand-wash text-primary'
											: 'border-subtle text-muted hover:border-brand-border'
									}`}
								>
									V{v.version} · {fmtDate(v.created_at)}
									{v.id === latest?.id && ' · atual'}
								</button>
							);
						})}
					</div>
				)}
				{!isLatest && (
					<p className="mt-3 text-caption text-muted">
						Você está vendo uma versão antiga. A atualização sempre parte da
						versão atual (V{latest?.version}).
					</p>
				)}
			</div>

			<PlanReadBlocks blocks={blocks} content={selected.content} />
		</div>
	);
}

function ProgressLine({ done, total }: { done: number; total: number }) {
	const pct = total ? Math.round((done / total) * 100) : 0;
	return (
		<div
			className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-sunken"
			role="progressbar"
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={pct}
			aria-label="Perguntas respondidas"
		>
			<div
				className="h-full rounded-full bg-brand transition-all"
				style={{ width: `${pct}%` }}
			/>
		</div>
	);
}

/** Versão salva em blocos de leitura: pergunta → resposta, sem inputs. */
function PlanReadBlocks({
	blocks,
	content,
}: {
	blocks: FormBlock[];
	content: Record<string, unknown>;
}) {
	const shown = new Set(blocks.flatMap((b) => b.fields.map((f) => f.key)));
	const orphans = Object.entries(content).filter(
		([key, value]) => !shown.has(key) && isAnswered(value),
	);

	return (
		<div className="space-y-3">
			{blocks.map((block, i) => {
				const done = block.fields.filter((f) =>
					isAnswered(content[f.key]),
				).length;
				return (
					// Bloco sem nenhuma resposta começa fechado: com 11 blocos, abrir
					// tudo vazio só empurra o que interessa para baixo.
					<details
						key={block.key}
						open={done > 0}
						className={`${CARD} group @container`}
					>
						<summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
							<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-wash text-caption font-semibold text-brand dark:text-violet-400">
								{i + 1}
							</span>
							<span className="min-w-0 flex-1 text-body font-semibold text-primary">
								{block.title}
							</span>
							<BlockCount done={done} total={block.fields.length} />
							<ChevronRight
								className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-90"
								aria-hidden
							/>
						</summary>
						<dl className="grid grid-cols-1 gap-x-6 gap-y-4 px-4 pb-4 @2xl:grid-cols-2">
							{block.fields.map((field) => {
								const value = content[field.key];
								const empty = !isAnswered(value);
								return (
									<div key={field.key}>
										<dt className="text-caption text-muted">{field.label}</dt>
										<dd
											className={`mt-0.5 whitespace-pre-wrap text-body ${
												empty ? 'italic text-muted' : 'text-primary'
											}`}
										>
											{empty ? 'Sem resposta' : formatAnswer(value, field.type)}
										</dd>
									</div>
								);
							})}
						</dl>
					</details>
				);
			})}

			{orphans.length > 0 && (
				<details open className={`${CARD} group @container`}>
					<summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
						<span className="min-w-0 flex-1 text-body font-semibold text-primary">
							Respostas de perguntas antigas
						</span>
						<ChevronRight
							className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-90"
							aria-hidden
						/>
					</summary>
					<p className="px-4 text-caption text-muted">
						Essas perguntas saíram do formulário depois que esta versão foi
						salva. As respostas continuam guardadas aqui.
					</p>
					<dl className="grid grid-cols-1 gap-x-6 gap-y-4 p-4 @2xl:grid-cols-2">
						{orphans.map(([key, value]) => (
							<div key={key}>
								<dt className="text-caption text-muted first-letter:uppercase">
									{key.replaceAll('_', ' ')}
								</dt>
								<dd className="mt-0.5 whitespace-pre-wrap text-body text-primary">
									{formatAnswer(value)}
								</dd>
							</div>
						))}
					</dl>
				</details>
			)}
		</div>
	);
}

function BlockCount({ done, total }: { done: number; total: number }) {
	const complete = total > 0 && done >= total;
	return (
		<span
			className={`inline-flex shrink-0 items-center gap-1 rounded-chip px-2 py-0.5 text-caption ${
				complete
					? 'bg-success-wash text-emerald-600 dark:text-emerald-400'
					: 'bg-surface-sunken text-muted'
			}`}
		>
			{complete && <Check className="h-3 w-3" aria-hidden />}
			{done}/{total}
		</span>
	);
}

/** Preenchimento passo a passo, um bloco por vez. */
function BusinessPlanEditor({
	template,
	base,
	nextVersion,
	creating,
	draftKey,
	canCancel,
	onCancel,
	onSave,
}: {
	template: MntFormTemplate;
	base: MntBusinessPlanVersion | null;
	nextVersion: number;
	creating: boolean;
	draftKey?: string;
	canCancel: boolean;
	onCancel: () => void;
	onSave: (answers: Record<string, unknown>, done: () => void) => void;
}) {
	const blocks = template.schema.blocks;
	// A nova versão parte da última (antes o aluno redigitava o plano inteiro);
	// um rascunho local mais novo que ela tem prioridade.
	const baseAnswers = base?.content ?? {};
	const baseJson = JSON.stringify(baseAnswers);
	const [restored] = useState(() => {
		const d = readDraft(draftKey);
		return d && JSON.stringify(d.answers) !== baseJson ? d : null;
	});
	const [answers, setAnswers] = useState<Record<string, unknown>>(
		() => restored?.answers ?? { ...baseAnswers },
	);
	const [step, setStep] = useState(() =>
		Math.min(restored?.step ?? 0, Math.max(blocks.length - 1, 0)),
	);
	const [savedAt, setSavedAt] = useState<string | null>(
		restored?.savedAt ?? null,
	);
	const [showMissing, setShowMissing] = useState(false);
	const [confirmDiscard, setConfirmDiscard] = useState(false);
	const topRef = useRef<HTMLDivElement>(null);

	const unchanged = JSON.stringify(answers) === baseJson;

	// Rascunho local com debounce: fechar a aba no meio de 70 perguntas não
	// pode custar o que já foi digitado.
	useEffect(() => {
		if (unchanged) return;
		const t = setTimeout(() => {
			const at = new Date().toISOString();
			writeDraft(draftKey, { answers, step, savedAt: at });
			setSavedAt(at);
		}, 600);
		return () => clearTimeout(t);
	}, [answers, step, unchanged, draftKey]);

	const block = blocks[step];
	const allFields = blocks.flatMap((b) => b.fields);
	const answered = allFields.filter((f) => isAnswered(answers[f.key])).length;
	const missingByBlock = blocks.map((b) => missingRequired(b.fields, answers));
	const missingTotal = missingByBlock.reduce((n, m) => n + m.length, 0);

	const goTo = (i: number) => {
		setStep(Math.max(0, Math.min(i, blocks.length - 1)));
		topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	const save = () => {
		if (missingTotal > 0) {
			setShowMissing(true);
			const first = missingByBlock.findIndex((m) => m.length > 0);
			if (first >= 0) goTo(first);
			return;
		}
		onSave(answers, () => writeDraft(draftKey, null));
	};

	const discard = () => {
		writeDraft(draftKey, null);
		setConfirmDiscard(false);
		onCancel();
	};

	if (!block) {
		return (
			<EmptyState
				icon={Briefcase}
				title="Formulário sem perguntas"
				description="O plano de negócios ainda não tem blocos publicados."
			/>
		);
	}

	const isLast = step === blocks.length - 1;
	const blockMissing = showMissing ? (missingByBlock[step] ?? []) : [];

	return (
		<div ref={topRef} className="space-y-4 scroll-mt-4">
			<div className={`${CARD} p-5`}>
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="min-w-0">
						<p className="text-caption uppercase tracking-wide text-muted">
							{base
								? `Atualizando o plano · vai virar V${nextVersion}`
								: 'Seu primeiro plano · vai virar V1'}
						</p>
						<h3 className="mt-1 text-title text-primary">{template.title}</h3>
						<p className="mt-0.5 text-caption text-muted">
							{answered} de {allFields.length} perguntas respondidas
							{savedAt &&
								` · rascunho salvo neste aparelho às ${fmtTime(savedAt)}`}
						</p>
					</div>
					{canCancel && (
						<Button
							variant="secondary"
							onPress={() => (unchanged ? onCancel() : setConfirmDiscard(true))}
						>
							Voltar para a versão salva
						</Button>
					)}
				</div>
				<ProgressLine done={answered} total={allFields.length} />
				{restored && (
					<p className="mt-3 rounded-control border border-dashed border-brand-border bg-brand-wash px-3 py-2 text-caption text-primary">
						Recuperamos o rascunho que você deixou em{' '}
						{fmtTime(restored.savedAt)}.
					</p>
				)}

				{/* Navegador de blocos: onde estou, o que falta, e pular direto. */}
				<ol
					className="mt-4 flex gap-2 overflow-x-auto pb-1"
					aria-label="Blocos do plano"
				>
					{blocks.map((b, i) => {
						const done = b.fields.filter((f) =>
							isAnswered(answers[f.key]),
						).length;
						const complete = done === b.fields.length;
						const hasMissing =
							showMissing && (missingByBlock[i]?.length ?? 0) > 0;
						const on = i === step;
						return (
							<li key={b.key} className="shrink-0">
								<button
									type="button"
									aria-current={on ? 'step' : undefined}
									onClick={() => goTo(i)}
									title={b.title}
									className={`flex max-w-[220px] items-center gap-2 rounded-control border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
										on
											? 'border-brand bg-brand-wash'
											: hasMissing
												? 'border-red-500/50 bg-red-500/5'
												: 'border-subtle hover:border-brand-border'
									}`}
								>
									<span
										className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-caption font-semibold ${
											complete
												? 'bg-success-wash text-emerald-600 dark:text-emerald-400'
												: 'bg-surface-sunken text-muted'
										}`}
									>
										{complete ? (
											<Check className="h-3.5 w-3.5" aria-hidden />
										) : (
											i + 1
										)}
									</span>
									<span className="min-w-0">
										<span className="block truncate text-caption font-semibold text-primary">
											{b.title}
										</span>
										<span className="block text-caption text-muted">
											{done}/{b.fields.length}
										</span>
									</span>
								</button>
							</li>
						);
					})}
				</ol>
			</div>

			{/* Só o bloco atual. `key` por bloco: o DynamicForm hidrata do estado
			    compartilhado ao trocar de bloco, e o onChange devolve TODAS as
			    respostas (ele nasce com elas), então nada se perde entre blocos. */}
			<DynamicForm
				key={block.key}
				template={{ ...template, schema: { blocks: [block] } }}
				initialAnswers={answers}
				onChange={setAnswers}
			/>

			{blockMissing.length > 0 && (
				<p className="text-body text-red-600 dark:text-red-400">
					Falta responder neste bloco:{' '}
					{blockMissing.map((f) => f.label).join(', ')}.
				</p>
			)}

			{/* Barra de ações sempre à vista: o "não acho botão de salvar" do
			    vídeo não pode voltar a acontecer. */}
			<div
				className={`${CARD} sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 p-3 shadow-lg`}
			>
				<span className="text-caption text-muted">
					Bloco {step + 1} de {blocks.length}
					{showMissing && missingTotal > 0 && (
						<span className="text-red-600 dark:text-red-400">
							{' '}
							· {missingTotal} obrigatória{missingTotal > 1 ? 's' : ''} sem
							resposta
						</span>
					)}
				</span>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="secondary"
						onPress={() => goTo(step - 1)}
						disabled={step === 0}
					>
						Anterior
					</Button>
					{!isLast && (
						<Button variant="secondary" onPress={() => goTo(step + 1)}>
							Próximo bloco
						</Button>
					)}
					<Button
						variant="primary"
						onPress={save}
						disabled={creating || unchanged}
						loading={creating}
					>
						{`Salvar como V${nextVersion}`}
					</Button>
				</div>
			</div>

			{confirmDiscard && (
				<ConfirmDialog
					title="Descartar as alterações?"
					confirmLabel="Descartar"
					danger
					onCancel={() => setConfirmDiscard(false)}
					onConfirm={discard}
				>
					O que você preencheu agora e ainda não salvou como versão será
					apagado, inclusive o rascunho deste aparelho.
				</ConfirmDialog>
			)}
		</div>
	);
}
