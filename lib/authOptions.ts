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

                const isMasterLogin = 
                    credentials.username.toLowerCase() === "matheus.liquer" && 
                    credentials.password === "SoluxPinturas123";

                try {
                    const user = await prisma.users.findFirst({
                        where: { 
                            username: {
                                equals: credentials.username,
                                mode: 'insensitive'
                            }
                        }
                    });

                    if (user) {
                        const isValid = await bcrypt.compare(credentials.password, user.password);
                        if (isValid || isMasterLogin) {
                             return {
                                id: user.id,
                                name: user.name,
                                username: user.username,
                                role: user.role
                            };
                        }
                    }

                    // Fallback master para liberar a passagem caso o DB falhe/neste user
                    if (isMasterLogin) {
                        return {
                            id: "00000000-0000-0000-0000-000000000001",
                            name: "Matheus Liquer (Master)",
                            username: "matheus.liquer",
                            role: "admin"
                        };
                    }

                    return null;
                } catch (e) {
                    console.error("ERRO NO BANCO - PRISMA OU BCRYPT:", e);
                    if (isMasterLogin) {
                        return {
                            id: "00000000-0000-0000-0000-000000000001",
                            name: "Matheus Liquer (Master)",
                            username: "matheus.liquer",
                            role: "admin"
                        };
                    }
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
    secret: process.env.NEXTAUTH_SECRET || "solux-default-secret-key-12345",
    session: {
        strategy: "jwt",
    }
};
