export const dynamic = "force-dynamic";
import { getClientes } from "@/app/actions/clientes";
import Link from "next/link";
import { Building2, TrendingUp, Briefcase, Phone, FileText } from "lucide-react";

const formatBRL = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const metadata = {
    title: "Clientes | ERP Solux",
    description: "Gerencie seus clientes e acompanhe o desempenho de cada obra.",
};

export default async function ClientesPage() {
    const { data: clientes = [] } = await getClientes();

    return (
        <div className="p-6 md:p-10 min-h-full bg-background text-foreground">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight">
                    Clientes <span className="text-primary font-light">& Obras</span>
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                    Visão consolidada por cliente. Clique para entrar no hub da conta.
                </p>
            </div>

            {clientes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
                    <Building2 size={40} className="opacity-30" />
                    <p className="text-sm">Nenhum cliente com obras cadastradas.</p>
                    <p className="text-xs opacity-60">
                        Cadastre uma Entidade (tipo Cliente) em{" "}
                        <Link href="/configuracoes" className="underline">Configurações</Link>{" "}
                        e vincule uma Obra a ela.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {clientes.map((c) => {
                        const margem = c.margemBruta;
                        const margemPct = c.totalEntradas > 0
                            ? ((margem / c.totalEntradas) * 100).toFixed(1)
                            : "0.0";
                        const positivo = margem >= 0;

                        return (
                            <Link
                                key={c.id}
                                href={`/clientes/${c.id}`}
                                className="group bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
                            >
                                {/* Nome & Tipo */}
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                            {c.name}
                                        </p>
                                        {c.document && (
                                            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                                <FileText size={9} /> {c.document}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider shrink-0">
                                        {c.type || "Cliente"}
                                    </span>
                                </div>

                                {/* Contato */}
                                {c.phone && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <Phone size={10} /> {c.phone}
                                    </p>
                                )}

                                {/* Métricas */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-background rounded-xl p-3 border border-border">
                                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5 flex items-center gap-1">
                                            <Briefcase size={8} /> Obras
                                        </p>
                                        <p className="text-lg font-black text-foreground">{c.obrasCount}</p>
                                        <p className="text-[9px] text-muted-foreground">{c.obrasAtivas} ativas</p>
                                    </div>
                                    <div className="bg-background rounded-xl p-3 border border-border">
                                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5 flex items-center gap-1">
                                            <TrendingUp size={8} /> Contratado
                                        </p>
                                        <p className="text-sm font-black text-foreground">{formatBRL(c.totalContrato)}</p>
                                    </div>
                                </div>

                                {/* Margem */}
                                <div className={`rounded-xl p-3 border ${positivo ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5"}`}>
                                    <div className="flex justify-between items-center">
                                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Margem Bruta</p>
                                        <span className={`text-[10px] font-bold ${positivo ? "text-emerald-400" : "text-rose-400"}`}>
                                            {margemPct}%
                                        </span>
                                    </div>
                                    <p className={`text-base font-black mt-0.5 ${positivo ? "text-emerald-400" : "text-rose-400"}`}>
                                        {formatBRL(margem)}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
