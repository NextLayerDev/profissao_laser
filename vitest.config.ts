import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
		},
	},
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./vitest.setup.ts'],
		// Garante baseURL absoluta para o axios/apiCourses, pra o MSW interceptar.
		env: {
			NEXT_PUBLIC_GATEWAY_URL: 'http://localhost/api',
		},
		include: ['src/**/*.{test,spec}.{ts,tsx}'],
	},
});
