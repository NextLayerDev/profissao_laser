import type { LucideIcon } from 'lucide-react';
import { FileText, ImageIcon } from 'lucide-react';

export function formatFileSize(bytes?: number): string {
	if (bytes == null || bytes === 0) return '—';
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(mimeType: string): LucideIcon {
	const t = mimeType.toLowerCase();
	if (t.includes('pdf')) return FileText;
	if (
		t.includes('image') ||
		t.includes('svg') ||
		t.includes('png') ||
		t.includes('jpg') ||
		t.includes('jpeg') ||
		t.includes('webp') ||
		t.includes('gif')
	)
		return ImageIcon;
	return FileText;
}

export function getFileTypeLabel(mimeType: string): string {
	const t = mimeType.toLowerCase();
	if (t.includes('pdf')) return 'PDF';
	if (t.includes('svg')) return 'SVG';
	if (t.includes('png')) return 'PNG';
	if (t.includes('jpg') || t.includes('jpeg')) return 'JPG';
	if (t.includes('webp')) return 'WebP';
	if (t.includes('gif')) return 'GIF';
	return 'Ficheiro';
}
