"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { NewProjectModal } from "@/components/NewProjectModal";
import {
    TrendingUp, TrendingDown, Wallet, Building2, ChevronRight,
    Calendar, Clock, CheckCircle2, AlertCircle, XCircle,
    ArrowLeft, Phone, Mail, FileText, Filter
} from "lucide-react";

/* ─── Tipos ────────────────────────────────────────────── */
interface Transaction {
    id: string; name: string; amount: number; type: string;
    status: string; due_date: string;
    categories: { name: string; color: string } | null;
}
interface ProjectService {
    id: string;
    service: { code: string; name: string; mo_sell_value: number };
    totalServico: number;
}
interface Obra {
    id: string; name: string; status: string;
    contract_value: number | null;
    transactions: Transaction[];
    project_services: ProjectService[];
    entradas: number; saidas: number; margem: number; totalServicos: number;
}
interface Cliente {
    id: string; name: string; type: string | null; document: string | null;
    phone: string | null; email: string | null;
}

interface Props {
    cliente: Cliente;
    obras: Obra[];
}

/* ─── Helpers ───────────────────────────────────────────── */
const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    negotiation: { label: "Negociação", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    active: { label: "Ativa", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    completed: { label: "Concluída", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    paused: { label: "Pausada", color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20" },
};

const TX_STATUS: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
    Agendado: { label: "Agendado", icon: Calendar, cls: "text-sky-400" },
    Atrasado: { label: "Atrasado", icon: AlertCircle, cls: "text-rose-400" },
    Pago: { label: "Pago", icon: CheckCircle2, cls: "text-emerald-400" },
    Cancelado: { label: "Cancelado", icon: XCircle, cls: "text-zinc-500" },
};

/* ─── Card de OBRA com mini-kanban ───────────────────── */
function ObraKanbanCard({
    obra, entityId
}: {
    obra: Obra;
    entityId: string;
}) {
    const colunas = ["Agendado", "Atrasado", "Pago", "Cancelado"] as const;

    return (
        <Link
            href={`/clientes/${entityId}/obras/${obra.id}`}
            className="group block bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
        >
            {/* Header da Obra */}
            <div className="px-5 pt-5 pb-4 border-b border-border">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                        <span className="shrink-0 font-mono text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded-lg border border-primary/20 font-bold">
                            OBRA
                        </span>
                        <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                            {obra.name}
                        </p>
                    </div>
                    <span className={`shrink-0 text-[9px] font-bold px-2.5 py-1 rounded-full border ${STATUS_MAP[obra.status]?.color ?? STATUS_MAP.negotiation.color}`}>
                        {STATUS_MAP[obra.status]?.label ?? "Negociação"}
                    </span>
                </div>

                {/* KPIs da obra */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-background/60 rounded-xl border border-border/50">
                    <div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Venda Estimada</p>
                        <p className="text-xs font-bold text-foreground">{fmt(obra.totalServicos)}</p>
                    </div>
                    <div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Receitas Reais</p>
                        <p className="text-xs font-bold text-emerald-400">{fmt(obra.entradas)}</p>
                    </div>
                    <div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Custos Reais</p>
                        <p className="text-xs font-bold text-rose-400">{fmt(obra.saidas)}</p>
                    </div>
                    <div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Saldo C/V (Caixa)</p>
                        <p className={`text-xs font-bold ${obra.margem >= 0 ? "text-primary" : "text-rose-400"}`}>{fmt(obra.margem)}</p>
                    </div>
                </div>

                {/* Serviços associados */}
                <p className="text-[10px] text-muted-foreground mt-2.5 leading-tight">
                    {obra.project_services.length} Serviço(s) Atrelado(s)
                </p>
            </div>

            {/* Kanban de lançamentos da obra */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-border divide-x divide-border">
                {colunas.map(col => {
                    const cfg = TX_STATUS[col];
                    const Icon = cfg.icon;
                    const items = obra.transactions.filter(t => t.status === col);
                    const total = items.reduce((acc, t) => acc + t.amount, 0);

                    return (
                        <div key={col} className="p-3">
                            <div className="flex items-center gap-1.5 mb-2">
                                <Icon size={10} className={cfg.cls} />
                                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">{cfg.label}</span>
                                {items.length > 0 && (
                                    <span className={`ml-auto text-[9px] font-bold ${cfg.cls}`}>{items.length}</span>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                {items.slice(0, 3).map(t => (
                                    <div key={t.id} className="bg-background/60 rounded-lg p-2 border border-border/50">
                                        <p className="text-[9px] text-muted-foreground truncate leading-tight">{t.name}</p>
                                        <p className={`text-[10px] font-bold ${t.type === "Entrada" ? "text-emerald-400" : "text-rose-400"}`}>
                                            {t.type === "Entrada" ? "+" : "-"}{fmt(t.amount)}
                                        </p>
                                        <p className="text-[8px] text-muted-foreground/60">{fmtDate(t.due_date)}</p>
                                    </div>
                                ))}
                                {items.length > 3 && (
                                    <p className="text-[9px] text-muted-foreground text-center">+{items.length - 3} mais</p>
                                )}
                                {items.length === 0 && (
                                    <p className="text-[9px] text-muted-foreground/40 text-center py-2">—</p>
                                )}
                            </div>

                            {items.length > 0 && (
                                <p className={`text-[9px] font-bold mt-2 pt-1.5 border-t border-border/50 ${cfg.cls}`}>
                                    {fmt(total)}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Rodapé */}
            <div className="px-5 py-3 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{obra.transactions.length} lançamento(s)</span>
                <span className="text-[10px] text-muted-foreground group-hover:text-primary flex items-center gap-1 transition-colors">
                    Gerenciar Obra <ChevronRight size={10} />
                </span>
            </div>
        </Link>
    );
}


/* ─── Componente principal ──────────────────────────────── */
export function ClienteHubClient({ cliente, obras }: Props) {
    // Meses disponíveis baseados nas transações
    const meses = useMemo(() => {
        const set = new Set<string>();
        obras.forEach(o => o.transactions.forEach(t => {
            const [y, m] = t.due_date.split("-");
            set.add(`${y}-${m}`);
        }));
        return ["todos", ...Array.from(set).sort().reverse()];
    }, [obras]);

    const [mesFiltro, setMesFiltro] = useState<string>("todos");
    const [statusFiltro, setStatusFiltro] = useState<string>("todos");
    const [novaObraOpen, setNovaObraOpen] = useState(false);

    // KPIs globais do cliente (calculados sobre obras filtradas)
    const obrasFiltered = useMemo(() =>
        obras
            .filter(o => statusFiltro === "todos" || o.status === statusFiltro)
            .map(o => ({
                ...o,
                transactions: mesFiltro === "todos"
                    ? o.transactions
                    : o.transactions.filter(t => t.due_date.startsWith(mesFiltro)),
            })),
        [obras, mesFiltro, statusFiltro]
    );

    const totalEntradas = obrasFiltered.reduce((acc, o) =>
        acc + o.transactions.filter(t => t.type === "Entrada" && t.status === "Pago").reduce((s, t) => s + t.amount, 0), 0);
    const totalSaidas = obrasFiltered.reduce((acc, o) =>
        acc + o.transactions.filter(t => t.type !== "Entrada" && t.status === "Pago").reduce((s, t) => s + t.amount, 0), 0);
    const totalPendente = obrasFiltered.reduce((acc, o) =>
        acc + o.transactions.filter(t => t.status === "Agendado" || t.status === "Atrasado").reduce((s, t) => s + t.amount, 0), 0);
    const saldoLiquido = totalEntradas - totalSaidas;
    const obrasAtivas = obras.filter(o => o.status === "active").length;

    const labelMes = (m: string) => {
        if (m === "todos") return "Todos os períodos";
        const [y, mo] = m.split("-");
        const d = new Date(Number(y), Number(mo) - 1);
        return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    };

    return (
        <div className="p-6 md:p-10 min-h-full bg-background text-foreground">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-6 text-xs text-muted-foreground">
                <Link href="/clientes" className="flex items-center gap-1 hover:text-foreground transition-colors">
                    <ArrowLeft size={12} /> Clientes
                </Link>
                <ChevronRight size={10} />
                <span className="text-foreground font-medium">{cliente.name}</span>
            </div>

            {/* Header do Cliente */}
            <div className="bg-card border border-border rounded-2xl p-5 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Building2 size={22} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">{cliente.name}</h1>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {cliente.document && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <FileText size={10} /> {cliente.document}
                                </span>
                            )}
                            {cliente.phone && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Phone size={10} /> {cliente.phone}
                                </span>
                            )}
                            {cliente.email && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Mail size={10} /> {cliente.email}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">{obras.length} obra(s) cadastradas</span>
                    <button
                        onClick={() => setNovaObraOpen(true)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold"
                    >
                        <Plus size={12} /> Nova Obra
                    </button>
                    <Link
                        href="/configuracoes"
                        className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
                    >
                        Editar Cliente
                    </Link>
                </div>
            </div>

            <NewProjectModal
                entityId={cliente.id}
                entityName={cliente.name}
                open={novaObraOpen}
                onClose={() => setNovaObraOpen(false)}
            />

            {/* KPIs financeiros */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Wallet size={14} className={saldoLiquido >= 0 ? "text-primary" : "text-rose-400"} />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Saldo Líquido</p>
                    </div>
                    <p className={`text-lg font-bold ${saldoLiquido >= 0 ? "text-primary" : "text-rose-400"}`}>{fmt(saldoLiquido)}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">Entradas − Saídas pagas</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={14} className="text-emerald-400" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Entradas Pagas</p>
                    </div>
                    <p className="text-lg font-bold text-emerald-400">{fmt(totalEntradas)}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">Confirmadas no período</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingDown size={14} className="text-rose-400" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Saídas Pagas</p>
                    </div>
                    <p className="text-lg font-bold text-rose-400">{fmt(totalSaidas)}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">Realizadas no período</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock size={14} className="text-amber-400" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pendente</p>
                    </div>
                    <p className="text-lg font-bold text-amber-400">{fmt(totalPendente)}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{obrasAtivas} obra(s) ativa(s)</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-card border border-border rounded-xl">
                <Filter size={14} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Filtrar por:</span>
                <select
                    value={mesFiltro}
                    onChange={e => setMesFiltro(e.target.value)}
                    className="text-xs bg-background border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:border-primary/40"
                >
                    {meses.map(m => (
                        <option key={m} value={m}>{labelMes(m)}</option>
                    ))}
                </select>
                <select
                    value={statusFiltro}
                    onChange={e => setStatusFiltro(e.target.value)}
                    className="text-xs bg-background border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:border-primary/40"
                >
                    <option value="todos">Todos os status</option>
                    <option value="negotiation">Negociação</option>
                    <option value="active">Ativa</option>
                    <option value="completed">Concluída</option>
                    <option value="paused">Pausada</option>
                </select>
                {(mesFiltro !== "todos" || statusFiltro !== "todos") && (
                    <button
                        onClick={() => { setMesFiltro("todos"); setStatusFiltro("todos"); }}
                        className="text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg border border-border hover:border-primary/40 transition-all"
                    >
                        Limpar filtros
                    </button>
                )}
            </div>

            {/* Título */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                    Obras ({obrasFiltered.length}{obrasFiltered.length !== obras.length ? ` de ${obras.length}` : ""})
                </h2>
            </div>

            {/* Grid de cards — 1 por Obra */}
            {obrasFiltered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
                    <p className="text-sm">Nenhuma obra encontrada com esses filtros.</p>
                </div>
            ) : (
                <div className="grid gap-5 xl:grid-cols-2">
                    {obrasFiltered.map((obra) => (
                        <ObraKanbanCard key={obra.id} obra={obra} entityId={cliente.id} />
                    ))}
                </div>
            )}
        </div>
    );
}
