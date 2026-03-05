import { addProductToClass } from '@/services/classes';
import {
	createLesson,
	createModule,
	getLessons,
	getModules,
} from '@/services/modules';
import { createProduct, uploadProductImage } from '@/services/products';
import {
	createLessonQuiz,
	createQuestion,
	getLessonQuiz,
} from '@/services/quiz';
import type { Lesson, Module } from '@/types/modules';
import type { Product } from '@/types/products';
import type { CreateQuestionPayload } from '@/types/quiz';

function uniqueSlug(original: string): string {
	const base = original
		.replace(/-copia(-\d+)?$/, '')
		.replace(/-[a-f0-9]{8}$/i, '');
	const suffix = Date.now().toString(36);
	return `${base}-copia-${suffix}`;
}

export interface DuplicateProductPaymentPayload {
	price: number;
	interval: 'one_time' | 'month' | 'year' | 'week';
	category: string;
	refundDays: number;
}

export async function duplicateProduct(
	product: Product,
	classId: string,
	payment: DuplicateProductPaymentPayload,
): Promise<Product> {
	// 1. Buscar módulos e aulas do produto original
	const modules = await getModules(product.id);
	const modulesWithLessons: Array<Module & { lessons: Lesson[] }> =
		await Promise.all(
			modules.map(async (mod) => ({
				...mod,
				lessons: await getLessons(mod.id),
			})),
		);

	// 2. Criar novo produto via POST /product (nome exato, valor definido pelo utilizador).
	// O backend gera novos stripeProductId e stripePriceId. O slug deve ser único para evitar colisão em /course/[slug].
	const newProduct = await createProduct({
		name: product.name,
		type: 'curso',
		description: product.description ?? '',
		price: payment.price,
		interval: payment.interval,
		slug: uniqueSlug(product.slug),
		language: product.language,
		country: product.country,
		category: payment.category,
		refundDays: payment.refundDays,
	});

	// 3. Tentar copiar imagem (pode falhar por CORS)
	if (product.image) {
		try {
			const res = await fetch(product.image);
			if (res.ok) {
				const blob = await res.blob();
				const ext = product.image.split('.').pop()?.split('?')[0] ?? 'jpg';
				const file = new File([blob], `cover.${ext}`, {
					type: blob.type || 'image/jpeg',
				});
				await uploadProductImage(newProduct.id, file);
			}
		} catch {
			// Ignora falha de CORS ou rede; produto fica sem imagem
		}
	}

	// 4. Associar à classe
	await addProductToClass(classId, newProduct.id);

	// 5. Criar módulos e aulas
	const sortedModules = [...modulesWithLessons].sort(
		(a, b) => a.order - b.order,
	);

	for (const mod of sortedModules) {
		const newMod = await createModule({
			productId: newProduct.id,
			title: mod.title,
			description: mod.description ?? '',
			order: mod.order,
		});

		const sortedLessons = [...(mod.lessons ?? [])].sort(
			(a, b) => a.order - b.order,
		);

		for (const lesson of sortedLessons) {
			const newLesson = await createLesson({
				moduleId: newMod.id,
				productId: newProduct.id,
				title: lesson.title,
				description: lesson.description ?? '',
				videoUrl: lesson.videoUrl,
				duration: lesson.duration,
				order: lesson.order,
				isFree: lesson.isFree,
			});

			// 7. Copiar quiz da aula
			try {
				const quiz = await getLessonQuiz(lesson.id);
				if (quiz && quiz.questions.length > 0) {
					const newQuiz = await createLessonQuiz(newLesson.id, quiz.title);
					const sortedQuestions = [...quiz.questions].sort(
						(a, b) => a.order - b.order,
					);
					for (const q of sortedQuestions) {
						const payload: CreateQuestionPayload = {
							text: q.text,
							order: q.order,
							options: q.options.map((o) => ({
								text: o.text,
								isCorrect: o.isCorrect,
							})),
						};
						await createQuestion(newQuiz.id, payload);
					}
				}
			} catch {
				// Quiz opcional; ignora erros
			}
		}
	}

	return newProduct;
}
