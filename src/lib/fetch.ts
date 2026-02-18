import axios from 'axios';
import { db } from './db';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
	baseURL: API_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

api.interceptors.request.use(async (config) => {
	const { data } = await db.auth.getSession();
	const token = data.session?.access_token;

	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}

	return config;
});

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			const { data, error: refreshError } = await db.auth.refreshSession();

			if (refreshError || !data.session) {
				return Promise.reject(refreshError ?? error);
			}

			originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`;
			return api(originalRequest);
		}

		return Promise.reject(error);
	},
);
