export interface VectorSupportFile {
	id: string;
	messageId: string;
	fileUrl: string;
	fileName: string;
	fileType: string;
	createdAt: string;
}

export interface VectorSupportMessage {
	id: string;
	ticketId: string;
	authorId: string;
	authorName: string;
	isTechnician: boolean;
	content: string | null;
	files: VectorSupportFile[];
	createdAt: string;
}

export interface VectorSupportTicket {
	id: string;
	customerId: string;
	customerName: string;
	status: string;
	subject: string;
	messages?: VectorSupportMessage[];
	createdAt: string;
	updatedAt: string;
}
