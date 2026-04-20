export const dynamic = "force-dynamic";
import { getMateriais } from "@/app/actions/materiais";
import MateriaisClient from "@/components/MateriaisClient";

export const metadata = {
    title: "Materiais | ERP Solux",
    description: "Base mestre de materiais e SKUs com markup e precificação.",
};

export default async function MateriaisPage() {
    const { data: materiais = [] } = await getMateriais();
    return <MateriaisClient initialData={materiais} />;
}
