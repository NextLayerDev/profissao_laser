'use client';

/**
 * Smoke test da integração do `@upvox-dev/ui`.
 *
 * Existe para pegar a falha mais silenciosa desta stack: a página renderiza
 * inteira, com a estrutura certa e ZERO estilo, sem erro nenhum no console.
 * Se os botões abaixo aparecerem sem cor, sem altura e sem raio de borda, algo
 * quebrou no caminho — o wrapper do `next.config.ts` ou o import em três
 * partes do `globals.css`.
 *
 * Página de desenvolvimento, descartável. Não está em `PUBLIC_PATHS` do
 * `AuthGuard`, então é preciso estar logado para abrir.
 */

import {
	Badge,
	Button,
	Card,
	Checkbox,
	FormField,
	Input,
	Switch,
} from '@upvox-dev/ui';
import { useState } from 'react';
import { Text } from 'react-native-css/components/Text';
import { View } from 'react-native-css/components/View';

const VARIANTS = ['primary', 'secondary', 'ghost', 'danger'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;
const TONES = ['neutral', 'brand', 'success', 'warning', 'danger'] as const;

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<View className="gap-md">
			<Text className="text-section text-primary">{title}</Text>
			{children}
		</View>
	);
}

export default function UpvoxUiCheckPage() {
	const [nome, setNome] = useState('');
	const [aceito, setAceito] = useState(false);
	const [ativo, setAtivo] = useState(true);

	return (
		<View className="min-h-screen bg-surface-sunken p-2xl">
			<View className="mx-auto w-full max-w-(--container-3xl) gap-3xl">
				<View className="gap-xs">
					<Text className="text-page text-primary">@upvox-dev/ui</Text>
					<Text className="text-body text-secondary">
						Se isto estiver estilizado, a integração está de pé.
					</Text>
				</View>

				<Section title="Button — variants">
					<View className="flex-row flex-wrap gap-sm">
						{VARIANTS.map((variant) => (
							<Button key={variant} variant={variant}>
								{variant}
							</Button>
						))}
					</View>
				</Section>

				<Section title="Button — sizes e estados">
					<View className="flex-row flex-wrap items-center gap-sm">
						{SIZES.map((size) => (
							<Button key={size} size={size}>
								{size}
							</Button>
						))}
						<Button disabled>disabled</Button>
						<Button loading>loading</Button>
					</View>
				</Section>

				<Section title="Badge — tones">
					<View className="flex-row flex-wrap gap-sm">
						{TONES.map((tone) => (
							<Badge key={tone} tone={tone}>
								{tone}
							</Badge>
						))}
					</View>
				</Section>

				<Section title="Formulário">
					<Card title="Dados" headerDivider className="gap-lg">
						<FormField label="Nome" hint="Como aparece no certificado.">
							<Input
								value={nome}
								onChangeText={setNome}
								placeholder="Digite seu nome"
							/>
						</FormField>

						<FormField label="E-mail" error="Endereço inválido.">
							<Input
								value="nao-e-um-email"
								invalid
								placeholder="voce@email.com"
							/>
						</FormField>

						<Checkbox checked={aceito} onChange={setAceito}>
							Aceito os termos
						</Checkbox>
						<Switch value={ativo} onValueChange={setAtivo}>
							Receber novidades
						</Switch>
					</Card>
				</Section>
			</View>
		</View>
	);
}
