import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_SECRET = process.env.NEXT_PUBLIC_PROVISIONING_SECRET;

export const internalApi = axios.create({
	baseURL: API_URL,
	headers: {
		'Content-Type': 'application/json',
		'x-api-secret': API_SECRET ?? '',
	},
});
