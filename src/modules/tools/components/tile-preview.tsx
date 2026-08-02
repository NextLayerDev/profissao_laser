'use client';

/**
 * Prévia de textura repetível: o mesmo PNG repetido num quadro N×N.
 *
 * `background-repeat` faz o trabalho — custo zero de banda (uma imagem só) e
 * zero de CPU. E o ponto não é decorativo: o `makeTileable` FECHA a costura
 * (medido), mas em veio longo e reto o espelhamento pode formar "borboletas"
 * simétricas no meio do ladrilho. Isso é julgamento visual, não métrica. Então
 * a tela mostra o resultado repetido e deixa a pessoa decidir, em vez de
 * prometer que ficou invisível.
 */
export function TilePreview({
	url,
	repeat = 3,
	className = '',
}: {
	url: string;
	repeat?: number;
	className?: string;
}) {
	const n = Math.max(2, Math.min(6, repeat));
	return (
		<div className={`space-y-2 ${className}`}>
			<div
				className="aspect-square w-full overflow-hidden rounded-xl border border-slate-200 dark:border-white/10"
				style={{
					backgroundImage: `url("${url}")`,
					backgroundRepeat: 'repeat',
					// `100%/n` = exatamente n ladrilhos por lado.
					backgroundSize: `${100 / n}% ${100 / n}%`,
				}}
			/>
			<p className="text-xs text-slate-500 dark:text-gray-400">
				Repetida {n}×{n}. Olhe as emendas: se aparecer um espelho no meio do
				ladrilho, gere de novo com uma textura menos direcional.
			</p>
		</div>
	);
}
