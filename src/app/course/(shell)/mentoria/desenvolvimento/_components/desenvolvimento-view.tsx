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
	Briefcase,
	Check,
	CheckCircle2,
	ChevronRight,
	Flag,
	Lightbulb,
	Lock,
	Plus,
	Smile,
	Triangle,
} from 'lucide-react';
import { useId, useState } from 'react';
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
	inputClass,
} from '@/modules/mentoria/components/dynamic-form';
import type {
	GoodNewsState,
	MntBusinessPlanVersion,
	MntFormTemplate,
	MntGoal,
	MntMaslowTest,
} from '@/modules/mentoria/types';
import { CARD, EmptyState, fmtDate } from '../../_components/shared';

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
						Você já registrou as boas notícias de hoje. Volte amanhã!
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
}: {
	goals: MntGoal[];
	creating: boolean;
	onCreate: (body: {
		title: string;
		indicator_text: string | null;
		deadline: string | null;
		first_action_48h: string | null;
	}) => void;
	onUpdateStatus: (goalId: string, status: string) => void;
	onToggleFirstAction: (goalId: string, done: boolean) => void;
}) {
	const [showForm, setShowForm] = useState(false);
	const fieldId = useId();
	const [form, setForm] = useState({
		title: '',
		indicator_text: '',
		deadline: '',
		first_action_48h: '',
	});

	const submit = () => {
		onCreate({
			title: form.title,
			indicator_text: form.indicator_text || null,
			deadline: form.deadline || null,
			first_action_48h: form.first_action_48h || null,
		});
		setShowForm(false);
		setForm({
			title: '',
			indicator_text: '',
			deadline: '',
			first_action_48h: '',
		});
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

			{goals.length === 0 && !showForm ? (
				<EmptyState
					icon={Flag}
					title="Nenhuma meta cadastrada"
					description="Cadastre sua meta com o indicador que comprova o resultado e a primeira ação das próximas 48 horas."
				/>
			) : (
				goals.map((goal) => (
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
									onChange={(e) => onUpdateStatus(goal.id, e.target.value)}
								>
									{GOAL_STATUS.map((s) => (
										<option key={s.value} value={s.value}>
											{s.label}
										</option>
									))}
								</select>
							</div>
						</div>
						{goal.first_action_48h && (
							<button
								type="button"
								aria-pressed={Boolean(goal.first_action_done_at)}
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

export function MaslowView({
	history,
	submitting,
	onSubmit,
}: {
	history: MntMaslowTest[];
	submitting: boolean;
	onSubmit: (answers: number[]) => void;
}) {
	const [answers, setAnswers] = useState<Array<number | null>>(
		Array.from({ length: 15 }, () => null),
	);
	const [showTest, setShowTest] = useState(false);
	const statementId = useId();

	const latest = history.at(-1) ?? null;

	const send = () => {
		onSubmit(answers as number[]);
		setShowTest(false);
		setAnswers(Array.from({ length: 15 }, () => null));
	};

	return (
		<div className="space-y-6">
			<div className={`${CARD} p-4 text-caption text-muted`}>
				O Teste de Maslow é uma ferramenta educacional de autopercepção — não é
				um diagnóstico psicológico. Pontue cada afirmação de 0 (discordo
				totalmente) a 4 (concordo totalmente).
			</div>

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
														aria-pressed={answers[index] === score}
														onClick={() =>
															setAnswers((prev) =>
																prev.map((p, j) => (j === index ? score : p)),
															)
														}
														className={`h-9 w-9 rounded-chip border text-caption transition ${
															answers[index] === score
																? 'border-brand bg-brand text-on-brand'
																: 'border-subtle text-muted'
														}`}
													>
														{score}
													</button>
												))}
											</fieldset>
										</div>
									);
								})}
							</div>
						</div>
					))}
					<Button
						variant="primary"
						onPress={send}
						disabled={submitting || answers.some((a) => a === null)}
					>
						Enviar teste
					</Button>
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

function LowestDimension({ scores }: { scores: Record<string, number> }) {
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
				A dimensão que merece maior atenção agora é{' '}
				<b>{MASLOW_LABELS[lowest[0]] ?? lowest[0]}</b> ({lowest[1]}%).
			</p>
		</div>
	);
}

// ── Plano de Negócios ────────────────────────────────────────────────────────
export function BusinessPlanView({
	template,
	versions,
	creating,
	onCreate,
}: {
	template: MntFormTemplate | null | undefined;
	versions: MntBusinessPlanVersion[];
	creating: boolean;
	onCreate: (answers: Record<string, unknown>) => void;
}) {
	const [editing, setEditing] = useState(false);
	const [answers, setAnswers] = useState<Record<string, unknown>>({});
	const [viewing, setViewing] = useState<MntBusinessPlanVersion | null>(null);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-3">
				<p className="text-body text-muted">
					Cada envio gera uma nova versão imutável — assim dá pra comparar V1,
					V2... ao longo dos anos.
				</p>
				{template && (
					<Button
						variant="primary"
						onPress={() => {
							setEditing((v) => !v);
							setViewing(null);
						}}
					>
						<Plus className="h-4 w-4 text-on-brand" aria-hidden />
						<Text className={buttonLabel({ variant: 'primary' })}>
							Nova versão
						</Text>
					</Button>
				)}
			</div>

			{editing && template && (
				<div className="space-y-4">
					<DynamicForm
						template={template}
						initialAnswers={answers}
						onChange={setAnswers}
					/>
					<Button
						variant="primary"
						onPress={() => {
							onCreate(answers);
							setEditing(false);
							setAnswers({});
						}}
						disabled={creating}
					>
						Salvar como nova versão
					</Button>
				</div>
			)}

			{versions.length === 0 && !editing ? (
				<EmptyState
					icon={Briefcase}
					title="Nenhuma versão do plano de negócios"
					description="Crie a V1 do seu plano — ela fica registrada para sempre e vira base de comparação."
				/>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					{versions.map((v) => {
						const open = viewing?.id === v.id;
						return (
							<button
								key={v.id}
								type="button"
								aria-pressed={open}
								onClick={() => {
									setViewing(open ? null : v);
									setEditing(false);
								}}
								// Estado selecionado e anel de foco: antes nada indicava qual
								// versão estava aberta no leitor abaixo, nem havia foco
								// visível para quem navega por teclado.
								className={`rounded-card border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
									open
										? 'border-brand bg-brand-wash'
										: 'border-subtle bg-surface hover:border-brand-border'
								}`}
							>
								<div className="flex items-center gap-2">
									<div className="min-w-0 flex-1">
										<p className="text-body font-semibold text-primary">
											{v.label ?? `V${v.version}`}
										</p>
										<p className="mt-0.5 text-caption text-muted">
											{fmtDate(v.created_at)}
										</p>
									</div>
									<ChevronRight
										className="h-4 w-4 shrink-0 text-muted"
										aria-hidden
									/>
								</div>
							</button>
						);
					})}
				</div>
			)}

			{viewing && template && (
				<div>
					{/* Cadeado como no Diagnóstico congelado — mesmo vocabulário visual
					    para "somente leitura" na feature inteira. */}
					<div className="mb-3 flex items-center gap-2">
						<Lock
							className="h-4 w-4 shrink-0 text-brand dark:text-violet-400"
							aria-hidden
						/>
						<h3 className="text-title text-primary">
							{viewing.label ?? `V${viewing.version}`} (somente leitura)
						</h3>
					</div>
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
