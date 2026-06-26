'use client';

import { usePathname } from 'next/navigation';
import { CommandPalette } from '@/components/tools/command-palette';
import { CommandPaletteProvider } from '@/components/tools/use-command-palette';

const ADMIN_PATHS = [
	'/dashboard',
	'/products',
	'/courses',
	'/planos',
	'/sales',
	'/links',
	'/fatura',
	'/reports',
	'/community',
	'/forum',
	'/agendamentos',
	'/acessos',
	'/alunos',
	'/grupo-whatsapp',
	'/duvidas-admin',
	'/suporte',
	'/parametros',
	'/previas-admin',
	'/vetorizacao-admin',
	'/ferramentas',
];

export function AdminLayoutWrapper({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();

	const isAdmin = ADMIN_PATHS.some(
		(p) => pathname === p || pathname.startsWith(`${p}/`),
	);

	if (!isAdmin) return <>{children}</>;

	return (
		<CommandPaletteProvider audience="admin">
			<div className="relative flex min-h-screen bg-slate-100 dark:bg-[#080809]">
				<div className="hidden dark:block absolute inset-0 pointer-events-none overflow-hidden">
					<div className="absolute top-25 left-[20%] w-125 h-125 bg-blue-900/15 rounded-full blur-3xl" />
					<div className="absolute bottom-12.5 right-[10%] w-100 h-100 bg-indigo-900/15 rounded-full blur-3xl" />
					<div className="absolute top-[30%] right-[30%] w-75 h-75 bg-blue-800/8 rounded-full blur-3xl" />
				</div>

				{/* Conteúdo full-width — a top bar (Header) é renderizada por cada página */}
				<div className="relative z-10 flex-1 min-w-0">{children}</div>
			</div>
			<CommandPalette />
		</CommandPaletteProvider>
	);
}
