'use client';

import { type Canvas, Rect } from 'fabric';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Permite o user desenhar uma região retangular sobre o canvas. A região
 * fica destacada (overlay violeta) e suas coordenadas ficam expostas para
 * passar pro endpoint /editor/ai como `regionInfo`.
 *
 * Quando `active=true`, o canvas entra em modo "draw rect": cliques desabilitam
 * a seleção padrão e o user arrasta para definir o retângulo.
 */
export interface CanvasRegion {
	x: number;
	y: number;
	width: number;
	height: number;
}

export function useCanvasRegion(canvas: Canvas | null, active: boolean) {
	const [region, setRegion] = useState<CanvasRegion | null>(null);
	const drawingRef = useRef<{
		startX: number;
		startY: number;
		rect: Rect;
	} | null>(null);
	const overlayRef = useRef<Rect | null>(null);

	const clear = useCallback(() => {
		if (!canvas) return;
		if (overlayRef.current) {
			canvas.remove(overlayRef.current);
			overlayRef.current = null;
		}
		setRegion(null);
		canvas.requestRenderAll();
	}, [canvas]);

	useEffect(() => {
		if (!canvas) return;

		if (!active) {
			canvas.selection = true;
			canvas.defaultCursor = 'default';
			return;
		}

		// Modo região: desativa seleção, cursor "crosshair"
		canvas.selection = false;
		canvas.defaultCursor = 'crosshair';
		canvas.discardActiveObject();
		canvas.requestRenderAll();

		const onMouseDown = (
			opt: import('fabric').TPointerEventInfo<TouchEvent | MouseEvent>,
		) => {
			const pointer = canvas.getViewportPoint(opt.e);
			if (overlayRef.current) {
				canvas.remove(overlayRef.current);
				overlayRef.current = null;
			}
			const rect = new Rect({
				left: pointer.x,
				top: pointer.y,
				width: 1,
				height: 1,
				fill: 'rgba(124, 58, 237, 0.18)',
				stroke: 'rgba(124, 58, 237, 0.9)',
				strokeWidth: 2,
				strokeDashArray: [6, 4],
				selectable: false,
				evented: false,
			});
			canvas.add(rect);
			drawingRef.current = {
				startX: pointer.x,
				startY: pointer.y,
				rect,
			};
		};

		const onMouseMove = (
			opt: import('fabric').TPointerEventInfo<TouchEvent | MouseEvent>,
		) => {
			if (!drawingRef.current) return;
			const pointer = canvas.getViewportPoint(opt.e);
			const { startX, startY, rect } = drawingRef.current;
			const width = Math.abs(pointer.x - startX);
			const height = Math.abs(pointer.y - startY);
			rect.set({
				left: Math.min(pointer.x, startX),
				top: Math.min(pointer.y, startY),
				width,
				height,
			});
			canvas.requestRenderAll();
		};

		const onMouseUp = () => {
			if (!drawingRef.current) return;
			const { rect } = drawingRef.current;
			drawingRef.current = null;
			const w = rect.width ?? 0;
			const h = rect.height ?? 0;
			if (w < 8 || h < 8) {
				// Click acidental — descarta
				canvas.remove(rect);
				canvas.requestRenderAll();
				return;
			}
			overlayRef.current = rect;
			setRegion({
				x: Math.round(rect.left ?? 0),
				y: Math.round(rect.top ?? 0),
				width: Math.round(w),
				height: Math.round(h),
			});
		};

		canvas.on('mouse:down', onMouseDown);
		canvas.on('mouse:move', onMouseMove);
		canvas.on('mouse:up', onMouseUp);

		return () => {
			canvas.off('mouse:down', onMouseDown);
			canvas.off('mouse:move', onMouseMove);
			canvas.off('mouse:up', onMouseUp);
		};
	}, [canvas, active]);

	return { region, clear };
}
