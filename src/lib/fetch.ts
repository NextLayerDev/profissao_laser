import axios from 'axios';
import { clearAllTokens, getActiveToken, getToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_GATEWAY_URL;

export const api = axios.create({
	baseURL: API_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

api.interceptors.request.use((config) => {
	const token = getActiveToken();
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	// FormData: remover Content-Type para o browser definir multipart/form-data com boundary
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
	'/payment-link',
	'/promo-link',
	'/global-promo-link',
	'/link-plano',
];

api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			const path =
				typeof window !== 'undefined' ? window.location.pathname : '';
			const isPublicPage =
				path === '/' || PUBLIC_PAGE_PREFIXES.some((p) => path.startsWith(p));

			// Staff/colaborador (token de painel) navegando a área do aluno
			// (/course) pode receber 401 em endpoints exclusivos de customer (ex.:
			// feed da comunidade). Nesse caso NÃO derrubamos a sessão do painel.
			// Fora de /course, 401 com token de painel é sessão expirada → redirect.
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
