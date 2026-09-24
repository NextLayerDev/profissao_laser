'use client';

/**
 * Conferência visual da tela de Diagnóstico (Mentoria 360°).
 *
 * Renderiza os quatro estados de `DiagnosticoView` lado a lado com fixtures, sem
 * backend. Existe porque os estados reais são caros de alcançar: o "sem
 * template" depende da turma não ter formulário publicado, e o "Foto Zero
 * congelada" é IRREVERSÍVEL — conferir o modo leitura de verdade custaria uma
 * jornada queimada a cada ajuste de pixel.
 *
 * O template das fixtures tem um campo de CADA tipo, inclusive os que o
 * template de produção não usa (`select`, `scale`) e os que caem no fallback
 * de texto (`multiselect`, `file`). Numa migração visual esses ramos são
 * exatamente os que passariam despercebidos.
 *
 * Página de desenvolvimento, descartável — mesmo padrão de
 * `app/(dev)/upvox-ui-check`. Não está em `PUBLIC_PATHS` do `AuthGuard`, então
 * é preciso estar logado para abrir.
 *
 * O que ela NÃO cobre: o modal de confirmação depende do `ModalPortal`, que
 * ancora no <body> — aqui ele centraliza certo por não haver o `transform` do
 * <main> do course shell. Ou seja, o bug que o portal conserta só se verifica
 * na rota real, com a página rolada.
 */

import { useState } from 'react';
import { DiagnosticoView } from '@/app/course/(shell)/mentoria/diagnostico/_components/diagnostico-view';
import {
	diagnosticBlankFixture,
	diagnosticDraftFixture,
	diagnosticEmptyFixture,
	diagnosticFrozenFixture,
} from '@/modules/mentoria/__fixtures__/diagnostic';

const CASES = [
	{
		id: 'empty',
		title: '1. Sem template publicado',
		note: 'A turma ainda não tem formulário. Espera-se MntHeader + EmptyState.',
		state: diagnosticEmptyFixture,
	},
	{
		id: 'blank',
		title: '2a. Preenchimento — primeira visita',
		note: 'Sem rascunho: o rodapé deve dizer "Nenhum rascunho salvo ainda."',
		state: diagnosticBlankFixture,
	},
	{
		id: 'draft',
		title: '2b. Preenchimento — com rascunho',
		note: 'Um campo de cada tipo. "Capacidade produtiva" vem marcada como A LEVANTAR.',
		state: diagnosticDraftFixture,
	},
	{
		id: 'frozen',
		title: '3. Foto Zero congelada',
		note: 'Modo leitura. "Maturidade comercial" está ausente — deve sair como "—".',
		state: diagnosticFrozenFixture,
	},
] as const;

export default function DiagnosticoCheckPage() {
	// Só para ver o efeito de `disabled`/"Salvando..." sem rede.
	const [pending, setPending] = useState<'none' | 'draft' | 'submit'>('none');

	return (
		<div className="p-4 md:p-8">
			<header className="mb-8">
				<h1 className="text-page text-primary">Diagnóstico — conferência</h1>
				<p className="mt-1 text-body text-secondary">
					Quatro estados com fixtures. Alterne o tema para caçar texto ilegível:
					o suspeito nº 1 é o âmbar do &quot;A LEVANTAR&quot;.
				</p>
				<div className="mt-3 flex flex-wrap gap-2">
					{(['none', 'draft', 'submit'] as const).map((p) => (
						<button
							key={p}
							type="button"
							onClick={() => setPending(p)}
							aria-pressed={pending === p}
							className={`rounded-chip border px-3 py-1 text-caption transition ${
								pending === p
									? 'border-brand bg-brand-wash text-brand dark:text-violet-400'
									: 'border-subtle text-muted'
							}`}
						>
							{p === 'none'
								? 'ocioso'
								: p === 'draft'
									? 'salvando rascunho'
									: 'enviando'}
						</button>
					))}
				</div>
			</header>

			<div className="space-y-12">
				{CASES.map((c) => (
					<section key={c.id}>
						<div className="mb-3 border-subtle border-b pb-2">
							<h2 className="text-section text-primary">{c.title}</h2>
							<p className="text-caption text-muted">{c.note}</p>
						</div>
						{/* `max-w-3xl` imita a largura da coluna de conteúdo da Mentoria
						    com o Assistente aberto — é onde as container queries do
						    formulário colapsam para uma coluna. */}
						<div className="max-w-3xl">
							<DiagnosticoView
								data={c.state}
								savingDraft={pending === 'draft'}
								submitting={pending === 'submit'}
								onSaveDraft={(answers) =>
									console.log('[check] salvar rascunho', answers)
								}
								onSubmit={(answers) => console.log('[check] enviar', answers)}
							/>
						</div>
					</section>
				))}
			</div>
		</div>
	);
}
