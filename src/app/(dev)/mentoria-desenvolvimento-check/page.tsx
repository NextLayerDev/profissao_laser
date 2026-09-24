'use client';

/**
 * Conferência visual das 4 abas de Desenvolvimento pessoal (Mentoria 360°).
 *
 * Renderiza os estados de `GoodNewsView`, `GoalsView`, `MaslowView` e
 * `BusinessPlanView` lado a lado com fixtures, sem backend. Existe porque
 * alguns desses estados dependem de sequência real e cara de reproduzir de
 * propósito: uma sequência de dias de "boas notícias", metas em cada status,
 * e mais de uma aplicação do teste de Maslow para o radar comparar.
 *
 * Página de desenvolvimento, descartável — mesmo padrão de
 * `app/(dev)/mentoria-diagnostico-check`. Não está em `PUBLIC_PATHS` do
 * `AuthGuard`, então é preciso estar logado para abrir.
 */

import { useState } from 'react';
import {
	BusinessPlanView,
	GoalsView,
	GoodNewsView,
	MaslowView,
} from '@/app/course/(shell)/mentoria/desenvolvimento/_components/desenvolvimento-view';
import {
	businessPlanEmptyFixture,
	businessPlanListFixture,
	businessPlanNoTemplateFixture,
	goalsEmptyFixture,
	goalsListFixture,
	goodNewsFreshFixture,
	goodNewsMidStreakFixture,
	goodNewsPostedTodayFixture,
	maslowNoHistoryFixture,
	maslowWithHistoryFixture,
} from '@/modules/mentoria/__fixtures__/desenvolvimento';

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
				<h2 className="text-section text-primary">{title}</h2>
				<p className="text-caption text-muted">{note}</p>
			</div>
			<div className="max-w-3xl">{children}</div>
		</section>
	);
}

export default function DesenvolvimentoCheckPage() {
	// Só para ver o efeito de `disabled`/"..." sem rede.
	const [pending, setPending] = useState(false);

	return (
		<div className="p-4 md:p-8">
			<header className="mb-8">
				<h1 className="text-page text-primary">
					Desenvolvimento pessoal — conferência
				</h1>
				<p className="mt-1 text-body text-secondary">
					Estados das 4 abas com fixtures. Alterne o tema para caçar texto
					ilegível.
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
				<div className="space-y-8">
					<h2 className="text-title text-primary">Boas Notícias</h2>

					<Section
						title="1. Primeira visita"
						note="Sem sequência e sem mural — só o formulário do dia."
					>
						<GoodNewsView
							data={goodNewsFreshFixture}
							posting={pending}
							onPost={(news) =>
								console.log('[check] postar boas notícias', news)
							}
						/>
					</Section>

					<Section
						title="2. Sequência em andamento"
						note="Sequência parcial preenchida + mural com dias anteriores."
					>
						<GoodNewsView
							data={goodNewsMidStreakFixture}
							posting={pending}
							onPost={(news) =>
								console.log('[check] postar boas notícias', news)
							}
						/>
					</Section>

					<Section
						title="3. Já postou hoje"
						note="O formulário fecha e mostra a confirmação; sequência completa."
					>
						<GoodNewsView
							data={goodNewsPostedTodayFixture}
							posting={pending}
							onPost={(news) =>
								console.log('[check] postar boas notícias', news)
							}
						/>
					</Section>
				</div>

				<div className="space-y-8">
					<h2 className="text-title text-primary">Meta e Ação</h2>

					<Section title="1. Nenhuma meta cadastrada" note="Estado vazio.">
						<GoalsView
							goals={goalsEmptyFixture}
							creating={pending}
							onCreate={(body) => console.log('[check] criar meta', body)}
							onUpdateStatus={(id, status) =>
								console.log('[check] mudar status', id, status)
							}
							onToggleFirstAction={(id, done) =>
								console.log('[check] alternar ação 48h', id, done)
							}
						/>
					</Section>

					<Section
						title="2. Metas em cada status"
						note="Não iniciada, atrasada, não iniciada e concluída, com e sem ação de 48h marcada."
					>
						<GoalsView
							goals={goalsListFixture}
							creating={pending}
							onCreate={(body) => console.log('[check] criar meta', body)}
							onUpdateStatus={(id, status) =>
								console.log('[check] mudar status', id, status)
							}
							onToggleFirstAction={(id, done) =>
								console.log('[check] alternar ação 48h', id, done)
							}
						/>
					</Section>
				</div>

				<div className="space-y-8">
					<h2 className="text-title text-primary">Teste de Maslow</h2>

					<Section
						title="1. Nunca aplicado"
						note="Sem histórico — o teste aparece direto, sem radar."
					>
						<MaslowView
							history={maslowNoHistoryFixture}
							submitting={pending}
							onSubmit={(answers) =>
								console.log('[check] enviar maslow', answers)
							}
						/>
					</Section>

					<Section
						title="2. Com histórico"
						note="Radar da última aplicação, dimensão mais baixa em destaque e lista de aplicações anteriores."
					>
						<MaslowView
							history={maslowWithHistoryFixture}
							submitting={pending}
							onSubmit={(answers) =>
								console.log('[check] enviar maslow', answers)
							}
						/>
					</Section>
				</div>

				<div className="space-y-8">
					<h2 className="text-title text-primary">Plano de Negócios</h2>

					<Section
						title="1. Sem template publicado"
						note="A turma ainda não tem formulário de plano de negócios."
					>
						<BusinessPlanView
							template={businessPlanNoTemplateFixture.template}
							versions={businessPlanNoTemplateFixture.versions}
							creating={pending}
							onCreate={(answers) =>
								console.log('[check] salvar plano', answers)
							}
						/>
					</Section>

					<Section
						title="2. Template publicado, nenhuma versão"
						note="Estado vazio + botão 'Nova versão' disponível."
					>
						<BusinessPlanView
							template={businessPlanEmptyFixture.template}
							versions={businessPlanEmptyFixture.versions}
							creating={pending}
							onCreate={(answers) =>
								console.log('[check] salvar plano', answers)
							}
						/>
					</Section>

					<Section
						title="3. Múltiplas versões"
						note="Lista de versões (mais recente com label) — clique num card para abrir em modo leitura."
					>
						<BusinessPlanView
							template={businessPlanListFixture.template}
							versions={businessPlanListFixture.versions}
							creating={pending}
							onCreate={(answers) =>
								console.log('[check] salvar plano', answers)
							}
						/>
					</Section>
				</div>
			</div>
		</div>
	);
}
