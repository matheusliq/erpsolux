---
name: ERP Solux Visual Identity
description: Complete guidelines for styling, colors, and layout structure used in the ERP Solux Next.js project.
---

# ERP Solux Visual Identity & UI Guidelines

Você está trabalhando no projeto **ERP Premium da Solux Pinturas**. Para garantir uma interface consistente e "premium", siga estritamente estas diretrizes visuais e arquiteturais ao criar ou modificar componentes e páginas.

## 🛠️ Stack & Arquitetura
- **Framework:** Next.js (App Router)
- **Estilização:** Tailwind CSS v4.0 + Variáveis CSS (`app/globals.css`)
- **Componentes Base:** shadcn/ui (Estilo "New York", Cor Base "Slate")
- **Ícones:** Lucide React (`import { ... } from "lucide-react"`)
- **Tema:** Dark Mode forçado por padrão (`className="dark"` aplicado no `<html lang="pt-BR">`).

## 🎨 Cores e Tema (OKLCH)
Não utilize cores mágicas do Tailwind (como `bg-blue-500` ou `text-zinc-900`). **Use as variáveis de tema predefinidas**, que reagem automaticamente ao modo da aplicação via CSS puro.

- **Background Principal:** Ambiente dark ultra-profundo equivalente a zinc-950/900 (`bg-background`).
- **Cards e Popovers:** Superfícies elevadas levemente mais claras que o background (`bg-card`, `bg-popover`).
- **Textos:** Use `text-foreground` para texto primário e `text-muted-foreground` para secundários.
- **Cor Primária (Vibrante):** Representa ações principais e destaques (`bg-primary text-primary-foreground`). Possui um tom violeta/indigo premium.
- **Cor Secundária e Mutada:** Ações menos prioritárias e áreas de repouso (`bg-secondary`, `bg-muted`).
- **Feedback Destrutivo:** Para erros e deleções exclusivas (`bg-destructive`).
- **Bordas e Rings:** Use sempre `border-border` e `ring-ring` para manter harmonia com os estados de foco (Focus Rings predefinidos).

## 🔤 Tipografia e Layout
- A fonte primária da aplicação é **Inter** (`next/font/google`). As classes utilitárias do Tailwind já mapeiam para essa fonte (ex: `font-sans`).
- **Aparência Premium:** Utilize espaçamentos consistentes, tracking ajustado (ex: `tracking-tight` para títulos) e hierarquia clara (`h1` = `text-4xl font-extrabold`, `h2` = `text-3xl font-semibold`, etc).
- **Layout Persistente:** O `<body flex h-screen overflow-hidden>` possui a **Sidebar** engessada (`<Sidebar />`) e injeta o conteúdo de páginas num `<main flex-1 overflow-y-auto bg-background pt-16 md:pt-0>`. Não reconstrua estruturas de sidebar em novas páginas, concentre-se apenas no conteúdo útil que já terá background, limitação e padding base providenciados.

## 🧱 Componentes (shadcn/ui)
Sempre considere o catálogo de componentes dentro de `@/components/ui/` em vez de criar do zero (ex: Botões, Modais/Dialogs, Dropdowns, Inputs, Badge, Table).

Para interfaces ricas:
1. **Forms e Inputs:** Utilize `border`, `bg-background` suave (`input` e `ring` defaults) e adicione animações simples (ex: nas transições de hover).
2. **Cards:** Aplique raio nas bordas padrão do projeto (`rounded-xl`, `rounded-2xl` via variáveis de raio).
3. **Micro-Animações e Feedback Visual:** Aproveite bibliotecas adicionais presentes ou transições padrão do Tailwind (ex: `transition-all duration-300 hover:scale-[1.02]`) para gerar uma sensação responsiva e viva ("WOW").

## 📌 Checklist Rápida p/ Novas Funcionalidades
- [ ] Eu usei as variáveis abstratas do Tailwind (ex: `bg-card` ou `text-muted-foreground`) em vez de cores duras?
- [ ] Eu não quebrei as propriedades do modo *dark-mode*?
- [ ] Estou usando ícones da biblioteca *lucide-react*?
- [ ] O componente tem o "look-and-feel" premium e corporativo do ERP Solux?
