import dagre from '@dagrejs/dagre';
import type { FlowEdge, FlowNode } from './canvas-mapping';

/**
 * Auto-layout esquerda→direita (dagre). Posições são EFÊMERAS (estado local do
 * canvas), não vão pra definition. Usadas ao carregar uma tool e no botão
 * "Organizar".
 */
const NODE_W = 230;
const NODE_H = 140;

export function layoutLR(
	nodes: FlowNode[],
	edges: FlowEdge[],
): Record<string, { x: number; y: number }> {
	const g = new dagre.graphlib.Graph();
	g.setGraph({
		rankdir: 'LR',
		nodesep: 36,
		ranksep: 110,
		marginx: 20,
		marginy: 20,
	});
	g.setDefaultEdgeLabel(() => ({}));
	for (const n of nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });
	for (const e of edges) {
		if (e.source && e.target) g.setEdge(e.source, e.target);
	}
	dagre.layout(g);
	const pos: Record<string, { x: number; y: number }> = {};
	for (const n of nodes) {
		const p = g.node(n.id);
		if (p) pos[n.id] = { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 };
	}
	return pos;
}
