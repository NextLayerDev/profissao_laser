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

export async function GET() {
	const headersList = await headers();
	const ip = getClientIp(headersList);
	const timestamp = new Date().toISOString();

	return NextResponse.json({ ip, timestamp });
}
