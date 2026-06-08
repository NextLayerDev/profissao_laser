'use client';

import { use } from 'react';
import { EventWaitingRoom } from '@/components/community/event-waiting-room';

interface PageProps {
	params: Promise<{ eventId: string }>;
}

export default function EventWaitingRoomPage({ params }: PageProps) {
	const { eventId } = use(params);

	return (
		<div className="p-4 md:p-8 max-w-6xl mx-auto">
			<EventWaitingRoom eventId={eventId} />
		</div>
	);
}
