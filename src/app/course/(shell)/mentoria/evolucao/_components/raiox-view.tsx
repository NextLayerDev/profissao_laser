'use client';

// Apresentação do Raio-X Empresarial 360° — recebe o relatório já gerado e só
// desenha. Quem gera é o `page.tsx`.
//
// Arquivo separado da `evolucao-view` de propósito: é a única parte da tela que
// vai para o papel, e a rota de conferência (`app/(dev)/mentoria-evolucao-check`)
// precisa renderizar ele sozinho para dar para conferir a folha impressa sem
// gerar um relatório de verdade.
//
// O `payload` vem do backend como JSON solto (`Record<string, unknown>`), então
// a leitura é por cast — o contrato das 8 seções mora aqui, não no tipo.

import { Badge, type Tone } from '@upvox-dev/ui';
import { Printer } from 'lucide-react';
import { areaLabel } from '@/modules/mentoria/components/company-map-radar';
import {
	DonutProgress,
	ListRow,
	StatCard,
} from '@/modules/mentoria/components/ui';
import { formatBrPlain, formatMetricValue } from '@/modules/mentoria/numbers';
import type { MntReport } from '@/modules/mentoria/types';
import { CARD, fmtDate } from '../../_components/shared';

/** Rótulos das métricas da Foto Zero. Chave desconhecida cai na própria chave. */
const METRIC_LABEL: Record<string, string> = {
	faturamento: 'Faturamento',
	custos_fixos: 'Custos fixos',
	margem: 'Margem (%)',
	ticket: 'Ticket médio',
	vendas: 'Vendas/mês',
	clientes: 'Clientes',
	funcionarios: 'Funcionários',
	recorrencia: 'Clientes recorrentes (%)',
	maturidade_geral: 'Maturidade geral (%)',
};

/** Semáforo do indicador → tom do Badge. Desconhecido fica neutro. */
const SEMAPHORE_TONE: Record<string, Tone> = {
	green: 'success',
	yellow: 'warning',
	red: 'danger',
	unmeasured: 'neutral',
};

const SEMAPHORE_LABEL: Record<string, string> = {
	green: 'Saudável',
	yellow: 'Atenção',
	red: 'Crítico',
	unmeasured: 'Não medido',
};

// O relatório vai impresso para o cliente: status cru ('active', 'pending')
// não pode aparecer. Desconhecido cai no próprio valor.
const GOAL_STATUS_LABEL: Record<string, string> = {
	not_started: 'Não iniciada',
	in_progress: 'Em andamento',
	done: 'Concluída',
	late: 'Atrasada',
	cancelled: 'Cancelada',
};

const TASK_STATUS_LABEL: Record<string, string> = {
	pending: 'Pendente',
	in_progress: 'Em andamento',
	done: 'Concluída',
	overdue: 'Atrasada',
	cancelled: 'Cancelada',
};

export function RaioxView({ report }: { report: MntReport }) {
	const p = report.payload as Record<string, unknown>;
	const fotoZero = p.foto_zero as
		| { taken_at?: string; metrics?: Record<string, unknown> }
		| undefined;
	const tarefas = p.tarefas as { total?: number; concluidas?: number } | null;
	const pendencias = (p.pendencias ?? []) as Array<{
		title: string;
		status: string;
		due_date: string | null;
	}>;
	const indicadores = (p.indicadores ?? []) as Array<{
		name: string;
		latest: number | null;
		target: number | null;
		semaphore: string;
	}>;
	const ferramentas = (p.ferramentas ?? []) as Array<{
		area: string;
		maturity_pct: number;
	}>;
	const encontros = (p.encontros ?? []) as Array<{
		position: number;
		title: string | null;
		status: string;
	}>;
	const metas = (p.metas ?? []) as Array<{ title: string; status: string }>;
	const score = p.score_maturidade as number | undefined;
	const proximos = p.proximos_90_dias as string | null;

	return (
		// `print-root` é o escopo da impressão: o `@media print` de globals.css
		// esconde o resto do documento (shell, nav, Assistente, rodapé, toasts) e
		// revela só esta subárvore.
		<div
			className={`${CARD} print-root p-6 mt-6 print:border-0 print:shadow-none`}
		>
			{/* `flex-wrap`: o título é longo e o botão não pode ser espremido —
			    em celular os dois viram duas linhas. */}
			<div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
				<h3 className="font-display text-lg font-bold text-primary">
					RAIO-X EMPRESARIAL — Profissão Laser 360°
				</h3>
				<button
					type="button"
					onClick={() => window.print()}
					className="inline-flex items-center gap-2 rounded-control border border-subtle px-3 py-2 text-label text-secondary transition-colors hover:border-brand-border hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
				>
					<Printer className="w-4 h-4" aria-hidden />
					Imprimir
				</button>
			</div>

			<div className="space-y-6 text-body">
				<ReportSection title="1. Onde comecei (Foto Zero)">
					<p className="text-caption text-muted mb-3">
						Registrada em {fmtDate(fotoZero?.taken_at ?? null)}
					</p>
					<MetricGrid metrics={fotoZero?.metrics ?? {}} />
				</ReportSection>

				<ReportSection title="2. O que diagnosticamos">
					{/* TODO: texto fixo — esta seção não lê nada do payload. O resumo do
					    diagnóstico existe na Foto Zero e poderia ser sintetizado aqui,
					    mas isso é trabalho de backend (o relatório é gerado lá). */}
					<p className="text-secondary">
						Diagnóstico completo registrado na Foto Zero (blocos identificação,
						estrutura, financeiro, comercial e diagnóstico).
					</p>
				</ReportSection>

				<ReportSection title="3. O que planejamos">
					{metas.length === 0 ? (
						<p className="text-muted">Nenhuma meta registrada.</p>
					) : (
						<ul className="space-y-1">
							{/* key por índice: metas/tarefas homônimas duplicavam a key. */}
							{metas.map((m, i) => (
								<li key={`${i}-${m.title}`} className="text-secondary">
									• {m.title}{' '}
									<span className="text-caption text-muted">
										({GOAL_STATUS_LABEL[m.status] ?? m.status})
									</span>
								</li>
							))}
						</ul>
					)}
				</ReportSection>

				<ReportSection title="4. O que foi executado">
					<p className="text-secondary mb-3">
						Encontros concluídos:{' '}
						{encontros.filter((e) => e.status === 'done').length}/
						{encontros.length} · Tarefas: {tarefas?.concluidas ?? 0}/
						{tarefas?.total ?? 0} concluídas
					</p>
					<div className="flex flex-wrap gap-2">
						{ferramentas.map((f) => (
							<Badge key={f.area} tone="brand">
								{`${areaLabel(f.area)}: ${formatBrPlain(f.maturity_pct)}%`}
							</Badge>
						))}
					</div>
				</ReportSection>

				<ReportSection title="5. Resultados (indicadores)">
					{indicadores.length === 0 ? (
						<p className="text-muted">Nenhum indicador registrado.</p>
					) : (
						<div className="divide-y divide-subtle">
							{indicadores.map((k, i) => (
								<ListRow
									key={`${i}-${k.name}`}
									title={k.name}
									description={`Atual ${formatBrPlain(k.latest)} · meta ${formatBrPlain(k.target)}`}
									trailing={
										<Badge tone={SEMAPHORE_TONE[k.semaphore] ?? 'neutral'}>
											{SEMAPHORE_LABEL[k.semaphore] ?? k.semaphore}
										</Badge>
									}
								/>
							))}
						</div>
					)}
				</ReportSection>

				<ReportSection title="6. Pendências">
					{pendencias.length === 0 ? (
						<p className="text-muted">Nenhuma pendência. 🎉</p>
					) : (
						<div className="divide-y divide-subtle">
							{pendencias.map((t, i) => (
								<ListRow
									key={`${i}-${t.title}`}
									title={t.title}
									description={
										t.due_date ? `Prazo ${fmtDate(t.due_date)}` : undefined
									}
									trailing={
										<Badge tone="neutral">
											{TASK_STATUS_LABEL[t.status] ?? t.status}
										</Badge>
									}
								/>
							))}
						</div>
					)}
				</ReportSection>

				<ReportSection title="7. Evolução">
					<div className="flex flex-wrap items-center gap-6">
						<DonutProgress pct={score ?? 0} caption="maturidade" />
						<p className="text-secondary flex-1 min-w-55">
							{score === undefined
								? 'Score de maturidade ainda não calculado.'
								: `Score de maturidade: ${score}/100.`}{' '}
							Comparação completa disponível no comparador acima (Foto Zero vs
							Agora).
						</p>
					</div>
				</ReportSection>

				<ReportSection title="8. Próximos 90 dias">
					<p className="text-secondary whitespace-pre-wrap">
						{proximos ??
							// A avaliação final ainda não tem tela para o aluno: não mandar
							// preencher algo que ele não encontra.
							'O plano dos próximos 90 dias é definido com o seu mentor no encerramento da jornada.'}
					</p>
				</ReportSection>
			</div>
		</div>
	);
}

function ReportSection({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	// `break-inside-avoid` mantém a seção inteira na mesma folha — uma seção
	// partida no meio é o que mais atrapalha na leitura do relatório impresso.
	return (
		<section className="break-inside-avoid">
			<h4 className="text-label text-primary mb-2">{title}</h4>
			{children}
		</section>
	);
}

function MetricGrid({ metrics }: { metrics: Record<string, unknown> }) {
	// Campos aninhados (objeto) não são métrica — entram no payload da Foto Zero
	// junto com os escalares e quebrariam o `String(value)`.
	const entries = Object.entries(metrics).filter(
		([, v]) => typeof v !== 'object' || v === null,
	);

	if (entries.length === 0)
		return <p className="text-muted">Sem métricas registradas.</p>;

	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
			{entries.map(([key, value]) => (
				<StatCard
					key={key}
					label={METRIC_LABEL[key] ?? key}
					value={formatMetricValue(key, value)}
				/>
			))}
		</div>
	);
}
