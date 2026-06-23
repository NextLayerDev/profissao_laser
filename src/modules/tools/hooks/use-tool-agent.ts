'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
	type BuilderState,
	docToState,
} from '@/components/ferramentas/builder-model';
import { usePlans } from '@/modules/plans/hooks/use-plans';
import { applyVoxCharge, emitVoxSpend } from '../lib/vox-fx';
import { streamAgentTurn } from '../services/tool-agent.service';

/** Uma ação executada pelo agente, no transcript ("✓ Adicionou o campo …"). */
export interface AgentAction {
	label: string;
	ok: boolean;
}
export interface AgentMessage {
	id: string;
	role: 'user' | 'assistant';
	text: string;
	actions: AgentAction[];
	cost?: number;
	insufficient?: boolean;
}

let counter = 0;
const uid = (p: string) =>
	`${p}_${Date.now().toString(36)}_${(counter++).toString(36)}`;

/**
 * Estado conversacional do Agente "Engenheiro de Ferramentas" ligado ao MESMO
 * par `state`/`setState` do canvas: cada evento `doc` reconstrói a BuilderState
 * (via `docToState`) e o canvas + prévia atualizam AO VIVO. O custo (voxes) anima
 * no header (vox-fx). A montagem é catálogo-driven (o estado atual vira catálogo).
 */
export function useToolAgent(
	state: BuilderState | null,
	setState: (s: BuilderState) => void,
) {
	const qc = useQueryClient();
	const [messages, setMessages] = useState<AgentMessage[]>([]);
	const [streaming, setStreaming] = useState(false);

	// refs estáveis (evita recriar `send` a cada tecla / a cada doc).
	const sessionRef = useRef(uid('sess'));
	const historyRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>(
		[],
	);
	const abortRef = useRef<AbortController | null>(null);
	// trava SÍNCRONA de re-entrância: impede 2 turnos simultâneos (duplo-clique /
	// chip + Enter) que cobrariam voxes 2x — `streaming` (state) atualiza tarde.
	const sendingRef = useRef(false);
	const stateRef = useRef(state);
	useEffect(() => {
		stateRef.current = state;
	}, [state]);

	// Planos reais (key+nome) p/ o agente usar keys válidas em salas (Mentoria).
	const plansQuery = usePlans();
	const plansRef = useRef<{ key: string; name: string }[]>([]);
	useEffect(() => {
		plansRef.current = (plansQuery.data ?? []).map((p) => ({
			key: p.key,
			name: p.name,
		}));
	}, [plansQuery.data]);

	const patchMsg = useCallback(
		(id: string, fn: (m: AgentMessage) => AgentMessage) => {
			setMessages((prev) => prev.map((m) => (m.id === id ? fn(m) : m)));
		},
		[],
	);

	const send = useCallback(
		async (raw: string) => {
			const text = raw.trim();
			const current = stateRef.current;
			if (!text || sendingRef.current || !current) return;
			sendingRef.current = true;

			const aId = uid('a');
			setMessages((prev) => [
				...prev,
				{ id: uid('u'), role: 'user', text, actions: [] },
				{ id: aId, role: 'assistant', text: '', actions: [] },
			]);

			const ac = new AbortController();
			abortRef.current = ac;
			setStreaming(true);
			let narration = '';

			try {
				for await (const ev of streamAgentTurn(
					{
						session_id: sessionRef.current,
						state: stateRef.current ?? current,
						message: text,
						history: historyRef.current,
						plans: plansRef.current,
					},
					ac.signal,
				)) {
					if (ev.type === 'text') {
						narration += ev.delta;
						patchMsg(aId, (m) => ({ ...m, text: m.text + ev.delta }));
					} else if (ev.type === 'action') {
						patchMsg(aId, (m) => ({
							...m,
							actions: [...m.actions, { label: ev.label, ok: ev.ok }],
						}));
					} else if (ev.type === 'doc') {
						const base = stateRef.current ?? current;
						const ui = ev.definition.ui as
							| { title?: string; description?: string }
							| undefined;
						setState(
							docToState({
								tool_key: base.toolKey,
								title: ui?.title ?? base.title,
								description: ui?.description ?? base.description,
								definition: ev.definition,
							}),
						);
					} else if (ev.type === 'cost') {
						if (ev.balance != null && ev.voxes_spent > 0) {
							applyVoxCharge(qc, {
								voxes_spent: ev.voxes_spent,
								balance: ev.balance,
							});
						} else if (ev.voxes_spent > 0) {
							emitVoxSpend(ev.voxes_spent);
						}
						patchMsg(aId, (m) => ({
							...m,
							cost: ev.voxes_spent,
							insufficient: ev.insufficient,
						}));
						if (ev.insufficient) {
							toast.error('Saldo de voxxys insuficiente para continuar.');
						}
					} else if (ev.type === 'error') {
						toast.error(ev.message);
						patchMsg(aId, (m) => ({
							...m,
							text: m.text || `⚠️ ${ev.message}`,
						}));
					}
				}
			} catch {
				if (!ac.signal.aborted) {
					toast.error('Conexão com o agente caiu. Tente de novo.');
				}
			} finally {
				// turno abortado não vira histórico (não polui o contexto do próximo
				// turno com uma resposta de assistente pela metade).
				if (!ac.signal.aborted) {
					historyRef.current = [
						...historyRef.current,
						{ role: 'user', content: text },
						{
							role: 'assistant',
							content: narration || '(montou/ajustou a ferramenta)',
						},
					];
				}
				setStreaming(false);
				sendingRef.current = false;
				abortRef.current = null;
			}
		},
		[setState, patchMsg, qc],
	);

	const stop = useCallback(() => {
		abortRef.current?.abort();
		setStreaming(false);
	}, []);

	const reset = useCallback(() => {
		abortRef.current?.abort();
		sessionRef.current = uid('sess');
		historyRef.current = [];
		setMessages([]);
		setStreaming(false);
	}, []);

	return { messages, streaming, send, stop, reset };
}
