'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { AdminLayoutWrapper } from '@/components/admin-layout-wrapper';
import { AuthGuard } from '@/components/auth-guard';
import { ThemeProvider } from '@/contexts/theme-context';

export function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						// 1 min "fresco": navegar/voltar dentro do minuto = cache, sem rede.
						staleTime: 60_000,
						// mantém dados em cache 5 min → voltar pra página é instantâneo.
						gcTime: 5 * 60_000,
						// mata o "recarrega tudo" ao focar a aba.
						refetchOnWindowFocus: false,
						refetchOnReconnect: true,
						// falha rápido em endpoint fora do ar (em vez de 3x com backoff).
						retry: 1,
					},
					mutations: { retry: 0 },
				},
			}),
	);

	return (
		<ThemeProvider>
			<QueryClientProvider client={queryClient}>
				<AuthGuard>
					<AdminLayoutWrapper>{children}</AdminLayoutWrapper>
				</AuthGuard>
				<Toaster theme="dark" richColors position="top-right" />
			</QueryClientProvider>
		</ThemeProvider>
	);
}
