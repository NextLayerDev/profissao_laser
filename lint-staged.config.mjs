export default {
	// Formata/linta apenas os arquivos em stage
	'*.{js,ts,jsx,tsx}': ['biome check --write'],
	// Typecheck do projeto inteiro (função => ignora a lista de arquivos do
	// lint-staged; `tsc --noEmit` precisa do tsconfig, não de arquivos avulsos).
	// Só dispara quando há .ts/.tsx em stage.
	'*.{ts,tsx}': () => 'npm run typecheck',
};
