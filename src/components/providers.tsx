'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { AdminLayoutWrapper } from '@/components/admin-layout-wrapper';
import { ThemeProvider } from '@/contexts/theme-context';
import { AuthGuard } from '@/modules/auth';

export function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(() => new QueryClient());

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
