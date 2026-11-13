'use client';

import { useId } from 'react';
import type { CreationTemplate } from '../services/tool-definitions.service';

/**
 * Desenho do MOLDE de um formato: contorno da peça, zonas proibidas (hachuradas)
 * e a margem de segurança (tracejada). Em mm — o `viewBox` é a própria peça,
 * então a proporção na tela é a física.
 *
 * Com `imageUrl`, a arte aparece recortada pelo molde sobre um xadrez: é o que
 * o aluno vai receber, câmera vazia incluída.
 */
interface CreationTemplatePreviewProps {
	template: CreationTemplate;
	imageUrl?: string | null;
	/** Zona destacada (índice) — o admin vê qual está editando. */
	highlightZone?: number | null;
	className?: string;
	/** Texto alternativo (o nome do formato/modelo). */
	label?: string;
}

export function CreationTemplatePreview({
	template: t,
	imageUrl,
	highlightZone = null,
	className = '',
	label,
}: CreationTemplatePreviewProps) {
	const uid = useId().replace(/:/g, '');
	const w = t.width_mm;
	const h = t.height_mm;
	if (!(w > 0 && h > 0)) return null;
	const r = Math.min(t.corner_radius_mm ?? 0, w / 2, h / 2);
	const margin = t.safe_margin_mm ?? 0;
	const stroke = Math.max(w, h) / 160;
	const outline =
		t.outline === 'ellipse' ? (
			<ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} />
		) : (
			<rect x={0} y={0} width={w} height={h} rx={r} ry={r} />
		);

	return (
		<svg
			viewBox={`${-stroke} ${-stroke} ${w + 2 * stroke} ${h + 2 * stroke}`}
			className={className}
			role="img"
			aria-label={label ? `Molde: ${label}` : 'Molde da peça'}
		>
			<defs>
				<pattern
					id={`xadrez-${uid}`}
					width={6}
					height={6}
					patternUnits="userSpaceOnUse"
				>
					<rect width={6} height={6} fill="#f1f5f9" />
					<rect width={3} height={3} fill="#e2e8f0" />
					<rect x={3} y={3} width={3} height={3} fill="#e2e8f0" />
				</pattern>
				<pattern
					id={`hachura-${uid}`}
					width={3}
					height={3}
					patternUnits="userSpaceOnUse"
					patternTransform="rotate(45)"
				>
					<rect width={3} height={3} fill="#fee2e2" />
					<line x1={0} y1={0} x2={0} y2={3} stroke="#ef4444" strokeWidth={1} />
				</pattern>
				<clipPath id={`peca-${uid}`}>{outline}</clipPath>
				<mask id={`recorte-${uid}`}>
					<rect x={0} y={0} width={w} height={h} fill="#fff" />
					{(t.zones ?? []).map((z, i) =>
						z.shape === 'ellipse' ? (
							<ellipse
								// biome-ignore lint/suspicious/noArrayIndexKey: zonas não têm id
								key={i}
								cx={z.x + z.w / 2}
								cy={z.y + z.h / 2}
								rx={z.w / 2}
								ry={z.h / 2}
								fill="#000"
							/>
						) : (
							<rect
								// biome-ignore lint/suspicious/noArrayIndexKey: zonas não têm id
								key={i}
								x={z.x}
								y={z.y}
								width={z.w}
								height={z.h}
								rx={z.r ?? 0}
								ry={z.r ?? 0}
								fill="#000"
							/>
						),
					)}
				</mask>
			</defs>

			<g clipPath={`url(#peca-${uid})`}>
				<rect x={0} y={0} width={w} height={h} fill={`url(#xadrez-${uid})`} />
				{imageUrl ? (
					<image
						href={imageUrl}
						x={0}
						y={0}
						width={w}
						height={h}
						preserveAspectRatio="xMidYMid slice"
						mask={`url(#recorte-${uid})`}
					/>
				) : (
					<rect
						x={0}
						y={0}
						width={w}
						height={h}
						fill="#ffffff"
						mask={`url(#recorte-${uid})`}
					/>
				)}
				{!imageUrl &&
					(t.zones ?? []).map((z, i) => {
						const on = highlightZone === i;
						const common = {
							fill: `url(#hachura-${uid})`,
							stroke: on ? '#b91c1c' : '#ef4444',
							strokeWidth: on ? stroke * 2 : stroke,
						};
						return z.shape === 'ellipse' ? (
							<ellipse
								// biome-ignore lint/suspicious/noArrayIndexKey: zonas não têm id
								key={i}
								cx={z.x + z.w / 2}
								cy={z.y + z.h / 2}
								rx={z.w / 2}
								ry={z.h / 2}
								{...common}
							/>
						) : (
							<rect
								// biome-ignore lint/suspicious/noArrayIndexKey: zonas não têm id
								key={i}
								x={z.x}
								y={z.y}
								width={z.w}
								height={z.h}
								rx={z.r ?? 0}
								ry={z.r ?? 0}
								{...common}
							/>
						);
					})}
				{margin > 0 && !imageUrl && (
					<rect
						x={margin}
						y={margin}
						width={Math.max(0, w - 2 * margin)}
						height={Math.max(0, h - 2 * margin)}
						rx={Math.max(0, r - margin)}
						fill="none"
						stroke="#94a3b8"
						strokeWidth={stroke}
						strokeDasharray={`${stroke * 3} ${stroke * 2}`}
					/>
				)}
			</g>
			<g fill="none" stroke="#334155" strokeWidth={stroke}>
				{outline}
			</g>
		</svg>
	);
}
