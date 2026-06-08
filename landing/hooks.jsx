/* Shared React hooks for the landing — keep them lightweight so each section
   can opt into the bits it needs. */

function useInView(threshold = 0.2) {
	const ref = React.useRef(null);
	const [inView, setInView] = React.useState(false);
	React.useEffect(() => {
		if (!ref.current) return;
		// If element is already on screen at mount, fire immediately
		const r = ref.current.getBoundingClientRect();
		const vh = window.innerHeight || document.documentElement.clientHeight;
		if (r.top < vh && r.bottom > 0) {
			setInView(true);
			return;
		}
		const obs = new IntersectionObserver(
			([e]) => {
				if (e.isIntersecting) {
					setInView(true);
					obs.disconnect();
				}
			},
			{ threshold },
		);
		obs.observe(ref.current);
		return () => obs.disconnect();
	}, [threshold]);
	return [ref, inView];
}

/* Smoothly counts a number up from 0 to `to` when `start` flips true. */
function useCountUp(to, start, duration = 1400) {
	const [val, setVal] = React.useState(0);
	React.useEffect(() => {
		if (!start) return;
		let raf;
		const t0 = performance.now();
		const tick = (now) => {
			const p = Math.min(1, (now - t0) / duration);
			// ease-out cubic
			const e = 1 - (1 - p) ** 3;
			setVal(to * e);
			if (p < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [to, start, duration]);
	return val;
}

/* 3D tilt on mouse move — returns a ref and inline style for a wrapper. */
function useTilt(intensity = 8) {
	const ref = React.useRef(null);
	const [style, setStyle] = React.useState({});
	const onMove = (e) => {
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
	};
	const onLeave = () =>
		setStyle({ transform: 'perspective(900px) rotateY(0) rotateX(0)' });
	return {
		ref,
		style,
		handlers: { onMouseMove: onMove, onMouseLeave: onLeave },
	};
}

/* Magnetic button — pulls slightly toward cursor on hover. */
function useMagnetic(strength = 0.25) {
	const ref = React.useRef(null);
	React.useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const onMove = (e) => {
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

/* Format a number with BR locale separators, supporting + prefix and % suffix. */
function fmtNumber(n, opts = {}) {
	const v = Math.floor(n);
	const formatted = v.toLocaleString('pt-BR');
	return `${opts.prefix ?? ''}${formatted}${opts.suffix ?? ''}`;
}

Object.assign(window, {
	useInView,
	useCountUp,
	useTilt,
	useMagnetic,
	fmtNumber,
});
