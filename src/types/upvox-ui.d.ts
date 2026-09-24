/**
 * O `@upvox-dev/ui` publica TypeScript fonte, mas os wrappers de bundler
 * (`/next`, `/metro`) são CommonJS puro e não trazem `.d.ts`. Sem esta
 * declaração o `next.config.ts` quebra com TS7016 sob `strict`.
 */
declare module '@upvox-dev/ui/next' {
	import type { NextConfig } from 'next';

	/**
	 * Aplica em cima do config do app: `transpilePackages` da stack React
	 * Native, aliases de `react-native` → `react-native-web` (Turbopack e
	 * webpack), a entrada `.web.js` do `react-native-svg` e `global` →
	 * `globalThis`. Faz merge raso: `images`, `env`, `output` e demais chaves
	 * do config recebido passam intactas.
	 */
	const withUpvox: (nextConfig?: NextConfig) => NextConfig;

	export default withUpvox;
	export { withUpvox };
}
