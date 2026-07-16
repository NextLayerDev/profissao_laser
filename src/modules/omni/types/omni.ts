/**
 * Tipos da feature OmniResposta (automação de atendimento WhatsApp por IA).
 * Espelham os contratos REST do main API (`/api/omni/*`) — entidades em
 * snake_case, exatamente como o backend devolve.
 */

export type OmniProvider = 'zapi' | 'evolution' | 'meta';

export type OmniInstanceStatus =
	| 'disconnected'
	| 'connecting'
	| 'qr'
	| 'connected'
	| 'error';

export type OmniBillingStatus = 'ok' | 'no_balance';

export interface OmniInstance {
	id: string;
	owner_id: string;
	name: string;
	provider: OmniProvider;
	status: OmniInstanceStatus;
	setup_status: string | null;
	setup_error: string | null;
	phone_number: string | null;
	profile_name: string | null;
	ia_enabled: boolean;
	billing_status: OmniBillingStatus;
	debounce_seconds: number;
	qr_code: string | null;
	created_at: string;
	updated_at: string;
	webhook_url?: string;
}

export interface OmniMetaCredentials {
	meta_phone_number_id: string;
	meta_waba_token: string;
	meta_verify_token: string;
	meta_app_secret?: string;
}

export interface CreateOmniInstancePayload {
	provider: OmniProvider;
	name?: string;
	credentials?: OmniMetaCredentials;
}

export interface UpdateOmniInstancePayload {
	name?: string;
	ia_enabled?: boolean;
	debounce_seconds?: number;
	billing_status?: 'ok';
}

export interface OmniConnectResponse {
	qrCodeBase64?: string | null;
	qr_code?: string | null;
	status?: OmniInstanceStatus;
}

export interface OmniInstanceStatusResponse {
	status: OmniInstanceStatus;
	phone_number: string | null;
	profile_name: string | null;
	qr_code: string | null;
	billing_status: OmniBillingStatus;
	webhook_url?: string;
}

/** Shape parcial tolerado — backend pode não mandar tudo. */
export interface OmniInstanceStats {
	total?: number;
	ia?: number;
	human?: number;
	unread?: number;
	by_lead_step?: Record<string, number>;
}

export interface OmniContact {
	id: string;
	wa_id: string;
	name: string | null;
	push_name: string | null;
	profile_pic_url: string | null;
}

export type OmniChatStatus = 'active' | 'waiting' | 'closed' | 'window_closed';

export interface OmniChat {
	id: string;
	instance_id: string;
	contact: OmniContact;
	wa_chat_id: string;
	last_message: string | null;
	last_message_at: string | null;
	unread_count: number;
	assigned_to: 'ai' | 'human';
	assigned_user_id: string | null;
	assigned_user_name: string | null;
	ia_paused: boolean;
	is_pinned: boolean;
	is_archived: boolean;
	status: OmniChatStatus;
	lead_step: string | null;
	created_at: string;
	updated_at: string;
}

export type OmniChatAssignFilter = 'all' | 'ia' | 'human';

export interface OmniChatListParams {
	search?: string;
	filter?: OmniChatAssignFilter;
	leadStep?: string;
	archived?: boolean;
	pinned?: boolean;
	limit?: number;
	cursor?: string;
}

export interface OmniChatListResponse {
	chats: OmniChat[];
	nextCursor?: string | null;
}

export interface UpdateOmniChatPayload {
	is_pinned?: boolean;
	is_archived?: boolean;
	lead_step?: string | null;
	ia_paused?: boolean;
	status?: OmniChatStatus;
}

export type OmniTransferPayload =
	| { to: 'ai' }
	| { to: 'user'; userId: string; userName: string };

export type OmniMediaType =
	| 'image'
	| 'video'
	| 'audio'
	| 'document'
	| 'sticker'
	| null;

export type OmniMessageStatus =
	| 'pending'
	| 'sent'
	| 'delivered'
	| 'read'
	| 'failed';

export interface OmniMessage {
	id: string;
	chat_id: string;
	provider_message_id: string | null;
	direction: 'in' | 'out';
	author_type: 'contact' | 'ai' | 'user';
	author_id: string | null;
	sender_name: string | null;
	content: string | null;
	media_url: string | null;
	media_type: OmniMediaType;
	file_name: string | null;
	caption: string | null;
	transcription: string | null;
	status: OmniMessageStatus;
	error?: string | null;
	wa_timestamp: string | null;
	created_at: string;
}

export interface OmniAgent {
	id: string;
	instance_id: string;
	name: string;
	slug: string;
	role: 'router' | 'specialist';
	system_prompt: string;
	tool_description: string | null;
	model: string;
	temperature: number;
	position: number;
	enabled: boolean;
}

export interface OmniAgentPayload {
	name?: string;
	slug?: string;
	role?: 'router' | 'specialist';
	system_prompt?: string;
	tool_description?: string | null;
	model?: string;
	temperature?: number;
	position?: number;
	enabled?: boolean;
}

export type OmniKbFileStatus = 'processing' | 'ready' | 'error';

export interface OmniKbFile {
	id: string;
	instance_id: string;
	name: string;
	url: string | null;
	mime: string | null;
	size_bytes: number | null;
	status: OmniKbFileStatus;
	error: string | null;
	chunk_count: number | null;
	created_at: string;
}

export interface OmniKbChunk {
	id?: string;
	file_id?: string;
	file_name?: string;
	content?: string;
	text?: string;
	score?: number;
}

/** 16 campos da configuração do negócio (alimentam o prompt dos agentes). */
export interface OmniBusinessConfig {
	company_description: string;
	product_categories: string;
	greeting_message: string;
	payment_method: string;
	payment_terms: string;
	local_pickup_city: string;
	delivery_policy: string;
	business_location: string;
	business_hours: string;
	issues_invoice: boolean;
	marketplace_url: string;
	exchange_policy: string;
	engraving_included: boolean;
	accepted_formats: string;
	human_transfer_priority: string;
	tone_of_voice: string;
}

export const DEFAULT_OMNI_BUSINESS_CONFIG: OmniBusinessConfig = {
	company_description: '',
	product_categories: '',
	greeting_message: '',
	payment_method: 'PIX',
	payment_terms:
		'50% de sinal para iniciar a produção e 50% após o pedido pronto, antes do envio',
	local_pickup_city: '',
	delivery_policy: 'Frete por conta do cliente',
	business_location: '',
	business_hours: 'Horário comercial',
	issues_invoice: true,
	marketplace_url: '',
	exchange_policy:
		'Solicitar foto e descrição do problema para análise caso a caso',
	engraving_included: true,
	accepted_formats:
		'PNG, JPG, AI, SVG ou PDF. Fundo transparente e alta resolução para melhor resultado',
	human_transfer_priority: '',
	tone_of_voice:
		'Humano, empático, entusiasmado com vendas, profissional. Máximo 2 frases + 1 pergunta por mensagem. Português BR, simples e direto.',
};

// ─── Eventos do socket (server → client) ────────────────────────────────────

export interface OmniSocketNewMessage {
	chatId: string;
	message: OmniMessage;
}

export interface OmniSocketChatUpdate {
	chat: OmniChat;
}

export interface OmniSocketMessagesRead {
	chatId?: string;
	[key: string]: unknown;
}

export interface OmniSocketBillingStatus {
	billing_status: OmniBillingStatus;
}
