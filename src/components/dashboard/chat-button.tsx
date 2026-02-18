import { MessageCircle } from 'lucide-react';

export function ChatButton() {
	return (
		<button
			type="button"
			className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 transition-all duration-300 hover:scale-110"
		>
			<MessageCircle className="w-6 h-6 text-white" />
		</button>
	);
}
