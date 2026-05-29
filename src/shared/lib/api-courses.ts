import axios from 'axios';
import { clearAllTokens, getActiveToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_COURSES_API_URL;

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
];

apiCourses.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			const path =
				typeof window !== 'undefined' ? window.location.pathname : '';
			const isPublicPage =
				path === '/' || PUBLIC_PAGE_PREFIXES.some((p) => path.startsWith(p));

			if (!isPublicPage) {
				clearAllTokens();
				window.location.href = '/login';
			}
		}
		return Promise.reject(error);
	},
);
