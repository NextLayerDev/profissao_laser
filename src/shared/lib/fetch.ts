import axios from 'axios';
import { clearToken, getToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_GATEWAY_URL;

export const api = axios.create({
	baseURL: API_URL,
	headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
	const token = getToken();
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

api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			const path =
				typeof window !== 'undefined' ? window.location.pathname : '';
			const isPublicPage =
				path === '/' || PUBLIC_PAGE_PREFIXES.some((p) => path.startsWith(p));

			if (!isPublicPage) {
				clearToken();
				window.location.href = '/login';
			}
		}
		return Promise.reject(error);
	},
);
