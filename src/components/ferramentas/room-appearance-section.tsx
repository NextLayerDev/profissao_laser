'use client';

import { Palette } from 'lucide-react';
import type { BuilderRoomState, RoomScreenUi } from './builder-model';
import {
	Field,
	FormSection,
	inputCls,
	SegmentedControl,
	Switch,
} from './builder-ui';

const SWATCHES = [
	'#ff3b30',
	'#7c3aed',
	'#2563eb',
	'#059669',
	'#d97706',
	'#db2777',
	'#0891b2',
	'#475569',
];

const LABEL_FIELDS: {
	key: string;
	label: string;
	placeholder: string;
	admin?: boolean;
}[] = [
	{
		key: 'headerSubtitle',
		label: 'Subtítulo do topo',
		placeholder: 'Salas de vídeo e lives ao vivo da sua jornada.',
	},
	{ key: 'enter', label: 'Botão "Entrar"', placeholder: 'Entrar' },
	{
		key: 'emptyText',
		label: 'Texto quando vazio',
		placeholder: 'Nenhuma sessão agendada ainda.',
	},
	{
		key: 'emptyButton',
		label: 'Botão do estado vazio',
		placeholder: 'Agendar a primeira',
		admin: true,
	},
	{
		key: 'materialsTitle',
		label: 'Título "Materiais"',
		placeholder: 'Materiais',
	},
	{ key: 'chatTitle', label: 'Título do chat', placeholder: 'Chat ao vivo' },
	{
		key: 'novaSessao',
		label: 'Botão "Nova sessão"',
		placeholder: 'Nova sessão',
		admin: true,
	},
	{
		key: 'acompanhar',
		label: 'Botão "Acompanhar"',
		placeholder: 'Acompanhar',
		admin: true,
	},
];

/**
 * Editor de aparência da sala (room.ui), SEPARADO por tela (aluno/admin) via
 * sub-toggle. Cor, tema, textos, banner e seções visíveis. O preview (abas
 * Aluno/Admin) reflete ao vivo via `previewDef`.
 */
export function RoomAppearanceSection({
	room,
	setRoom,
	screen,
	onScreenChange,
	selectedField,
	onFieldFocus,
}: {
	room: BuilderRoomState;
	setRoom: (partial: Partial<BuilderRoomState>) => void;
	/** Tela editada (controlado pelo editor 2-colunas). */
	screen: 'customer' | 'admin';
	onScreenChange: (s: 'customer' | 'admin') => void;
	/** Campo selecionado no canvas (realça aqui no form). */
	selectedField?: string;
	onFieldFocus?: (field: string) => void;
}) {
	const cur: RoomScreenUi = room.ui?.[screen] ?? {};
	const accent = cur.accent ?? '#ff3b30';

	const patchScreen = (p: Partial<RoomScreenUi>) => {
		const ui = { ...(room.ui ?? {}) };
		ui[screen] = { ...(ui[screen] ?? {}), ...p };
		setRoom({ ui });
	};
	const setLabel = (key: string, value: string) => {
		const labels = { ...(cur.labels ?? {}) };
		if (value.trim()) labels[key] = value;
		else delete labels[key];
		patchScreen({ labels });
	};
	const patchNotice = (p: Partial<NonNullable<RoomScreenUi['notice']>>) =>
		patchScreen({ notice: { ...(cur.notice ?? {}), ...p } });

	return (
		<FormSection
			step="04"
			title="Aparência"
			subtitle="Cor, tema, textos e banner — separados por tela."
			icon={<Palette className="h-4 w-4" />}
			accent="violet"
			delay={180}
		>
			<div className="mb-5">
				<SegmentedControl
					value={screen}
					onChange={(v) => onScreenChange(v as 'customer' | 'admin')}
					ariaLabel="Tela a personalizar"
					options={[
						{ value: 'customer', label: 'Aluno' },
						{ value: 'admin', label: 'Admin' },
					]}
				/>
			</div>

			<div className="space-y-5">
				<Field label="Cor de destaque" hint="botões, ícones e realces">
					<div className="flex flex-wrap items-center gap-2">
						{SWATCHES.map((c) => (
							<button
								key={c}
								type="button"
								aria-label={c}
								onClick={() => patchScreen({ accent: c })}
								className={`size-7 rounded-full ring-2 ${accent.toLowerCase() === c ? 'ring-white' : 'ring-transparent'}`}
								style={{ backgroundColor: c }}
							/>
						))}
						<input
							type="color"
							aria-label="Cor personalizada"
							value={accent}
							onChange={(e) => patchScreen({ accent: e.target.value })}
							className="size-7 cursor-pointer rounded-full border border-white/10 bg-transparent p-0"
						/>
						<input
							value={accent}
							onChange={(e) => {
								const v = e.target.value;
								if (/^#[0-9a-fA-F]{0,6}$/.test(v)) patchScreen({ accent: v });
							}}
							className={`${inputCls} w-28 font-mono`}
						/>
					</div>
				</Field>

				<Field label="Tema">
					<SegmentedControl
						value={cur.theme ?? 'app'}
						onChange={(v) => patchScreen({ theme: v as RoomScreenUi['theme'] })}
						ariaLabel="Tema"
						options={[
							{ value: 'app', label: 'Seguir app' },
							{ value: 'light', label: 'Claro' },
							{ value: 'dark', label: 'Escuro' },
						]}
					/>
				</Field>

				<Field label="Textos" hint="vazio = padrão">
					<div className="grid gap-3 sm:grid-cols-2">
						{LABEL_FIELDS.filter((f) => screen === 'admin' || !f.admin).map(
							(f) => (
								<div key={f.key}>
									<span className="mb-1 block text-[12px] text-slate-400">
										{f.label}
									</span>
									<input
										id={`ap-${f.key}`}
										value={cur.labels?.[f.key] ?? ''}
										onChange={(e) => setLabel(f.key, e.target.value)}
										onFocus={() => onFieldFocus?.(f.key)}
										placeholder={f.placeholder}
										className={`${inputCls} ${selectedField === f.key ? 'ring-2 ring-violet-400/60' : ''}`}
									/>
								</div>
							),
						)}
					</div>
				</Field>

				<div
					id="ap-banner"
					className={`rounded-xl border bg-black/20 p-4 ${selectedField === 'banner' ? 'border-violet-400/60 ring-2 ring-violet-400/40' : 'border-white/10'}`}
				>
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-[13px] font-medium text-slate-200">
								Banner / aviso no topo
							</p>
							<p className="text-[11px] text-slate-500">
								Um destaque acima das sessões (boas-vindas, regras, avisos).
							</p>
						</div>
						<Switch
							checked={!!cur.notice}
							onChange={(on) =>
								patchScreen({ notice: on ? { type: 'info' } : null })
							}
							accent="violet"
						/>
					</div>
					{cur.notice && (
						<div className="mt-4 space-y-3">
							<SegmentedControl
								value={cur.notice.type ?? 'info'}
								onChange={(v) =>
									patchNotice({
										type: v as 'info' | 'warning' | 'success',
									})
								}
								ariaLabel="Tipo do aviso"
								options={[
									{ value: 'info', label: 'Info' },
									{ value: 'warning', label: 'Aviso' },
									{ value: 'success', label: 'Sucesso' },
								]}
							/>
							<input
								value={cur.notice.title ?? ''}
								onChange={(e) => patchNotice({ title: e.target.value })}
								placeholder="Título"
								className={inputCls}
							/>
							<textarea
								value={cur.notice.message ?? ''}
								onChange={(e) => patchNotice({ message: e.target.value })}
								placeholder="Mensagem"
								rows={2}
								className="w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-emerald-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/30"
							/>
						</div>
					)}
				</div>

				<Field label="Seções visíveis nesta tela">
					<div className="space-y-2">
						<AppearanceToggle
							label="Materiais"
							checked={cur.sections?.materials ?? true}
							onChange={(on) =>
								patchScreen({ sections: { ...cur.sections, materials: on } })
							}
						/>
						<AppearanceToggle
							label="Chat ao vivo"
							checked={cur.sections?.chat ?? true}
							onChange={(on) =>
								patchScreen({ sections: { ...cur.sections, chat: on } })
							}
						/>
					</div>
				</Field>
			</div>
		</FormSection>
	);
}

function AppearanceToggle({
	label,
	checked,
	onChange,
}: {
	label: string;
	checked: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
			<span className="text-[13px] text-slate-200">{label}</span>
			<Switch checked={checked} onChange={onChange} accent="violet" />
		</div>
	);
}
