/**
 * Leitura de Server-Sent Events sobre `fetch`.
 *
 * Não dá para usar `EventSource`: ele é GET-only, e as duas rotas de streaming
 * do app são POST (uma manda a definition, a outra manda a foto em multipart).
 * Então abrimos um `fetch` e lemos o corpo pelo reader, separando os frames
 * `event:`/`data:` à mão.
 *
 * Mora em `lib/` porque já são DOIS consumidores — o agente construtor de tools
 * e o time de pesquisa da Central de Inteligência. Antes disso era um detalhe
 * de um serviço; agora é contrato compartilhado.
 */

export interface SseFrame {
	event: string;
	data: Record<string, unknown>;
}

/** Frame cru (`event: x\ndata: {...}`) → `{event, data}`. `null` se inutilizável. */
export function parseSseFrame(frame: string): SseFrame | null {
	let event = '';
	const dataLines: string[] = [];
	for (const line of frame.split('\n')) {
		if (line.startsWith('event:')) event = line.slice(6).trim();
		else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
	}
	if (!event) return null;
	try {
		return {
			event,
			data: dataLines.length
				? (JSON.parse(dataLines.join('\n')) as Record<string, unknown>)
				: {},
		};
	} catch {
		// Frame partido pela metade (rede, proxy): ignora em vez de derrubar o
		// stream inteiro — o próximo frame provavelmente chega inteiro.
		return null;
	}
}

/**
 * Lê o corpo de uma resposta SSE e entrega frame a frame.
 *
 * O buffer é mantido entre chunks de propósito: um frame pode chegar partido em
 * dois pacotes TCP, e processar por chunk perderia a metade.
 */
export async function* lerFramesSse(
	res: Response,
	signal?: AbortSignal,
): AsyncGenerator<SseFrame> {
	const reader = res.body?.getReader();
	if (!reader) return;
	const decoder = new TextDecoder();
	let buffer = '';

	try {
		while (true) {
			if (signal?.aborted) return;
			const { done, value } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });

			// Frames são separados por linha em branco.
			let corte = buffer.indexOf('\n\n');
			while (corte !== -1) {
				const bruto = buffer.slice(0, corte);
				buffer = buffer.slice(corte + 2);
				const frame = parseSseFrame(bruto);
				if (frame) yield frame;
				corte = buffer.indexOf('\n\n');
			}
		}
		// O último frame pode vir sem a linha em branco final.
		const resto = parseSseFrame(buffer);
		if (resto) yield resto;
	} finally {
		try {
			await reader.cancel();
		} catch {
			// stream já encerrado
		}
	}
}
