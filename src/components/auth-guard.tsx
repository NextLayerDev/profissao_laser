'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentUser, isAdmin } from '@/lib/auth';

const PUBLIC_PATHS = [
	'/login',
	'/register',
	'/store',
	'/',
	'/checkout',
	'/payment-link',
	'/promo-link',
	'/global-promo-link',
	'/link-plano',
	// TERCEIRO LUGAR OBRIGATÓRIO do `/orcamento` (os outros dois são os clients
	// axios). Aqui a falha não é sutil: sem o prefixo, o `AuthGuard` manda o
	// cliente final do profissional — que não tem e nunca vai ter conta — direto
	// para `/login`, e a página pública simplesmente não existe.
	'/orcamento',
	// Verificação pública da arte licenciada gerada na ferramenta. Quem escaneia
	// o QR gravado na peça é o consumidor final: não tem conta e não vai criar
	// uma para conferir se o escudo é oficial. Um 401 daqui também não pode
	// derrubar a sessão de quem estiver logado noutra aba.
	'/a',
];

const ADMIN_PATHS = [
	'/dashboard',
	'/products',
	'/sales',
	'/links',
	'/cupons',
	'/reports',
	'/community',
	'/acessos',
	'/forum',
];

function isAdminPath(pathname: string): boolean {
	return ADMIN_PATHS.some((p) =>
		p === '/'
			? pathname === '/'
			: pathname === p || pathname.startsWith(`${p}/`),
	);
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const isPublic = PUBLIC_PATHS.some((p) =>
			p === '/' ? pathname === '/' : pathname.startsWith(p),
		);

		if (!isPublic && !getCurrentUser()) {
			router.replace('/login');
			return;
		}

		if (!isPublic && getCurrentUser() && !isAdmin() && isAdminPath(pathname)) {
			router.replace('/store');
			return;
		}

		setReady(true);
	}, [pathname, router]);

	if (!ready) return null;

	return <>{children}</>;
}
