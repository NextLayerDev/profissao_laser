'use client';

import { Canvas, Circle, FabricImage, IText, Rect, Triangle } from 'fabric';
import { useEffect, useRef } from 'react';
import type { EditorTool } from './editor-toolbar';

interface EditorCanvasAreaProps {
	width: number;
	height: number;
	initialJson?: unknown;
	initialImage?: string | null;
	activeTool: EditorTool;
	onCanvasReady: (canvas: Canvas) => void;
}

/**
 * Wrapper que instancia o Fabric.Canvas e expõe ele via onCanvasReady.
 * Carregar canvasJson serializado (preferencial) ou imagem inicial base64.
 *
 * Atalhos de ferramenta — quando o user troca de tool:
 *   • text → adiciona IText editável no centro
 *   • rect/circle/triangle → cria a forma no centro
 *   • brush → habilita free drawing
 *   • select → desabilita free drawing
 */
export function EditorCanvasArea({
	width,
	height,
	initialJson,
	initialImage,
	activeTool,
	onCanvasReady,
}: EditorCanvasAreaProps) {
	const canvasElRef = useRef<HTMLCanvasElement | null>(null);
	const fabricRef = useRef<Canvas | null>(null);
	const onReadyRef = useRef(onCanvasReady);
	onReadyRef.current = onCanvasReady;

	// Init Fabric (1x ao montar)
	// biome-ignore lint/correctness/useExhaustiveDependencies: init só com w/h
	useEffect(() => {
		if (!canvasElRef.current || fabricRef.current) return;
		const canvas = new Canvas(canvasElRef.current, {
			width,
			height,
			backgroundColor: '#ffffff',
			preserveObjectStacking: true,
		});
		fabricRef.current = canvas;
		onReadyRef.current(canvas);

		// Carrega estado inicial — aceita string (JSON serializado) ou object
		(async () => {
			if (initialJson) {
				try {
					const parsed =
						typeof initialJson === 'string'
							? JSON.parse(initialJson)
							: initialJson;
					await canvas.loadFromJSON(parsed as object);
					canvas.requestRenderAll();
					return;
				} catch {
					// fallback pra imagem
				}
			}
			if (initialImage) {
				try {
					const img = await FabricImage.fromURL(initialImage, {
						crossOrigin: 'anonymous',
					});
					// escala pra caber no canvas
					const scale = Math.min(
						width / (img.width ?? width),
						height / (img.height ?? height),
					);
					img.scale(scale);
					img.set({
						left: width / 2 - ((img.width ?? 0) * scale) / 2,
						top: height / 2 - ((img.height ?? 0) * scale) / 2,
						selectable: true,
					});
					canvas.add(img);
					canvas.requestRenderAll();
				} catch {
					// ignore
				}
			}
		})();

		return () => {
			canvas.dispose();
			fabricRef.current = null;
		};
	}, []);

	// Resize canvas quando width/height mudam
	useEffect(() => {
		const canvas = fabricRef.current;
		if (!canvas) return;
		canvas.setDimensions({ width, height });
	}, [width, height]);

	// Reage à mudança de ferramenta (cria objetos / toggle brush)
	useEffect(() => {
		const canvas = fabricRef.current;
		if (!canvas) return;

		canvas.isDrawingMode = activeTool === 'brush';

		if (activeTool === 'text') {
			const text = new IText('Texto', {
				left: width / 2 - 40,
				top: height / 2 - 16,
				fontSize: 32,
				fill: '#000000',
				fontFamily: 'Arial',
			});
			canvas.add(text);
			canvas.setActiveObject(text);
			canvas.requestRenderAll();
		} else if (activeTool === 'rect') {
			const rect = new Rect({
				left: width / 2 - 50,
				top: height / 2 - 50,
				width: 100,
				height: 100,
				fill: '#7c3aed',
			});
			canvas.add(rect);
			canvas.setActiveObject(rect);
			canvas.requestRenderAll();
		} else if (activeTool === 'circle') {
			const c = new Circle({
				left: width / 2 - 50,
				top: height / 2 - 50,
				radius: 50,
				fill: '#7c3aed',
			});
			canvas.add(c);
			canvas.setActiveObject(c);
			canvas.requestRenderAll();
		} else if (activeTool === 'triangle') {
			const t = new Triangle({
				left: width / 2 - 50,
				top: height / 2 - 50,
				width: 100,
				height: 100,
				fill: '#7c3aed',
			});
			canvas.add(t);
			canvas.setActiveObject(t);
			canvas.requestRenderAll();
		}
		// Os hooks useCanvasRegion lidam com 'region'. 'select'/'ai' não criam objetos.
	}, [activeTool, width, height]);

	return (
		<div className="flex-1 flex items-center justify-center bg-slate-100 dark:bg-[#0f0f11] overflow-auto p-6">
			<div className="shadow-xl">
				<canvas ref={canvasElRef} />
			</div>
		</div>
	);
}
