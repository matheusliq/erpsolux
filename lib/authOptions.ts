import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Usuário", type: "text", placeholder: "seu.usuario" },
                password: { label: "Senha", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) return null;

                try {
                    const user = await prisma.users.findFirst({
                        where: {
                            username: {
                                equals: credentials.username,
                                mode: 'insensitive'
                            }
                        }
                    });

                    if (!user) return null;

                    const isValid = await bcrypt.compare(credentials.password, user.password);
                    if (!isValid) return null;

                    return {
                        id: user.id,
                        name: user.name,
                        username: user.username,
                        role: user.role
                    };
                } catch (e) {
                    // FAIL CLOSED: se o banco falhar, ninguém entra.
                    // O comportamento anterior liberava acesso admin quando o banco caía,
                    // o que transformava uma indisponibilidade em bypass de autenticação.
                    console.error("Erro ao autenticar:", e);
                    return null;
                }
            }
        })
    ],
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.username = (user as any).username;
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).username = token.username;
                (session.user as any).role = token.role;
            }
            return session;
        }
    },
    // Sem fallback: este segredo assina os tokens de sessão. Um valor previsível
    // permite forjar uma sessão de admin sem senha. Melhor falhar o boot.
    secret: (() => {
        const s = process.env.NEXTAUTH_SECRET;
        if (!s) throw new Error("NEXTAUTH_SECRET não definido. Configure a variável de ambiente.");
        return s;
    })(),
    session: {
        strategy: "jwt",
    }
};
