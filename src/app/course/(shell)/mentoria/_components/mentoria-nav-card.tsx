'use client';

// Navegação da Mentoria 360°, como card ao lado do conteúdo.
//
// Antes as seções viviam como sub-menu expansível dentro da sidebar global do
// curso. O desenho aprovado traz a navegação para dentro da própria área, em um
// card com as seções em pílulas — então a sidebar global voltou a ser um link
// simples e a lista canônica passou a morar em `src/modules/mentoria/nav.ts`.

import { Button, buttonLabel } from '@upvox-dev/ui';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Text } from 'react-native-css/components/Text';
import { toast } from 'sonner';
import { isSectionActive, MENTORIA_SECTIONS } from '@/modules/mentoria/nav';

export function MentoriaNavCard() {
	const pathname = usePathname();

	return (
		<nav
			aria-label="Seções da Mentoria 360°"
			className="rounded-card border border-subtle bg-surface p-4 lg:sticky lg:top-6"
		>
			<p className="text-caption text-secondary px-1 mb-3">
				Profissão Laser 360°
			</p>

			<ul className="space-y-2">
				{MENTORIA_SECTIONS.map((section) => {
					const active = isSectionActive(section, pathname);
					const Icon = section.icon;

					return (
						<li key={section.href}>
							<Link
								href={section.href}
								aria-current={active ? 'page' : undefined}
								className={`flex items-center gap-3 rounded-control border px-3 py-2.5 text-label transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
									active
										? // `text-brand` não tem versão escura no DS e sumiria no
											// fundo preto — daí o par `dark:` (ver ui.tsx do admin).
											'border-brand-border bg-brand-wash text-brand dark:text-violet-400'
										: 'border-subtle text-secondary hover:text-primary hover:bg-surface-sunken'
								}`}
							>
								<Icon className="w-4 h-4 shrink-0" aria-hidden />
								<span className="truncate">{section.label}</span>
							</Link>
						</li>
					);
				})}
			</ul>

			{/* O desenho prevê um assistente aqui, mas o destino ainda não existe —
			    nem rota, nem contrato. Fica visível e anunciado como indisponível em
			    vez de virar um link morto. Ver docs/mentoria-360-design-system.md. */}
			<div className="mt-4">
				<Button
					variant="primary"
					fullWidth
					onPress={() =>
						toast('Em breve', {
							description:
								'O Assistente da Mentoria estará disponível em breve!',
						})
					}
					accessibilityLabel="Assistente da Mentoria (em breve)"
				>
					{/* Ícone + texto é um ARRAY de children, e array bypassa o wrap
					    automático do Button em <Text> — o texto cru quebraria em
					    runtime ("A text node cannot be a child of a <View>"). Por isso
					    o <Text> explícito, como nas telas do admin. */}
					<Sparkles className="w-4 h-4" aria-hidden />
					<Text className={buttonLabel({ variant: 'primary' })}>
						Assistente
					</Text>
				</Button>
			</div>
		</nav>
	);
}
