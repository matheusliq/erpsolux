/**
 * Exportação do relatório de lançamentos (Excel e PDF).
 *
 * Princípio: o que é exportado é EXATAMENTE o que está na tela — mesmas linhas,
 * mesmo resumo. O resumo é recalculado sobre as linhas exportadas, nunca sobre
 * o conjunto total, para que os números do cabeçalho sempre batam com a lista.
 */

export interface LinhaExport {
    id: string;
    name: string;
    amount: number;
    type: string;
    status: string;
    due_date: string;
    notes: string | null;
}

export interface FiltrosExport {
    inicio: string;
    fim: string;
    tipo: string;
    status: string;
    categoria: string;
    busca: string;
}

const TAX_MARKER = "[IMPOSTO]";

const formatBRL = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtData = (d: string) => {
    if (!d) return "";
    const [a, m, dia] = d.split("T")[0].split("-");
    return `${dia}/${m}/${a}`;
};

/** Resumo calculado sobre as linhas que serão exportadas. */
export function calcularResumo(linhas: LinhaExport[]) {
    const entradas = linhas.filter((t) => t.type === "Entrada");
    const saidas = linhas.filter((t) => t.type !== "Entrada");
    const impostos = saidas.filter((t) => t.notes?.includes(TAX_MARKER));

    const totalEntradas = entradas.reduce((a, t) => a + t.amount, 0);
    const totalSaidas = saidas.reduce((a, t) => a + t.amount, 0);
    const totalImpostos = impostos.reduce((a, t) => a + t.amount, 0);

    return {
        totalEntradas,
        totalSaidas,
        totalImpostos,
        saldoLiquido: totalEntradas - totalSaidas,
        qtdEntradas: entradas.length,
        qtdSaidas: saidas.length,
        qtdImpostos: impostos.length,
        qtdTotal: linhas.length,
    };
}

/** Descrição legível do período, para o cabeçalho do relatório. */
export function descreverPeriodo(inicio: string, fim: string) {
    if (inicio && fim) return `${fmtData(inicio)} a ${fmtData(fim)}`;
    if (inicio) return `a partir de ${fmtData(inicio)}`;
    if (fim) return `até ${fmtData(fim)}`;
    return "Todo o período";
}

/** Lista dos filtros ativos, para registrar no relatório o recorte usado. */
export function descreverFiltros(f: FiltrosExport) {
    const ativos: string[] = [];
    if (f.tipo !== "todos") ativos.push(`Tipo: ${f.tipo === "entrada" ? "Entradas" : "Saídas"}`);
    if (f.status !== "todos") ativos.push(`Status: ${f.status}`);
    if (f.categoria && f.categoria !== "todas") ativos.push(`Categoria: ${f.categoria}`);
    if (f.busca) ativos.push(`Busca: "${f.busca}"`);
    return ativos.length ? ativos.join(" · ") : "Nenhum filtro aplicado";
}

/** Nome do arquivo: solux-lancamentos-2026-09-01_2026-09-30 */
export function nomeArquivo(inicio: string, fim: string) {
    const hoje = new Date().toISOString().slice(0, 10);
    const ini = inicio || "inicio";
    const f = fim || hoje;
    return `solux-lancamentos-${ini}_${f}`;
}

// ─── Excel ────────────────────────────────────────────────────────────────────

export async function exportarExcel(linhas: LinhaExport[], filtros: FiltrosExport) {
    const XLSX = await import("xlsx");
    const r = calcularResumo(linhas);

    // Cabeçalho com o recorte usado — sem isso o arquivo perde o contexto
    const cabecalho = [
        ["SOLUX PINTURAS E ENGENHARIA DE SUPERFÍCIES"],
        ["Relatório de Lançamentos"],
        [],
        ["Período:", descreverPeriodo(filtros.inicio, filtros.fim)],
        ["Filtros:", descreverFiltros(filtros)],
        ["Emitido em:", new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })],
        [],
        ["RESUMO"],
        ["Entradas", r.totalEntradas, `${r.qtdEntradas} lançamento(s)`],
        ["Saídas (incl. impostos)", r.totalSaidas, `${r.qtdSaidas} lançamento(s)`],
        ["Impostos + Retenção", r.totalImpostos, `${r.qtdImpostos} lançamento(s)`],
        ["Saldo líquido", r.saldoLiquido, ""],
        [],
        ["LANÇAMENTOS"],
        ["Data", "Descrição", "Tipo", "Valor", "Status"],
    ];

    const corpo = linhas.map((t) => [
        fmtData(t.due_date),
        t.name,
        t.type,
        t.amount, // número, não texto — permite somar no Excel
        t.status,
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...cabecalho, ...corpo]);

    ws["!cols"] = [{ wch: 12 }, { wch: 52 }, { wch: 10 }, { wch: 16 }, { wch: 14 }];

    // Formato de moeda nas células de valor (resumo + corpo)
    const linhasResumo = [8, 9, 10, 11];
    linhasResumo.forEach((i) => {
        const ref = XLSX.utils.encode_cell({ r: i, c: 1 });
        if (ws[ref]) ws[ref].z = 'R$ #,##0.00';
    });
    const primeiraLinhaCorpo = cabecalho.length;
    corpo.forEach((_, i) => {
        const ref = XLSX.utils.encode_cell({ r: primeiraLinhaCorpo + i, c: 3 });
        if (ws[ref]) ws[ref].z = 'R$ #,##0.00';
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lançamentos");
    XLSX.writeFile(wb, `${nomeArquivo(filtros.inicio, filtros.fim)}.xlsx`);
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

/**
 * Gera o PDF pela impressão do navegador (mesma abordagem já usada em
 * components/PropostaPDFView.tsx), evitando uma dependência extra.
 * Abre uma janela com o relatório formatado e dispara o diálogo de impressão,
 * onde o usuário escolhe "Salvar como PDF".
 */
export function exportarPDF(linhas: LinhaExport[], filtros: FiltrosExport) {
    const r = calcularResumo(linhas);
    const esc = (s: string) =>
        String(s ?? "").replace(/[&<>"]/g, (c) =>
            ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string)
        );

    const corpo = linhas
        .map(
            (t) => `<tr>
      <td>${fmtData(t.due_date)}</td>
      <td>${esc(t.name)}</td>
      <td>${esc(t.type)}</td>
      <td class="num ${t.type === "Entrada" ? "in" : "out"}">${formatBRL(t.amount)}</td>
      <td>${esc(t.status)}</td>
    </tr>`
        )
        .join("");

    const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>${nomeArquivo(filtros.inicio, filtros.fim)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color: #18181b; margin: 0; font-size: 11px; }
  h1 { font-size: 17px; margin: 0; letter-spacing: -.3px; }
  .sub { font-size: 11px; color: #71717a; margin-top: 2px; }
  header { border-bottom: 2px solid #0056b3; padding-bottom: 10px; margin-bottom: 14px; }
  .meta { font-size: 10px; color: #52525b; margin-top: 8px; line-height: 1.6; }
  .cards { display: flex; gap: 8px; margin-bottom: 16px; }
  .card { flex: 1; border: 1px solid #e4e4e7; border-radius: 6px; padding: 8px 10px; }
  .card .lbl { font-size: 8px; text-transform: uppercase; letter-spacing: .07em; color: #71717a; font-weight: 700; }
  .card .val { font-size: 14px; font-weight: 800; margin-top: 3px; }
  .in { color: #047857; } .out { color: #be123c; }
  .tax { color: #b45309; } .saldo { color: #0056b3; }
  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }
  th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: .05em;
       color: #52525b; border-bottom: 1.5px solid #d4d4d8; padding: 6px 5px; }
  td { padding: 5px; border-bottom: 1px solid #f4f4f5; }
  tr { page-break-inside: avoid; }
  .num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
  th:nth-child(4) { text-align: right; }
  footer { margin-top: 16px; padding-top: 8px; border-top: 1px solid #e4e4e7;
           font-size: 9px; color: #a1a1aa; display: flex; justify-content: space-between; }
</style></head><body>
<header>
  <h1>Solux Pinturas e Engenharia de Superfícies</h1>
  <div class="sub">Relatório de Lançamentos</div>
  <div class="meta">
    <strong>Período:</strong> ${esc(descreverPeriodo(filtros.inicio, filtros.fim))}<br>
    <strong>Filtros:</strong> ${esc(descreverFiltros(filtros))}<br>
    <strong>Emitido em:</strong> ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
  </div>
</header>

<div class="cards">
  <div class="card"><div class="lbl">Entradas</div><div class="val in">${formatBRL(r.totalEntradas)}</div></div>
  <div class="card"><div class="lbl">Saídas</div><div class="val out">${formatBRL(r.totalSaidas)}</div></div>
  <div class="card"><div class="lbl">Impostos</div><div class="val tax">${formatBRL(r.totalImpostos)}</div></div>
  <div class="card"><div class="lbl">Saldo líquido</div><div class="val saldo">${formatBRL(r.saldoLiquido)}</div></div>
</div>

<table>
  <thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Valor</th><th>Status</th></tr></thead>
  <tbody>${corpo || '<tr><td colspan="5" style="text-align:center;padding:20px;color:#a1a1aa">Nenhum lançamento no período/filtros selecionados.</td></tr>'}</tbody>
</table>

<footer><span>${r.qtdTotal} lançamento(s)</span><span>Solux Pinturas — documento interno</span></footer>
</body></html>`;

    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) {
        alert("O navegador bloqueou a janela de impressão. Permita pop-ups para este site e tente novamente.");
        return;
    }
    w.document.write(html);
    w.document.close();
    w.onload = () => {
        w.focus();
        w.print();
    };
}
