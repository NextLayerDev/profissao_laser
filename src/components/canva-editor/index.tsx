'use client';

import type { Canvas, FabricObject } from 'fabric';
import { FabricImage } from 'fabric';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCanvasHistory } from '@/hooks/canva-editor/use-canvas-history';
import { useCanvasRegion } from '@/hooks/canva-editor/use-canvas-region';
import {
	useDesign,
	useUpdateDesign,
	useUploadDesignThumbnail,
} from '@/hooks/use-designs';
import { EditorCanvasArea } from './editor-canvas-area';
import { EditorHeader } from './editor-header';
import { EditorSidebar } from './editor-sidebar';
import { type EditorTool, EditorToolbar } from './editor-toolbar';

interface CanvaEditorProps {
	designId: string;
}

const AUTO_SAVE_INTERVAL_MS = 30_000;

export function CanvaEditor({ designId }: CanvaEditorProps) {
	const { data: design, isLoading } = useDesign(designId);
	const updateDesign = useUpdateDesign();
	const uploadThumbnail = useUploadDesignThumbnail();

	const [canvas, setCanvas] = useState<Canvas | null>(null);
	const [selectedObject, setSelectedObject] = useState<FabricObject | null>(
		null,
	);
	const [activeTool, setActiveTool] = useState<EditorTool>('select');
	const [name, setName] = useState('');
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

	const { undo, redo, canUndo, canRedo } = useCanvasHistory(canvas);
	const { region, clear: clearRegion } = useCanvasRegion(
		canvas,
		activeTool === 'region',
	);

	// Sync nome inicial
	useEffect(() => {
		if (design?.name && !name) setName(design.name);
	}, [design, name]);

	// Selection tracking
	useEffect(() => {
		if (!canvas) return;
		const onSelect = () => setSelectedObject(canvas.getActiveObject() ?? null);
		const onClear = () => setSelectedObject(null);
		canvas.on('selection:created', onSelect);
		canvas.on('selection:updated', onSelect);
		canvas.on('selection:cleared', onClear);
		canvas.on('object:modified', () => setHasUnsavedChanges(true));
		canvas.on('object:added', () => setHasUnsavedChanges(true));
		canvas.on('object:removed', () => setHasUnsavedChanges(true));
		canvas.on('path:created', () => setHasUnsavedChanges(true));
		return () => {
			canvas.off('selection:created', onSelect);
			canvas.off('selection:updated', onSelect);
			canvas.off('selection:cleared', onClear);
		};
	}, [canvas]);

	const handleSave = useCallback(async () => {
		if (!canvas || !design) return;
		const canvasJsonStr = JSON.stringify(canvas.toJSON());
		const thumbnailDataUri = canvas.toDataURL({
			format: 'png',
			multiplier: 0.3,
			quality: 0.8,
		});

		try {
			await updateDesign.mutateAsync({
				id: design.id,
				payload: {
					name: name.trim() || design.name,
					canvasJson: canvasJsonStr,
				},
			});

			// Upload thumbnail (best-effort — não falha o save se der erro)
			try {
				const blob = await (await fetch(thumbnailDataUri)).blob();
				const file = new File([blob], `${design.id}-thumb.png`, {
					type: 'image/png',
				});
				await uploadThumbnail.mutateAsync({ id: design.id, file });
			} catch {
				// ignore
			}

			setHasUnsavedChanges(false);
			toast.success('Design salvo');
		} catch {
			toast.error('Erro ao salvar design');
		}
	}, [canvas, design, name, updateDesign, uploadThumbnail]);

	// Auto-save
	useEffect(() => {
		if (!hasUnsavedChanges) return;
		const timer = setTimeout(() => {
			handleSave();
		}, AUTO_SAVE_INTERVAL_MS);
		return () => clearTimeout(timer);
	}, [hasUnsavedChanges, handleSave]);

	// Aplica resultado de IA: substitui a imagem ativa (ou adiciona) pela nova
	const handleApplyEditedImage = useCallback(
		async (base64: string) => {
			if (!canvas) return;
			try {
				const img = await FabricImage.fromURL(base64);
				const w = canvas.getWidth();
				const h = canvas.getHeight();
				const scale = Math.min(w / (img.width ?? w), h / (img.height ?? h));
				img.scale(scale);
				img.set({
					left: w / 2 - ((img.width ?? 0) * scale) / 2,
					top: h / 2 - ((img.height ?? 0) * scale) / 2,
				});
				// Remove imagens existentes pra substituir (mantém shapes/text)
				canvas.getObjects().forEach((o) => {
					if ((o.type as string) === 'image') canvas.remove(o);
				});
				canvas.add(img);
				canvas.sendObjectToBack(img);
				canvas.requestRenderAll();
				setHasUnsavedChanges(true);
			} catch {
				toast.error('Falha ao aplicar imagem da IA');
			}
		},
		[canvas],
	);

	const handleExport = useCallback(() => {
		if (!canvas) return;
		const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 });
		const a = document.createElement('a');
		a.href = dataUrl;
		a.download = `${name || 'design'}.png`;
		a.click();
	}, [canvas, name]);

	// Beforeunload warning
	const hasUnsavedRef = useRef(hasUnsavedChanges);
	hasUnsavedRef.current = hasUnsavedChanges;
	useEffect(() => {
		const handler = (e: BeforeUnloadEvent) => {
			if (hasUnsavedRef.current) e.preventDefault();
		};
		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	}, []);

	if (isLoading || !design) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
			</div>
		);
	}

	return (
		<div className="flex flex-col h-screen">
			<EditorHeader
				name={name}
				onNameChange={(n) => {
					setName(n);
					setHasUnsavedChanges(true);
				}}
				hasUnsavedChanges={hasUnsavedChanges}
				isSaving={updateDesign.isPending}
				onSave={handleSave}
				onExport={handleExport}
				onUndo={undo}
				onRedo={redo}
				canUndo={canUndo}
				canRedo={canRedo}
			/>
			<div className="flex-1 flex overflow-hidden">
				<EditorToolbar active={activeTool} onChange={setActiveTool} />
				<EditorCanvasArea
					width={design.width}
					height={design.height}
					initialJson={design.canvasJson ?? undefined}
					initialImage={design.thumbnailUrl}
					activeTool={activeTool}
					onCanvasReady={setCanvas}
				/>
				<EditorSidebar
					canvas={canvas}
					activeTool={activeTool}
					selectedObject={selectedObject}
					region={region}
					onClearRegion={clearRegion}
					onApplyEditedImage={handleApplyEditedImage}
				/>
			</div>
		</div>
	);
}
