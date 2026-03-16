import axios from 'axios';
import { clearAllTokens, getActiveToken, isAdmin } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

const PUBLIC_PAGE_PREFIXES = ['/store', '/checkout', '/login', '/register'];

api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			const path =
				typeof window !== 'undefined' ? window.location.pathname : '';
			const isPublicPage =
				path === '/' || PUBLIC_PAGE_PREFIXES.some((p) => path.startsWith(p));

			if (!isPublicPage) {
				const wasAdmin = isAdmin();
				clearAllTokens();
				window.location.href = wasAdmin ? '/login/admin' : '/login';
			}
		}
		return Promise.reject(error);
	},
);
