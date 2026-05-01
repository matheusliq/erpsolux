"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// FUNÇÃO AUXILIAR: Transforma Objetos Complexos em Tipos Nativos (Sanitização)
const sanitizeCategory = (cat: any) => ({
    ...cat,
    // Converte o Objeto Decimal do Prisma para um número comum que o Front-end aceita
    monthly_budget: cat.monthly_budget ? Number(cat.monthly_budget) : null,
});

export async function createCategory(data: { name: string; color: string; type: string; is_material_category?: boolean }) {
    try {
        const dbType = data.type === "entrada" ? "Entrada" : "Sa_da";
        const newCategory = await prisma.categories.create({
            data: {
                name: data.name,
                color: data.color,
                type: dbType as any,
                ...(data.is_material_category !== undefined
                    ? { is_material_category: data.is_material_category }
                    : {}),
            } as any,
        });
        revalidatePath("/configuracoes");
        return { success: true, data: sanitizeCategory(newCategory) };
    } catch (error) {
        console.error("Erro ao criar categoria:", error);
        return { success: false, error: "Falha ao conectar com o banco de dados." };
    }
}

export async function getCategories(options: { showAllCaps?: boolean } = {}) {
    try {
        // Busca todas as categorias financeiras (e flag is_material_category já vem do banco)
        const categorias = await prisma.categories.findMany({ orderBy: { name: 'asc' } });

        // Passa todas as categorias pelo "tradutor" antes de mandar para a tela e usa a flag nativa do banco
        const sanitizedData = categorias.map(c => ({
            ...sanitizeCategory(c),
            is_material: (c as any).is_material_category === true
        }));

        // Se showAllCaps for false (comportamento padrão), oculta categorias em CAPS LOCK (ex: ROLOS)
        let finalData = sanitizedData;
        if (!options.showAllCaps) {
            finalData = sanitizedData.filter(c => c.name !== c.name.toUpperCase());
        }

        return { success: true, data: finalData };
    } catch (error) {
        console.error("Erro ao buscar categorias:", error);
        return { success: false, error: "Falha ao buscar categorias." };
    }
}

export async function updateCategory(id: string, data: { name: string; color: string; type: string; is_material_category?: boolean }) {
    try {
        const dbType = data.type === "entrada" ? "Entrada" : "Sa_da";
        const updatedCategory = await prisma.categories.update({
            where: { id },
            data: {
                name: data.name,
                color: data.color,
                type: dbType as any,
                ...(data.is_material_category !== undefined
                    ? { is_material_category: data.is_material_category }
                    : {}),
            } as any,
        });
        revalidatePath("/configuracoes");
        return { success: true, data: sanitizeCategory(updatedCategory) };
    } catch (error) {
        console.error("Erro ao atualizar categoria:", error);
        return { success: false, error: "Falha ao atualizar categoria." };
    }
}

export async function deleteCategory(id: string) {
    try {
        await prisma.categories.delete({ where: { id } });
        revalidatePath("/configuracoes");
        return { success: true };
    } catch (error: any) {
        console.error("deleteCategory error:", error);
        if (error.code === 'P2003') {
            return { success: false, error: "Não é possível excluir esta categoria pois existem lançamentos financeiros vinculados a ela." };
        }
        return { success: false, error: "Falha ao excluir categoria." };
    }
}