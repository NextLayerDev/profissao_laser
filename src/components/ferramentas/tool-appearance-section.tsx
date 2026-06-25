'use client';

import { Palette } from 'lucide-react';
import type { ScreenUi } from '@/modules/tools/services/tool-definitions.service';
import {
	Field,
	FormSection,
	inputCls,
	SegmentedControl,
	Switch,
} from './builder-ui';

/** Aparência das duas telas de uma tool de pipeline (Admin + Cliente). */
export interface ToolScreensUi {
	admin?: ScreenUi;
	customer?: ScreenUi;
}

const SWATCHES = [
	'#d946ef',
	'#7c3aed',
	'#2563eb',
	'#059669',
	'#d97706',
	'#db2777',
	'#0891b2',
	'#475569',
];

const DEFAULT_ACCENT = '#d946ef';

/**
 * Editor de aparência de uma tool de PIPELINE (Banco do Admin / Prompts
 * Mágicos): SEPARADO por tela (Admin/Cliente) via sub-toggle. Cor, tema,
 * título, subtítulo e banner. Espelha o `RoomAppearanceSection` das salas,
 * porém mais simples (sem materiais/chat). Lê/escreve `{ admin?, customer? }`
 * via `value`/`onChange` — quem persiste (patch do `ui` + publish) é a view.
 */
export function ToolAppearanceSection({
	value,
	onChange,
	screen,
	onScreenChange,
}: {
	value: ToolScreensUi;
	onChange: (next: ToolScreensUi) => void;
	/** Tela editada (Admin OU Cliente). */
	screen: 'admin' | 'customer';
	onScreenChange: (s: 'admin' | 'customer') => void;
}) {
	const cur: ScreenUi = value[screen] ?? {};
	const accent = cur.accent ?? DEFAULT_ACCENT;

	const patchScreen = (p: Partial<ScreenUi>) => {
		onChange({ ...value, [screen]: { ...(value[screen] ?? {}), ...p } });
	};
	const patchNotice = (p: Partial<NonNullable<ScreenUi['notice']>>) =>
		patchScreen({ notice: { ...(cur.notice ?? {}), ...p } });

	return (
		<FormSection
			step="05"
			title="Aparência"
			subtitle="Cor, tema, textos e banner — separados por tela."
			icon={<Palette className="h-4 w-4" />}
			accent="fuchsia"
			delay={180}
		>
			<div className="mb-5">
				<SegmentedControl
					value={screen}
					onChange={(v) => onScreenChange(v as 'admin' | 'customer')}
					ariaLabel="Tela a personalizar"
					accent="fuchsia"
					options={[
						{ value: 'admin', label: 'Admin' },
						{ value: 'customer', label: 'Cliente' },
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
						onChange={(v) => patchScreen({ theme: v as ScreenUi['theme'] })}
						ariaLabel="Tema"
						accent="fuchsia"
						options={[
							{ value: 'app', label: 'Seguir app' },
							{ value: 'light', label: 'Claro' },
							{ value: 'dark', label: 'Escuro' },
						]}
					/>
				</Field>

				<Field label="Textos do topo" hint="vazio = padrão">
					<div className="grid gap-3 sm:grid-cols-2">
						<div>
							<span className="mb-1 block text-[12px] text-slate-400">
								Título
							</span>
							<input
								value={cur.title ?? ''}
								onChange={(e) => patchScreen({ title: e.target.value })}
								placeholder={
									screen === 'admin' ? 'Banco do Admin' : 'Escolha um modelo'
								}
								className={inputCls}
							/>
						</div>
						<div>
							<span className="mb-1 block text-[12px] text-slate-400">
								Subtítulo
							</span>
							<input
								value={cur.subtitle ?? ''}
								onChange={(e) => patchScreen({ subtitle: e.target.value })}
								placeholder={
									screen === 'admin'
										? 'alimente os itens que o cliente usa'
										: 'gere com um clique'
								}
								className={inputCls}
							/>
						</div>
					</div>
				</Field>

				<div className="rounded-xl border border-white/10 bg-black/20 p-4">
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-[13px] font-medium text-slate-200">
								Banner / aviso no topo
							</p>
							<p className="text-[11px] text-slate-500">
								Um destaque acima do conteúdo (boas-vindas, regras, avisos).
							</p>
						</div>
						<Switch
							checked={!!cur.notice}
							onChange={(on) =>
								patchScreen({ notice: on ? { type: 'info' } : null })
							}
							accent="fuchsia"
						/>
					</div>
					{cur.notice && (
						<div className="mt-4 space-y-3">
							<SegmentedControl
								value={cur.notice.type ?? 'info'}
								onChange={(v) =>
									patchNotice({ type: v as 'info' | 'warning' | 'success' })
								}
								ariaLabel="Tipo do aviso"
								accent="fuchsia"
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
								className="w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-fuchsia-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/30"
							/>
						</div>
					)}
				</div>
			</div>
		</FormSection>
	);
}
