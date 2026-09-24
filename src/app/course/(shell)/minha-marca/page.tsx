import { redirect } from 'next/navigation';

/**
 * `/course/minha-marca` VIROU REDIRECT — o cadastro agora é uma seção do perfil.
 *
 * ┌─ POR QUE REDIRECT E NÃO 404 ────────────────────────────────────────────┐
 * │ A marca deixou de ser "uma tela sua" para virar parte do perfil: o dono  │
 * │ pediu isso com todas as letras ("não quero como ferramenta, eu quero     │
 * │ algo como editar o perfil mesmo"). Manter as duas telas criaria DOIS     │
 * │ endereços para o mesmo cadastro, que é como uma delas envelhece sem      │
 * │ ninguém perceber.                                                        │
 * │                                                                          │
 * │ Mas apagar a rota quebraria quem tem o link salvo, quem clicou nele num  │
 * │ grupo de WhatsApp e qualquer aba aberta — e a página existia no menu     │
 * │ lateral até agora. Um 404 aqui seria o produto dizendo "isso não existe  │
 * │ mais" para algo que existe, só que em outro lugar.                       │
 * │                                                                          │
 * │ Server component de propósito: o `redirect()` acontece ANTES de o        │
 * │ navegador pintar qualquer coisa — nada de piscar uma tela vazia antes de │
 * │ trocar de endereço.                                                      │
 * │                                                                          │
 * │ A âncora `#marca` leva direto à seção, que fica no meio da página (a     │
 * │ seção declara `scroll-mt-24` para não nascer embaixo do cabeçalho fixo). │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * SEM `SubscriptionGate`, e isso é deliberado: o gate antigo apontava para a
 * key da tool DONA da coleção, que nem existe mais como dona. O perfil é de todo
 * aluno logado, e o cadastro da marca é opcional — quem não puder cadastrar
 * simplesmente não vê a seção (`useMarcaDisponivel`).
 */
export default function MinhaMarcaPage() {
	redirect('/course/perfil#marca');
}
