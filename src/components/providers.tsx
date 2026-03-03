'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { AuthGuard } from '@/components/auth-guard';
import { ThemeProvider } from '@/contexts/theme-context';

export function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<ThemeProvider>
			<QueryClientProvider client={queryClient}>
				<AuthGuard>{children}</AuthGuard>
				<Toaster theme="dark" richColors position="top-right" />
			</QueryClientProvider>
		</ThemeProvider>
	);
}
