import { withAuth } from "next-auth/middleware";

/**
 * Porteiro de rotas (no Next 16 este arquivo se chama proxy.ts; era middleware.ts).
 * Roda ANTES de cada rota que casar com o matcher; sem sessão válida, redireciona
 * para /login (ou devolve 401 nas rotas de API).
 *
 * O secret NÃO tem fallback de propósito: ele valida a assinatura do token de
 * sessão. Um valor previsível permitiria forjar uma sessão de admin.
 */
export default withAuth({
    pages: {
        signIn: "/login",
    },
});

export const config = {
    /**
     * Protege tudo, EXCETO:
     *   - /login                → senão ninguém consegue autenticar
     *   - /api/auth/*           → fluxo do NextAuth (trava circular se bloquear)
     *   - /landing/*            → páginas públicas de proposta (route group (public))
     *   - estáticos e imagens
     *
     * ATENÇÃO: a versão anterior excluía `api` INTEIRO do matcher, o que deixava
     * /api/extrato e /api/iago abertos a qualquer pessoa na internet. Agora só
     * /api/auth fica de fora, e as demais rotas de API exigem sessão.
     */
    matcher: [
        "/((?!api/auth|_next/static|_next/image|favicon.ico|logo.png|sublogo.png|login|landing).*)",
    ],
};
