'use client';

/**
 * Conferência visual da Evolução (Mentoria 360°).
 *
 * Renderiza `EvolucaoView` e `RaioxView` com fixtures, sem backend. Existe pelo
 * mesmo motivo das outras: os estados daqui dependem de TEMPO, não de cliques —
 * comparar períodos exige Foto Zero enviada e meses de snapshots, e o Raio-X só
 * sai quando o backend consegue consolidar a jornada inteira. Ver o relatório
 * vazio e o cheio lado a lado não acontece numa jornada real.
 *
 * O cenário 8 é o que se usa para conferir a folha impressa (Ctrl+P).
 *
 * Página de desenvolvimento, descartável — mesmo padrão de
 * `app/(dev)/mentoria-tarefas-check`. Não está em `PUBLIC_PATHS` do
 * `AuthGuard`, então é preciso estar logado para abrir.
 */

import { useState } from 'react';
import { fmtDate } from '@/app/course/(shell)/mentoria/_components/shared';
import { EvolucaoView } from '@/app/course/(shell)/mentoria/evolucao/_components/evolucao-view';
import { RaioxView } from '@/app/course/(shell)/mentoria/evolucao/_components/raiox-view';
import {
	comparisonEmptyFixture,
	comparisonMixedFixture,
	raioxEmptyFixture,
	raioxFullFixture,
	reportsEmptyFixture,
	reportsListFixture,
	snapshotsManyFixture,
	snapshotsMinimalFixture,
} from '@/modules/mentoria/__fixtures__/evolucao';

/** Mesma montagem de opções que o container faz a partir dos snapshots. */
function periodOptions(snapshots: typeof snapshotsManyFixture) {
	return [
		{ value: 'foto_zero', label: 'Foto Zero' },
		...snapshots
			.filter((s) => s.kind !== 'foto_zero')
			.map((s) => ({
				value: s.id,
				label: `${s.label ?? s.kind} — ${fmtDate(s.taken_at)}`,
			})),
		{ value: 'current', label: 'Agora' },
	];
}

function Section({
	title,
	note,
	children,
}: {
	title: string;
	note: string;
	children: React.ReactNode;
}) {
	return (
		<section>
			<div className="mb-3 border-subtle border-b pb-2">
				<h3 className="text-section text-primary">{title}</h3>
				<p className="text-caption text-muted">{note}</p>
			</div>
			{children}
		</section>
	);
}

export default function EvolucaoCheckPage() {
	// Só para ver o efeito de `disabled`/"..." sem rede.
	const [pending, setPending] = useState(false);

	const noop = () => {};
	const minimal = periodOptions(snapshotsMinimalFixture);
	const many = periodOptions(snapshotsManyFixture);

	const base = {
		from: 'foto_zero',
		to: 'current',
		onFromChange: noop,
		onToChange: noop,
		openReport: null,
		onToggleReport: noop,
		snapshotting: pending,
		onSnapshot: noop,
		generating: pending,
		onGenerate: noop,
	};

	return (
		<div className="p-4 md:p-8">
			<header className="mb-8 max-w-5xl mx-auto">
				<h1 className="text-page text-primary">Evolução — conferência</h1>
				<p className="mt-1 text-body text-secondary">
					Estados do comparador e do Raio-X 360° com fixtures. Alterne o tema
					para caçar texto ilegível. No cenário 4, confira a cor da variação de
					"Custos fixos": subir custo tem que sair <b>vermelho</b>, mesmo sendo
					um número positivo.
				</p>
				<div className="mt-3 flex flex-wrap gap-2">
					<button
						type="button"
						onClick={() => setPending((v) => !v)}
						aria-pressed={pending}
						className={`rounded-chip border px-3 py-1 text-caption transition ${
							pending
								? 'border-brand bg-brand-wash text-brand dark:text-violet-400'
								: 'border-subtle text-muted'
						}`}
					>
						{pending ? 'enviando (ligado)' : 'ocioso'}
					</button>
				</div>
			</header>

			<div className="space-y-14">
				<Section
					title="1. Comparação carregando"
					note="Skeleton do comparador enquanto a comparação entre os dois períodos não volta."
				>
					<EvolucaoView
						{...base}
						options={minimal}
						comparisonState="loading"
						comparison={undefined}
						reports={reportsEmptyFixture}
					/>
				</Section>

				<Section
					title="2. Sem Foto Zero"
					note="A comparação falha porque o diagnóstico inicial nunca foi enviado — é o erro mais comum da tela."
				>
					<EvolucaoView
						{...base}
						options={minimal}
						comparisonState="error"
						comparison={undefined}
						reports={reportsEmptyFixture}
					/>
				</Section>

				<Section
					title="3. Sem métricas em comum"
					note="Os dois períodos existem, mas não compartilham nenhuma métrica numérica."
				>
					<EvolucaoView
						{...base}
						options={many}
						comparisonState="empty"
						comparison={comparisonEmptyFixture}
						reports={reportsEmptyFixture}
					/>
				</Section>

				<Section
					title="4. Deltas mistos (conferir Custos fixos)"
					note="Subida boa, subida ruim (custos fixos), queda ruim (margem), delta zero, lado sem valor e chave fora do dicionário de rótulos."
				>
					<EvolucaoView
						{...base}
						options={many}
						comparisonState="ready"
						comparison={comparisonMixedFixture}
						reports={reportsEmptyFixture}
					/>
				</Section>

				<Section
					title="5. Nenhum relatório gerado"
					note="Estado vazio da lista de Raio-X, com a explicação do que o relatório consolida."
				>
					<EvolucaoView
						{...base}
						options={many}
						comparisonState="ready"
						comparison={comparisonMixedFixture}
						reports={reportsEmptyFixture}
					/>
				</Section>

				<Section
					title="6. Lista de relatórios, um aberto"
					note="O Raio-X é regerado a cada rodada, então a lista acumula. O aberto ganha o selo e renderiza o relatório abaixo."
				>
					<EvolucaoView
						{...base}
						options={many}
						comparisonState="ready"
						comparison={comparisonMixedFixture}
						reports={reportsListFixture}
						openReport={raioxFullFixture}
					/>
				</Section>

				<Section
					title="7. Raio-X de uma jornada no começo"
					note="Cinco estados vazios de uma vez, score ausente e o fallback dos próximos 90 dias."
				>
					<RaioxView report={raioxEmptyFixture} />
				</Section>

				<Section
					title="8. Raio-X completo — usar este para conferir a impressão"
					note="Jornada no fim: 10/10 encontros, as 8 áreas do Mapa, indicadores nos quatro semáforos, pendências com e sem prazo, score 78 e plano multi-linha. Ctrl+P aqui deve imprimir só o relatório."
				>
					<RaioxView report={raioxFullFixture} />
				</Section>
			</div>
		</div>
	);
}
