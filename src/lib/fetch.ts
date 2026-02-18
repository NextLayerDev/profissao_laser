import axios from 'axios';
import { getActiveToken } from './auth';

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
	return config;
});
