'use client';

import { Box, Grid3x3, Maximize2, RotateCw, Split } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import type * as ThreeNS from 'three';
// `import type` é APAGADO na compilação: dá tipos do three sem colocar uma
// única linha dele no bundle. O runtime entra só pelo `await import('three')`
// lá dentro do efeito.
import type { OrbitControls as OrbitControlsType } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Visualizador 3D da montagem: extruda cada peça do JSON de `assembly.ts` e põe
 * o cliente para girar a peça antes de mandar cortar.
 *
 * REGRA DE BUNDLE, e ela não é negociável: `three` só pode entrar por
 * `await import('three')` DENTRO do componente. Um único `import * as THREE`
 * no topo de qualquer arquivo alcançável pelo Estúdio derruba ~180 KB gz no
 * bundle das ~100 tools publicadas — inclusive nas que nunca abrem 3D. Pela
 * mesma razão não existe `@react-three/fiber` aqui: são +90 KB de
 * react-reconciler para renderizar uma cena estática que não precisa de React.
 *
 * A montagem é Z-UP (a espessura extruda em +Z, herdado do plano do sketch),
 * enquanto o Three.js é Y-up por padrão. Por isso `camera.up = (0,0,1)` e o
 * grid nasce girado 90° em X. Sem esses dois ajustes o orbit gira "deitado" e a
 * peça aparece de lado.
 */

export interface AssemblyPart {
	id: string;
	label: string;
	thickness: number;
	material: string;
	outline: [number, number][];
	holes: [number, number][][];
	pose: { pos: [number, number, number]; rot: [number, number, number] };
}

export interface Assembly {
	units: 'mm';
	parts: AssemblyPart[];
	bbox?: { min: [number, number, number]; max: [number, number, number] };
}

interface Props {
	assembly?: Assembly | null;
	/** Material a usar nas peças que não declararam o seu. */
	materialHint?: string;
}

type MaterialKey = 'mdf' | 'acrilico' | 'aco' | 'corten';

const MATERIAIS: Record<
	MaterialKey,
	{ color: number; roughness: number; metalness: number; opacity: number }
> = {
	mdf: { color: 0xc8a165, roughness: 0.85, metalness: 0, opacity: 1 },
	acrilico: { color: 0xdbeafe, roughness: 0.12, metalness: 0, opacity: 0.45 },
	aco: { color: 0x9aa0a6, roughness: 0.35, metalness: 0.8, opacity: 1 },
	corten: { color: 0x8a4b2a, roughness: 0.9, metalness: 0.25, opacity: 1 },
};

/** Nome livre de material → família visual. Acento e caixa não importam. */
function chaveMaterial(bruto: string | undefined): MaterialKey {
	// NFD + remoção da faixa de acentos combinantes: "Aço" e "aco" caem no mesmo
	// material sem depender de como o admin digitou.
	const s = (bruto ?? '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();
	if (s.includes('acril') || s.includes('acryl') || s.includes('pmma'))
		return 'acrilico';
	if (s.includes('corten')) return 'corten';
	if (
		s.includes('aco') ||
		s.includes('inox') ||
		s.includes('steel') ||
		s.includes('alumin') ||
		s.includes('galvan') ||
		s.includes('metal')
	)
		return 'aco';
	return 'mdf';
}

/** Handles imperativos da cena: os botões falam com o three sem re-renderizar. */
interface CenaApi {
	setAutoRotate(v: boolean): void;
	setExplode(v: boolean): void;
	setWireframe(v: boolean): void;
	fit(): void;
}

function ModelScene({ assembly, materialHint }: Props) {
	const hostRef = useRef<HTMLDivElement>(null);
	const apiRef = useRef<CenaApi | null>(null);
	const estadoRef = useRef({
		girando: true,
		explodido: false,
		wireframe: false,
	});

	const [girando, setGirando] = useState(true);
	const [explodido, setExplodido] = useState(false);
	const [wireframe, setWireframe] = useState(false);
	const [erro, setErro] = useState<string | null>(null);
	const [carregando, setCarregando] = useState(true);
	const [dims, setDims] = useState<[number, number, number] | null>(null);

	const pecas = assembly?.parts?.length ?? 0;

	useEffect(() => {
		const host = hostRef.current;
		if (!host || !assembly || assembly.parts.length === 0) return;

		let cancelado = false;
		let descartar: (() => void) | null = null;
		setErro(null);
		setCarregando(true);

		void (async () => {
			let THREE: typeof ThreeNS;
			let OrbitControls: typeof OrbitControlsType;
			try {
				THREE = await import('three');
				({ OrbitControls } = await import(
					'three/examples/jsm/controls/OrbitControls.js'
				));
			} catch {
				if (!cancelado) {
					setErro('Não foi possível carregar o visualizador 3D.');
					setCarregando(false);
				}
				return;
			}
			if (cancelado) return;

			const largura = host.clientWidth || 640;
			const altura = host.clientHeight || 440;

			let renderer: ThreeNS.WebGLRenderer;
			try {
				renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
			} catch {
				if (!cancelado) {
					setErro(
						'Seu navegador não conseguiu abrir o 3D (WebGL indisponível). Use a prévia em 2D para conferir a peça.',
					);
					setCarregando(false);
				}
				return;
			}
			renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
			renderer.setSize(largura, altura);
			renderer.shadowMap.enabled = true;
			renderer.shadowMap.type = THREE.PCFSoftShadowMap;
			host.appendChild(renderer.domElement);

			const scene = new THREE.Scene();
			const grupo = new THREE.Group();
			scene.add(grupo);

			const geometrias: ThreeNS.BufferGeometry[] = [];
			const materiais = new Map<MaterialKey, ThreeNS.MeshStandardMaterial>();
			const montadas: {
				mesh: ThreeNS.Mesh;
				base: ThreeNS.Vector3;
				dir: ThreeNS.Vector3;
			}[] = [];
			const padrao = chaveMaterial(materialHint);

			for (const part of assembly.parts) {
				if (!Array.isArray(part.outline) || part.outline.length < 3) continue;

				const shape = new THREE.Shape(
					part.outline.map(([x, y]) => new THREE.Vector2(x, y)),
				);
				for (const furo of part.holes ?? []) {
					if (furo.length < 3) continue;
					shape.holes.push(
						new THREE.Path(furo.map(([x, y]) => new THREE.Vector2(x, y))),
					);
				}

				// Espessura 0 gera geometria degenerada (faces coincidentes, z-fighting
				// preto). 0,1 mm é invisível na tela e mantém o sólido válido.
				const espessura = Math.max(part.thickness || 0, 0.1);
				const geo = new THREE.ExtrudeGeometry(shape, {
					depth: espessura,
					bevelEnabled: false,
				});
				geometrias.push(geo);

				const chave = part.material ? chaveMaterial(part.material) : padrao;
				let mat = materiais.get(chave);
				if (!mat) {
					const spec = MATERIAIS[chave];
					mat = new THREE.MeshStandardMaterial({
						color: spec.color,
						roughness: spec.roughness,
						metalness: spec.metalness,
						transparent: spec.opacity < 1,
						opacity: spec.opacity,
						// Transparente precisa das faces internas, senão o acrílico fica
						// oco por dentro quando você olha através dele.
						side: spec.opacity < 1 ? THREE.DoubleSide : THREE.FrontSide,
					});
					mat.wireframe = estadoRef.current.wireframe;
					materiais.set(chave, mat);
				}

				const mesh = new THREE.Mesh(geo, mat);
				mesh.castShadow = true;
				mesh.receiveShadow = true;
				const pose = part.pose ?? { pos: [0, 0, 0], rot: [0, 0, 0] };
				mesh.position.set(pose.pos[0], pose.pos[1], pose.pos[2]);
				// Ordem 'ZYX' porque a pose do motor é R = Rz·Ry·Rx (vide assembly.ts).
				// Com o 'XYZ' padrão do Three as laterais da caixa viram para fora.
				mesh.rotation.set(pose.rot[0], pose.rot[1], pose.rot[2], 'ZYX');
				grupo.add(mesh);
				montadas.push({
					mesh,
					base: mesh.position.clone(),
					dir: new THREE.Vector3(),
				});
			}

			if (montadas.length === 0) {
				renderer.dispose();
				renderer.domElement.remove();
				if (!cancelado) {
					setErro('A montagem não trouxe nenhuma peça fechada para extrudar.');
					setCarregando(false);
				}
				return;
			}

			// Caixa medida DA CENA, não a `bbox` do JSON: assim o enquadramento está
			// certo mesmo que o gerador informe uma bbox errada ou não informe nada.
			const caixa = new THREE.Box3().setFromObject(grupo);
			const centro = caixa.getCenter(new THREE.Vector3());
			const tamanho = caixa.getSize(new THREE.Vector3());
			const raio = Math.max(tamanho.length() / 2, 1);
			const chao = caixa.min.z;

			for (const p of montadas) {
				const c = new THREE.Box3()
					.setFromObject(p.mesh)
					.getCenter(new THREE.Vector3());
				p.dir.copy(c).sub(centro);
				// Peça exatamente no centro (fundo de caixa) não tem direção de fuga:
				// manda para cima, senão ela fica parada e a explosão parece bugada.
				if (p.dir.lengthSq() < 1e-6) p.dir.set(0, 0, 1);
				p.dir.normalize();
			}

			scene.add(new THREE.HemisphereLight(0xffffff, 0x2b313a, 2));
			const sol = new THREE.DirectionalLight(0xffffff, 2.4);
			sol.position
				.copy(centro)
				.add(new THREE.Vector3(-raio * 1.2, -raio * 1.6, raio * 2.2));
			sol.target.position.copy(centro);
			sol.castShadow = true;
			sol.shadow.mapSize.set(1024, 1024);
			const camSombra = sol.shadow.camera;
			camSombra.left = -raio * 1.7;
			camSombra.right = raio * 1.7;
			camSombra.top = raio * 1.7;
			camSombra.bottom = -raio * 1.7;
			camSombra.near = 0.1;
			camSombra.far = raio * 10;
			camSombra.updateProjectionMatrix();
			scene.add(sol);
			scene.add(sol.target);

			// Grid em mm: célula de 10 mm é a régua mental de quem corta a laser.
			const passo = 10;
			const extensao = Math.max(
				Math.ceil((raio * 3) / passo) * passo,
				passo * 4,
			);
			const grid = new THREE.GridHelper(
				extensao,
				extensao / passo,
				0x94a3b8,
				0xdbe1ea,
			);
			grid.rotation.x = Math.PI / 2; // GridHelper nasce no plano XZ (Y-up)
			grid.position.set(centro.x, centro.y, chao);
			scene.add(grid);

			// Plano só para RECEBER sombra: sem ele a peça flutua sem contato com o
			// chão e a leitura de profundidade some.
			const sombraGeo = new THREE.PlaneGeometry(extensao, extensao);
			const sombraMat = new THREE.ShadowMaterial({ opacity: 0.18 });
			const sombra = new THREE.Mesh(sombraGeo, sombraMat);
			sombra.position.set(centro.x, centro.y, chao - 0.02);
			sombra.receiveShadow = true;
			scene.add(sombra);

			const camera = new THREE.PerspectiveCamera(42, largura / altura, 0.1, 1);
			camera.up.set(0, 0, 1);

			const controls = new OrbitControls(camera, renderer.domElement);
			controls.enableDamping = true;
			controls.dampingFactor = 0.08;
			controls.autoRotateSpeed = 1.6;
			controls.autoRotate = estadoRef.current.girando;

			const enquadrar = () => {
				const dist = (raio / Math.sin((camera.fov * Math.PI) / 360)) * 1.18;
				const dir = new THREE.Vector3(1, -1, 0.75).normalize();
				camera.position.copy(centro).addScaledVector(dir, dist);
				camera.near = Math.max(dist / 1000, 0.01);
				camera.far = dist * 12;
				camera.updateProjectionMatrix();
				controls.target.copy(centro);
				controls.update();
			};
			enquadrar();

			let explosao = estadoRef.current.explodido ? 1 : 0;
			let alvo = explosao;
			const aplicaExplosao = () => {
				for (const p of montadas) {
					p.mesh.position
						.copy(p.base)
						.addScaledVector(p.dir, explosao * raio * 0.55);
				}
			};
			aplicaExplosao();

			let raf = 0;
			const loop = () => {
				raf = requestAnimationFrame(loop);
				if (explosao !== alvo) {
					explosao += (alvo - explosao) * 0.15;
					if (Math.abs(alvo - explosao) < 0.001) explosao = alvo;
					aplicaExplosao();
				}
				controls.update();
				renderer.render(scene, camera);
			};
			raf = requestAnimationFrame(loop);

			const ro = new ResizeObserver(() => {
				const w = host.clientWidth || 1;
				const h = host.clientHeight || 1;
				camera.aspect = w / h;
				camera.updateProjectionMatrix();
				renderer.setSize(w, h);
			});
			ro.observe(host);

			apiRef.current = {
				setAutoRotate: (v) => {
					controls.autoRotate = v;
				},
				setExplode: (v) => {
					alvo = v ? 1 : 0;
				},
				setWireframe: (v) => {
					for (const m of materiais.values()) m.wireframe = v;
				},
				fit: enquadrar,
			};

			// CLEANUP: cada mudança de parâmetro recria a cena inteira. Sem soltar
			// GPU aqui o Chrome derruba o contexto WebGL mais antigo depois de ~16
			// recriações e o preview simplesmente fica preto — sem erro no console.
			descartar = () => {
				cancelAnimationFrame(raf);
				ro.disconnect();
				controls.dispose();
				for (const g of geometrias) g.dispose();
				for (const m of materiais.values()) m.dispose();
				sombraGeo.dispose();
				sombraMat.dispose();
				grid.geometry.dispose();
				const gm = grid.material;
				if (Array.isArray(gm)) {
					for (const m of gm) m.dispose();
				} else {
					gm.dispose();
				}
				renderer.dispose();
				renderer.domElement.remove();
				apiRef.current = null;
			};

			if (cancelado) {
				descartar();
				return;
			}
			setDims([tamanho.x, tamanho.y, tamanho.z]);
			setCarregando(false);
		})();

		return () => {
			cancelado = true;
			descartar?.();
		};
	}, [assembly, materialHint]);

	const alternarGiro = () => {
		const n = !girando;
		setGirando(n);
		estadoRef.current.girando = n;
		apiRef.current?.setAutoRotate(n);
	};

	const alternarExplosao = () => {
		const n = !explodido;
		setExplodido(n);
		estadoRef.current.explodido = n;
		apiRef.current?.setExplode(n);
	};

	const alternarWireframe = () => {
		const n = !wireframe;
		setWireframe(n);
		estadoRef.current.wireframe = n;
		apiRef.current?.setWireframe(n);
	};

	if (!assembly || pecas === 0) {
		return <Aviso texto="Gere a peça para ver o modelo 3D da montagem." />;
	}

	if (erro) return <Aviso texto={erro} />;

	const botao =
		'rounded-lg border border-slate-200 bg-white/90 p-1.5 backdrop-blur transition-colors dark:border-white/10 dark:bg-black/50';
	const ativo = 'ring-2 ring-[var(--screen-accent,#7c3aed)]';

	return (
		<div className="space-y-0">
			<div className="relative h-[clamp(360px,62vh,720px)] w-full overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100 shadow-xl shadow-slate-900/5 dark:border-white/10 dark:from-[#15171b] dark:to-[#0e0f12] dark:shadow-black/40">
				<div ref={hostRef} className="absolute inset-0 [&>canvas]:block" />

				{carregando ? (
					<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
						<p className="rounded-full bg-white/85 px-3 py-1 text-xs text-slate-500 backdrop-blur dark:bg-black/60 dark:text-gray-400">
							Montando o modelo 3D…
						</p>
					</div>
				) : null}

				<div className="absolute left-3 top-3 flex gap-1">
					<button
						type="button"
						aria-label={girando ? 'Parar giro' : 'Girar'}
						aria-pressed={girando}
						onClick={alternarGiro}
						className={`${botao} ${girando ? ativo : ''}`}
					>
						<RotateCw className="h-3.5 w-3.5" />
					</button>
					<button
						type="button"
						aria-label="Explodir montagem"
						aria-pressed={explodido}
						onClick={alternarExplosao}
						className={`${botao} ${explodido ? ativo : ''}`}
					>
						<Split className="h-3.5 w-3.5" />
					</button>
					<button
						type="button"
						aria-label="Wireframe"
						aria-pressed={wireframe}
						onClick={alternarWireframe}
						className={`${botao} ${wireframe ? ativo : ''}`}
					>
						<Grid3x3 className="h-3.5 w-3.5" />
					</button>
					<button
						type="button"
						aria-label="Enquadrar"
						onClick={() => apiRef.current?.fit()}
						className={botao}
					>
						<Maximize2 className="h-3.5 w-3.5" />
					</button>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-200 px-1 py-2 font-mono text-[11px] tabular-nums text-slate-500 dark:border-white/10">
				<span>
					{pecas} {pecas === 1 ? 'peça' : 'peças'}
				</span>
				{dims ? (
					<span>
						· {Math.round(dims[0])} × {Math.round(dims[1])} ×{' '}
						{Math.round(dims[2])} mm
					</span>
				) : null}
				<span className="ml-auto">arraste para girar · scroll para zoom</span>
			</div>
		</div>
	);
}

function Aviso({ texto }: { texto: string }) {
	return (
		<div className="flex h-[clamp(360px,62vh,720px)] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 text-center dark:border-white/10 dark:bg-[#111]">
			<Box className="h-10 w-10 text-slate-300 dark:text-gray-600" />
			<p className="max-w-sm text-sm text-slate-400 dark:text-gray-500">
				{texto}
			</p>
		</div>
	);
}

/**
 * O componente real só existe no cliente: WebGL não roda no servidor e o
 * `ssr: false` evita o flash de hidratação de um canvas vazio.
 */
export const ModelViewport = dynamic(async () => ModelScene, {
	ssr: false,
	loading: () => <Aviso texto="Carregando visualizador 3D…" />,
});
