// Rotas de conferência com fixtures (/mentoria-*-check etc.). Só exigiam login,
// então qualquer aluno abria em produção relatórios fictícios com cara de
// reais. Em build de produção viram 404; `ENABLE_DEV_ROUTES=1` reabre (ex.:
// preview para conferir o layout).

import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

export default function DevRoutesLayout({ children }: { children: ReactNode }) {
	if (
		process.env.NODE_ENV === 'production' &&
		process.env.ENABLE_DEV_ROUTES !== '1'
	) {
		notFound();
	}
	return <>{children}</>;
}
