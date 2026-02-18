'use client';

import { ImagePlus, Loader2, X } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCreateProduct } from '@/hooks/use-products';
import type { AddCourseModalProps } from '@/types/components/add-course-modal';

const LANGUAGE_OPTIONS = [
	{ value: 'pt', label: 'Português', locale: 'pt-BR' },
	{ value: 'en', label: 'Inglês', locale: 'en-US' },
	{ value: 'es', label: 'Espanhol', locale: 'es-ES' },
];

const COUNTRY_OPTIONS = [
	{ value: 'BR', label: 'Brasil' },
	{ value: 'PT', label: 'Portugal' },
	{ value: 'US', label: 'Estados Unidos' },
];

function slugify(text: string): string {
	return text
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-');
}

export function AddCourseModal({ isOpen, onClose }: AddCourseModalProps) {
	const [step, setStep] = useState(1);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [language, setLanguage] = useState('pt');
	const [country, setCountry] = useState('BR');
	const [coverPreview, setCoverPreview] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [paymentType, setPaymentType] = useState<'single' | 'subscription'>(
		'single',
	);
	const [subscriptionInterval, setSubscriptionInterval] = useState<
		'month' | 'year' | 'week'
	>('month');
	const [price, setPrice] = useState('');
	const [category, setCategory] = useState('');
	const [refundDays, setRefundDays] = useState('7');

	const mutation = useCreateProduct();

	if (!isOpen) return null;

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) {
			const url = URL.createObjectURL(file);
			setCoverPreview(url);
		}
	}

	function handleRemoveCover() {
		setCoverPreview(null);
		if (fileInputRef.current) fileInputRef.current.value = '';
	}

	function handleClose() {
		setStep(1);
		setName('');
		setDescription('');
		setLanguage('pt');
		setCountry('BR');
		setCoverPreview(null);
		setPaymentType('single');
		setSubscriptionInterval('month');
		setPrice('');
		setCategory('');
		setRefundDays('7');
		onClose();
	}

	async function handleSubmit() {
		if (!name.trim()) {
			toast.error('Informe o nome do curso');
			return;
		}
		if (!price) {
			toast.error('Informe o valor do curso');
			return;
		}

		const locale =
			LANGUAGE_OPTIONS.find((l) => l.value === language)?.locale ?? 'pt-BR';

		const interval =
			paymentType === 'single' ? 'one_time' : subscriptionInterval;

		try {
			await mutation.mutateAsync({
				name,
				type: 'curso',
				description,
				image: '',
				price: parseFloat(price),
				interval,
				slug: slugify(name),
				language: locale,
				country,
				category,
				refundDays: parseInt(refundDays, 10) || 7,
			});
			toast.success('Curso criado com sucesso!');
			handleClose();
		} catch {
			toast.error('Erro ao criar curso');
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<button
				type="button"
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={handleClose}
				onKeyDown={(e) => {
					if (e.key === 'Escape') handleClose();
				}}
			>
				<span className="sr-only">Fechar modal</span>
			</button>

			<div className="relative bg-[#1a1a1d] border border-gray-800 rounded-2xl w-full max-w-lg mx-4 p-6 shadow-2xl">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-xl font-bold">
						{step === 1 ? 'Adicionar curso' : 'Informações de pagamento'}
					</h2>
					<button
						type="button"
						onClick={handleClose}
						className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#252528]"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{step === 1 && (
					<div className="space-y-5">
						<div>
							<label
								htmlFor="course-name"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								Nome do curso
							</label>
							<input
								id="course-name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Ex: Curso de Gravação a Laser"
								className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
							/>
						</div>

						<div>
							<label
								htmlFor="course-description"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								Descrição
							</label>
							<textarea
								id="course-description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Descreva seu curso..."
								rows={3}
								className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label
									htmlFor="course-language"
									className="block text-sm font-medium text-gray-300 mb-2"
								>
									Idioma
								</label>
								<select
									id="course-language"
									value={language}
									onChange={(e) => setLanguage(e.target.value)}
									className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-violet-500/50 transition-colors appearance-none"
								>
									{LANGUAGE_OPTIONS.map((l) => (
										<option key={l.value} value={l.value}>
											{l.label}
										</option>
									))}
								</select>
							</div>

							<div>
								<label
									htmlFor="course-country"
									className="block text-sm font-medium text-gray-300 mb-2"
								>
									País de venda
								</label>
								<select
									id="course-country"
									value={country}
									onChange={(e) => setCountry(e.target.value)}
									className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-violet-500/50 transition-colors appearance-none"
								>
									{COUNTRY_OPTIONS.map((c) => (
										<option key={c.value} value={c.value}>
											{c.label}
										</option>
									))}
								</select>
							</div>
						</div>

						<div>
							<label
								htmlFor="course-cover-image"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								Imagem da capa
							</label>
							{coverPreview ? (
								<div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-700">
									<Image
										src={coverPreview}
										alt="Capa do curso"
										fill
										className="object-cover"
									/>
									<button
										type="button"
										onClick={handleRemoveCover}
										className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-gray-300 hover:text-white transition-colors"
									>
										<X className="w-4 h-4" />
									</button>
								</div>
							) : (
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="w-full h-40 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-violet-500/50 hover:text-violet-400 transition-colors"
								>
									<ImagePlus className="w-8 h-8" />
									<span className="text-sm">Clique para fazer upload</span>
								</button>
							)}
							<input
								id="course-cover-image"
								ref={fileInputRef}
								type="file"
								accept="image/*"
								onChange={handleFileChange}
								className="hidden"
							/>
						</div>
					</div>
				)}

				{step === 2 && (
					<div className="space-y-5">
						<fieldset>
							<legend className="block text-sm font-medium text-gray-300 mb-2">
								Tipo de pagamento
							</legend>
							<div className="flex gap-4">
								<button
									type="button"
									onClick={() => setPaymentType('single')}
									className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
										paymentType === 'single'
											? 'bg-violet-600'
											: 'bg-[#0d0d0f] border border-gray-700 hover:border-gray-600'
									}`}
								>
									Pagamento único
								</button>
								<button
									type="button"
									onClick={() => setPaymentType('subscription')}
									className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
										paymentType === 'subscription'
											? 'bg-violet-600'
											: 'bg-[#0d0d0f] border border-gray-700 hover:border-gray-600'
									}`}
								>
									Assinatura
								</button>
							</div>
						</fieldset>

						{paymentType === 'subscription' && (
							<div>
								<label
									htmlFor="subscription-interval"
									className="block text-sm font-medium text-gray-300 mb-2"
								>
									Intervalo de cobrança
								</label>
								<select
									id="subscription-interval"
									value={subscriptionInterval}
									onChange={(e) =>
										setSubscriptionInterval(
											e.target.value as typeof subscriptionInterval,
										)
									}
									className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-violet-500/50 transition-colors appearance-none"
								>
									<option value="week">Semanal</option>
									<option value="month">Mensal</option>
									<option value="year">Anual</option>
								</select>
							</div>
						)}

						<div>
							<label
								htmlFor="course-price"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								Valor
							</label>
							<div className="relative">
								<span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
									R$
								</span>
								<input
									id="course-price"
									type="number"
									min={1}
									step="0.01"
									value={price}
									onChange={(e) => setPrice(e.target.value)}
									placeholder="0,00"
									className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 pl-10 text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label
									htmlFor="course-category"
									className="block text-sm font-medium text-gray-300 mb-2"
								>
									Categoria (opcional)
								</label>
								<input
									id="course-category"
									type="text"
									value={category}
									onChange={(e) => setCategory(e.target.value)}
									placeholder="Ex: Tecnologia"
									className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
								/>
							</div>

							<div>
								<label
									htmlFor="course-refund-days"
									className="block text-sm font-medium text-gray-300 mb-2"
								>
									Dias de reembolso
								</label>
								<input
									id="course-refund-days"
									type="number"
									min={0}
									value={refundDays}
									onChange={(e) => setRefundDays(e.target.value)}
									className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
								/>
							</div>
						</div>
					</div>
				)}

				<div className="flex items-center gap-3 mt-6">
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
								disabled={mutation.isPending}
								className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm bg-violet-600 hover:bg-violet-700 transition-colors disabled:opacity-50"
							>
								{mutation.isPending && (
									<Loader2 className="w-4 h-4 animate-spin" />
								)}
								Criar curso
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
