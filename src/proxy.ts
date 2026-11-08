import { type NextRequest, NextResponse } from 'next/server';
import {
	DISABLED_TOOL_REDIRECT,
	isDisabledToolPath,
} from '@/modules/tools/enabled-tools';

/**
 * Rota antiga de ferramenta desligada (`NEXT_PUBLIC_ENABLED_TOOLS`) → hub de
 * ferramentas, antes de renderizar. Sem allowlist, nada é redirecionado.
 */
export function proxy(req: NextRequest) {
	if (!isDisabledToolPath(req.nextUrl.pathname)) return NextResponse.next();
	const url = req.nextUrl.clone();
	url.pathname = DISABLED_TOOL_REDIRECT;
	url.search = '';
	return NextResponse.redirect(url);
}

export const config = {
	matcher: [
		'/course/vetorizacao/:path*',
		'/course/previas/:path*',
		'/course/parametros/:path*',
		'/course/gravacao-oneclick/:path*',
		'/course/canva/:path*',
	],
};
