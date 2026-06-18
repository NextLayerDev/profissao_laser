/**
 * Exporta o Financeiro completo (totais, composição, mensal, top clientes,
 * lastro de voxxys e extrato) em Excel e PDF — SEM dependências externas:
 * - Excel: SpreadsheetML 2003 (.xls), multi-aba, gerado como string XML.
 * - PDF: relatório HTML estilizado aberto numa janela com print → "Salvar como PDF".
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

function derive(inv: CompanyInvoice) {
	const t = inv.totals;
	const gross = t.gross_revenue_cents ?? 0;
	const net = t.company_net_cents ?? 0;
	const repasse = gross > 0 ? gross - net : (t.open_cents ?? 0);
	const margin = gross > 0 ? (net / gross) * 100 : 0;
	const vx = inv.voxxy_lastro;
	return { t, gross, net, repasse, margin, vx };
}

const periodLabel = (meta: FinanceExportMeta) =>
	`${meta.from || 'início'} → ${meta.to || 'hoje'}`;

function esc(v: unknown): string {
	return String(v ?? '').replace(/[<>&"']/g, (c) => {
		switch (c) {
			case '<':
				return '&lt;';
			case '>':
				return '&gt;';
			case '&':
				return '&amp;';
			case '"':
				return '&quot;';
			default:
				return '&apos;';
		}
	});
}

function download(filename: string, content: string, mime: string) {
	const blob = new Blob([content], { type: `${mime};charset=utf-8` });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ── Excel (SpreadsheetML 2003, multi-aba, sem lib) ───────────────────────── */

type Row = (string | number)[];

function xmlCell(v: string | number): string {
	const isNum = typeof v === 'number' && Number.isFinite(v);
	return `<Cell><Data ss:Type="${isNum ? 'Number' : 'String'}">${esc(v)}</Data></Cell>`;
}
function xmlSheet(name: string, rows: Row[]): string {
	const safe = name.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31);
	const body = rows
		.map((r) => `<Row>${r.map(xmlCell).join('')}</Row>`)
		.join('');
	return `<Worksheet ss:Name="${esc(safe)}"><Table>${body}</Table></Worksheet>`;
}

export async function exportFinanceiroExcel(
	inv: CompanyInvoice,
	meta: FinanceExportMeta,
): Promise<void> {
	const { t, gross, net, repasse, margin, vx } = derive(inv);

	const sheets = [
		xmlSheet('Resumo', [
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
		]),
		xmlSheet('Mensal', [
			['Mês', 'Bruta (R$)', 'Repasse (R$)', 'Líquido (R$)'],
			...inv.monthly.map((m) => [
				m.month,
				reais(m.gross_cents),
				reais(m.repasse_cents),
				reais(m.net_cents),
			]),
		]),
		xmlSheet('Top clientes', [
			['Cliente', 'Email', 'Bruta (R$)', 'Repasse (R$)', 'Líquido (R$)'],
			...inv.top_customers.map((c) => [
				c.customer_name ?? '',
				c.customer_email ?? '',
				reais(c.gross_cents),
				reais(c.repasse_cents),
				reais(c.net_cents),
			]),
		]),
		xmlSheet('Lastro Voxxys', [
			['Indicador', 'Valor (R$)'],
			['Vendido', reais(vx?.sold_cents ?? 0)],
			['Usado (valor)', reais(vx?.used_value_cents ?? 0)],
			['upvox (50%)', reais(vx?.upvox_share_cents ?? 0)],
			['Empresa (50%)', reais(vx?.company_share_cents ?? 0)],
			['Lastro (não usados)', reais(vx?.lastro_cents ?? 0)],
			[],
			['Cliente', 'Email', 'Comprou', 'Usou', 'Lastro', 'Ganho'],
			...(vx?.per_customer ?? []).map((c) => [
				c.customer_name ?? '',
				c.customer_email ?? '',
				reais(c.sold_cents),
				reais(c.used_value_cents),
				reais(c.lastro_cents),
				reais(c.company_share_cents),
			]),
		]),
		xmlSheet('Extrato', [
			[
				'Data',
				'Cliente',
				'Origem',
				'Base (R$)',
				'Taxa',
				'Voxxys',
				'Valor (R$)',
			],
			...inv.entries.map((e) => [
				fmtDate(e.created_at),
				e.customer_name ?? e.customer_email ?? '',
				SOURCE_LABEL[e.source] ?? e.source,
				e.base_amount_cents != null ? reais(e.base_amount_cents) : '',
				fmtRate(e.rate_bps),
				e.voxes_spent || '',
				reais(e.amount_cents),
			]),
		]),
	].join('');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${sheets}</Workbook>`;
	download(`financeiro-${stamp()}.xls`, xml, 'application/vnd.ms-excel');
}

/* ── PDF (relatório HTML → print → "Salvar como PDF", sem lib) ─────────────── */

function htmlTable(head: string[], body: Row[]): string {
	const th = head.map((h) => `<th>${esc(h)}</th>`).join('');
	const rows = body
		.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
		.join('');
	return `<table><thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table>`;
}

export async function exportFinanceiroPdf(
	inv: CompanyInvoice,
	meta: FinanceExportMeta,
): Promise<void> {
	const { t, gross, net, repasse, margin, vx } = derive(inv);

	const sections: string[] = [
		`<h2>Composição do repasse à upvox</h2>${htmlTable(
			['Origem', 'Valor'],
			[
				['Voxxys do plano', fmtBRL(t.plan_grants_cents ?? 0)],
				['Compras via link (100%)', fmtBRL(t.link_purchases_cents ?? 0)],
				['Assinaturas (3,5%)', fmtBRL(t.subscription_fees_cents ?? 0)],
				['Ferramentas', fmtBRL(t.tools_cents ?? 0)],
				['Voxxy comprado (50%)', fmtBRL(t.vox_purchase_use_cents ?? 0)],
			],
		)}`,
	];
	if (inv.monthly.length > 0) {
		sections.push(
			`<h2>Resumo por mês</h2>${htmlTable(
				['Mês', 'Bruta', 'Repasse', 'Líquido'],
				inv.monthly.map((m) => [
					m.month,
					fmtBRL(m.gross_cents),
					fmtBRL(m.repasse_cents),
					fmtBRL(m.net_cents),
				]),
			)}`,
		);
	}
	if (inv.top_customers.length > 0) {
		sections.push(
			`<h2>Top clientes por receita</h2>${htmlTable(
				['Cliente', 'Bruta', 'Repasse', 'Líquido'],
				inv.top_customers.map((c) => [
					c.customer_name ?? c.customer_email ?? '—',
					fmtBRL(c.gross_cents),
					fmtBRL(c.repasse_cents),
					fmtBRL(c.net_cents),
				]),
			)}`,
		);
	}
	sections.push(
		`<h2>Lastro de Voxxys (apenas voxxys comprados)</h2>${htmlTable(
			['Indicador', 'Valor'],
			[
				['Vendido', fmtBRL(vx?.sold_cents ?? 0)],
				['Usado (valor)', fmtBRL(vx?.used_value_cents ?? 0)],
				['upvox (50%)', fmtBRL(vx?.upvox_share_cents ?? 0)],
				['Empresa (50%)', fmtBRL(vx?.company_share_cents ?? 0)],
				['Lastro (não usados)', fmtBRL(vx?.lastro_cents ?? 0)],
			],
		)}`,
	);
	if ((vx?.per_customer ?? []).length > 0) {
		sections.push(
			`<h2>Lastro por cliente</h2>${htmlTable(
				['Cliente', 'Comprou', 'Usou', 'Lastro', 'Ganho'],
				(vx?.per_customer ?? []).map((c) => [
					c.customer_name ?? c.customer_email ?? '—',
					fmtBRL(c.sold_cents),
					fmtBRL(c.used_value_cents),
					fmtBRL(c.lastro_cents),
					fmtBRL(c.company_share_cents),
				]),
			)}`,
		);
	}
	if (inv.entries.length > 0) {
		sections.push(
			`<h2>Extrato detalhado</h2>${htmlTable(
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
			)}`,
		);
	}

	const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Financeiro</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #1e293b; margin: 32px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .meta { color: #64748b; font-size: 12px; margin-bottom: 16px; }
  .kpis { display: flex; gap: 12px; margin-bottom: 20px; }
  .kpi { flex: 1; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
  .kpi .lbl { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #7c3aed; font-weight: 700; }
  .kpi .val { font-size: 20px; font-weight: 700; margin-top: 4px; }
  h2 { font-size: 13px; margin: 22px 0 8px; color: #334155; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #7c3aed; color: #fff; text-align: left; padding: 6px 8px; }
  td { border: 1px solid #e2e8f0; padding: 5px 8px; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  @media print { body { margin: 12px; } h2 { page-break-after: avoid; } table { page-break-inside: auto; } tr { page-break-inside: avoid; } }
</style></head><body>
  <h1>Financeiro — Profissão Laser</h1>
  <div class="meta">Período: ${esc(periodLabel(meta))} · Gerado em ${esc(meta.generatedAt)}</div>
  <div class="kpis">
    <div class="kpi"><div class="lbl">Receita bruta</div><div class="val">${esc(fmtBRL(gross))}</div></div>
    <div class="kpi"><div class="lbl">Fatura upvox</div><div class="val">${esc(fmtBRL(repasse))}</div></div>
    <div class="kpi"><div class="lbl">Líquido (margem ${margin.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%)</div><div class="val">${esc(fmtBRL(net))}</div></div>
  </div>
  ${sections.join('')}
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };</script>
</body></html>`;

	const w = window.open('', '_blank');
	if (!w) {
		// Pop-up bloqueado: baixa o HTML pra o usuário abrir/imprimir.
		download(`financeiro-${stamp()}.html`, html, 'text/html');
		return;
	}
	w.document.open();
	w.document.write(html);
	w.document.close();
}
