'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAntifraud } from '@/contexts/antifraud-context';
import { getCurrentUser } from '@/lib/auth';

type AuditEventType =
	| 'beforeprint'
	| 'afterprint'
	| 'visibility_hidden'
	| 'visibility_visible'
	| 'blur'
	| 'focus';

function sendAudit(type: AuditEventType, pathname: string) {
	const user = getCurrentUser();
	const payload = {
		type,
		at: new Date().toISOString(),
		pathname,
		userId: user?.sub ?? undefined,
		email: user?.email ?? undefined,
	};

	const body = JSON.stringify(payload);
	navigator.sendBeacon?.('/api/audit', body);
}

export function PrintGuard() {
	const pathname = usePathname();
	const antifraud = useAntifraud();

	useEffect(() => {
		const onBeforePrint = () => {
			sendAudit('beforeprint', pathname);
			antifraud?.setShowWatermark(true);
		};

		const onAfterPrint = () => {
			sendAudit('afterprint', pathname);
			antifraud?.setShowWatermark(false);
		};

		window.addEventListener('beforeprint', onBeforePrint);
		window.addEventListener('afterprint', onAfterPrint);

		const mql = window.matchMedia?.('print');
		const onMql = (e: MediaQueryListEvent) => {
			if (e.matches) onBeforePrint();
			else onAfterPrint();
		};
		mql?.addEventListener?.('change', onMql);

		const onVisibilityChange = () => {
			if (document.hidden) {
				sendAudit('visibility_hidden', pathname);
			} else {
				sendAudit('visibility_visible', pathname);
			}
		};

		document.addEventListener('visibilitychange', onVisibilityChange);

		const onBlur = () => {
			sendAudit('blur', pathname);
		};

		const onFocus = () => {
			sendAudit('focus', pathname);
		};

		window.addEventListener('blur', onBlur);
		window.addEventListener('focus', onFocus);

		return () => {
			window.removeEventListener('beforeprint', onBeforePrint);
			window.removeEventListener('afterprint', onAfterPrint);
			mql?.removeEventListener?.('change', onMql);
			document.removeEventListener('visibilitychange', onVisibilityChange);
			window.removeEventListener('blur', onBlur);
			window.removeEventListener('focus', onFocus);
		};
	}, [pathname, antifraud]);

	return null;
}
