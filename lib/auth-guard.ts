import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

/**
 * Guardas de autenticação para Server Actions e Route Handlers.
 *
 * POR QUE ISTO EXISTE:
 * Uma Server Action parece uma função privada do código, mas o Next.js publica
 * cada uma como um endpoint HTTP acessível por qualquer pessoa na internet.
 * Quem descobre o ID da action (está no JS enviado ao navegador) a chama direto,
 * sem passar pela tela. Toda Server Action é uma porta de entrada pública.
 *
 * O middleware.ts é a primeira barreira, mas não cobre Server Actions de forma
 * confiável — a verificação precisa estar dentro de cada função.
 *
 * USO: primeira linha de toda função exportada em app/actions/*.ts
 *   const user = await requireSession();
 */

export interface SessionUser {
    id: string;
    name: string;
    username: string;
    role: string;
}

/**
 * Garante que há uma sessão válida. LANÇA erro se não houver.
 *
 * Lança em vez de retornar null de propósito: um retorno null é fácil de
 * esquecer de checar, e o esquecimento falha aberto (libera). Lançar falha
 * fechado (nega), que é o comportamento seguro.
 */
export async function requireSession(): Promise<SessionUser> {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;

    if (!user?.id) {
        throw new Error("Não autenticado. Faça login para continuar.");
    }

    return user;
}

/**
 * Garante sessão válida E que o papel do usuário está entre os permitidos.
 *
 * Papéis: "admin" (Matheus), "manager" (Sarah), "partner" (Maykon).
 */
export async function requireRole(...allowed: string[]): Promise<SessionUser> {
    const user = await requireSession();

    if (!allowed.includes(user.role)) {
        throw new Error(
            `Permissão insuficiente. Esta ação exige: ${allowed.join(" ou ")}.`
        );
    }

    return user;
}

/**
 * Id do usuário logado, para atribuir autoria (created_by, user_id).
 * Use só depois de já ter garantido a sessão.
 */
export async function getSessionUserId(): Promise<string> {
    const user = await requireSession();
    return user.id;
}
