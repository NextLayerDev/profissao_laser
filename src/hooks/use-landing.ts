'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ─── useCountUp ──────────────────────────────────────────────────────────────

export function useCountUp(to: number, start: boolean, duration = 1400) {
	const [val, setVal] = useState(0);
	useEffect(() => {
		if (!start) return;
		let raf: number;
		const t0 = performance.now();
		const tick = (now: number) => {
			const p = Math.min(1, (now - t0) / duration);
			const e = 1 - (1 - p) ** 3; // ease-out cubic
			setVal(to * e);
			if (p < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [to, start, duration]);
	return val;
}

// ─── useTilt ─────────────────────────────────────────────────────────────────

interface TiltStyle {
	transform?: string;
	'--shineX'?: string;
	'--shineY'?: string;
}

export function useTilt(intensity = 8) {
	const ref = useRef<HTMLDivElement>(null);
	const [style, setStyle] = useState<TiltStyle>({});

	const onMove = useCallback(
		(e: React.MouseEvent) => {
			const el = ref.current;
			if (!el) return;
			const r = el.getBoundingClientRect();
			const x = (e.clientX - r.left) / r.width - 0.5;
			const y = (e.clientY - r.top) / r.height - 0.5;
			setStyle({
				transform: `perspective(900px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) translateZ(0)`,
				'--shineX': `${(x + 0.5) * 100}%`,
				'--shineY': `${(y + 0.5) * 100}%`,
			});
		},
		[intensity],
	);

	const onLeave = useCallback(() => {
		setStyle({
			transform: 'perspective(900px) rotateY(0) rotateX(0)',
		});
	}, []);

	return {
		ref,
		style,
		handlers: { onMouseMove: onMove, onMouseLeave: onLeave },
	};
}

// ─── useMagnetic ─────────────────────────────────────────────────────────────

export function useMagnetic(strength = 0.25) {
	const ref = useRef<HTMLButtonElement>(null);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const onMove = (e: MouseEvent) => {
			const r = el.getBoundingClientRect();
			const x = e.clientX - (r.left + r.width / 2);
			const y = e.clientY - (r.top + r.height / 2);
			el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
		};
		const onLeave = () => {
			el.style.transform = 'translate(0,0)';
		};
		el.addEventListener('mousemove', onMove);
		el.addEventListener('mouseleave', onLeave);
		return () => {
			el.removeEventListener('mousemove', onMove);
			el.removeEventListener('mouseleave', onLeave);
		};
	}, [strength]);
	return ref;
}

// ─── useTween ────────────────────────────────────────────────────────────────

export function useTween(value: number, duration = 350) {
	const [v, setV] = useState(value);
	const from = useRef(value);
	useEffect(() => {
		const start = performance.now();
		const f = from.current;
		let raf: number;
		const tick = (now: number) => {
			const p = Math.min(1, (now - start) / duration);
			const e = 1 - (1 - p) ** 3;
			setV(f + (value - f) * e);
			if (p < 1) raf = requestAnimationFrame(tick);
			else from.current = value;
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [value, duration]);
	return v;
}

// ─── fmtNumber ───────────────────────────────────────────────────────────────

export function fmtNumber(
	n: number,
	opts: { prefix?: string; suffix?: string } = {},
) {
	const v = Math.floor(n);
	const formatted = v.toLocaleString('pt-BR');
	return `${opts.prefix ?? ''}${formatted}${opts.suffix ?? ''}`;
}
