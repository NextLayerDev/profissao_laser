'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { AuthGuard } from '@/components/auth-guard';

export function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<QueryClientProvider client={queryClient}>
			<AuthGuard>{children}</AuthGuard>
			<Toaster theme="dark" richColors position="top-right" />
		</QueryClientProvider>
	);
}
