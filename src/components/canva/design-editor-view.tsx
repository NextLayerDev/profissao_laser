'use client';

import {
	ArrowLeft,
	Download,
	Eraser,
	FileText,
	Loader2,
	Palette,
	Redo2,
	Save,
	Sparkles,
	Undo2,
	Wand2,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CreditConfirmModal } from '@/components/credits/credit-confirm-modal';
import {
	useDesign,
	useUpdateDesign,
	useUploadDesignThumbnail,
} from '@/hooks/use-designs';
import {
	useApplyColor,
	useEditorAiGenerate,
	useRemoveBackground,
} from '@/hooks/use-editor-ai';
import { useEntitlements } from '@/hooks/use-entitlements';
import { useRunTool } from '@/modules/tools/hooks/use-run-tool';
import type { EditorAiMode } from '@/types/editor-ai';

const MAX_HISTORY = 10;

type ActiveTool = 'generate' | 'remove-bg' | 'apply-color' | 'info';

function ensureDataUri(b64: string): string {
	if (b64.startsWith('data:')) return b64;
	return `data:image/png;base64,${b64}`;
}

function base64ToFile(base64: string, filename: string): File {
	const arr = base64.split(',');
	const mime = arr[0].match(/:(.*?);/)?.[1] ?? 'image/png';
	const bstr = atob(arr[1]);
	const n = bstr.length;
	const u8arr = new Uint8Array(n);
	for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
	return new File([u8arr], filename, { type: mime });
}

function downloadImage(base64: string, name: string) {
	const link = document.createElement('a');
	link.href = base64;
	link.download = `${name}.png`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

export function DesignEditorView({ designId }: { designId: string }) {
	const { data: design, isLoading, isError } = useDesign(designId);

	// Image state
	const [currentImage, setCurrentImage] = useState<string | null>(null);
	const [imageFromUrl, setImageFromUrl] = useState(false);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

	// History
	const [imageHistory, setImageHistory] = useState<string[]>([]);
	const [historyIndex, setHistoryIndex] = useState(-1);

	// Design metadata
	const [editName, setEditName] = useState('');
	const [editNotes, setEditNotes] = useState('');

	// Tool state
	const [activeTool, setActiveTool] = useState<ActiveTool>('generate');
	const [aiPrompt, setAiPrompt] = useState('');
	const [aiMode, setAiMode] = useState<EditorAiMode>('generate');
	const [targetColor, setTargetColor] = useState('#ff0000');

	// Hooks
	const aiGenerate = useEditorAiGenerate();
	const removeBg = useRemoveBackground();
	const applyColorMutation = useApplyColor();
	// Acesso/billing agora vêm do upvox: o curso ativo define onde a ferramenta
	// bilha; cota grátis / custo / saldo saem dos entitlements daquele curso.
	const { courses } = useEntitlements();
	const courseSlug = courses[0]?.slug;
	const entitlements = useEntitlements(courseSlug);
	const aiCanvasCost = entitlements.toolFor('ai_canvas')?.vox_cost ?? 0;
	const aiCanvasRemainingFree = entitlements.remainingFree('ai_canvas');
	const voxBalance = entitlements.voxBalance;
	const runTool = useRunTool('ai_canvas', courseSlug);
	const [confirmRun, setConfirmRun] = useState<(() => void) | null>(null);

	const updateDesign = useUpdateDesign();
	const uploadThumbnail = useUploadDesignThumbnail();

	const isAnyPending = runTool.pending || applyColorMutation.isPending;
	const isSaving = updateDesign.isPending || uploadThumbnail.isPending;

	const initialLoadDone = useRef(false);

	// Load design data
	useEffect(() => {
		if (!design || initialLoadDone.current) return;
		initialLoadDone.current = true;
		setEditName(design.name);
		setEditNotes(design.notes ?? '');

		if (design.thumbnailUrl) {
			// Try fetching thumbnail as base64
			fetch(design.thumbnailUrl)
				.then((res) => res.blob())
				.then((blob) => {
					const reader = new FileReader();
					reader.onloadend = () => {
						const b64 = reader.result as string;
						setCurrentImage(b64);
						setImageHistory([b64]);
						setHistoryIndex(0);
					};
					reader.readAsDataURL(blob);
				})
				.catch(() => {
					// CORS fallback: show via img tag, can't edit until AI generates new
					setImageFromUrl(true);
				});
		}
	}, [design]);

	// Unsaved changes warning
	useEffect(() => {
		if (!hasUnsavedChanges) return;
		const handler = (e: BeforeUnloadEvent) => {
			e.preventDefault();
		};
		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	}, [hasUnsavedChanges]);

	const pushToHistory = useCallback((img: string) => {
		setImageHistory((prev) => {
			const truncated = prev.slice(0, prev.length);
			const next = [...truncated, img].slice(-MAX_HISTORY);
			setHistoryIndex(next.length - 1);
			return next;
		});
	}, []);

	const updateImage = useCallback(
		(img: string) => {
			const dataUri = ensureDataUri(img);
			setCurrentImage(dataUri);
			setImageFromUrl(false);
			setHasUnsavedChanges(true);
			pushToHistory(dataUri);
		},
		[pushToHistory],
	);

	// AI Generate
	const handleGenerate = () => {
		if (!aiPrompt.trim()) {
			toast.error('Escreva um prompt para gerar.');
			return;
		}
		const action = () =>
			runTool.run((invocationId) =>
				aiGenerate
					.mutateAsync({
						mode: aiMode,
						prompt: aiPrompt.trim(),
						image: aiMode === 'edit' && currentImage ? currentImage : undefined,
						invocation_id: invocationId,
					})
					.then((result) => {
						updateImage(result.imageBase64);
						setAiPrompt('');
						return result;
					}),
			);
		// Sem cota grátis e a ação custa voxxys → confirma antes de gastar.
		if (aiCanvasRemainingFree === 0 && aiCanvasCost > 0)
			setConfirmRun(() => action);
		else action();
	};

	// Remove Background
	const handleRemoveBg = () => {
		if (!currentImage) return;
		const action = () =>
			runTool.run((invocationId) =>
				removeBg
					.mutateAsync({
						image: currentImage,
						invocation_id: invocationId,
					})
					.then((result) => {
						updateImage(result.imageBase64);
						return result;
					}),
			);
		// Sem cota grátis e a ação custa voxxys → confirma antes de gastar.
		if (aiCanvasRemainingFree === 0 && aiCanvasCost > 0)
			setConfirmRun(() => action);
		else action();
	};

	// Apply Color
	const handleApplyColor = useCallback(async () => {
		if (!currentImage) return;
		try {
			const result = await applyColorMutation.mutateAsync({
				image: currentImage,
				targetColor,
			});
			updateImage(result.imageBase64);
		} catch {
			// toast handled by hook
		}
	}, [currentImage, targetColor, applyColorMutation, updateImage]);

	// Save
	const handleSave = useCallback(async () => {
		if (!currentImage && !editName) return;
		try {
			const promises: Promise<unknown>[] = [];
			promises.push(
				updateDesign.mutateAsync({
					id: designId,
					payload: {
						name: editName.trim() || 'Sem nome',
						notes: editNotes.trim() || undefined,
					},
				}),
			);
			if (currentImage && !imageFromUrl) {
				const file = base64ToFile(currentImage, 'thumbnail.png');
				promises.push(uploadThumbnail.mutateAsync({ id: designId, file }));
			}
			await Promise.all(promises);
			setHasUnsavedChanges(false);
			toast.success('Design salvo!');
		} catch {
			toast.error('Erro ao salvar design');
		}
	}, [
		designId,
		currentImage,
		imageFromUrl,
		editName,
		editNotes,
		updateDesign,
		uploadThumbnail,
	]);

	// Download
	const handleDownload = useCallback(() => {
		if (!currentImage) return;
		downloadImage(currentImage, editName || 'design');
	}, [currentImage, editName]);

	// Undo / Redo
	const canUndo = historyIndex > 0;
	const canRedo = historyIndex < imageHistory.length - 1;

	const handleUndo = useCallback(() => {
		if (!canUndo) return;
		const newIdx = historyIndex - 1;
		setHistoryIndex(newIdx);
		setCurrentImage(imageHistory[newIdx]);
		setHasUnsavedChanges(true);
	}, [canUndo, historyIndex, imageHistory]);

	const handleRedo = useCallback(() => {
		if (!canRedo) return;
		const newIdx = historyIndex + 1;
		setHistoryIndex(newIdx);
		setCurrentImage(imageHistory[newIdx]);
		setHasUnsavedChanges(true);
	}, [canRedo, historyIndex, imageHistory]);

	// Loading / Error states
	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-32">
				<Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
			</div>
		);
	}

	if (isError || !design) {
		return (
			<div className="flex flex-col items-center justify-center py-32 gap-4">
				<p className="text-slate-500 dark:text-gray-400">
					Design nao encontrado.
				</p>
				<Link
					href="/course/canva"
					className="flex items-center gap-2 text-violet-700 hover:text-violet-600 font-medium"
				>
					<ArrowLeft className="w-4 h-4" />
					Voltar para designs
				</Link>
			</div>
		);
	}

	const hasImage = !!currentImage || imageFromUrl;
	const canEditImage = !!currentImage && !imageFromUrl;

	const tools: { key: ActiveTool; icon: typeof Wand2; label: string }[] = [
		{ key: 'generate', icon: Wand2, label: 'Gerar' },
		{ key: 'remove-bg', icon: Eraser, label: 'Fundo' },
		{ key: 'apply-color', icon: Palette, label: 'Cor' },
		{ key: 'info', icon: FileText, label: 'Info' },
	];

	return (
		<div className="relative p-4 md:p-6">
			{/* Header */}
			<div className="flex items-center justify-between gap-4 mb-6">
				<div className="flex items-center gap-3 min-w-0">
					<Link
						href="/course/canva"
						className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shrink-0"
					>
						<ArrowLeft className="w-4 h-4" />
					</Link>
					<input
						type="text"
						value={editName}
						onChange={(e) => {
							setEditName(e.target.value);
							setHasUnsavedChanges(true);
						}}
						className="text-lg font-bold text-slate-900 dark:text-white bg-transparent border-none outline-none focus:ring-0 min-w-0 flex-1 truncate"
						placeholder="Nome do design"
					/>
				</div>
				<div className="flex items-center gap-2 shrink-0">
					{hasUnsavedChanges && (
						<span className="text-xs text-violet-600 font-medium hidden sm:inline">
							Nao salvo
						</span>
					)}
					<button
						type="button"
						onClick={handleDownload}
						disabled={!currentImage}
						className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-30"
						title="Download"
					>
						<Download className="w-4 h-4" />
					</button>
					<button
						type="button"
						onClick={handleSave}
						disabled={isSaving}
						className="flex items-center gap-2 px-4 py-2.5 bg-violet-700 hover:bg-violet-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
					>
						{isSaving ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Save className="w-4 h-4" />
						)}
						Salvar
					</button>
				</div>
			</div>

			{/* Main layout */}
			<div className="flex flex-col lg:flex-row gap-6">
				{/* Canvas area */}
				<div className="flex-1 min-w-0">
					<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] overflow-hidden">
						{/* Image display */}
						<div
							className="relative flex items-center justify-center min-h-[400px] lg:min-h-[500px]"
							style={{
								backgroundImage: hasImage
									? 'linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)'
									: undefined,
								backgroundSize: '20px 20px',
								backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
							}}
						>
							{isAnyPending && (
								<div className="absolute inset-0 bg-white/60 dark:bg-black/40 flex flex-col items-center justify-center z-10">
									<Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-3" />
									<span className="text-sm font-medium text-slate-600 dark:text-slate-300">
										Processando...
									</span>
								</div>
							)}

							{currentImage ? (
								<img
									src={currentImage}
									alt={editName}
									className="max-w-full max-h-[500px] object-contain"
								/>
							) : imageFromUrl && design.thumbnailUrl ? (
								<img
									src={design.thumbnailUrl}
									alt={editName}
									className="max-w-full max-h-[500px] object-contain"
								/>
							) : (
								<div className="flex flex-col items-center justify-center py-20 px-6 text-center">
									<Sparkles className="w-12 h-12 text-violet-400 mb-4" />
									<h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
										Gere sua primeira imagem
									</h3>
									<p className="text-sm text-slate-500 dark:text-gray-400 max-w-xs">
										Use o painel de geracao ao lado para criar uma imagem com
										IA.
									</p>
								</div>
							)}
						</div>

						{/* Undo/Redo bar */}
						<div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 dark:border-white/5">
							<div className="flex items-center gap-1">
								<button
									type="button"
									onClick={handleUndo}
									disabled={!canUndo || isAnyPending}
									className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
									title="Desfazer"
								>
									<Undo2 className="w-4 h-4" />
								</button>
								<button
									type="button"
									onClick={handleRedo}
									disabled={!canRedo || isAnyPending}
									className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
									title="Refazer"
								>
									<Redo2 className="w-4 h-4" />
								</button>
							</div>
							<span className="text-xs text-slate-400">
								{design.width} x {design.height}
							</span>
						</div>
					</div>
				</div>

				{/* Tools sidebar */}
				<div className="lg:w-[280px] xl:w-[340px] shrink-0">
					<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] overflow-hidden">
						{/* Tool tabs */}
						<div className="flex border-b border-slate-100 dark:border-white/5 p-1 gap-1">
							{tools.map((t) => (
								<button
									key={t.key}
									type="button"
									onClick={() => setActiveTool(t.key)}
									className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium rounded-lg transition-colors ${
										activeTool === t.key
											? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400'
											: 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
									}`}
								>
									<t.icon className="w-3.5 h-3.5" />
									{t.label}
								</button>
							))}
						</div>

						{/* Tool panels */}
						<div className="p-4">
							{/* Generate */}
							{activeTool === 'generate' && (
								<div className="space-y-4">
									<div>
										<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
											Modo
										</span>
										<div className="flex gap-2">
											{(['generate', 'edit'] as const).map((m) => (
												<button
													key={m}
													type="button"
													onClick={() => setAiMode(m)}
													className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
														aiMode === m
															? 'bg-violet-700 text-white'
															: 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
													}`}
												>
													{m === 'generate' ? 'Gerar' : 'Editar'}
												</button>
											))}
										</div>
										{aiMode === 'edit' && !canEditImage && (
											<p className="text-xs text-violet-600 mt-1.5">
												Gere uma imagem primeiro para usar o modo editar.
											</p>
										)}
									</div>
									<div>
										<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
											Prompt
										</span>
										<textarea
											value={aiPrompt}
											onChange={(e) => setAiPrompt(e.target.value)}
											placeholder={
												aiMode === 'generate'
													? 'Ex: Logo minimalista de laser em fundo escuro...'
													: 'Ex: Adicionar texto "Laser Pro" na parte inferior...'
											}
											rows={4}
											className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30"
										/>
									</div>
									<button
										type="button"
										onClick={handleGenerate}
										disabled={
											isAnyPending ||
											!aiPrompt.trim() ||
											(aiMode === 'edit' && !canEditImage)
										}
										className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-700 hover:bg-violet-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
									>
										{runTool.pending ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											<Wand2 className="w-4 h-4" />
										)}
										{aiMode === 'generate' ? 'Gerar Imagem' : 'Editar Imagem'}
									</button>
								</div>
							)}

							{/* Remove Background */}
							{activeTool === 'remove-bg' && (
								<div className="space-y-4">
									<div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-[#1a1a1d]">
										<Eraser className="w-5 h-5 text-violet-600 mt-0.5 shrink-0" />
										<div>
											<p className="text-sm font-medium text-slate-900 dark:text-white">
												Remover Fundo
											</p>
											<p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
												Remove automaticamente o fundo da imagem atual usando
												IA.
											</p>
										</div>
									</div>
									<button
										type="button"
										onClick={handleRemoveBg}
										disabled={isAnyPending || !canEditImage}
										className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-700 hover:bg-violet-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
									>
										{runTool.pending ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											<Eraser className="w-4 h-4" />
										)}
										Remover Fundo
									</button>
									{!canEditImage && (
										<p className="text-xs text-violet-600 text-center">
											Gere uma imagem primeiro.
										</p>
									)}
								</div>
							)}

							{/* Apply Color */}
							{activeTool === 'apply-color' && (
								<div className="space-y-4">
									<div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-[#1a1a1d]">
										<Palette className="w-5 h-5 text-violet-600 mt-0.5 shrink-0" />
										<div>
											<p className="text-sm font-medium text-slate-900 dark:text-white">
												Aplicar Cor
											</p>
											<p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
												Aplica uma cor alvo a imagem atual usando IA.
											</p>
										</div>
									</div>
									<div>
										<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
											Cor
										</span>
										<div className="flex items-center gap-3">
											<input
												type="color"
												value={targetColor}
												onChange={(e) => setTargetColor(e.target.value)}
												className="w-10 h-10 rounded-lg border border-slate-200 dark:border-white/10 cursor-pointer"
											/>
											<input
												type="text"
												value={targetColor}
												onChange={(e) => setTargetColor(e.target.value)}
												className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/30"
											/>
										</div>
									</div>
									<button
										type="button"
										onClick={handleApplyColor}
										disabled={isAnyPending || !canEditImage}
										className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-700 hover:bg-violet-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
									>
										{applyColorMutation.isPending ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											<Palette className="w-4 h-4" />
										)}
										Aplicar Cor
									</button>
									{!canEditImage && (
										<p className="text-xs text-violet-600 text-center">
											Gere uma imagem primeiro.
										</p>
									)}
								</div>
							)}

							{/* Info */}
							{activeTool === 'info' && (
								<div className="space-y-4">
									<div>
										<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
											Nome
										</span>
										<input
											type="text"
											value={editName}
											onChange={(e) => {
												setEditName(e.target.value);
												setHasUnsavedChanges(true);
											}}
											className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
										/>
									</div>
									<div>
										<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
											Notas
										</span>
										<textarea
											value={editNotes}
											onChange={(e) => {
												setEditNotes(e.target.value);
												setHasUnsavedChanges(true);
											}}
											placeholder="Notas sobre este design..."
											rows={4}
											className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30"
										/>
									</div>
									<div className="pt-2 space-y-1.5 text-xs text-slate-400">
										<p>
											Dimensoes: {design.width} x {design.height}
										</p>
										<p>
											Criado:{' '}
											{new Date(design.createdAt).toLocaleDateString('pt-BR')}
										</p>
										<p>
											Atualizado:{' '}
											{new Date(design.updatedAt).toLocaleDateString('pt-BR')}
										</p>
										{design.templateId && <p>Template: {design.templateId}</p>}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{confirmRun && (
				<CreditConfirmModal
					variant="confirm"
					cost={aiCanvasCost}
					balance={voxBalance}
					pending={runTool.pending}
					onConfirm={() => {
						const a = confirmRun;
						setConfirmRun(null);
						a?.();
					}}
					onClose={() => setConfirmRun(null)}
				/>
			)}

			{runTool.block?.kind === 'insufficient_voxes' && (
				<CreditConfirmModal
					variant="insufficient"
					cost={aiCanvasCost}
					balance={voxBalance}
					onConfirm={runTool.clearBlock}
					onClose={runTool.clearBlock}
				/>
			)}
		</div>
	);
}
