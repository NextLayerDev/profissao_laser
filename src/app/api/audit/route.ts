import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

function getClientIp(headersList: Headers): string {
	const forwarded = headersList.get('x-forwarded-for');
	if (forwarded) {
		return forwarded.split(',')[0]?.trim() ?? 'N/A';
	}
	const realIp = headersList.get('x-real-ip');
	if (realIp) return realIp;
	return 'N/A';
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const headersList = await headers();
		const ip = getClientIp(headersList);

		const payload = {
			...body,
			ip,
		};

		const apiUrl = process.env.NEXT_PUBLIC_API_URL;
		if (apiUrl) {
			const res = await fetch(`${apiUrl}/audit`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
			if (!res.ok) {
				console.warn('[antifraud] Backend /audit returned', res.status);
			}
		} else {
			console.warn(
				'[antifraud] NEXT_PUBLIC_API_URL not set, audit not forwarded',
			);
		}
	} catch (err) {
		console.warn('[antifraud] Audit log error:', err);
	}

	return NextResponse.json({ ok: true }, { status: 200 });
}
