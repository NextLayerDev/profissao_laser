import axios from 'axios';
import { clearAllTokens, getActiveToken, getToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_GATEWAY_URL;

export const apiCourses = axios.create({
	baseURL: API_URL,
	headers: { 'Content-Type': 'application/json' },
});

apiCourses.interceptors.request.use((config) => {
	const token = getActiveToken();
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	if (config.data instanceof FormData) {
		delete config.headers['Content-Type'];
	}
	return config;
});

const PUBLIC_PAGE_PREFIXES = [
	'/store',
	'/checkout',
	'/login',
	'/register',
	'/forgot-password',
	'/reset-password',
	'/payment-link',
	'/promo-link',
	'/global-promo-link',
	'/link-plano',
];

apiCourses.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			const path =
				typeof window !== 'undefined' ? window.location.pathname : '';
			const isPublicPage =
				path === '/' || PUBLIC_PAGE_PREFIXES.some((p) => path.startsWith(p));

			// Staff/colaborador (token de painel) pode navegar a área do aluno
			// (/course) e receber 401 em rotas exclusivas de customer (ex.:
			// entitlements). Nesse caso NÃO derrubamos a sessão do painel: deixamos
			// a request falhar isolada e o widget degradar. Fora de /course, um 401
			// com token de painel é sessão expirada de verdade → segue o redirect.
			const isPanelInCourseArea =
				!!getToken('user') && path.startsWith('/course');

			if (!isPublicPage && !isPanelInCourseArea) {
				clearAllTokens();
				window.location.href = '/login';
			}
		}
		return Promise.reject(error);
	},
);
