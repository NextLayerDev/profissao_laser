'use client';

import type { Canvas, FabricObject } from 'fabric';
import { Eraser, Loader2, Lock, Sparkles, Trash2, Unlock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { CreditConfirmModal } from '@/components/credits/credit-confirm-modal';
import type { CanvasRegion } from '@/hooks/canva-editor/use-canvas-region';
import { useCreditAction } from '@/hooks/use-credit-action';
import { useVoxBalance, useVoxCosts } from '@/hooks/use-credits';
import {
	useEditorAiGenerate,
	useRemoveBackground,
} from '@/hooks/use-editor-ai';
import type { EditorTool } from './editor-toolbar';

interface EditorSidebarProps {
	canvas: Canvas | null;
	activeTool: EditorTool;
	selectedObject: FabricObject | null;
	region: CanvasRegion | null;
	onClearRegion: () => void;
	onApplyEditedImage: (base64: string) => void;
}

export function EditorSidebar({
	canvas,
	activeTool,
	selectedObject,
	region,
	onClearRegion,
	onApplyEditedImage,
}: EditorSidebarProps) {
	return (
		<aside className="w-72 shrink-0 border-l border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] overflow-y-auto">
			{(activeTool === 'region' || activeTool === 'ai') && (
				<AiPanel
					region={region}
					canvas={canvas}
					isRegionMode={activeTool === 'region'}
					onClearRegion={onClearRegion}
					onApplyEditedImage={onApplyEditedImage}
				/>
			)}
			{activeTool !== 'region' && activeTool !== 'ai' && selectedObject && (
				<ObjectPanel canvas={canvas} object={selectedObject} />
			)}
			{activeTool !== 'region' && activeTool !== 'ai' && !selectedObject && (
				<div className="p-5 text-sm text-slate-500 dark:text-gray-400">
					<p>Selecione um objeto para editar suas propriedades.</p>
					<p className="mt-2">
						Ou use a ferramenta <strong>Região (IA)</strong> pra editar uma área
						específica com IA.
					</p>
				</div>
			)}
		</aside>
	);
}

// ─── AI Panel ───────────────────────────────────────────────────────────

interface AiPanelProps {
	region: CanvasRegion | null;
	canvas: Canvas | null;
	isRegionMode: boolean;
	onClearRegion: () => void;
	onApplyEditedImage: (base64: string) => void;
}

function AiPanel({
	region,
	canvas,
	isRegionMode,
	onClearRegion,
	onApplyEditedImage,
}: AiPanelProps) {
	const [prompt, setPrompt] = useState('');
	const aiGenerate = useEditorAiGenerate();
	const removeBg = useRemoveBackground();
	const { data: voxBalance } = useVoxBalance();
	const { data: voxCosts } = useVoxCosts();
	const cost = voxCosts?.find((c) => c.feature === 'editor-ai')?.cost ?? 1;

	const exportCanvasAsBase64 = (): string | null => {
		if (!canvas) return null;
		return canvas.toDataURL({ format: 'png', multiplier: 1 });
	};

	const aiAction = useCreditAction({
		feature: 'editor-ai',
		cost,
		balance: voxBalance?.balance ?? 0,
		run: async ({ useCredits }) => {
			const trimmed = prompt.trim();
			if (!trimmed) throw new Error('no-prompt');
			const image = exportCanvasAsBase64();
			if (!image) throw new Error('no-image');
			const result = await aiGenerate.mutateAsync({
				mode: 'edit',
				prompt: trimmed,
				image,
				regionInfo: isRegionMode && region ? region : undefined,
				useCredits,
			});
			onApplyEditedImage(result.imageBase64);
			setPrompt('');
			if (isRegionMode) onClearRegion();
			return result;
		},
	});

	const removeBgAction = useCreditAction({
		feature: 'editor-ai',
		cost,
		balance: voxBalance?.balance ?? 0,
		run: async ({ useCredits }) => {
			const image = exportCanvasAsBase64();
			if (!image) throw new Error('no-image');
			const result = await removeBg.mutateAsync({ image, useCredits });
			onApplyEditedImage(result.imageBase64);
			return result;
		},
	});

	const trigger = () => {
		if (!prompt.trim()) {
			toast.error('Escreva um prompt antes.');
			return;
		}
		aiAction.trigger();
	};

	return (
		<div className="p-5 space-y-4">
			<div>
				<h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
					<Sparkles className="w-4 h-4 text-violet-500" />
					{isRegionMode ? 'Editar região com IA' : 'IA global'}
				</h3>
				<p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
					{isRegionMode
						? region
							? `Região: ${region.width}×${region.height}px em (${region.x}, ${region.y}).`
							: 'Arraste no canvas para selecionar a região.'
						: 'A IA vai editar o canvas inteiro.'}
				</p>
			</div>

			{isRegionMode && region && (
				<button
					type="button"
					onClick={onClearRegion}
					className="inline-flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:underline"
				>
					<Eraser className="w-3 h-3" />
					Limpar seleção
				</button>
			)}

			<div>
				<label
					htmlFor="ai-prompt"
					className="text-xs font-medium text-slate-500 dark:text-gray-400 block mb-1"
				>
					Descreva o que mudar
				</label>
				<textarea
					id="ai-prompt"
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					rows={4}
					placeholder={
						isRegionMode
							? 'ex: substitua o fundo por um gradiente azul'
							: 'ex: deixe a imagem mais quente com tons dourados'
					}
					className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 px-3 py-2 focus:outline-none focus:border-violet-500 resize-none"
				/>
			</div>

			<button
				type="button"
				onClick={trigger}
				disabled={
					!prompt.trim() ||
					aiAction.pending ||
					aiGenerate.isPending ||
					(isRegionMode && !region)
				}
				className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-linear-to-br from-violet-600 to-fuchsia-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg"
			>
				{aiGenerate.isPending || aiAction.pending ? (
					<Loader2 className="w-4 h-4 animate-spin" />
				) : (
					<Sparkles className="w-4 h-4" />
				)}
				Aplicar IA ({cost} {cost === 1 ? 'voxxy' : 'voxxys'})
			</button>

			<div className="pt-3 border-t border-slate-200 dark:border-white/10">
				<button
					type="button"
					onClick={() => removeBgAction.trigger()}
					disabled={removeBg.isPending || removeBgAction.pending}
					className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-50 text-slate-700 dark:text-gray-300 text-sm font-medium rounded-lg"
				>
					{removeBg.isPending || removeBgAction.pending ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						<Eraser className="w-4 h-4" />
					)}
					Remover fundo
				</button>
			</div>

			{aiAction.modal && (
				<CreditConfirmModal
					variant={aiAction.modal.variant}
					cost={aiAction.modal.cost}
					balance={aiAction.modal.balance}
					canUseCredits={aiAction.modal.canUseCredits}
					freeTier={aiAction.modal.freeTier}
					pending={aiAction.pending}
					onConfirm={aiAction.confirm}
					onClose={aiAction.close}
				/>
			)}
			{removeBgAction.modal && (
				<CreditConfirmModal
					variant={removeBgAction.modal.variant}
					cost={removeBgAction.modal.cost}
					balance={removeBgAction.modal.balance}
					canUseCredits={removeBgAction.modal.canUseCredits}
					freeTier={removeBgAction.modal.freeTier}
					pending={removeBgAction.pending}
					onConfirm={removeBgAction.confirm}
					onClose={removeBgAction.close}
				/>
			)}
		</div>
	);
}

// ─── Object panel ───────────────────────────────────────────────────────

interface ObjectPanelProps {
	canvas: Canvas | null;
	object: FabricObject;
}

function ObjectPanel({ canvas, object }: ObjectPanelProps) {
	const isText =
		(object.type as string) === 'i-text' || (object.type as string) === 'text';
	// biome-ignore lint/suspicious/noExplicitAny: fabric types narrow
	const text = object as any;

	const [, force] = useState(0);
	const rerender = () => force((n) => n + 1);

	const updateProp = <K extends keyof FabricObject>(
		key: K,
		value: FabricObject[K],
	) => {
		object.set(key, value);
		canvas?.requestRenderAll();
		rerender();
	};

	return (
		<div className="p-5 space-y-4">
			<h3 className="font-semibold text-slate-900 dark:text-white">
				{isText ? 'Texto' : 'Objeto'}
			</h3>

			{isText && (
				<>
					<div>
						<label
							htmlFor="obj-text"
							className="text-xs font-medium text-slate-500 dark:text-gray-400 block mb-1"
						>
							Texto
						</label>
						<input
							id="obj-text"
							type="text"
							value={text.text ?? ''}
							onChange={(e) => {
								text.set('text', e.target.value);
								canvas?.requestRenderAll();
								rerender();
							}}
							className="w-full h-10 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white px-3 focus:outline-none focus:border-violet-500"
						/>
					</div>
					<div className="grid grid-cols-2 gap-2">
						<div>
							<label
								htmlFor="obj-font-size"
								className="text-xs font-medium text-slate-500 dark:text-gray-400 block mb-1"
							>
								Tamanho
							</label>
							<input
								id="obj-font-size"
								type="number"
								min={6}
								max={400}
								value={text.fontSize ?? 32}
								onChange={(e) => {
									text.set('fontSize', Number(e.target.value));
									canvas?.requestRenderAll();
									rerender();
								}}
								className="w-full h-10 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white px-3 focus:outline-none focus:border-violet-500"
							/>
						</div>
						<div>
							<label
								htmlFor="obj-fill"
								className="text-xs font-medium text-slate-500 dark:text-gray-400 block mb-1"
							>
								Cor
							</label>
							<input
								id="obj-fill"
								type="color"
								value={typeof text.fill === 'string' ? text.fill : '#000000'}
								onChange={(e) => {
									text.set('fill', e.target.value);
									canvas?.requestRenderAll();
									rerender();
								}}
								className="w-full h-10 rounded-lg border border-slate-200 dark:border-white/10 cursor-pointer"
							/>
						</div>
					</div>
				</>
			)}

			{!isText && (
				<div>
					<label
						htmlFor="obj-fill-shape"
						className="text-xs font-medium text-slate-500 dark:text-gray-400 block mb-1"
					>
						Cor
					</label>
					<input
						id="obj-fill-shape"
						type="color"
						value={typeof object.fill === 'string' ? object.fill : '#7c3aed'}
						onChange={(e) =>
							updateProp('fill', e.target.value as FabricObject['fill'])
						}
						className="w-full h-10 rounded-lg border border-slate-200 dark:border-white/10 cursor-pointer"
					/>
				</div>
			)}

			<div>
				<label
					htmlFor="obj-opacity"
					className="text-xs font-medium text-slate-500 dark:text-gray-400 block mb-1"
				>
					Opacidade: {Math.round((object.opacity ?? 1) * 100)}%
				</label>
				<input
					id="obj-opacity"
					type="range"
					min={0}
					max={100}
					value={Math.round((object.opacity ?? 1) * 100)}
					onChange={(e) => updateProp('opacity', Number(e.target.value) / 100)}
					className="w-full accent-violet-600"
				/>
			</div>

			<div>
				<label
					htmlFor="obj-rotation"
					className="text-xs font-medium text-slate-500 dark:text-gray-400 block mb-1"
				>
					Rotação: {Math.round(object.angle ?? 0)}°
				</label>
				<input
					id="obj-rotation"
					type="range"
					min={-180}
					max={180}
					value={Math.round(object.angle ?? 0)}
					onChange={(e) => updateProp('angle', Number(e.target.value))}
					className="w-full accent-violet-600"
				/>
			</div>

			<div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
				<button
					type="button"
					onClick={() => {
						const lock = !object.lockMovementX;
						object.set({
							lockMovementX: lock,
							lockMovementY: lock,
							lockScalingX: lock,
							lockScalingY: lock,
							lockRotation: lock,
						});
						rerender();
					}}
					className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5"
				>
					{object.lockMovementX ? (
						<Lock className="w-3 h-3" />
					) : (
						<Unlock className="w-3 h-3" />
					)}
					{object.lockMovementX ? 'Bloqueado' : 'Bloquear'}
				</button>
				<button
					type="button"
					onClick={() => {
						if (!canvas) return;
						canvas.remove(object);
						canvas.discardActiveObject();
						canvas.requestRenderAll();
					}}
					className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
				>
					<Trash2 className="w-3 h-3" />
					Remover
				</button>
			</div>
		</div>
	);
}
