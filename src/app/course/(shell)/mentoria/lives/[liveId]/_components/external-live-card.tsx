'use client';

// Usado em: `live-view.tsx` (estado `external`) e, com fixtures, em
// `app/(dev)/mentoria-lives-check`.
//
// Ocupa a área do player quando a sala é `source: 'external'` — transmissão
// fora da plataforma (Zoom/Meet/YouTube). Não há vídeo para embutir: o aluno
// sai para a outra aba, então o que mora aqui é o convite para sair.
//
// Arquivo próprio e não mais uma ramificação dentro do `live-view.tsx`: as
// regras de copy aqui (agendada × no ar × gravação) não têm nada a ver com o
// `Waiting`, que fala do player abrindo sozinho.

import { ExternalLink, Hourglass, PlaySquare, Radio } from 'lucide-react';
import type { MntLiveRoom } from '@/modules/mentoria/types';
import { BTN_PRIMARY, CARD } from '../../../_components/shared';

type Cta = { href: string; label: string };

/**
 * O que o card diz e para onde manda, por status. `null` no `cta` é estado sem
 * link clicável — a sala existe, mas ainda (ou não mais) tem para onde ir.
 */
function content(live: MntLiveRoom): {
	icon: typeof Radio;
	title: string;
	description: string;
	cta: Cta | null;
	pulse?: boolean;
} {
	if (live.status === 'vod_ready' && live.recording_url) {
		return {
			icon: PlaySquare,
			title: 'Gravação disponível',
			description: 'O encontro já aconteceu — assista quando quiser.',
			cta: { href: live.recording_url, label: 'Assistir gravação' },
		};
	}
	if (live.status === 'active' && live.external_url) {
		return {
			icon: Radio,
			title: 'A live começou',
			description: 'A transmissão acontece fora da plataforma.',
			cta: { href: live.external_url, label: 'Entrar na live' },
			pulse: true,
		};
	}
	if (live.status === 'ended' || live.status === 'vod_ready') {
		return {
			icon: Hourglass,
			title: 'Live encerrada',
			description:
				'Se houver gravação, ela aparece aqui assim que for postada.',
			cta: null,
		};
	}
	return {
		icon: Hourglass,
		title: 'Aguardando o mentor liberar',
		description:
			'O link de acesso aparece aqui quando a transmissão começar. Vale deixar a página aberta.',
		cta: null,
	};
}

export function ExternalLiveCard({ live }: { live: MntLiveRoom }) {
	const { icon: Icon, title, description, cta, pulse } = content(live);

	return (
		<div
			className={`${CARD} aspect-video flex flex-col items-center justify-center text-center px-6`}
		>
			{/* Mesma dupla `text-brand dark:text-violet-400` do `Waiting`: o token
			    `brand` é valor de modo claro e o DS ainda não publica o tom escuro
			    dele para texto. */}
			<Icon
				className={`w-8 h-8 text-brand dark:text-violet-400 mb-3 ${
					pulse ? 'animate-pulse' : ''
				}`}
				aria-hidden
			/>
			<p className="text-title text-primary">{title}</p>
			<p className="text-body text-muted mt-1 max-w-sm">{description}</p>
			{cta && (
				<a
					href={cta.href}
					target="_blank"
					rel="noreferrer"
					className={`${BTN_PRIMARY} mt-4`}
				>
					<ExternalLink className="w-4 h-4" aria-hidden />
					{cta.label}
				</a>
			)}
		</div>
	);
}
