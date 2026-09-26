'use client';

// Navegação da Mentoria 360°, como card ao lado do conteúdo.
//
// Antes as seções viviam como sub-menu expansível dentro da sidebar global do
// curso. O desenho aprovado traz a navegação para dentro da própria área, em um
// card com as seções em pílulas — então a sidebar global voltou a ser um link
// simples e a lista canônica passou a morar em `src/modules/mentoria/nav.ts`.

import { Button, buttonLabel } from '@upvox-dev/ui';
import { Lock, Settings, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Text } from 'react-native-css/components/Text';
import { FLOATING_COLUMN } from '@/modules/mentoria/components/ui';
import { useMentoriaToolsLocked } from '@/modules/mentoria/hooks';
import {
	isSectionActive,
	MENTORIA_ROOT,
	MENTORIA_SECTIONS,
	MENTORIA_SETTINGS,
} from '@/modules/mentoria/nav';

/** Pílula da navegação — mesma forma para seções e para Configurações. */
function navItem(active: boolean) {
	return `flex items-center gap-3 rounded-control border px-3 py-2.5 text-label transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
		active
			? // `text-brand` não tem versão escura no DS e sumiria no fundo preto —
				// daí o par `dark:` (ver ui.tsx do admin).
				'border-brand-border bg-brand-wash text-brand dark:text-violet-400'
			: 'border-subtle text-secondary hover:text-primary hover:bg-surface-sunken'
	}`;
}

export function MentoriaNavCard({
	assistantOpen,
	onToggleAssistant,
}: {
	assistantOpen: boolean;
	onToggleAssistant: () => void;
}) {
	const pathname = usePathname();
	const toolsLocked = useMentoriaToolsLocked();

	return (
		<>
			<MobileTabs pathname={pathname} toolsLocked={toolsLocked} />
			<nav
				aria-label="Seções da Mentoria 360°"
				className={`${FLOATING_COLUMN.surface} ${FLOATING_COLUMN.stickyLg} hidden flex-col p-4 lg:flex`}
			>
				<p className="text-caption text-secondary px-1 mb-3">
					Profissão Laser 360°
				</p>

				<ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
					{MENTORIA_SECTIONS.map((section) => {
						const active = isSectionActive(section, pathname);
						const Icon = section.icon;

						return (
							<li key={section.href}>
								<Link
									href={section.href}
									aria-current={active ? 'page' : undefined}
									className={navItem(active)}
								>
									<Icon className="w-4 h-4 shrink-0" aria-hidden />
									<span className="truncate">{section.label}</span>
									{toolsLocked &&
										section.href === `${MENTORIA_ROOT}/ferramentas` && (
											<Lock
												className="ml-auto w-3.5 h-3.5 shrink-0 text-muted"
												aria-label="Bloqueada"
											/>
										)}
								</Link>
							</li>
						);
					})}

					{/* Configurações fecha a lista em vez de morar fora dela: o <ul> é
				    `flex-1` e estica até o rodapé, então um irmão abaixo dele ficava
				    separado por toda a sobra da coluna, e não pelo `space-y-2` dos
				    demais. Continua fora de MENTORIA_SECTIONS — aquela lista é a
				    jornada do aluno, e configuração não é etapa de jornada. */}
					<li>
						<Link
							href={MENTORIA_SETTINGS}
							aria-current={pathname === MENTORIA_SETTINGS ? 'page' : undefined}
							className={navItem(pathname === MENTORIA_SETTINGS)}
						>
							<Settings className="w-4 h-4 shrink-0" aria-hidden />
							<span className="truncate">Configurações</span>
						</Link>
					</li>
				</ul>

				{/* Abre e fecha a coluna do Assistente, que mora no `MentoriaShell` — o
			    painel é irmão desta navegação na grade, não um overlay. A conversa em
			    si ainda não tem backend; o gap está em
			    docs/mentoria-360-design-system.md.
			    Só a partir do xl: abaixo disso o painel vira a última linha da grade,
			    depois de todo o conteúdo, e abrir jogava a página para o rodapé. E
			    secundário + "Em breve": o destaque primário prometia algo que ainda
			    só responde "Em breve". */}
				<div className="mt-4 hidden shrink-0 xl:block">
					<Button
						variant="secondary"
						fullWidth
						onPress={onToggleAssistant}
						accessibilityLabel={
							assistantOpen
								? 'Fechar o Assistente da Mentoria'
								: 'Abrir o Assistente da Mentoria'
						}
					>
						{/* Ícone + texto é um ARRAY de children, e array bypassa o wrap
					    automático do Button em <Text> — o texto cru quebraria em
					    runtime ("A text node cannot be a child of a <View>"). Por isso
					    o <Text> explícito, como nas telas do admin. */}
						<Sparkles className="w-4 h-4 text-primary" aria-hidden />
						<Text className={buttonLabel({ variant: 'secondary' })}>
							Assistente de IA · Em breve
						</Text>
					</Button>
				</div>
			</nav>
		</>
	);
}

/**
 * Abaixo do `lg` o card de 10 pílulas empurrava o conteúdo de toda página
 * para baixo da dobra. Vira uma faixa de abas no topo, rolando na horizontal
 * (dentro dela, sem scroll lateral na página), com a aba atual à vista.
 */
function MobileTabs({
	pathname,
	toolsLocked,
}: {
	pathname: string;
	toolsLocked: boolean;
}) {
	const activeRef = useRef<HTMLAnchorElement | null>(null);
	// biome-ignore lint/correctness/useExhaustiveDependencies: recentraliza a cada troca de rota
	useEffect(() => {
		activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
	}, [pathname]);

	const items = [
		...MENTORIA_SECTIONS,
		{ href: MENTORIA_SETTINGS, label: 'Configurações', icon: Settings },
	];
	const tab = (active: boolean) =>
		`flex shrink-0 items-center gap-1.5 rounded-chip border px-3 py-1.5 text-caption transition-colors ${
			active
				? 'border-brand-border bg-brand-wash text-brand dark:text-violet-400'
				: 'border-subtle text-secondary'
		}`;

	return (
		<nav
			aria-label="Seções da Mentoria 360°"
			className="lg:hidden"
			data-testid="mentoria-mobile-tabs"
		>
			<ul className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
				{items.map((section) => {
					const active =
						section.href === MENTORIA_SETTINGS
							? pathname === MENTORIA_SETTINGS
							: isSectionActive(section, pathname);
					const Icon = section.icon;
					return (
						<li key={section.href} className="shrink-0">
							<Link
								href={section.href}
								ref={active ? activeRef : undefined}
								aria-current={active ? 'page' : undefined}
								className={tab(active)}
							>
								<Icon className="h-3.5 w-3.5" aria-hidden />
								{section.label}
								{toolsLocked &&
									section.href === `${MENTORIA_ROOT}/ferramentas` && (
										<Lock
											className="h-3 w-3 text-muted"
											aria-label="Bloqueada"
										/>
									)}
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
