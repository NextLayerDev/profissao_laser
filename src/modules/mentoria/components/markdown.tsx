// Markdown mínimo para o `content_md` dos encontros (o admin edita um campo
// "Conteúdo (Markdown)", e o aluno via '##' e '**' crus). Cobre o que o mentor
// usa — títulos, listas, negrito/itálico e parágrafos — montando elementos
// React, sem `dangerouslySetInnerHTML`: HTML digitado sai como texto.

import type { ReactNode } from 'react';

const HEADING = /^(#{1,6})\s+(.*)$/;
const BULLET = /^\s*[-*+]\s+/;
const ORDERED = /^\s*\d+[.)]\s+/;
const INLINE = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/;

function isBlockStart(line: string): boolean {
	return HEADING.test(line) || BULLET.test(line) || ORDERED.test(line);
}

function inline(text: string): ReactNode[] {
	const out: ReactNode[] = [];
	let n = 0;
	for (const part of text.split(INLINE)) {
		if (!part) continue;
		n += 1;
		if (/^(\*\*|__).+\1$/.test(part)) {
			out.push(
				<strong key={`s${n}`} className="font-semibold text-primary">
					{part.slice(2, -2)}
				</strong>,
			);
		} else if (/^([*_]).+\1$/.test(part)) {
			out.push(<em key={`e${n}`}>{part.slice(1, -1)}</em>);
		} else {
			out.push(part);
		}
	}
	return out;
}

function list(
	lines: string[],
	start: number,
	marker: RegExp,
): { items: string[]; next: number } {
	const items: string[] = [];
	let i = start;
	while (i < lines.length && marker.test(lines[i] ?? '')) {
		items.push((lines[i] ?? '').replace(marker, ''));
		i += 1;
	}
	return { items, next: i };
}

export function Markdown({ source }: { source: string }) {
	const lines = source.replace(/\r\n/g, '\n').split('\n');
	const blocks: ReactNode[] = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i] ?? '';
		const key = `b${blocks.length}`;
		if (!line.trim()) {
			i += 1;
			continue;
		}

		const h = HEADING.exec(line);
		if (h) {
			const level = h[1]?.length ?? 1;
			const Tag = level <= 2 ? 'h3' : 'h4';
			blocks.push(
				<Tag
					key={key}
					className={`text-primary font-semibold ${level <= 2 ? 'text-body' : 'text-label'}`}
				>
					{inline(h[2] ?? '')}
				</Tag>,
			);
			i += 1;
			continue;
		}

		if (BULLET.test(line) || ORDERED.test(line)) {
			const ordered = !BULLET.test(line);
			const { items, next } = list(lines, i, ordered ? ORDERED : BULLET);
			const Tag = ordered ? 'ol' : 'ul';
			blocks.push(
				<Tag
					key={key}
					className={`${ordered ? 'list-decimal' : 'list-disc'} space-y-1 pl-5`}
				>
					{items.map((item, n) => (
						<li key={`${key}-${n}-${item}`}>{inline(item)}</li>
					))}
				</Tag>,
			);
			i = next;
			continue;
		}

		const para: string[] = [];
		while (
			i < lines.length &&
			(lines[i] ?? '').trim() &&
			!isBlockStart(lines[i] ?? '')
		) {
			para.push(lines[i] ?? '');
			i += 1;
		}
		blocks.push(
			<p key={key} className="whitespace-pre-line">
				{inline(para.join('\n'))}
			</p>,
		);
	}

	return (
		<div className="space-y-3 text-body text-secondary leading-relaxed">
			{blocks}
		</div>
	);
}
