'use client';

import { useParams } from 'next/navigation';
import { CanvaEditor } from '@/components/canva-editor';

export default function DesignEditorPage() {
	const { id } = useParams<{ id: string }>();
	// Abre pra todo aluno, com ou sem plano: o uso do ai_canvas é cobrado em
	// voxxys dentro do próprio editor.
	return <CanvaEditor designId={id} />;
}
