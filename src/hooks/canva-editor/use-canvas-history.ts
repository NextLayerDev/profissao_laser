'use client';

import type { Canvas } from 'fabric';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Stack de undo/redo pra Fabric canvas.
 * Salva snapshots em JSON sempre que o canvas é modificado.
 */
const MAX_HISTORY = 30;

export function useCanvasHistory(canvas: Canvas | null) {
	const stackRef = useRef<string[]>([]);
	const indexRef = useRef(-1);
	const isApplyingRef = useRef(false);
	const [canUndo, setCanUndo] = useState(false);
	const [canRedo, setCanRedo] = useState(false);

	const sync = useCallback(() => {
		setCanUndo(indexRef.current > 0);
		setCanRedo(indexRef.current < stackRef.current.length - 1);
	}, []);

	const pushSnapshot = useCallback(() => {
		if (!canvas || isApplyingRef.current) return;
		const json = JSON.stringify(canvas.toJSON());
		const stack = stackRef.current.slice(0, indexRef.current + 1);
		stack.push(json);
		if (stack.length > MAX_HISTORY) stack.shift();
		stackRef.current = stack;
		indexRef.current = stack.length - 1;
		sync();
	}, [canvas, sync]);

	useEffect(() => {
		if (!canvas) return;

		// snapshot inicial
		pushSnapshot();

		const handleChange = () => pushSnapshot();
		canvas.on('object:added', handleChange);
		canvas.on('object:modified', handleChange);
		canvas.on('object:removed', handleChange);
		canvas.on('path:created', handleChange);

		return () => {
			canvas.off('object:added', handleChange);
			canvas.off('object:modified', handleChange);
			canvas.off('object:removed', handleChange);
			canvas.off('path:created', handleChange);
		};
	}, [canvas, pushSnapshot]);

	const applySnapshot = useCallback(
		async (json: string) => {
			if (!canvas) return;
			isApplyingRef.current = true;
			try {
				await canvas.loadFromJSON(JSON.parse(json));
				canvas.requestRenderAll();
			} finally {
				isApplyingRef.current = false;
			}
		},
		[canvas],
	);

	const undo = useCallback(() => {
		if (!canvas || indexRef.current <= 0) return;
		indexRef.current -= 1;
		applySnapshot(stackRef.current[indexRef.current]);
		sync();
	}, [canvas, applySnapshot, sync]);

	const redo = useCallback(() => {
		if (!canvas || indexRef.current >= stackRef.current.length - 1) return;
		indexRef.current += 1;
		applySnapshot(stackRef.current[indexRef.current]);
		sync();
	}, [canvas, applySnapshot, sync]);

	return { undo, redo, canUndo, canRedo };
}
