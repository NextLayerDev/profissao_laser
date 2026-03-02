'use client';

import { Check, Loader2, Package, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
	useAddProductToClass,
	useCreateClass,
	useRemoveProductFromClass,
	useUpdateClass,
} from '@/hooks/use-classes';
import { useProducts } from '@/hooks/use-products';
import type { ClassWithProducts } from '@/types/classes';

const TIER_OPTIONS = [
	{ value: 'prata', label: 'Prata' },
	{ value: 'ouro', label: 'Ouro' },
	{ value: 'platina', label: 'Platina' },
] as const;

interface CreateClassModalProps {
	isOpen: boolean;
	onClose: () => void;
	editing?: ClassWithProducts | null;
}

export function CreateClassModal({
	isOpen,
	onClose,
	editing,
}: CreateClassModalProps) {
	const [step, setStep] = useState(1);
	const [name, setName] = useState('');
	const [tier, setTier] = useState<'prata' | 'ouro' | 'platina'>('prata');
	const [description, setDescription] = useState('');
	const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');
	const [aula, setAula] = useState(false);
	const [chat, setChat] = useState(false);
	const [vetorizacao, setVetorizacao] = useState(false);
	const [suporte, setSuporteState] = useState(false);
	const [comunidade, setComunidade] = useState(false);
	const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
		new Set(),
	);

	const { products } = useProducts();
	const createMutation = useCreateClass();
	const updateMutation = useUpdateClass();
	const addProduct = useAddProductToClass();
	const removeProduct = useRemoveProductFromClass();

	const isEditing = !!editing;
	const isPending = createMutation.isPending || updateMutation.isPending;

	const resetForm = useCallback(() => {
		setStep(1);
		setName('');
		setTier('prata');
		setDescription('');
		setStatus('ativo');
		setAula(false);
		setChat(false);
		setVetorizacao(false);
		setSuporteState(false);
		setComunidade(false);
		setSelectedProductIds(new Set());
	}, []);

	useEffect(() => {
		if (editing) {
			setName(editing.name);
			setTier(editing.tier);
			setDescription(editing.description ?? '');
			setStatus(editing.status);
			setAula(editing.aula);
			setChat(editing.chat);
			setVetorizacao(editing.vetorizacao);
			setSuporteState(editing.suporte);
			setComunidade(editing.comunidade);
			setSelectedProductIds(new Set(editing.products.map((p) => p.id)));
		} else {
			resetForm();
		}
	}, [editing, resetForm]);

	if (!isOpen) return null;

	function handleClose() {
		resetForm();
		onClose();
	}

	function toggleProduct(id: string) {
		setSelectedProductIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	async function handleSubmit() {
		if (!name.trim()) {
			toast.error('Informe o nome da classe');
			return;
		}

		try {
			if (isEditing) {
				await updateMutation.mutateAsync({
					id: editing.id,
					payload: {
						name,
						tier,
						description,
						status,
						aula,
						chat,
						vetorizacao,
						suporte,
						comunidade,
					},
				});

				const previousIds = new Set(editing.products.map((p) => p.id));
				const toAdd = [...selectedProductIds].filter(
					(id) => !previousIds.has(id),
				);
				const toRemove = [...previousIds].filter(
					(id) => !selectedProductIds.has(id),
				);

				await Promise.all([
					...toAdd.map((productId) =>
						addProduct.mutateAsync({ classId: editing.id, productId }),
					),
					...toRemove.map((productId) =>
						removeProduct.mutateAsync({ classId: editing.id, productId }),
					),
				]);

				toast.success('Classe atualizada com sucesso!');
			} else {
				const created = await createMutation.mutateAsync({
					name,
					tier,
					description,
					status,
					aula,
					chat,
					vetorizacao,
					suporte,
					comunidade,
				});

				await Promise.all(
					[...selectedProductIds].map((productId) =>
						addProduct.mutateAsync({ classId: created.id, productId }),
					),
				);

				toast.success('Classe criada com sucesso!');
			}

			handleClose();
		} catch {
			toast.error(
				isEditing ? 'Erro ao atualizar classe' : 'Erro ao criar classe',
			);
		}
	}

	const activeProducts = (products ?? []).filter((p) => p.status === 'ativo');

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<button
				type="button"
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={handleClose}
			>
				<span className="sr-only">Fechar modal</span>
			</button>

			<div className="relative bg-[#1a1a1d] border border-gray-800 rounded-2xl w-full max-w-lg mx-4 p-6 shadow-2xl max-h-[90vh] flex flex-col">
				<div className="flex items-center justify-between mb-6 shrink-0">
					<div>
						<h2 className="text-xl font-bold">
							{isEditing
								? 'Editar classe'
								: step === 1
									? 'Criar classe'
									: 'Selecionar produtos'}
						</h2>
						<p className="text-xs text-gray-500 mt-0.5">Passo {step} de 2</p>
					</div>
					<button
						type="button"
						onClick={handleClose}
						className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#252528]"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="overflow-y-auto flex-1">
					{step === 1 && (
						<div className="space-y-5">
							<div>
								<label
									htmlFor="class-name"
									className="block text-sm font-medium text-gray-300 mb-2"
								>
									Nome da classe
								</label>
								<input
									id="class-name"
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Ex: Plano Prata"
									className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
								/>
							</div>

							<div>
								<label
									htmlFor="class-tier"
									className="block text-sm font-medium text-gray-300 mb-2"
								>
									Tier
								</label>
								<div className="grid grid-cols-3 gap-3">
									{TIER_OPTIONS.map((opt) => (
										<button
											key={opt.value}
											type="button"
											onClick={() => setTier(opt.value)}
											className={`py-3 rounded-xl text-sm font-medium transition-colors ${
												tier === opt.value
													? 'bg-violet-600 text-white'
													: 'bg-[#0d0d0f] border border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
											}`}
										>
											{opt.label}
										</button>
									))}
								</div>
							</div>

							<div>
								<label
									htmlFor="class-description"
									className="block text-sm font-medium text-gray-300 mb-2"
								>
									Descrição (opcional)
								</label>
								<textarea
									id="class-description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Descreva o que está incluído nesta classe..."
									rows={3}
									className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
								/>
							</div>

							<div>
								<p className="text-sm font-medium text-gray-300 mb-2">Status</p>
								<div className="flex gap-3">
									{(['ativo', 'inativo'] as const).map((s) => (
										<button
											key={s}
											type="button"
											onClick={() => setStatus(s)}
											className={`flex-1 py-3 rounded-xl text-sm font-medium capitalize transition-colors ${
												status === s
													? 'bg-violet-600 text-white'
													: 'bg-[#0d0d0f] border border-gray-700 text-gray-400 hover:border-gray-600'
											}`}
										>
											{s === 'ativo' ? 'Ativo' : 'Inativo'}
										</button>
									))}
								</div>
							</div>

							<div>
								<p className="text-sm font-medium text-gray-300 mb-2">
									Funcionalidades
								</p>
								<div className="grid grid-cols-2 gap-2">
									{(
										[
											{
												key: 'aula',
												label: 'Aulas',
												value: aula,
												setter: setAula,
											},
											{
												key: 'chat',
												label: 'Chat',
												value: chat,
												setter: setChat,
											},
											{
												key: 'vetorizacao',
												label: 'Vetorização',
												value: vetorizacao,
												setter: setVetorizacao,
											},
											{
												key: 'suporte',
												label: 'Suporte',
												value: suporte,
												setter: setSuporteState,
											},
											{
												key: 'comunidade',
												label: 'Comunidade',
												value: comunidade,
												setter: setComunidade,
											},
										] as const
									).map((feat) => (
										<button
											key={feat.key}
											type="button"
											onClick={() => feat.setter(!feat.value)}
											className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
												feat.value
													? 'bg-violet-600/20 border border-violet-500/50 text-violet-300'
													: 'bg-[#0d0d0f] border border-gray-700 text-gray-400 hover:border-gray-600'
											}`}
										>
											<span
												className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
													feat.value
														? 'bg-violet-600 border-violet-600'
														: 'border-gray-600'
												}`}
											>
												{feat.value && (
													<Check className="w-2.5 h-2.5 text-white" />
												)}
											</span>
											{feat.label}
										</button>
									))}
								</div>
							</div>
						</div>
					)}

					{step === 2 && (
						<div className="space-y-3">
							<p className="text-sm text-gray-400">
								Selecione os produtos que fazem parte desta classe.
							</p>
							{activeProducts.length === 0 ? (
								<p className="text-sm text-gray-600 text-center py-8">
									Nenhum produto ativo disponível
								</p>
							) : (
								<ul className="space-y-2">
									{activeProducts.map((product) => {
										const selected = selectedProductIds.has(product.id);
										return (
											<li key={product.id}>
												<button
													type="button"
													onClick={() => toggleProduct(product.id)}
													className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
														selected
															? 'bg-violet-600/15 border border-violet-500/40'
															: 'bg-[#0d0d0f] border border-gray-800 hover:border-gray-700'
													}`}
												>
													<div
														className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
															selected
																? 'bg-violet-600 border-violet-600'
																: 'border-gray-600'
														}`}
													>
														{selected && (
															<Check className="w-3 h-3 text-white" />
														)}
													</div>
													<Package className="w-4 h-4 text-gray-500 shrink-0" />
													<span className="text-sm text-gray-200 truncate">
														{product.name}
													</span>
												</button>
											</li>
										);
									})}
								</ul>
							)}
						</div>
					)}
				</div>

				<div className="flex items-center gap-3 mt-6 shrink-0">
					{step === 1 && (
						<>
							<button
								type="button"
								onClick={handleClose}
								className="flex-1 px-5 py-3 rounded-xl font-medium text-sm bg-[#252528] hover:bg-[#2a2a2d] transition-colors"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={() => setStep(2)}
								disabled={!name.trim()}
								className="flex-1 px-5 py-3 rounded-xl font-medium text-sm bg-violet-600 hover:bg-violet-700 transition-colors disabled:opacity-50"
							>
								Próximo
							</button>
						</>
					)}
					{step === 2 && (
						<>
							<button
								type="button"
								onClick={() => setStep(1)}
								className="flex-1 px-5 py-3 rounded-xl font-medium text-sm bg-[#252528] hover:bg-[#2a2a2d] transition-colors"
							>
								Voltar
							</button>
							<button
								type="button"
								onClick={handleSubmit}
								disabled={isPending}
								className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm bg-violet-600 hover:bg-violet-700 transition-colors disabled:opacity-50"
							>
								{isPending && <Loader2 className="w-4 h-4 animate-spin" />}
								{isEditing ? 'Salvar alterações' : 'Criar classe'}
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
