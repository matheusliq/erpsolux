export const dynamic = "force-dynamic";
import { getMateriais } from "@/app/actions/materiais";
import { getCategories } from "@/app/actions/categorias";
import { getEntities } from "@/app/actions/entidades";
import MateriaisClient from "@/components/MateriaisClient";

export const metadata = {
    title: "Materiais | ERP Solux",
    description: "Base mestre de materiais e SKUs com markup e precificação.",
};

export default async function MateriaisPage() {
    const { data: materiais = [] } = await getMateriais();
    const { data: categorias = [] } = await getCategories();
    const { data: entidades = [] } = await getEntities();
    return <MateriaisClient initialData={materiais} categorias={categorias} entidades={entidades} />;
}
