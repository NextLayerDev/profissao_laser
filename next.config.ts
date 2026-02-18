import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	output: 'standalone',
	reactCompiler: true,
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: '*.public.blob.vercel-storage.com',
				port: '',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'pps.whatsapp.net',
			},
			{
				protocol: 'https',
				hostname: '*.whatsapp.net',
			},
			{
				protocol: 'https',
				hostname: 'mmg.whatsapp.net',
			},
			{
				protocol: 'http',
				hostname: 'localhost',
			},
			{
				protocol: 'https',
				hostname: '*.backblazeb2.com',
				port: '',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'lkfifggdfyzvlzavhobl.supabase.co',
			},
			{
				protocol: 'https',
				hostname: 'files.stripe.com',
			},
		],
	},
	env: {
		NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
	},
};

export default nextConfig;
