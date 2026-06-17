/**
 * Exporta o Financeiro completo (totais, composição, mensal, top clientes,
 * lastro de voxxys e extrato) em Excel (.xlsx, multi-aba) e PDF. As libs são
 * importadas sob demanda (dynamic import) pra não pesar o bundle inicial.
 */

import type { CompanyInvoice } from '@/types/plan-link';

export type FinanceExportMeta = {
	from?: string;
	to?: string;
	source?: string;
	q?: string;
	generatedAt: string;
};

const SOURCE_LABEL: Record<string, string> = {
	subscription_fee: 'Taxa de assinatura',
	link_purchase: 'Compra via link',
	plan_grant: 'Voxxys do plano',
	link_tool_use: 'Uso de ferramenta',
};

const reais = (cents: number) => Math.round(cents) / 100;
const fmtBRL = (cents: number) =>
	reais(cents).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (iso: string) =>
	new Date(iso).toLocaleString('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
const fmtRate = (bps: number | null | undefined) =>
	bps == null ? '' : `${(bps / 100).toLocaleString('pt-BR')}%`;
const stamp = () => new Date().toISOString().slice(0, 10);

/** Números derivados comuns aos dois formatos. */
function derive(inv: CompanyInvoice) {
	const t = inv.totals;
	const gross = t.gross_revenue_cents ?? 0;
	const net = t.company_net_cents ?? 0;
	const repasse = gross > 0 ? gross - net : (t.open_cents ?? 0);
	const margin = gross > 0 ? (net / gross) * 100 : 0;
	const vx = inv.voxxy_lastro;
	return { t, gross, net, repasse, margin, vx };
}

function periodLabel(meta: FinanceExportMeta) {
	return `${meta.from || 'início'} → ${meta.to || 'hoje'}`;
}

/* ── Excel (.xlsx) ────────────────────────────────────────────────────────── */

export async function exportFinanceiroExcel(
	inv: CompanyInvoice,
	meta: FinanceExportMeta,
): Promise<void> {
	const XLSX = await import('xlsx');
	const { t, gross, net, repasse, margin, vx } = derive(inv);
	const wb = XLSX.utils.book_new();
	const add = (name: string, rows: (string | number)[][]) =>
		XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), name);

	add('Resumo', [
		['Financeiro — Profissão Laser'],
		['Gerado em', meta.generatedAt],
		['Período', periodLabel(meta)],
		[],
		['Indicador', 'Valor (R$)'],
		['Receita bruta', reais(gross)],
		['Fatura upvox (repasse)', reais(repasse)],
		['Líquido da empresa', reais(net)],
		['Margem (%)', Number(margin.toFixed(1))],
		[],
		['Composição do repasse', 'Valor (R$)'],
		['Voxxys do plano', reais(t.plan_grants_cents ?? 0)],
		['Compras via link (100%)', reais(t.link_purchases_cents ?? 0)],
		['Assinaturas (3,5%)', reais(t.subscription_fees_cents ?? 0)],
		['Ferramentas', reais(t.tools_cents ?? 0)],
		['Voxxy comprado (50%)', reais(t.vox_purchase_use_cents ?? 0)],
	]);

	add('Mensal', [
		['Mês', 'Bruta (R$)', 'Repasse (R$)', 'Líquido (R$)'],
		...inv.monthly.map((m) => [
			m.month,
			reais(m.gross_cents),
			reais(m.repasse_cents),
			reais(m.net_cents),
		]),
	]);

	add('Top clientes', [
		['Cliente', 'Email', 'Bruta (R$)', 'Repasse (R$)', 'Líquido (R$)'],
		...inv.top_customers.map((c) => [
			c.customer_name ?? '',
			c.customer_email ?? '',
			reais(c.gross_cents),
			reais(c.repasse_cents),
			reais(c.net_cents),
		]),
	]);

	add('Lastro Voxxys', [
		['Lastro de Voxxys (apenas voxxys comprados em pacote)'],
		[],
		['Indicador', 'Valor (R$)'],
		['Vendido', reais(vx?.sold_cents ?? 0)],
		['Usado (valor)', reais(vx?.used_value_cents ?? 0)],
		['upvox (50%)', reais(vx?.upvox_share_cents ?? 0)],
		['Empresa (50%)', reais(vx?.company_share_cents ?? 0)],
		['Lastro (não usados)', reais(vx?.lastro_cents ?? 0)],
		[],
		[
			'Cliente',
			'Email',
			'Comprou (R$)',
			'Usou (R$)',
			'Lastro (R$)',
			'Ganho (R$)',
		],
		...(vx?.per_customer ?? []).map((c) => [
			c.customer_name ?? '',
			c.customer_email ?? '',
			reais(c.sold_cents),
			reais(c.used_value_cents),
			reais(c.lastro_cents),
			reais(c.company_share_cents),
		]),
	]);

	add('Extrato', [
		['Data', 'Cliente', 'Origem', 'Base (R$)', 'Taxa', 'Voxxys', 'Valor (R$)'],
		...inv.entries.map((e) => [
			fmtDate(e.created_at),
			e.customer_name ?? e.customer_email ?? '',
			SOURCE_LABEL[e.source] ?? e.source,
			e.base_amount_cents != null ? reais(e.base_amount_cents) : '',
			fmtRate(e.rate_bps),
			e.voxes_spent || '',
			reais(e.amount_cents),
		]),
	]);

	XLSX.writeFile(wb, `financeiro-${stamp()}.xlsx`);
}

/* ── PDF ──────────────────────────────────────────────────────────────────── */

const VIOLET: [number, number, number] = [124, 58, 237];

export async function exportFinanceiroPdf(
	inv: CompanyInvoice,
	meta: FinanceExportMeta,
): Promise<void> {
	const { jsPDF } = await import('jspdf');
	const autoTable = (await import('jspdf-autotable')).default;
	const { t, gross, net, repasse, margin, vx } = derive(inv);

	const doc = new jsPDF({ unit: 'pt', format: 'a4' });
	const finalY = () =>
		(doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
			.finalY;

	doc.setFontSize(16);
	doc.text('Financeiro — Profissão Laser', 40, 44);
	doc.setFontSize(9);
	doc.setTextColor(110);
	doc.text(
		`Período: ${periodLabel(meta)}  ·  Gerado em ${meta.generatedAt}`,
		40,
		60,
	);
	doc.setTextColor(0);

	const section = (
		title: string,
		head: string[],
		body: (string | number)[][],
	) => {
		autoTable(doc, {
			startY: finalY() + 18,
			head: [head],
			body,
			theme: 'grid',
			styles: { fontSize: 8, cellPadding: 4 },
			headStyles: { fillColor: VIOLET, fontSize: 8 },
			margin: { left: 40, right: 40 },
			didDrawPage: () => {
				doc.setFontSize(11);
				doc.text(title, 40, finalY() ? finalY() + 14 : 80);
			},
		});
	};

	// Resumo
	autoTable(doc, {
		startY: 76,
		head: [['Indicador', 'Valor']],
		body: [
			['Receita bruta', fmtBRL(gross)],
			['Fatura upvox (repasse)', fmtBRL(repasse)],
			['Líquido da empresa', fmtBRL(net)],
			[
				'Margem',
				`${margin.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`,
			],
		],
		theme: 'grid',
		styles: { fontSize: 9, cellPadding: 5 },
		headStyles: { fillColor: VIOLET },
		margin: { left: 40, right: 40 },
	});

	section(
		'Composição do repasse à upvox',
		['Origem', 'Valor'],
		[
			['Voxxys do plano', fmtBRL(t.plan_grants_cents ?? 0)],
			['Compras via link (100%)', fmtBRL(t.link_purchases_cents ?? 0)],
			['Assinaturas (3,5%)', fmtBRL(t.subscription_fees_cents ?? 0)],
			['Ferramentas', fmtBRL(t.tools_cents ?? 0)],
			['Voxxy comprado (50%)', fmtBRL(t.vox_purchase_use_cents ?? 0)],
		],
	);

	if (inv.monthly.length > 0) {
		section(
			'Resumo por mês',
			['Mês', 'Bruta', 'Repasse', 'Líquido'],
			inv.monthly.map((m) => [
				m.month,
				fmtBRL(m.gross_cents),
				fmtBRL(m.repasse_cents),
				fmtBRL(m.net_cents),
			]),
		);
	}

	if (inv.top_customers.length > 0) {
		section(
			'Top clientes por receita',
			['Cliente', 'Bruta', 'Repasse', 'Líquido'],
			inv.top_customers.map((c) => [
				c.customer_name ?? c.customer_email ?? '—',
				fmtBRL(c.gross_cents),
				fmtBRL(c.repasse_cents),
				fmtBRL(c.net_cents),
			]),
		);
	}

	// Lastro Voxxys
	section(
		'Lastro de Voxxys (apenas voxxys comprados)',
		['Indicador', 'Valor'],
		[
			['Vendido', fmtBRL(vx?.sold_cents ?? 0)],
			['Usado (valor)', fmtBRL(vx?.used_value_cents ?? 0)],
			['upvox (50%)', fmtBRL(vx?.upvox_share_cents ?? 0)],
			['Empresa (50%)', fmtBRL(vx?.company_share_cents ?? 0)],
			['Lastro (não usados)', fmtBRL(vx?.lastro_cents ?? 0)],
		],
	);
	if ((vx?.per_customer ?? []).length > 0) {
		section(
			'Lastro por cliente',
			['Cliente', 'Comprou', 'Usou', 'Lastro', 'Ganho'],
			(vx?.per_customer ?? []).map((c) => [
				c.customer_name ?? c.customer_email ?? '—',
				fmtBRL(c.sold_cents),
				fmtBRL(c.used_value_cents),
				fmtBRL(c.lastro_cents),
				fmtBRL(c.company_share_cents),
			]),
		);
	}

	if (inv.entries.length > 0) {
		section(
			'Extrato detalhado',
			['Data', 'Cliente', 'Origem', 'Base', 'Taxa', 'Voxxys', 'Valor'],
			inv.entries.map((e) => [
				fmtDate(e.created_at),
				e.customer_name ?? e.customer_email ?? '—',
				SOURCE_LABEL[e.source] ?? e.source,
				e.base_amount_cents != null ? fmtBRL(e.base_amount_cents) : '—',
				fmtRate(e.rate_bps) || '—',
				e.voxes_spent ? String(e.voxes_spent) : '—',
				fmtBRL(e.amount_cents),
			]),
		);
	}

	doc.save(`financeiro-${stamp()}.pdf`);
}
