/**
 * Gerador de .xlsx (OOXML) SEM dependências — abre nativamente no Excel, Google
 * Sheets e Apple Numbers (ao contrário do SpreadsheetML 2003 `.xls`, que o macOS
 * não abre). Monta um ZIP pelo método STORE (sem compressão) com CRC32 próprio.
 *
 * Uso: `downloadXlsx('arquivo.xlsx', [{ name: 'Aba', rows: [['a', 1], ...] }])`.
 * Células `number` viram numéricas; o resto vira texto (inlineStr).
 */

export type XlsxCell = string | number;
export type XlsxSheet = { name: string; rows: XlsxCell[][] };

// ── CRC32 (tabela pré-computada) ────────────────────────────────────────────
const CRC_TABLE = (() => {
	const t = new Uint32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		t[n] = c >>> 0;
	}
	return t;
})();

function crc32(bytes: Uint8Array): number {
	let c = 0xffffffff;
	for (let i = 0; i < bytes.length; i++)
		c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
}

// ── ZIP (STORE, sem compressão) ─────────────────────────────────────────────
type ZipEntry = { name: string; data: Uint8Array };

function zipStore(entries: ZipEntry[]): Uint8Array {
	const enc = new TextEncoder();
	const local: Uint8Array[] = [];
	const central: Uint8Array[] = [];
	let offset = 0;

	for (const e of entries) {
		const nameBytes = enc.encode(e.name);
		const crc = crc32(e.data);
		const size = e.data.length;

		const lh = new DataView(new ArrayBuffer(30));
		lh.setUint32(0, 0x04034b50, true); // local file header sig
		lh.setUint16(4, 20, true); // version needed
		lh.setUint16(6, 0, true); // flags
		lh.setUint16(8, 0, true); // method 0 = store
		lh.setUint16(10, 0, true); // mod time
		lh.setUint16(12, 0x21, true); // mod date (1980-01-01)
		lh.setUint32(14, crc, true);
		lh.setUint32(18, size, true); // compressed size
		lh.setUint32(22, size, true); // uncompressed size
		lh.setUint16(26, nameBytes.length, true);
		lh.setUint16(28, 0, true); // extra length
		const lhBytes = new Uint8Array(lh.buffer);
		local.push(lhBytes, nameBytes, e.data);

		const ch = new DataView(new ArrayBuffer(46));
		ch.setUint32(0, 0x02014b50, true); // central dir header sig
		ch.setUint16(4, 20, true); // version made by
		ch.setUint16(6, 20, true); // version needed
		ch.setUint16(8, 0, true);
		ch.setUint16(10, 0, true); // method
		ch.setUint16(12, 0, true);
		ch.setUint16(14, 0x21, true);
		ch.setUint32(16, crc, true);
		ch.setUint32(20, size, true);
		ch.setUint32(24, size, true);
		ch.setUint16(28, nameBytes.length, true);
		ch.setUint16(30, 0, true); // extra
		ch.setUint16(32, 0, true); // comment
		ch.setUint16(34, 0, true); // disk
		ch.setUint16(36, 0, true); // internal attrs
		ch.setUint32(38, 0, true); // external attrs
		ch.setUint32(42, offset, true); // local header offset
		central.push(new Uint8Array(ch.buffer), nameBytes);

		offset += lhBytes.length + nameBytes.length + size;
	}

	const centralSize = central.reduce((a, c) => a + c.length, 0);
	const eocd = new DataView(new ArrayBuffer(22));
	eocd.setUint32(0, 0x06054b50, true); // EOCD sig
	eocd.setUint16(4, 0, true);
	eocd.setUint16(6, 0, true);
	eocd.setUint16(8, entries.length, true);
	eocd.setUint16(10, entries.length, true);
	eocd.setUint32(12, centralSize, true);
	eocd.setUint32(16, offset, true); // central dir offset
	eocd.setUint16(20, 0, true);

	const parts = [...local, ...central, new Uint8Array(eocd.buffer)];
	const total = parts.reduce((a, p) => a + p.length, 0);
	const out = new Uint8Array(total);
	let p = 0;
	for (const part of parts) {
		out.set(part, p);
		p += part.length;
	}
	return out;
}

// ── XLSX (OOXML mínimo: workbook + worksheets, sem styles/sharedStrings) ──────
const escXml = (v: unknown): string =>
	String(v ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');

function colRef(i: number): string {
	let s = '';
	let n = i + 1;
	while (n > 0) {
		const m = (n - 1) % 26;
		s = String.fromCharCode(65 + m) + s;
		n = Math.floor((n - 1) / 26);
	}
	return s;
}

function sheetXml(rows: XlsxCell[][]): string {
	const body = rows
		.map((r, ri) => {
			const cells = r
				.map((c, ci) => {
					const ref = `${colRef(ci)}${ri + 1}`;
					if (typeof c === 'number' && Number.isFinite(c))
						return `<c r="${ref}"><v>${c}</v></c>`;
					return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escXml(c)}</t></is></c>`;
				})
				.join('');
			return `<row r="${ri + 1}">${cells}</row>`;
		})
		.join('');
	return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`;
}

const sanitizeName = (n: string): string =>
	n.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Planilha';

/** Constrói o blob .xlsx a partir das abas. */
export function buildXlsx(sheets: XlsxSheet[]): Uint8Array {
	const enc = new TextEncoder();
	const names = sheets.map((s) => sanitizeName(s.name));

	const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets
		.map(
			(_, i) =>
				`<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
		)
		.join('')}</Types>`;

	const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;

	const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names
		.map(
			(n, i) =>
				`<sheet name="${escXml(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
		)
		.join('')}</sheets></workbook>`;

	const wbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets
		.map(
			(_, i) =>
				`<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
		)
		.join('')}</Relationships>`;

	const entries: ZipEntry[] = [
		{ name: '[Content_Types].xml', data: enc.encode(contentTypes) },
		{ name: '_rels/.rels', data: enc.encode(rootRels) },
		{ name: 'xl/workbook.xml', data: enc.encode(workbook) },
		{ name: 'xl/_rels/workbook.xml.rels', data: enc.encode(wbRels) },
		...sheets.map((s, i) => ({
			name: `xl/worksheets/sheet${i + 1}.xml`,
			data: enc.encode(sheetXml(s.rows)),
		})),
	];
	return zipStore(entries);
}

/** Gera e baixa o .xlsx no navegador. */
export function downloadXlsx(filename: string, sheets: XlsxSheet[]): void {
	const bytes = buildXlsx(sheets);
	const blob = new Blob([bytes as BlobPart], {
		type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
