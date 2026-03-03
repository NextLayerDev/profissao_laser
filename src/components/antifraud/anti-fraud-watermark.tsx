'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAntifraud } from '@/contexts/antifraud-context';
import { getCurrentUser } from '@/lib/auth';

function escapeXml(s: string) {
	return s
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

function makeSvgDataUrl(text: string) {
	const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="420" height="240">
    <style>
      text { font-family: ui-sans-serif, system-ui, -apple-system; font-size: 14px; fill: rgba(0,0,0,0.18); }
    </style>
    <g transform="translate(20,120) rotate(-18)">
      <text x="0" y="0">${escapeXml(text)}</text>
    </g>
  </svg>`;
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function AntiFraudWatermark() {
	const antifraud = useAntifraud();
	const [offset, setOffset] = useState({ x: 0, y: 0 });
	const [watermarkText, setWatermarkText] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function loadConfig() {
			const user = getCurrentUser();
			if (!user?.email) {
				return;
			}

			try {
				const res = await fetch('/api/watermark-config');
				if (!res.ok || cancelled) return;

				const { ip, timestamp } = (await res.json()) as {
					ip?: string;
					timestamp?: string;
				};

				const name = user.name || 'Utilizador';
				const email = user.email || '';
				const ipStr = ip || 'N/A';
				const ts = timestamp || new Date().toISOString();

				if (!cancelled) {
					setWatermarkText(`${name} | ${email} | ${ipStr} | ${ts}`);
				}
			} catch {
				// Fallback sem IP
				if (!cancelled && user?.email) {
					const name = user.name || 'Utilizador';
					const email = user.email || '';
					setWatermarkText(
						`${name} | ${email} | N/A | ${new Date().toISOString()}`,
					);
				}
			}
		}

		loadConfig();
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		const id = setInterval(() => {
			setOffset({
				x: Math.floor(Math.random() * 120),
				y: Math.floor(Math.random() * 120),
			});
		}, 3500);
		return () => clearInterval(id);
	}, []);

	const bg = useMemo(
		() => (watermarkText ? makeSvgDataUrl(watermarkText) : undefined),
		[watermarkText],
	);

	if (!antifraud?.showWatermark || !watermarkText || !bg) return null;

	return (
		<div
			aria-hidden
			style={{
				position: 'fixed',
				inset: 0,
				zIndex: 999999,
				pointerEvents: 'none',
				backgroundImage: `url("${bg}")`,
				backgroundRepeat: 'repeat',
				backgroundPosition: `${offset.x}px ${offset.y}px`,
				mixBlendMode: 'multiply',
			}}
		/>
	);
}
