'use client';

// Apresentação da tela de Diagnóstico — só recebe `DiagnosticState` e devolve
// os eventos. Quem busca e quem muta é o `page.tsx`.
//
// A separação existe por um motivo concreto: os três estados desta tela são
// caros de alcançar num ambiente real, e o terceiro é IRREVERSÍVEL — uma vez
// congelada, a Foto Zero não volta (o backend recusa o segundo envio e o
// snapshot é imutável por trigger). Sem esta divisão, conferir o modo leitura
// custaria uma jornada queimada a cada ajuste de pixel. Com ela, a rota
// `app/(dev)/mentoria-diagnostico-check` monta os quatro casos com fixtures.
//
// Os três estados, na ordem em que vale lê-los:
//   1. sem template publicado  → não há o que responder;
//   2. preenchimento           → formulário + rascunho + confirmação;
//   3. Foto Zero congelada     → modo leitura, para sempre.

import { Button, buttonLabel } from '@upvox-dev/ui';
import { Camera, ClipboardList, Lock, Save, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native-css/components/Text';
import { ModalPortal } from '@/components/ui/modal-portal';
import { DynamicForm } from '@/modules/mentoria/components/dynamic-form';
import { SectionCard } from '@/modules/mentoria/components/ui';
import type { DiagnosticState, MntSnapshot } from '@/modules/mentoria/types';
import { isUnknownAnswer } from '@/modules/mentoria/types';
import { EmptyState, fmtDate, MntHeader } from '../../_components/shared';

export function DiagnosticoView({
	data,
	savingDraft,
	submitting,
	onSaveDraft,
	onSubmit,
}: {
	data: DiagnosticState | null | undefined;
	savingDraft: boolean;
	submitting: boolean;
	onSaveDraft: (answers: Record<string, unknown>) => void;
	/** `null` quando o aluno não tocou no formulário nesta sessão. */
	onSubmit: (answers: Record<string, unknown> | null) => void;
}) {
	// As respostas ficam num ref, e não em state: o DynamicForm já guarda o
	// próprio estado, e espelhá-lo aqui re-renderizaria a tela a cada tecla.
	const answersRef = useRef<Record<string, unknown> | null>(null);
	const [confirming, setConfirming] = useState(false);

	// Sem `p-4 md:p-8` em nenhum dos três retornos: o `mentoria/layout.tsx` já
	// aplica o padding da área. Antes esta tela aplicava de novo, e o conteúdo
	// ficava com o dobro da margem das outras.
	if (!data?.template) {
		return (
			<div className="space-y-6">
				<MntHeader title="Diagnóstico — Raio-X inicial" icon={ClipboardList} />
				<EmptyState
					title="Diagnóstico indisponível"
					description="O formulário de diagnóstico ainda não foi publicado para a sua turma. Fale com seu mentor."
				/>
			</div>
		);
	}

	// Foto Zero congelada → modo leitura
	if (data.foto_zero) {
		return (
			<div className="space-y-6">
				<MntHeader
					title="Diagnóstico — Foto Zero"
					subtitle={`Congelada em ${fmtDate(data.foto_zero.taken_at)} — este é o seu ponto de partida`}
					icon={Camera}
				/>
				<div className="flex items-center gap-3 rounded-card border border-subtle bg-surface p-4">
					{/* `text-brand` não tem token escuro no DS — daí o par `dark:`,
					    mesma ressalva das outras telas da Mentoria. */}
					<Lock className="h-4 w-4 shrink-0 text-brand dark:text-violet-400" />
					<p className="text-body text-secondary">
						A Foto Zero está congelada e não pode ser alterada. Ela é a
						referência do &quot;antes&quot; para medir toda a sua evolução na
						mentoria.
					</p>
				</div>
				<FotoZeroView
					snapshot={data.foto_zero}
					answers={
						(data.submitted?.answers ?? data.draft?.answers ?? null) as Record<
							string,
							unknown
						> | null
					}
					templateBlocks={data.template.schema.blocks}
				/>
			</div>
		);
	}

	const initialAnswers =
		(data.draft?.answers as Record<string, unknown> | undefined) ?? {};

	return (
		<div className="space-y-6">
			<MntHeader
				title={data.template.title || 'Diagnóstico — Raio-X inicial'}
				subtitle={
					data.template.description ??
					'Responda com sinceridade: não saber também é diagnóstico. Use "A LEVANTAR" quando não tiver o dado.'
				}
				icon={ClipboardList}
			/>

			<DynamicForm
				template={data.template}
				initialAnswers={initialAnswers}
				onChange={(answers) => {
					answersRef.current = answers;
				}}
			/>

			<div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-subtle bg-surface p-4">
				<p className="text-body text-muted">
					{data.draft
						? `Rascunho salvo por último em ${fmtDate(data.draft.updated_at)}.`
						: 'Nenhum rascunho salvo ainda.'}
				</p>
				<div className="flex gap-2">
					{/* Ícone + texto é um ARRAY de children, e array bypassa o wrap
					    automático do Button em <Text> — o texto cru quebraria em runtime
					    ("A text node cannot be a child of a <View>"). Daí o <Text>
					    explícito. A cor do ícone também vai à mão: `buttonLabel` veste
					    só o <Text>. */}
					<Button
						variant="secondary"
						onPress={() => onSaveDraft(answersRef.current ?? initialAnswers)}
						disabled={savingDraft}
					>
						<Save className="h-4 w-4 text-primary" aria-hidden />
						<Text className={buttonLabel({ variant: 'secondary' })}>
							{savingDraft ? 'Salvando...' : 'Salvar rascunho'}
						</Text>
					</Button>
					<Button
						variant="primary"
						onPress={() => setConfirming(true)}
						disabled={submitting}
					>
						<Send className="h-4 w-4 text-on-brand" aria-hidden />
						<Text className={buttonLabel({ variant: 'primary' })}>
							Enviar diagnóstico e congelar Foto Zero
						</Text>
					</Button>
				</div>
			</div>

			{confirming && (
				<ConfirmFreeze
					submitting={submitting}
					onCancel={() => setConfirming(false)}
					onConfirm={() => {
						setConfirming(false);
						onSubmit(answersRef.current);
					}}
				/>
			)}
		</div>
	);
}

// ── Modal de confirmação ─────────────────────────────────────────────────────

// Fica em `ModalPortal` por obrigação, não por gosto: o course shell anima o
// <main> com `transform`, e transform cria containing block — sem o portal o
// `fixed` ancoraria no <main> rolado em vez do viewport, e o modal apareceria
// fora de lugar justamente em página rolada (que é o caso aqui: o formulário é
// longo, e o botão de enviar fica no fim dele).
//
// `items-start` + `overflow-y-auto` no pai e `my-auto` no painel são o que faz
// o modal ROLAR quando não cabe. É também por isso que o <Modal> do DS não foi
// adotado aqui: ele não rola (gap em docs/mentoria-360-design-system.md, A.5).
function ConfirmFreeze({
	submitting,
	onCancel,
	onConfirm,
}: {
	submitting: boolean;
	onCancel: () => void;
	onConfirm: () => void;
}) {
	// Esc fecha. O listener vai em `document`, e não num `onKeyDown` da div: o
	// resto do app faz assim e só funciona quando a div está focada — por isso
	// Esc não fecha `modal-overlay` nem `source-drawer`.
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onCancel();
		};
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [onCancel]);

	return (
		<ModalPortal>
			<div
				className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-overlay p-4 backdrop-blur-sm md:p-8"
				onClick={onCancel}
				onKeyDown={(e) => e.key === 'Escape' && onCancel()}
				role="presentation"
			>
				<div
					className="my-auto w-full max-w-md rounded-card border border-subtle bg-surface p-6 shadow-overlay"
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
					role="dialog"
					aria-modal="true"
					aria-labelledby="confirmar-foto-zero"
				>
					<div className="mb-2 flex items-center gap-2">
						<Camera className="h-5 w-5 text-brand dark:text-violet-400" />
						<h3 id="confirmar-foto-zero" className="text-title text-primary">
							Congelar Foto Zero?
						</h3>
					</div>
					<p className="mb-5 text-body text-secondary">
						Ao enviar, suas respostas viram a Foto Zero da sua empresa — o
						retrato oficial do ponto de partida.{' '}
						<strong>Ela não pode ser alterada depois.</strong>
					</p>
					<div className="flex justify-end gap-2">
						<Button variant="secondary" onPress={onCancel}>
							<Text className={buttonLabel({ variant: 'secondary' })}>
								Voltar e revisar
							</Text>
						</Button>
						<Button variant="primary" onPress={onConfirm} disabled={submitting}>
							<Text className={buttonLabel({ variant: 'primary' })}>
								{submitting ? 'Enviando...' : 'Enviar e congelar'}
							</Text>
						</Button>
					</div>
				</div>
			</div>
		</ModalPortal>
	);
}

// ── Modo leitura da Foto Zero ────────────────────────────────────────────────

function FotoZeroView({
	snapshot,
	answers,
	templateBlocks,
}: {
	snapshot: MntSnapshot;
	answers: Record<string, unknown> | null;
	templateBlocks: Array<{
		key: string;
		title: string;
		fields: Array<{ key: string; label: string }>;
	}>;
}) {
	// Preferimos as respostas da submissão; o payload do snapshot é o fallback.
	const source =
		answers ??
		((snapshot.payload.answers ?? snapshot.payload) as Record<string, unknown>);

	return (
		<div className="space-y-5">
			{templateBlocks.map((block) => (
				// `@container` + `@2xl:` em vez de `md:`: o painel do Assistente rouba
				// 384px da coluna, e breakpoint de viewport não enxerga isso — duas
				// colunas de definição numa coluna estreita ficam ilegíveis.
				<SectionCard key={block.key} title={block.title} className="@container">
					<dl className="grid grid-cols-1 gap-x-6 gap-y-3 @2xl:grid-cols-2">
						{block.fields.map((field) => {
							const value = source?.[field.key];
							return (
								<div key={field.key}>
									<dt className="text-caption uppercase tracking-wide text-muted">
										{field.label}
									</dt>
									<dd className="mt-0.5 whitespace-pre-wrap text-body text-primary">
										{renderAnswer(value)}
									</dd>
								</div>
							);
						})}
					</dl>
				</SectionCard>
			))}
		</div>
	);
}

function renderAnswer(value: unknown): string {
	if (value === undefined || value === null || value === '') return '—';
	if (isUnknownAnswer(value)) return '[ A LEVANTAR / NÃO MEDIDO ]';
	if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
	if (Array.isArray(value)) return value.map(String).join(', ');
	if (typeof value === 'object') return JSON.stringify(value);
	return String(value);
}
